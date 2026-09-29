import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import type { PoolConnection } from 'mysql2/promise';

const STATUS_VALID = ['Menunggu', 'Diproses', 'Selesai', 'Dibuang'];

// Status yang memotong stok produk.
// Mau "Dibuang" ikut memotong? Ubah jadi ['Selesai', 'Dibuang'] (ubah juga di [id]/route.ts).
const STATUS_POTONG_STOK = ['Selesai'];

function efekStok(status: string, qty: number) {
  return STATUS_POTONG_STOK.includes(status) ? Number(qty) : 0;
}

class StokError extends Error {}

// selisih negatif = kurangi stok, positif = kembalikan stok
async function ubahStok(conn: PoolConnection, barcode: string, selisih: number) {
  if (selisih === 0) return;

  const [rows] = await conn.query<RowDataPacket[]>(
    'SELECT stok FROM products WHERE barcode = ? FOR UPDATE',
    [barcode]
  );
  if (rows.length === 0) throw new StokError('Produk dengan barcode tersebut tidak ditemukan');

  const stokSekarang = Number(rows[0].stok);
  if (stokSekarang + selisih < 0) {
    throw new StokError(
      `Stok tidak cukup. Stok sekarang ${stokSekarang}, dibutuhkan ${Math.abs(selisih)}.`
    );
  }

  await conn.query('UPDATE products SET stok = stok + ? WHERE barcode = ?', [selisih, barcode]);
}

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
// Kalau status awal sudah "Selesai", stok produk langsung dipotong.
export async function POST(request: Request) {
  const conn = await pool.getConnection();
  try {
    const body = await request.json();
    const { barcode, tanggal, keterangan } = body;
    const qty = Number(body.qty);
    const status = body.status ?? 'Menunggu';

    if (!barcode || !tanggal || !qty || !keterangan) {
      return NextResponse.json(
        { message: 'Barcode, tanggal, qty, dan keterangan wajib diisi' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(qty) || qty <= 0) {
      return NextResponse.json({ message: 'Qty harus bilangan bulat lebih dari 0' }, { status: 400 });
    }

    if (!STATUS_VALID.includes(status)) {
      return NextResponse.json({ message: 'Status tidak valid' }, { status: 400 });
    }

    await conn.beginTransaction();

    const [existingProduct] = await conn.query<RowDataPacket[]>(
      'SELECT barcode FROM products WHERE barcode = ?',
      [barcode]
    );

    if (existingProduct.length === 0) {
      await conn.rollback();
      return NextResponse.json(
        { message: 'Produk dengan barcode tersebut tidak ditemukan' },
        { status: 404 }
      );
    }

    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO barang_rusak (barcode, tanggal, qty, keterangan, status)
       VALUES (?, ?, ?, ?, ?)`,
      [barcode, tanggal, qty, keterangan, status]
    );

    await ubahStok(conn, barcode, -efekStok(status, qty));

    await conn.commit();

    return NextResponse.json(
      { message: 'Barang rusak berhasil dicatat', id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    await conn.rollback();
    if (error instanceof StokError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json(
      { message: 'Gagal menyimpan data barang rusak' },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}