import { NextRequest, NextResponse } from 'next/server';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '@/lib/db'; // sesuaikan path sesuai lokasi file db.ts kamu

interface ItemRow extends RowDataPacket {
  id: number;
  picking_id: number;
  barcode_produk: string;
  nama_produk: string;
  jumlah: number;
  kode_rak: string | null;
}

type RouteContext = { params: Promise<{ id: string }> };

function mapItem(row: ItemRow) {
  return {
    id: row.id,
    pickingId: row.picking_id,
    barcodeProduk: row.barcode_produk,
    namaProduk: row.nama_produk,
    jumlah: row.jumlah,
    kodeRak: row.kode_rak, // null kalau produk belum ditaruh di rak manapun
  };
}

// GET /api/warehouse/picking/:id/items -> daftar item milik 1 picking + lokasi raknya
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id: idParam } = await context.params;
    const pickingId = Number(idParam);
    if (!pickingId) {
      return NextResponse.json({ message: 'ID picking tidak valid.' }, { status: 400 });
    }

    const [rows] = await pool.query<ItemRow[]>(
      `SELECT
         pi.id,
         pi.picking_id,
         pi.barcode_produk,
         pi.nama_produk,
         pi.jumlah,
         lr.kode_rak
       FROM picking_items pi
       LEFT JOIN products p ON p.barcode = pi.barcode_produk
       LEFT JOIN lokasi_rak lr ON lr.id = p.rak_id
       WHERE pi.picking_id = ?
       ORDER BY pi.id ASC`,
      [pickingId]
    );

    return NextResponse.json(rows.map(mapItem));
  } catch (err) {
    console.error('GET /api/warehouse/picking/[id]/items error:', err);
    return NextResponse.json({ message: 'Gagal mengambil item picking.' }, { status: 500 });
  }
}

// POST /api/warehouse/picking/:id/items  { barcodeProduk, namaProduk, jumlah }
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id: idParam } = await context.params;
    const pickingId = Number(idParam);
    if (!pickingId) {
      return NextResponse.json({ message: 'ID picking tidak valid.' }, { status: 400 });
    }

    const body = await req.json();
    const barcodeProduk = String(body.barcodeProduk ?? '').trim();
    const namaProduk = String(body.namaProduk ?? '').trim();
    const jumlah = Number(body.jumlah);

    if (!barcodeProduk || !namaProduk || !jumlah || jumlah <= 0) {
      return NextResponse.json(
        { message: 'Produk dan jumlah (lebih dari 0) wajib diisi.' },
        { status: 400 }
      );
    }

    const [pickingExists] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM picking WHERE id = ? LIMIT 1',
      [pickingId]
    );
    if (pickingExists.length === 0) {
      return NextResponse.json({ message: 'Data picking tidak ditemukan.' }, { status: 404 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO picking_items (picking_id, barcode_produk, nama_produk, jumlah) VALUES (?, ?, ?, ?)',
      [pickingId, barcodeProduk, namaProduk, jumlah]
    );

    return NextResponse.json(
      { id: result.insertId, pickingId, barcodeProduk, namaProduk, jumlah, kodeRak: null },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/warehouse/picking/[id]/items error:', err);
    return NextResponse.json({ message: 'Gagal menambah item picking.' }, { status: 500 });
  }
}