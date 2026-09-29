import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader } from 'mysql2';

const STATUS_VALID = ['Dalam Proses', 'Dikirim', 'Terkirim'];

// PUT /api/warehouse/pengiriman/:id  { status }
// Cuma status yang bisa diubah — kode packing & tujuan dikunci sejak dibuat.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const status = String(body.status ?? '').trim();

    if (!STATUS_VALID.includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid.' }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE pengiriman SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Data pengiriman tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Berhasil diperbarui' });
  } catch (err) {
    console.error('PUT /api/warehouse/pengiriman/[id] error:', err);
    return NextResponse.json({ error: 'Gagal memperbarui data pengiriman.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM pengiriman WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Data pengiriman tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Berhasil dihapus' });
  } catch (err) {
    console.error('DELETE /api/warehouse/pengiriman/[id] error:', err);
    return NextResponse.json({ error: 'Gagal menghapus data pengiriman.' }, { status: 500 });
  }
}