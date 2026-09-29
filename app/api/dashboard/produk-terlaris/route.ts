import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

// GET /api/dashboard/produk-terlaris
// GET /api/dashboard/produk-terlaris?limit=20  <-- dipakai halaman "Lihat Semua"
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit') ?? 5);

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT nama_produk AS nama, SUM(qty) AS terjual
       FROM transaction_items
       GROUP BY nama_produk
       ORDER BY terjual DESC
       LIMIT ?`,
      [limit]
    );

    const hasil = rows.map((row, i) => ({
      no: i + 1,
      nama: row.nama,
      terjual: Number(row.terjual),
    }));

    return NextResponse.json(hasil);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Gagal mengambil produk terlaris' },
      { status: 500 }
    );
  }
}