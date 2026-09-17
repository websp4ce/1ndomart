import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

// PATCH /api/barang-expired/:barcode
// Body: { tgl_expired: "2025-06-01" }
export async function PATCH(
  request: Request,
  context: { params: Promise<{ barcode: string }> }
) {
  try {
    const { barcode } = await context.params; // <-- WAJIB di-await di Next.js 15+

    console.log('BARCODE DITERIMA:', barcode); // sementara, buat debug

    const { tgl_expired } = await request.json();

    if (!tgl_expired) {
      return NextResponse.json({ message: 'Tanggal wajib diisi' }, { status: 400 });
    }

    // Cek dulu apakah barcode-nya benar-benar ada di tabel products
    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT barcode FROM products WHERE barcode = ?`,
      [barcode]
    );

    if (existing.length === 0) {
      return NextResponse.json({ message: 'Produk tidak ditemukan' }, { status: 404 });
    }

    await pool.query<ResultSetHeader>(
      `UPDATE products SET tgl_expired = ? WHERE barcode = ?`,
      [tgl_expired, barcode]
    );

    return NextResponse.json({ message: 'Tanggal expired berhasil diubah' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Gagal update' }, { status: 500 });
  }
}