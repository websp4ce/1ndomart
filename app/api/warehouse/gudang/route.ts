import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db'; // sesuaikan path sesuai lokasi koneksi database kamu

// GET /api/warehouse/gudang -> ambil data gudang (tipe = 'gudang' saja, bukan toko)
export async function GET() {
  try {
    const [rows] = await pool.query(
      "SELECT id, nama, lokasi, alamat, status FROM gudang WHERE tipe = 'gudang' ORDER BY id DESC"
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: 'Gagal mengambil data gudang.' },
      { status: 500 }
    );
  }
}

// POST /api/warehouse/gudang -> tambah gudang baru (tipe otomatis 'gudang')
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, lokasi, alamat, status } = body;

    if (!nama || !lokasi || !alamat || !status) {
      return NextResponse.json(
        { message: 'Lengkapi semua data gudang dulu ya.' },
        { status: 400 }
      );
    }

    const [result]: any = await pool.query(
      "INSERT INTO gudang (nama, tipe, lokasi, alamat, status) VALUES (?, 'gudang', ?, ?, ?)",
      [nama, lokasi, alamat, status]
    );

    return NextResponse.json(
      { id: result.insertId, nama, lokasi, alamat, status },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: 'Gagal menambahkan data gudang.' },
      { status: 500 }
    );
  }
}