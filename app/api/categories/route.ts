import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/categories
// Dipakai di halaman Transaksi buat gantiin kategoriList yang hardcode.
export async function GET() {
  try {
    const [rows] = await pool.query('SELECT id, nama FROM categories ORDER BY nama');
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Gagal mengambil daftar kategori' },
      { status: 500 }
    );
  }
}