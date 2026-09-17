import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

// GET /api/products/[barcode]
// Dipakai di halaman Scan Barcode buat gantiin daftarProduk.find(...).
//
// PENTING: mulai Next.js 15, "params" di route handler berbentuk
// Promise dan HARUS di-await. Kalau tidak, params.barcode akan
// undefined, dan query jadi "WHERE p.barcode = undefined" — cocok
// tidak dengan produk manapun, walau barcode-nya sendiri valid.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ barcode: string }> }
) {
  try {
    const { barcode } = await params;
    const barcodeBersih = barcode?.trim();

    if (!barcodeBersih) {
      return NextResponse.json(
        { message: 'Barcode tidak valid' },
        { status: 400 }
      );
    }

    // LEFT JOIN (bukan JOIN/INNER JOIN) supaya produk tetap ditemukan
    // walau category_id-nya NULL atau tidak cocok dengan baris manapun
    // di tabel categories.
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.barcode AS kode, p.nama, p.harga, p.stok, p.gambar, c.nama AS kategori
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.barcode = ?`,
      [barcodeBersih]
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