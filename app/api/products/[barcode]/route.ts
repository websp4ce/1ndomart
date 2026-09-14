import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

// GET /api/products/[barcode]
// Dipakai di halaman Scan Barcode buat gantiin daftarProduk.find(...).
export async function GET(
  request: Request,
  { params }: { params: { barcode: string } }
) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.barcode AS kode, p.nama, p.harga, p.stok, p.gambar, c.nama AS kategori
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.barcode = ?`,
      [params.barcode]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: 'Produk tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Gagal mencari produk' },
      { status: 500 }
    );
  }
}