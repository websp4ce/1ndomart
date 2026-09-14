import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET /api/products
// Dipakai di halaman Transaksi buat gantiin produkDummy.
export async function GET() {
  try {
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

    // 1. Cek kategori sudah ada atau belum
    const [existingCategory] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM categories WHERE nama = ?',
      [kategori]
    );

    let categoryId: number;

    if (existingCategory.length > 0) {
      categoryId = existingCategory[0].id;
    } else {
      // Kategori baru -> insert dulu ke tabel categories
      const [insertCategory] = await pool.query<ResultSetHeader>(
        'INSERT INTO categories (nama) VALUES (?)',
        [kategori]
      );
      categoryId = insertCategory.insertId;
    }

    // 2. Simpan produknya dengan category_id yang sudah pasti ada
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