import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT id, nama, tipe FROM gudang ORDER BY nama ASC');
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Gagal mengambil data gudang' }, { status: 500 });
  }
}