import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// PATCH /api/transfer-stok/:id
// Body: { status: "Proses" | "Selesai" | "Dibatalkan" }
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { status } = await request.json();

    const statusValid = ['Menunggu', 'Proses', 'Selesai', 'Dibatalkan'];
    if (!status || !statusValid.includes(status)) {
      return NextResponse.json({ message: 'Status tidak valid' }, { status: 400 });
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM transfer_stok WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ message: 'Transfer tidak ditemukan' }, { status: 404 });
    }

    await pool.query<ResultSetHeader>(
      'UPDATE transfer_stok SET status = ? WHERE id = ?',
      [status, id]
    );

    return NextResponse.json({ message: 'Status transfer berhasil diubah' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Gagal mengubah status transfer' }, { status: 500 });
  }
}