import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db'; // sesuaikan path sesuai lokasi koneksi database kamu
import type { ResultSetHeader } from 'mysql2';

type Params = { params: Promise<{ id: string }> };

// PUT /api/warehouse/gudang/[id] -> edit data gudang
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { nama, lokasi, alamat, status } = body;

    if (!nama || !lokasi || !alamat || !status) {
      return NextResponse.json(
        { message: 'Lengkapi semua data gudang dulu ya.' },
        { status: 400 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE gudang SET nama = ?, lokasi = ?, alamat = ?, status = ? WHERE id = ? AND tipe = 'gudang'",
      [nama, lokasi, alamat, status, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: 'Data gudang tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ id: Number(id), nama, lokasi, alamat, status });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: 'Gagal menyimpan perubahan data gudang.' },
      { status: 500 }
    );
  }
}

// DELETE /api/warehouse/gudang/[id] -> hapus data gudang
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM gudang WHERE id = ? AND tipe = 'gudang'",
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: 'Data gudang tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Data gudang berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: 'Gagal menghapus data gudang.' },
      { status: 500 }
    );
  }
}