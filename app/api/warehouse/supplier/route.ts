import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db'; // sesuaikan path sesuai lokasi koneksi database kamu
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET /api/warehouse/supplier -> ambil semua data supplier
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, nama, kontak, email, status FROM supplier ORDER BY id DESC'
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: 'Gagal mengambil data supplier.' },
      { status: 500 }
    );
  }
}

// POST /api/warehouse/supplier -> tambah data supplier baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, kontak, email, status } = body;

    if (!nama || !kontak || !email || !status) {
      return NextResponse.json(
        { message: 'Lengkapi semua data supplier dulu ya.' },
        { status: 400 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO supplier (nama, kontak, email, status) VALUES (?, ?, ?, ?)',
      [nama, kontak, email, status]
    );

    return NextResponse.json(
      { id: result.insertId, nama, kontak, email, status },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: 'Gagal menambahkan data supplier.' },
      { status: 500 }
    );
  }
}