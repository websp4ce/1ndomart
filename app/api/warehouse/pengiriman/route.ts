import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface PengirimanRow extends RowDataPacket {
  id: number;
  kode_pengiriman: string;
  kode_packing: string;
  tujuan: string;
  tanggal: string;
  status: string;
}

interface PackingRow extends RowDataPacket {
  kode_picking: string;
  status: string;
}

interface PickingRow extends RowDataPacket {
  tujuan: string;
}

function mapRow(row: PengirimanRow) {
  return {
    id: row.id,
    kodePengiriman: row.kode_pengiriman,
    kodePacking: row.kode_packing,
    tujuan: row.tujuan,
    tanggal: row.tanggal,
    status: row.status,
  };
}

// GET /api/warehouse/pengiriman?status=Dikirim&search=jakarta
export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get('status');
    const search = req.nextUrl.searchParams.get('search')?.trim();

    let sql = 'SELECT id, kode_pengiriman, kode_packing, tujuan, tanggal, status FROM pengiriman WHERE 1=1';
    const values: (string)[] = [];

    if (status && status !== 'Semua') {
      sql += ' AND status = ?';
      values.push(status);
    }
    if (search) {
      sql += ' AND (kode_pengiriman LIKE ? OR tujuan LIKE ?)';
      values.push(`%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY id DESC';

    const [rows] = await pool.query<PengirimanRow[]>(sql, values);
    return NextResponse.json({ data: rows.map(mapRow) });
  } catch (err) {
    console.error('GET /api/warehouse/pengiriman error:', err);
    return NextResponse.json({ error: 'Gagal mengambil data pengiriman.' }, { status: 500 });
  }
}

// POST /api/warehouse/pengiriman  { kodePengiriman, kodePacking, tanggal, status? }
// Tujuan TIDAK diminta dari client — selalu diambil ulang dari picking terkait di server,
// biar gak bisa dimanipulasi/salah ketik dari frontend.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const kodePengiriman = String(body.kodePengiriman ?? '').trim();
    const kodePacking = String(body.kodePacking ?? '').trim();
    const tanggal = String(body.tanggal ?? '').trim();
    const status = String(body.status ?? 'Dalam Proses').trim();

    if (!kodePengiriman || !kodePacking || !tanggal) {
      return NextResponse.json(
        { error: 'Kode pengiriman, kode packing, dan tanggal wajib diisi.' },
        { status: 400 }
      );
    }

    // Cek kode pengiriman belum dipakai
    const [existingPengiriman] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM pengiriman WHERE kode_pengiriman = ? LIMIT 1',
      [kodePengiriman]
    );
    if (existingPengiriman.length > 0) {
      return NextResponse.json(
        { error: `Kode pengiriman "${kodePengiriman}" sudah dipakai.` },
        { status: 409 }
      );
    }

    // Validasi packing: harus ada & statusnya "Selesai"
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

    // Cek packing ini belum pernah dipakai buat pengiriman lain
    const [pengirimanTerpakai] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM pengiriman WHERE kode_packing = ? LIMIT 1',
      [kodePacking]
    );
    if (pengirimanTerpakai.length > 0) {
      return NextResponse.json(
        { error: `Packing "${kodePacking}" sudah punya data pengiriman sebelumnya.` },
        { status: 409 }
      );
    }

    // Ambil tujuan dari picking terkait
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
    const tujuan = pickingRows[0].tujuan;

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO pengiriman (kode_pengiriman, kode_packing, tujuan, tanggal, status) VALUES (?, ?, ?, ?, ?)',
      [kodePengiriman, kodePacking, tujuan, tanggal, status]
    );

    return NextResponse.json(
      {
        id: result.insertId,
        kodePengiriman,
        kodePacking,
        tujuan,
        tanggal,
        status,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/warehouse/pengiriman error:', err);
    return NextResponse.json({ error: 'Gagal menambah data pengiriman.' }, { status: 500 });
  }
}