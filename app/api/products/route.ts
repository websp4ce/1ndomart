import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET /api/products
// GET /api/products?cari=laptop  <-- baru: dipakai autocomplete di form Transfer Stok
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cari = searchParams.get('cari');

  try {
    if (cari) {
      // Mode pencarian ringkas, buat dropdown/autocomplete
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT barcode AS id, nama FROM products
         WHERE nama LIKE ? OR barcode LIKE ?
         ORDER BY nama ASC
         LIMIT 10`,
        [`%${cari}%`, `%${cari}%`],
      );
      return NextResponse.json(rows);
    }

    // Mode lengkap (perilaku lama, dipakai halaman Transaksi)
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.barcode AS id, p.nama, p.harga, p.stok, p.gambar, c.nama AS kategori
       FROM products p
       JOIN categories c ON p.category_id = c.id
       ORDER BY p.nama`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Gagal mengambil daftar produk' },
      { status: 500 }
    );
  }
}

// POST /api/products
// Dipakai di form "Add Product" halaman Scan Barcode.
// Body: { barcode, nama, harga, stok, kategori, gambar }
// Kalau "kategori" belum ada di tabel categories, otomatis di-insert dulu
// (ini yang bikin pill kategori baru bisa muncul otomatis di halaman Transaksi).
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { barcode, nama, harga, stok, kategori, gambar } = body;

    if (!barcode || !nama || !harga || !kategori) {
      return NextResponse.json(
        { message: 'Barcode, nama, harga, dan kategori wajib diisi' },
        { status: 400 }
      );
    }

    const [existingCategory] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM categories WHERE nama = ?',
      [kategori]
    );

    let categoryId: number;

    if (existingCategory.length > 0) {
      categoryId = existingCategory[0].id;
    } else {
      const [insertCategory] = await pool.query<ResultSetHeader>(
        'INSERT INTO categories (nama) VALUES (?)',
        [kategori]
      );
      categoryId = insertCategory.insertId;
    }

    await pool.query(
      `INSERT INTO products (barcode, nama, harga, stok, category_id, gambar)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [barcode, nama, harga, stok ?? 0, categoryId, gambar ?? null]
    );

    return NextResponse.json(
      { message: 'Produk berhasil ditambahkan' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { message: 'Barcode ini sudah terdaftar' },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json(
      { message: 'Gagal menambahkan produk' },
      { status: 500 }
    );
  }
}