import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

// GET /api/inventory/stok-minimum
// Dipakai di halaman Stok Minimum (inventory). Ambil semua produk beserta
// stok saat ini & batas stok minimum-nya, supaya status (kritis/menipis/aman)
// bisa dihitung di halaman.
//
// Catatan: kolom "stok_minimum" perlu ditambah dulu ke tabel products, lihat:
//   ALTER TABLE products ADD COLUMN stok_minimum INT NOT NULL DEFAULT 10 AFTER stok;
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         p.barcode AS id,
         p.nama AS namaProduk,
         c.nama AS kategori,
         p.stok AS stokSaatIni,
         p.stok_minimum AS stokMinimum,
         p.gambar AS gambar
       FROM products p
       JOIN categories c ON p.category_id = c.id
       ORDER BY p.stok ASC`
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Gagal mengambil data stok minimum' },
      { status: 500 }
    );
  }
}