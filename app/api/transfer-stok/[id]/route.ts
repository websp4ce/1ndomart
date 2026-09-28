import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import type { PoolConnection } from 'mysql2/promise';

const STATUS_VALID = ['Menunggu', 'Proses', 'Selesai', 'Dibatalkan'];

class StokError extends Error {}

// Pindahkan stok dari satu gudang ke gudang lain (di tabel stok_lokasi).
// asalLabel dipakai buat pesan error ("gudang asal" / "gudang tujuan").
async function pindahStok(
  conn: PoolConnection,
  barcode: string,
  dariGudangId: number,
  keGudangId: number,
  jumlah: number,
  asalLabel: string
) {
  // 1. Kurangi stok di gudang sumber (dikunci biar aman kalau ada request bareng)
  const [sumber] = await conn.query<RowDataPacket[]>(
    'SELECT stok FROM stok_lokasi WHERE barcode = ? AND gudang_id = ? FOR UPDATE',
    [barcode, dariGudangId]
  );

  const tersedia = sumber.length > 0 ? Number(sumber[0].stok) : 0;
  if (tersedia < jumlah) {
    throw new StokError(`Stok tidak cukup di ${asalLabel}. Tersedia hanya ${tersedia} pcs.`);
  }

  await conn.query(
    'UPDATE stok_lokasi SET stok = stok - ? WHERE barcode = ? AND gudang_id = ?',
    [jumlah, barcode, dariGudangId]
  );

  // 2. Tambah stok di gudang penerima (kalau barisnya belum ada, dibuat dulu)
  const [penerima] = await conn.query<RowDataPacket[]>(
    'SELECT id FROM stok_lokasi WHERE barcode = ? AND gudang_id = ? FOR UPDATE',
    [barcode, keGudangId]
  );

  if (penerima.length > 0) {
    await conn.query(
      'UPDATE stok_lokasi SET stok = stok + ? WHERE barcode = ? AND gudang_id = ?',
      [jumlah, barcode, keGudangId]
    );
  } else {
    await conn.query(
      'INSERT INTO stok_lokasi (barcode, gudang_id, stok) VALUES (?, ?, ?)',
      [barcode, keGudangId, jumlah]
    );
  }
}

// PATCH /api/transfer-stok/:id
// Body: { status: "Menunggu" | "Proses" | "Selesai" | "Dibatalkan" }
//   - pindah KE Selesai   -> stok gudang asal berkurang, gudang tujuan bertambah
//   - pindah DARI Selesai -> perpindahan stok dibatalkan (dikembalikan ke gudang asal)
//   - status lain         -> stok tidak berubah
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const connection = await pool.getConnection();
  try {
    const { id } = await context.params;
    const { status } = await request.json();

    if (!status || !STATUS_VALID.includes(status)) {
      return NextResponse.json({ message: 'Status tidak valid' }, { status: 400 });
    }

    await connection.beginTransaction();

    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT barcode, dari_gudang_id, ke_gudang_id, jumlah, status
       FROM transfer_stok WHERE id = ? FOR UPDATE`,
      [id]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Transfer tidak ditemukan' }, { status: 404 });
    }

    const t = rows[0];
    const jumlah = Number(t.jumlah);
    const dari = Number(t.dari_gudang_id);
    const ke = Number(t.ke_gudang_id);

    if (t.status !== 'Selesai' && status === 'Selesai') {
      await pindahStok(connection, t.barcode, dari, ke, jumlah, 'gudang asal');
    } else if (t.status === 'Selesai' && status !== 'Selesai') {
      await pindahStok(connection, t.barcode, ke, dari, jumlah, 'gudang tujuan');
    }

    await connection.query('UPDATE transfer_stok SET status = ? WHERE id = ?', [status, id]);

    await connection.commit();

    return NextResponse.json({ message: 'Status transfer berhasil diubah' });
  } catch (error) {
    await connection.rollback();
    if (error instanceof StokError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ message: 'Gagal mengubah status transfer' }, { status: 500 });
  } finally {
    connection.release();
  }
}

// DELETE /api/transfer-stok/:id
// Kalau transfer yang dihapus sudah Selesai, stoknya dikembalikan dulu
// (gudang tujuan berkurang, gudang asal bertambah), baru datanya dihapus.
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const connection = await pool.getConnection();
  try {
    const { id } = await context.params;

    await connection.beginTransaction();

    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT barcode, dari_gudang_id, ke_gudang_id, jumlah, status
       FROM transfer_stok WHERE id = ? FOR UPDATE`,
      [id]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Transfer tidak ditemukan' }, { status: 404 });
    }

    const t = rows[0];

    if (t.status === 'Selesai') {
      await pindahStok(
        connection,
        t.barcode,
        Number(t.ke_gudang_id),
        Number(t.dari_gudang_id),
        Number(t.jumlah),
        'gudang tujuan'
      );
    }

    await connection.query('DELETE FROM transfer_stok WHERE id = ?', [id]);

    await connection.commit();

    return NextResponse.json({ message: 'Transfer berhasil dihapus' });
  } catch (error) {
    await connection.rollback();
    if (error instanceof StokError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ message: 'Gagal menghapus transfer' }, { status: 500 });
  } finally {
    connection.release();
  }
}