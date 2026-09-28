import { NextRequest, NextResponse } from 'next/server';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '@/lib/db'; // sesuaikan path sesuai lokasi file db.ts kamu

type StatusPicking = 'Pending' | 'Diproses' | 'Selesai';
const STATUS_VALID: StatusPicking[] = ['Pending', 'Diproses', 'Selesai'];

interface PickingRow extends RowDataPacket {
  id: number;
  kode: string;
  tanggal: string;
  tujuan: string;
  status: StatusPicking;
}

// GET /api/warehouse/picking -> ambil semua data picking
export async function GET() {
  try {
    const [rows] = await pool.query<PickingRow[]>(
      'SELECT id, kode, tanggal, tujuan, status FROM picking ORDER BY id DESC'
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error('GET /api/warehouse/picking error:', err);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat mengambil data picking.' },
      { status: 500 }
    );
  }
}

// POST /api/warehouse/picking -> tambah data picking baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const kode = String(body.kode ?? '').trim();
    const tanggal = String(body.tanggal ?? '').trim();
    const tujuan = String(body.tujuan ?? '').trim();
    const status = String(body.status ?? 'Pending').trim() as StatusPicking;

    if (!kode || !tanggal || !tujuan) {
      return NextResponse.json(
        { message: 'Kode, tanggal, dan tujuan wajib diisi.' },
        { status: 400 }
      );
    }

    if (!STATUS_VALID.includes(status)) {
      return NextResponse.json(
        { message: 'Status tidak valid.' },
        { status: 400 }
      );
    }

    const [existing] = await pool.query<PickingRow[]>(
      'SELECT id FROM picking WHERE kode = ? LIMIT 1',
      [kode]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { message: `Kode picking "${kode}" sudah dipakai.` },
        { status: 409 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO picking (kode, tanggal, tujuan, status) VALUES (?, ?, ?, ?)',
      [kode, tanggal, tujuan, status]
    );

    return NextResponse.json(
      { id: result.insertId, kode, tanggal, tujuan, status },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/warehouse/picking error:', err);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat menyimpan data picking.' },
      { status: 500 }
    );
  }
}