import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

interface PackingRow extends RowDataPacket {
  kode_picking: string;
  status: string;
}

interface PickingRow extends RowDataPacket {
  tujuan: string;
}

interface PengirimanRow extends RowDataPacket {
  id: number;
}

// GET /api/warehouse/pengiriman/lookup-packing?kode=PKG-2026-001
// Dipakai frontend buat cek & auto-isi tujuan sebelum submit form Buat Pengiriman
export async function GET(req: NextRequest) {
  try {
    const kodePacking = req.nextUrl.searchParams.get('kode')?.trim();

    if (!kodePacking) {
      return NextResponse.json({ error: 'Kode packing wajib diisi.' }, { status: 400 });
    }

    const [packingRows] = await pool.query<PackingRow[]>(
      'SELECT kode_picking, status FROM packing WHERE kode_packing = ? LIMIT 1',
      [kodePacking]
    );

    if (packingRows.length === 0) {
      return NextResponse.json({ error: `Kode packing "${kodePacking}" tidak ditemukan.` }, { status: 404 });
    }

    const packing = packingRows[0];

    if (packing.status !== 'Selesai') {
      return NextResponse.json(
        { error: `Packing "${kodePacking}" belum selesai (status saat ini: ${packing.status}).` },
        { status: 400 }
      );
    }

    const [pickingRows] = await pool.query<PickingRow[]>(
      'SELECT tujuan FROM picking WHERE kode = ? LIMIT 1',
      [packing.kode_picking]
    );

    if (pickingRows.length === 0) {
      return NextResponse.json(
        { error: `Data picking "${packing.kode_picking}" terkait packing ini tidak ditemukan.` },
        { status: 404 }
      );
    }

    // Cek apakah kode packing ini sudah pernah dipakai buat pengiriman lain
    const [pengirimanRows] = await pool.query<PengirimanRow[]>(
      'SELECT id FROM pengiriman WHERE kode_packing = ? LIMIT 1',
      [kodePacking]
    );

    if (pengirimanRows.length > 0) {
      return NextResponse.json(
        { error: `Packing "${kodePacking}" sudah punya data pengiriman sebelumnya.` },
        { status: 409 }
      );
    }

    return NextResponse.json({
      kodePicking: packing.kode_picking,
      tujuan: pickingRows[0].tujuan,
    });
  } catch (err) {
    console.error('GET /api/warehouse/pengiriman/lookup-packing error:', err);
    return NextResponse.json({ error: 'Gagal memeriksa kode packing.' }, { status: 500 });
  }
}