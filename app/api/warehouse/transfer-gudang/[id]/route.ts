import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db'; // sesuaikan path sesuai lokasi koneksi database kamu

// GET /api/warehouse/transfer-gudang/[id] -> detail header + daftar item produk
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [headerRows]: any = await pool.query(
      `SELECT
         tg.id, tg.kode_transfer, tg.tanggal, tg.status, tg.catatan,
         gasal.nama AS dari_gudang, gtujuan.nama AS ke_gudang
       FROM transfer_gudang tg
       JOIN gudang gasal ON gasal.id = tg.dari_gudang_id
       JOIN gudang gtujuan ON gtujuan.id = tg.ke_gudang_id
       WHERE tg.id = ?`,
      [id]
    );

    if (headerRows.length === 0) {
      return NextResponse.json({ message: 'Transfer tidak ditemukan.' }, { status: 404 });
    }

    const [items] = await pool.query(
      'SELECT id, barcode, nama_produk, qty FROM transfer_gudang_items WHERE transfer_gudang_id = ?',
      [id]
    );

    return NextResponse.json({ ...headerRows[0], items });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: 'Gagal mengambil detail transfer.' },
      { status: 500 }
    );
  }
}

// PATCH /api/warehouse/transfer-gudang/[id] -> ubah status transfer
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await req.json();
    const statusValid = ['Dalam Proses', 'Dikirim', 'Terkirim'];

    if (!statusValid.includes(status)) {
      return NextResponse.json({ message: 'Status tidak valid.' }, { status: 400 });
    }

    const [result]: any = await pool.query(
      'UPDATE transfer_gudang SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Transfer tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Status transfer berhasil diubah.' });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: 'Gagal mengubah status transfer.' },
      { status: 500 }
    );
  }
}

// DELETE /api/warehouse/transfer-gudang/[id] -> hapus transfer (item ikut terhapus lewat ON DELETE CASCADE)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [result]: any = await pool.query('DELETE FROM transfer_gudang WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Transfer tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Transfer berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: 'Gagal menghapus transfer.' },
      { status: 500 }
    );
  }
}