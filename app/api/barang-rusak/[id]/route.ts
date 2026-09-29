import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import type { PoolConnection } from 'mysql2/promise';

const STATUS_VALID = ['Menunggu', 'Diproses', 'Selesai', 'Dibuang'];

// Status yang memotong stok produk.
// Mau "Dibuang" ikut memotong? Ubah jadi ['Selesai', 'Dibuang'] (ubah juga di route.ts sebelah).
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

// PATCH /api/barang-rusak/:id
// Body: { status?, qty?, keterangan?, tanggal? }
//   - pindah KE status yang memotong stok   -> stok berkurang sebesar qty
//   - pindah DARI status yang memotong stok -> stok dikembalikan
//   - qty diubah saat status memotong stok  -> hanya selisihnya yang disesuaikan
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const conn = await pool.getConnection();
  try {
    const { id } = await context.params; // wajib di-await (Next.js 15+/16)
    const { status, qty, keterangan, tanggal } = await request.json();

    if (status !== undefined && !STATUS_VALID.includes(status)) {
      return NextResponse.json({ message: 'Status tidak valid' }, { status: 400 });
    }

    if (qty !== undefined && (!Number.isInteger(Number(qty)) || Number(qty) <= 0)) {
      return NextResponse.json({ message: 'Qty harus bilangan bulat lebih dari 0' }, { status: 400 });
    }

    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (status !== undefined) { fields.push('status = ?'); values.push(status); }
    if (qty !== undefined) { fields.push('qty = ?'); values.push(Number(qty)); }
    if (keterangan !== undefined) { fields.push('keterangan = ?'); values.push(keterangan); }
    if (tanggal !== undefined) { fields.push('tanggal = ?'); values.push(tanggal); }

    if (fields.length === 0) {
      return NextResponse.json({ message: 'Tidak ada data yang diubah' }, { status: 400 });
    }

    await conn.beginTransaction();

    // kunci baris supaya dua request tidak saling menimpa
    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT barcode, qty, status FROM barang_rusak WHERE id = ? FOR UPDATE',
      [id]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return NextResponse.json({ message: 'Data tidak ditemukan' }, { status: 404 });
    }

    const lama = rows[0];
    const statusBaru = status ?? lama.status;
    const qtyBaru = qty !== undefined ? Number(qty) : Number(lama.qty);

    // positif = stok dikembalikan, negatif = stok dikurangi
    const selisih = efekStok(lama.status, lama.qty) - efekStok(statusBaru, qtyBaru);
    await ubahStok(conn, lama.barcode, selisih);

    values.push(id);
    await conn.query(`UPDATE barang_rusak SET ${fields.join(', ')} WHERE id = ?`, values);

    await conn.commit();

    return NextResponse.json({ message: 'Data berhasil diubah' });
  } catch (error) {
    await conn.rollback();
    if (error instanceof StokError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ message: 'Gagal mengubah data' }, { status: 500 });
  } finally {
    conn.release();
  }
}

// DELETE /api/barang-rusak/:id
// Kalau data yang dihapus sedang memotong stok, stok dikembalikan dulu.
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const conn = await pool.getConnection();
  try {
    const { id } = await context.params;

    await conn.beginTransaction();

    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT barcode, qty, status FROM barang_rusak WHERE id = ? FOR UPDATE',
      [id]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return NextResponse.json({ message: 'Data tidak ditemukan' }, { status: 404 });
    }

    const lama = rows[0];
    await ubahStok(conn, lama.barcode, efekStok(lama.status, lama.qty));

    await conn.query('DELETE FROM barang_rusak WHERE id = ?', [id]);

    await conn.commit();

    return NextResponse.json({ message: 'Data berhasil dihapus' });
  } catch (error) {
    await conn.rollback();
    if (error instanceof StokError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ message: 'Gagal menghapus data' }, { status: 500 });
  } finally {
    conn.release();
  }
}