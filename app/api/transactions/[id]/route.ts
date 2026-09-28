import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

// GET /api/transactions/:id
// Dipakai saat baris transaksi di panel "Riwayat Transaksi" diklik,
// untuk menampilkan rincian barang (nama, qty, subtotal).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [transaksiRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, tanggal, grand_total FROM transactions WHERE id = ?`,
      [id]
    );

    if (transaksiRows.length === 0) {
      return NextResponse.json(
        { message: 'Transaksi tidak ditemukan' },
        { status: 404 }
      );
    }

    const [itemRows] = await pool.query<RowDataPacket[]>(
      `SELECT nama_produk AS nama, qty, harga_satuan, subtotal
       FROM transaction_items
       WHERE transaction_id = ?`,
      [id]
    );

    return NextResponse.json({
      id: transaksiRows[0].id,
      nomor: `#TRX-${String(transaksiRows[0].id).padStart(3, '0')}`,
      waktu: transaksiRows[0].tanggal,
      total: Number(transaksiRows[0].grand_total),
      items: itemRows.map((item) => ({
        nama: item.nama,
        qty: Number(item.qty),
        hargaSatuan: Number(item.harga_satuan),
        subtotal: Number(item.subtotal),
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Gagal mengambil detail transaksi' },
      { status: 500 }
    );
  }
}