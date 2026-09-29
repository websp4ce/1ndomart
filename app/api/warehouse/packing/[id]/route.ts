import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

interface PackingRow extends RowDataPacket {
  id: number;
  status: string;
}

interface PickingRow extends RowDataPacket {
  id: number;
}

interface PickingItemRow extends RowDataPacket {
  barcode_produk: string;
  nama_produk: string;
  jumlah: number;
}

interface ProdukRow extends RowDataPacket {
  stok: number;
}

interface StokUpdate {
  namaProduk: string;
  barcodeProduk: string;
  stokSebelum: number;
  stokSesudah: number;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const connection = await pool.getConnection();
  try {
    const { id } = await params;
    const body = await req.json();
    const { kodePacking, kodePicking, tanggal, status } = body;

    await connection.beginTransaction();

    // Ambil status packing SEBELUM diupdate, buat cek apakah ini transisi
    // pertama kali ke "Selesai" (biar stok gak kepotong dobel kalau disave ulang)
    const [existingRows] = await connection.query<PackingRow[]>(
      'SELECT id, status FROM packing WHERE id = ? LIMIT 1 FOR UPDATE',
      [id]
    );
    if (existingRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }
    const statusSebelum = existingRows[0].status;

    const [result] = await connection.query<ResultSetHeader>(
      'UPDATE packing SET kode_packing = ?, kode_picking = ?, tanggal = ?, status = ? WHERE id = ?',
      [kodePacking, kodePicking, tanggal, status, id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }

    // Baru kurangi stok kalau status BARU SAJA berubah jadi "Selesai"
    const stokUpdates: StokUpdate[] = [];

    if (status === 'Selesai' && statusSebelum !== 'Selesai') {
      const [pickingRows] = await connection.query<PickingRow[]>(
        'SELECT id FROM picking WHERE kode = ? LIMIT 1',
        [kodePicking]
      );

      if (pickingRows.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: `Data picking dengan kode "${kodePicking}" tidak ditemukan, stok tidak dapat diperbarui.` },
          { status: 404 }
        );
      }

      const pickingId = pickingRows[0].id;

      const [itemRows] = await connection.query<PickingItemRow[]>(
        'SELECT barcode_produk, nama_produk, jumlah FROM picking_items WHERE picking_id = ?',
        [pickingId]
      );

      for (const item of itemRows) {
        // Kunci baris produknya dulu (FOR UPDATE) biar stok sebelum yang dibaca akurat
        const [produkRows] = await connection.query<ProdukRow[]>(
          'SELECT stok FROM products WHERE barcode = ? LIMIT 1 FOR UPDATE',
          [item.barcode_produk]
        );

        if (produkRows.length === 0) continue; // produk gak ketemu, lewati

        const stokSebelum = produkRows[0].stok;
        const stokSesudah = stokSebelum - item.jumlah;

        await connection.query('UPDATE products SET stok = ? WHERE barcode = ?', [
          stokSesudah,
          item.barcode_produk,
        ]);

        stokUpdates.push({
          namaProduk: item.nama_produk,
          barcodeProduk: item.barcode_produk,
          stokSebelum,
          stokSesudah,
        });
      }
    }

    await connection.commit();
    return NextResponse.json({ message: 'Berhasil diperbarui', stokUpdates });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    return NextResponse.json({ error: 'Gagal memperbarui data packing' }, { status: 500 });
  } finally {
    connection.release();
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM packing WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Berhasil dihapus' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Gagal menghapus data packing' }, { status: 500 });
  }
}