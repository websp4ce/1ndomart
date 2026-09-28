import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db'; // sesuaikan path sesuai lokasi koneksi database kamu
import type { ResultSetHeader } from 'mysql2';

type Params = { params: Promise<{ id: string }> };

// PUT /api/warehouse/supplier/[id] -> edit data supplier
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { nama, kontak, email, status } = body;

    if (!nama || !kontak || !email || !status) {
      return NextResponse.json(
        { message: 'Lengkapi semua data supplier dulu ya.' },
        { status: 400 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE supplier SET nama = ?, kontak = ?, email = ?, status = ? WHERE id = ?',
      [nama, kontak, email, status, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: 'Data supplier tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ id: Number(id), nama, kontak, email, status });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: 'Gagal menyimpan perubahan data supplier.' },
      { status: 500 }
    );
  }
}

// DELETE /api/warehouse/supplier/[id] -> hapus data supplier
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM supplier WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: 'Data supplier tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Data supplier berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: 'Gagal menghapus data supplier.' },
      { status: 500 }
    );
  }
}