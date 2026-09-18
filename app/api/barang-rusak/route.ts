import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET /api/barang-rusak?search=&status=Semua&tanggal=YYYY-MM-DD
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'Semua';
  const tanggal = searchParams.get('tanggal') || '';

  try {
    const conditions: string[] = [];
    const values: (string | number)[] = [];

    if (search) {
      conditions.push('(p.nama LIKE ? OR c.nama LIKE ? OR br.keterangan LIKE ?)');
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status && status !== 'Semua') {
      conditions.push('br.status = ?');
      values.push(status);
    }

    if (tanggal) {
      conditions.push('br.tanggal = ?');
      values.push(tanggal);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         br.id,
         br.tanggal,
         br.barcode,
         p.nama,
         p.gambar,
         c.nama AS kategori,
         br.qty,
         br.keterangan,
         br.status
       FROM barang_rusak br
       JOIN products p ON br.barcode = p.barcode
       JOIN categories c ON p.category_id = c.id
       ${whereClause}
       ORDER BY br.tanggal DESC, br.id DESC`,
      values
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Gagal mengambil data barang rusak' },
      { status: 500 }
    );
  }
}

// POST /api/barang-rusak
// Body: { barcode, tanggal, qty, keterangan, status? }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { barcode, tanggal, qty, keterangan, status } = body;

    if (!barcode || !tanggal || !qty || !keterangan) {
      return NextResponse.json(
        { message: 'Barcode, tanggal, qty, dan keterangan wajib diisi' },
        { status: 400 }
      );
    }

    const [existingProduct] = await pool.query<RowDataPacket[]>(
      'SELECT barcode FROM products WHERE barcode = ?',
      [barcode]
    );

    if (existingProduct.length === 0) {
      return NextResponse.json(
        { message: 'Produk dengan barcode tersebut tidak ditemukan' },
        { status: 404 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO barang_rusak (barcode, tanggal, qty, keterangan, status)
       VALUES (?, ?, ?, ?, ?)`,
      [barcode, tanggal, qty, keterangan, status ?? 'Menunggu']
    );

    return NextResponse.json(
      { message: 'Barang rusak berhasil dicatat', id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Gagal menyimpan data barang rusak' },
      { status: 500 }
    );
  }
}