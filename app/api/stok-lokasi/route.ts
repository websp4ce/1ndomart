import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

// GET /api/stok-lokasi?barcode=xxx&gudang_id=1 — cek stok produk di 1 gudang tertentu
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get('barcode');
  const gudangId = searchParams.get('gudang_id');

  if (!barcode || !gudangId) {
    return NextResponse.json({ message: 'barcode dan gudang_id wajib diisi' }, { status: 400 });
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT stok FROM stok_lokasi WHERE barcode = ? AND gudang_id = ?',
      [barcode, gudangId],
    );
    return NextResponse.json({ stok: rows[0]?.stok ?? 0 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Gagal mengambil stok' }, { status: 500 });
  }
}