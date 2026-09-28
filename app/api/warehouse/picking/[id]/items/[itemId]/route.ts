import { NextRequest, NextResponse } from 'next/server';
import type { ResultSetHeader } from 'mysql2';
import pool from '@/lib/db'; // sesuaikan path sesuai lokasi file db.ts kamu

type RouteContext = { params: Promise<{ itemId: string }> };

// PUT /api/warehouse/picking/items/:itemId  { jumlah }
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { itemId: idParam } = await context.params;
    const id = Number(idParam);
    if (!id) {
      return NextResponse.json({ message: 'ID item tidak valid.' }, { status: 400 });
    }

    const body = await req.json();
    const jumlah = Number(body.jumlah);
    if (!jumlah || jumlah <= 0) {
      return NextResponse.json({ message: 'Jumlah harus lebih dari 0.' }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE picking_items SET jumlah = ? WHERE id = ?',
      [jumlah, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Item tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Item berhasil diperbarui.' });
  } catch (err) {
    console.error('PUT /api/warehouse/picking/items/[itemId] error:', err);
    return NextResponse.json({ message: 'Gagal memperbarui item.' }, { status: 500 });
  }
}

// DELETE /api/warehouse/picking/items/:itemId
export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { itemId: idParam } = await context.params;
    const id = Number(idParam);
    if (!id) {
      return NextResponse.json({ message: 'ID item tidak valid.' }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>('DELETE FROM picking_items WHERE id = ?', [
      id,
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Item tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Item berhasil dihapus.' });
  } catch (err) {
    console.error('DELETE /api/warehouse/picking/items/[itemId] error:', err);
    return NextResponse.json({ message: 'Gagal menghapus item.' }, { status: 500 });
  }
}