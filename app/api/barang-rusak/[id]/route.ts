import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

// PATCH /api/barang-rusak/:id
// Body: { status: "Diproses" }  -- atau field lain yang mau diubah
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // wajib di-await (Next.js 15+/16)
    const { status, qty, keterangan, tanggal } = await request.json();

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM barang_rusak WHERE id = ?`,
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ message: 'Data tidak ditemukan' }, { status: 404 });
    }

    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (status !== undefined) { fields.push('status = ?'); values.push(status); }
    if (qty !== undefined) { fields.push('qty = ?'); values.push(qty); }
    if (keterangan !== undefined) { fields.push('keterangan = ?'); values.push(keterangan); }
    if (tanggal !== undefined) { fields.push('tanggal = ?'); values.push(tanggal); }

    if (fields.length === 0) {
      return NextResponse.json({ message: 'Tidak ada data yang diubah' }, { status: 400 });
    }

    values.push(id);

    await pool.query<ResultSetHeader>(
      `UPDATE barang_rusak SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return NextResponse.json({ message: 'Data berhasil diubah' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Gagal mengubah data' }, { status: 500 });
  }
}

// DELETE /api/barang-rusak/:id
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM barang_rusak WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Data tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Gagal menghapus data' }, { status: 500 });
  }
}