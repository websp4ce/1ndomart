import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT pi.id,
              pi.barcode_produk AS barcodeProduk,
              pi.nama_produk AS namaProduk,
              pi.jumlah
       FROM packing pk
       JOIN picking pc ON pc.kode = pk.kode_picking
       JOIN picking_items pi ON pi.picking_id = pc.id
       WHERE pk.id = ?
       ORDER BY pi.id ASC`,
      [id]
    );

    if (rows.length === 0) {
      // cek dulu apakah packing-nya sendiri ada, biar bisa bedain "kosong" vs "picking tidak ditemukan"
      const [pk] = await pool.query<RowDataPacket[]>('SELECT id FROM packing WHERE id = ?', [id]);
      if (pk.length === 0) {
        return NextResponse.json({ error: 'Data packing tidak ditemukan' }, { status: 404 });
      }
    }

    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Gagal mengambil item packing' }, { status: 500 });
  }
}