import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, jumlah } = body;

    if (!id || !jumlah || jumlah <= 0) {
      return NextResponse.json(
        { message: 'Produk dan jumlah restock wajib diisi dengan benar' },
        { status: 400 }
      );
    }

    // 1. Pastikan produknya ada
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT barcode, stok FROM products WHERE barcode = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { message: 'Produk tidak ditemukan' },
        { status: 404 }
      );
    }

    // 2. Update stok: stok baru = stok lama + jumlah restock
    await pool.query<ResultSetHeader>(
      'UPDATE products SET stok = stok + ? WHERE barcode = ?',
      [jumlah, id]
    );

    // 3. Ambil ulang stok terbaru buat dikirim balik ke frontend
    const [updated] = await pool.query<RowDataPacket[]>(
      'SELECT barcode AS id, stok AS stokSaatIni FROM products WHERE barcode = ?',
      [id]
    );

    return NextResponse.json({
      message: 'Restock berhasil',
      data: updated[0],
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Gagal melakukan restock produk' },
      { status: 500 }
    );
  }
}