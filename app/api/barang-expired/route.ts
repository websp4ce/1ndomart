import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

// GET /api/barang-expired?search=&kategori=&status=
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? '';
    const kategori = searchParams.get('kategori') ?? '';
    const status = searchParams.get('status') ?? '';

    let query = `
      SELECT
        p.barcode,
        p.nama,
        p.gambar,
        c.nama AS kategori,
        p.batch,
        p.tgl_expired,
        DATEDIFF(p.tgl_expired, CURDATE()) AS sisa_hari
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.tgl_expired IS NOT NULL
    `;
    const params: (string | number)[] = [];

    if (search) {
      query += ` AND (p.nama LIKE ? OR p.batch LIKE ? OR c.nama LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (kategori && kategori !== 'Semua Kategori') {
      query += ` AND c.nama = ?`;
      params.push(kategori);
    }

    query += ` ORDER BY p.tgl_expired ASC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    // Hitung status di JS supaya gampang di-filter tanpa query rumit
    const data = rows.map((row) => {
      let itemStatus: 'Expired' | 'Hampir Expired' | 'Aman';
      if (row.sisa_hari <= 0) itemStatus = 'Expired';
      else if (row.sisa_hari <= 7) itemStatus = 'Hampir Expired';
      else itemStatus = 'Aman';

      return { ...row, status: itemStatus };
    });

    // Frontend kirim 'Semua' saat tab default
    const filtered =
      status && status !== 'Semua'
        ? data.filter((d) => d.status === status)
        : data;

    return NextResponse.json(filtered);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Gagal mengambil data barang expired' },
      { status: 500 }
    );
  }
}

// POST /api/barang-expired
// Karena expired nempel langsung di tabel products (bukan tabel batch terpisah),
// endpoint ini dipakai untuk MENGISI/MENGUBAH batch & tgl_expired produk yang sudah ada,
// bukan menambah baris produk baru.
export async function POST(request: Request) {
  try {
    const { barcode, batch, tgl_expired } = await request.json();

    if (!barcode || !batch || !tgl_expired) {
      return NextResponse.json(
        { message: 'Barcode, batch, dan tanggal expired wajib diisi' },
        { status: 400 }
      );
    }

    const [result] = await pool.query<RowDataPacket[] & { affectedRows: number }[]>(
      `UPDATE products SET batch = ?, tgl_expired = ? WHERE barcode = ?`,
      [batch, tgl_expired, barcode]
    );

    // @ts-expect-error - mysql2 OkPacket punya affectedRows meski tidak ada di tipe RowDataPacket
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: 'Produk dengan barcode tersebut tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Batch & tanggal expired berhasil disimpan' },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Gagal menyimpan batch/expired' },
      { status: 500 }
    );
  }
}