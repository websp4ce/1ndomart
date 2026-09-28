import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader } from 'mysql2';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { kode, tanggal, tujuan, status } = body;

    if (!kode || !tanggal || !tujuan || !status) {
      return NextResponse.json({ message: 'Lengkapi semua data picking.' }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE picking SET kode = ?, tanggal = ?, tujuan = ?, status = ? WHERE id = ?',
      [kode, tanggal, tujuan, status, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Data picking tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Berhasil diperbarui' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Gagal memperbarui data picking.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM picking WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Data picking tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Berhasil dihapus' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Gagal menghapus data picking.' }, { status: 500 });
  }
}