  import { NextRequest, NextResponse } from 'next/server';
  import pool from '@/lib/db';
  import type { ResultSetHeader } from 'mysql2';

  export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await params;
      const body = await req.json();
      const kodeRak = String(body.kodeRak ?? '').trim();
      const keterangan = String(body.keterangan ?? '').trim();
      const kapasitas = Number(body.kapasitas ?? 0);

      if (!kodeRak) {
        return NextResponse.json({ error: 'Kode rak wajib diisi.' }, { status: 400 });
      }

      const [result] = await pool.query<ResultSetHeader>(
        'UPDATE lokasi_rak SET kode_rak = ?, keterangan = ?, kapasitas = ? WHERE id = ?',
        [kodeRak, keterangan || null, kapasitas, id]
      );

      if (result.affectedRows === 0) {
        return NextResponse.json({ error: 'Data rak tidak ditemukan.' }, { status: 404 });
      }

      return NextResponse.json({ message: 'Berhasil diperbarui' });
    } catch (err) {
      console.error('PUT /api/warehouse/lokasi-rak/[id] error:', err);
      return NextResponse.json({ error: 'Gagal memperbarui lokasi rak.' }, { status: 500 });
    }
  }

  // Produk yang masih nempel di rak ini otomatis rak_id-nya jadi NULL (ON DELETE SET NULL di skema)
  export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await params;
      const [result] = await pool.query<ResultSetHeader>('DELETE FROM lokasi_rak WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return NextResponse.json({ error: 'Data rak tidak ditemukan.' }, { status: 404 });
      }

      return NextResponse.json({ message: 'Berhasil dihapus' });
    } catch (err) {
      console.error('DELETE /api/warehouse/lokasi-rak/[id] error:', err);
      return NextResponse.json({ error: 'Gagal menghapus lokasi rak.' }, { status: 500 });
    }
  }