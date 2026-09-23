import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET /api/inventory/barang-retur
// Dipakai di halaman Barang Retur buat gantiin initialData dummy.
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         br.id,
         br.tanggal,
         br.jenis,
         br.supplier,
         p.nama AS produk,
         br.product_barcode AS productBarcode,
         br.qty,
         br.alasan,
         br.status,
         br.catatan
       FROM barang_retur br
       JOIN products p ON p.barcode = br.product_barcode
       ORDER BY br.tanggal DESC, br.id DESC`
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Gagal mengambil data barang retur' },
      { status: 500 }
    );
  }
}

// POST /api/inventory/barang-retur
// Dipakai di modal "Catat Retur Baru".
// Body: { jenis: 'ke_supplier' | 'dari_pelanggan', supplier?, productBarcode, qty, alasan, status }
//
// LOGIKA STOK:
// - jenis = 'ke_supplier'    -> stok BERKURANG (barang dikirim balik ke supplier)
// - jenis = 'dari_pelanggan' -> stok NAMBAH   (barang balik dari pelanggan ke toko)
//
// Insert ke tabel barang_retur DAN update stok di products dilakukan
// dalam satu transaksi, biar nggak ada kasus salah satunya gagal sendirian.
export async function POST(request: Request) {
  const connection = await pool.getConnection();

  try {
    const body = await request.json();
    const { jenis, supplier, productBarcode, qty, alasan, status } = body;

    if (!jenis || !['ke_supplier', 'dari_pelanggan'].includes(jenis)) {
      return NextResponse.json(
        { message: 'Jenis retur wajib dipilih (ke supplier / dari pelanggan)' },
        { status: 400 }
      );
    }

    if (jenis === 'ke_supplier' && !supplier) {
      return NextResponse.json(
        { message: 'Supplier wajib diisi untuk retur ke supplier' },
        { status: 400 }
      );
    }

    if (!productBarcode || !qty || qty <= 0 || !alasan || !status) {
      return NextResponse.json(
        { message: 'Produk, jumlah, alasan, dan status wajib diisi dengan benar' },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    // 1. Ambil stok produk saat ini (LOCK baris ini biar aman kalau ada request bareng)
    const [produkRows] = await connection.query<RowDataPacket[]>(
      'SELECT stok FROM products WHERE barcode = ? FOR UPDATE',
      [productBarcode]
    );

    if (produkRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Produk tidak ditemukan' }, { status: 404 });
    }

    const stokSekarang = produkRows[0].stok as number;

    // 2. Hitung stok baru sesuai arah retur
    let stokBaru: number;
    if (jenis === 'ke_supplier') {
      if (qty > stokSekarang) {
        await connection.rollback();
        return NextResponse.json(
          { message: `Jumlah retur melebihi stok yang ada (stok saat ini ${stokSekarang} pcs)` },
          { status: 400 }
        );
      }
      stokBaru = stokSekarang - qty;
    } else {
      stokBaru = stokSekarang + qty;
    }

    // 3. Update stok produk
    await connection.query<ResultSetHeader>(
      'UPDATE products SET stok = ? WHERE barcode = ?',
      [stokBaru, productBarcode]
    );

    // 4. Catat retur-nya
    const [insertResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO barang_retur (jenis, supplier, product_barcode, qty, alasan, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [jenis, jenis === 'ke_supplier' ? supplier : null, productBarcode, qty, alasan, status]
    );

    await connection.commit();

    return NextResponse.json(
      {
        message: 'Retur berhasil dicatat',
        data: { id: insertResult.insertId, stokBaru },
      },
      { status: 201 }
    );
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return NextResponse.json(
      { message: 'Gagal mencatat retur barang' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}