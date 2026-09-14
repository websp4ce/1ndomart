import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader } from 'mysql2';

type ItemBody = {
  id: string; // barcode
  nama: string;
  harga: number;
  qty: number;
};

// POST /api/transactions
// Dipakai di halaman Pembayaran, dipanggil pas handleBayarTunai() /
// handleKonfirmasiNonTunai() sukses.
// Body: { kasirId, items, diskon, kodePromo, metode, jumlahDibayar, kembalian }
//
// Pakai koneksi khusus (bukan pool.query biasa) + transaction SQL supaya
// insert ke 3 tabel (transactions, transaction_items, payments) ini
// "semua-atau-tidak-sama-sekali" — kalau salah satu gagal, semuanya
// dibatalkan (rollback), jadi tidak ada transaksi yang datanya setengah.
export async function POST(request: Request) {
  const connection = await pool.getConnection();

  try {
    const body = await request.json();
    const {
      kasirId,
      items,
      diskon = 0,
      kodePromo = null,
      metode,
      jumlahDibayar,
      kembalian = 0,
    }: {
      kasirId: number;
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

    const totalBelanja = items.reduce((sum, item) => sum + item.harga * item.qty, 0);
    const grandTotal = Math.max(totalBelanja - diskon, 0);

    await connection.beginTransaction();

    // 1. Header transaksi
    const [transResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO transactions (kasir_id, total_belanja, diskon, kode_promo, grand_total)
       VALUES (?, ?, ?, ?, ?)`,
      [kasirId, totalBelanja, diskon, kodePromo, grandTotal]
    );
    const transactionId = transResult.insertId;

    // 2. Detail barang (satu baris per produk)
    for (const item of items) {
      await connection.query(
        `INSERT INTO transaction_items
           (transaction_id, barcode, nama_produk, harga_satuan, qty, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [transactionId, item.id, item.nama, item.harga, item.qty, item.harga * item.qty]
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
      { message: 'Gagal menyimpan transaksi' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}