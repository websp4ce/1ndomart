import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

type ItemBody = {
  id: string; // barcode
  nama: string;
  harga: number;
  qty: number;
};

type KasirRow = RowDataPacket & {
  id: number;
};

type StokRow = RowDataPacket & {
  stok: number;
};

// POST /api/transactions
// Dipakai di halaman Pembayaran, dipanggil pas handleBayarTunai() /
// handleKonfirmasiNonTunai() sukses.
// Body: { kasirId, items, diskon, kodePromo, metode, jumlahDibayar, kembalian }
//
// Catatan: "kasirId" yang dikirim dari halaman Pembayaran sebenarnya
// berisi EMAIL kasir (bukan id angka), karena diambil dari data login
// (indomart_user) yang cuma nyimpen { nama, email, role }. Jadi di sini
// kita lookup dulu id kasir aslinya dari tabel users berdasarkan email itu,
// sebelum dipakai buat insert ke tabel transactions.
//
// Pakai koneksi khusus (bukan pool.query biasa) + transaction SQL supaya
// insert ke 3 tabel (transactions, transaction_items, payments) ini
// "semua-atau-tidak-sama-sekali" — kalau salah satu gagal, semuanya
// dibatalkan (rollback), jadi tidak ada transaksi yang datanya setengah.
//
// TAMBAHAN: setiap item yang terjual sekarang juga MENGURANGI products.stok
// (dicek dulu stoknya cukup atau nggak sebelum transaksi diproses), supaya
// halaman Stok Minimum yang baca langsung dari products.stok otomatis
// ter-update tiap ada transaksi baru.
export async function POST(request: Request) {
  const connection = await pool.getConnection();

  try {
    const body = await request.json();
    const {
      kasirId, // sebenarnya email, lihat catatan di atas
      items,
      diskon = 0,
      kodePromo = null,
      metode,
      jumlahDibayar,
      kembalian = 0,
    }: {
      kasirId: string;
      items: ItemBody[];
      diskon?: number;
      kodePromo?: string | null;
      metode: string;
      jumlahDibayar: number;
      kembalian?: number;
    } = body;

    if (!kasirId || !items || items.length === 0 || !metode) {
      connection.release();
      return NextResponse.json(
        { message: 'Data transaksi belum lengkap (kasirId, items, metode wajib ada)' },
        { status: 400 }
      );
    }

    // Lookup id kasir asli dari email.
    // Sesuaikan nama tabel & kolom ini kalau di database kamu bukan "users"/"email".
    const [kasirRows] = await connection.query<KasirRow[]>(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [kasirId]
    );

    if (!kasirRows || kasirRows.length === 0) {
      connection.release();
      return NextResponse.json(
        { message: `Kasir dengan email "${kasirId}" tidak ditemukan` },
        { status: 404 }
      );
    }

    const kasirIdAsli = kasirRows[0].id;

    const totalBelanja = items.reduce((sum, item) => sum + item.harga * item.qty, 0);
    const grandTotal = Math.max(totalBelanja - diskon, 0);

    await connection.beginTransaction();

    // 0. Cek stok semua item cukup dulu, SEBELUM insert apa pun.
    // FOR UPDATE mengunci baris produknya selama transaksi ini berjalan,
    // supaya kalau ada 2 kasir jual barang yang sama di waktu bersamaan,
    // stoknya tidak sampai minus.
    for (const item of items) {
      const [stokRows] = await connection.query<StokRow[]>(
        `SELECT stok FROM products WHERE barcode = ? FOR UPDATE`,
        [item.id]
      );

      if (!stokRows || stokRows.length === 0) {
        await connection.rollback();
        connection.release();
        return NextResponse.json(
          { message: `Produk dengan barcode ${item.id} tidak ditemukan` },
          { status: 404 }
        );
      }

      if (stokRows[0].stok < item.qty) {
        await connection.rollback();
        connection.release();
        return NextResponse.json(
          {
            message: `Stok "${item.nama}" tidak cukup (tersisa ${stokRows[0].stok}, diminta ${item.qty})`,
          },
          { status: 400 }
        );
      }
    }

    // 1. Header transaksi
    const [transResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO transactions (kasir_id, total_belanja, diskon, kode_promo, grand_total)
       VALUES (?, ?, ?, ?, ?)`,
      [kasirIdAsli, totalBelanja, diskon, kodePromo, grandTotal]
    );
    const transactionId = transResult.insertId;

    // 2. Detail barang (satu baris per produk) + kurangi stok produknya
    for (const item of items) {
      await connection.query(
        `INSERT INTO transaction_items
           (transaction_id, barcode, nama_produk, harga_satuan, qty, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [transactionId, item.id, item.nama, item.harga, item.qty, item.harga * item.qty]
      );

      // Ini bagian utamanya: stok berkurang sesuai qty yang terjual.
      // 45 -> 44 -> 43 dst, tiap kali ada transaksi baru.
      await connection.query(
        `UPDATE products SET stok = stok - ? WHERE barcode = ?`,
        [item.qty, item.id]
      );
    }

    // 3. Pembayaran
    await connection.query(
      `INSERT INTO payments (transaction_id, metode, jumlah_dibayar, kembalian, status)
       VALUES (?, ?, ?, ?, 'Berhasil')`,
      [transactionId, metode, jumlahDibayar, kembalian]
    );

    await connection.commit();

    return NextResponse.json(
      { message: 'Transaksi berhasil disimpan', transactionId },
      { status: 201 }
    );
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Gagal menyimpan transaksi',
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}