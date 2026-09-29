import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query =
      "SELECT id, kode_packing AS kodePacking, kode_picking AS kodePicking, DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal, status FROM packing WHERE 1=1";
    const params: string[] = [];

    if (status && status !== 'Semua') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (kode_packing LIKE ? OR kode_picking LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY tanggal DESC, id DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Gagal mengambil data packing' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { kodePacking, kodePicking, tanggal, status } = body;

    if (!kodePacking || !kodePicking || !tanggal) {
      return NextResponse.json(
        { error: 'kodePacking, kodePicking, dan tanggal wajib diisi' },
        { status: 400 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO packing (kode_packing, kode_picking, tanggal, status) VALUES (?, ?, ?, ?)',
      [kodePacking, kodePicking, tanggal, status || 'Proses']
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    if (err?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Kode packing sudah dipakai' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal menambah data packing' }, { status: 500 });
  }
}