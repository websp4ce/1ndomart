import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET /api/products
// GET /api/products?cari=laptop  <-- dipakai autocomplete di form Transfer Stok
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cari = searchParams.get('cari');

  try {
    if (cari) {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT barcode AS id, nama FROM products
         WHERE nama LIKE ? OR barcode LIKE ?
         ORDER BY nama ASC
         LIMIT 10`,
        [`%${cari}%`, `%${cari}%`],
      );
      return NextResponse.json(rows);
    }

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
// Body: multipart/form-data { barcode, nama, harga, stok, kategori, gambar(File, opsional) }
// File gambar disimpan ke public/produk/, lalu path-nya ("/produk/xxx.png")
// disimpan ke kolom products.gambar.
const TIPE_GAMBAR: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};
const MAKS_UKURAN = 2 * 1024 * 1024; // 2 MB

export async function POST(request: Request) {
  try {
    const form = await request.formData();

    const barcode = String(form.get('barcode') ?? '').trim();
    const nama = String(form.get('nama') ?? '').trim();
    const harga = String(form.get('harga') ?? '').trim();
    const stok = String(form.get('stok') ?? '').trim();
    const kategori = String(form.get('kategori') ?? '').trim();
    const file = form.get('gambar');

    if (!barcode || !nama || !harga || !kategori) {
      return NextResponse.json(
        { message: 'Barcode, nama, harga, dan kategori wajib diisi' },
        { status: 400 }
      );
    }

    // ---- Simpan gambar (kalau ada) ----
    let pathGambar: string | null = null;

    if (file instanceof File && file.size > 0) {
      const ext = TIPE_GAMBAR[file.type];
      if (!ext) {
        return NextResponse.json(
          { message: 'Format gambar harus PNG, JPG, atau WEBP' },
          { status: 400 }
        );
      }
      if (file.size > MAKS_UKURAN) {
        return NextResponse.json(
          { message: 'Ukuran gambar maksimal 2 MB' },
          { status: 400 }
        );
      }

      const folder = path.join(process.cwd(), 'public', 'produk');
      await mkdir(folder, { recursive: true });

      const barcodeAman = barcode.replace(/[^a-zA-Z0-9_-]/g, '');
      const namaFile = `${barcodeAman}-${Date.now()}.${ext}`;
      await writeFile(
        path.join(folder, namaFile),
        Buffer.from(await file.arrayBuffer())
      );

      pathGambar = `/produk/${namaFile}`;
    }

    // ---- Kategori: pakai yang ada, atau buat baru ----
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
      [barcode, nama, Number(harga), stok ? Number(stok) : 0, categoryId, pathGambar]
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