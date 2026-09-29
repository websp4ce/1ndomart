import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import type { PoolConnection } from 'mysql2/promise';

const STATUS_VALID = ['Menunggu', 'Diproses', 'Selesai', 'Dibuang'];

// Stok produk baru berubah kalau status = Selesai.
//   ke_supplier    -> stok berkurang
//   dari_pelanggan -> stok bertambah
// Hasil: angka + = stok naik, angka - = stok turun, 0 = stok tidak berubah.
function efekStok(jenis: string, status: string, qty: number) {
  if (status !== 'Selesai') return 0;
  return jenis === 'ke_supplier' ? -Number(qty) : Number(qty);
}

class StokError extends Error {}

// Ubah stok produk di dalam transaksi. Balikin stok terbaru.
async function ubahStok(conn: PoolConnection, barcode: string, selisih: number) {
  const [rows] = await conn.query<RowDataPacket[]>(
    'SELECT stok FROM products WHERE barcode = ? FOR UPDATE',
    [barcode]
  );
  if (rows.length === 0) throw new StokError('Produk tidak ditemukan');

  const stokSekarang = Number(rows[0].stok);
  if (selisih === 0) return stokSekarang;

  if (stokSekarang + selisih < 0) {
    throw new StokError(
      `Jumlah retur melebihi stok yang ada (stok saat ini ${stokSekarang} pcs)`
    );
  }

  await conn.query('UPDATE products SET stok = stok + ? WHERE barcode = ?', [selisih, barcode]);
  return stokSekarang + selisih;
}

// PUT /api/inventory/barang-retur/[id]
// Efek stok lama dibatalkan dulu, lalu efek stok baru diterapkan.
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ message: 'ID retur tidak valid' }, { status: 400 });
  }

  const connection = await pool.getConnection();

  try {
    const body = await request.json();
    const { tanggal, jenis, supplier, productBarcode, alasan, status, catatan } = body;
    const qty = Number(body.qty);

    if (!jenis || !['ke_supplier', 'dari_pelanggan'].includes(jenis)) {
      return NextResponse.json(
        { message: 'Jenis retur wajib dipilih (ke supplier / dari pelanggan)' },
        { status: 400 }
      );
    }
    if (jenis === 'ke_supplier' && !supplier) {
      return NextResponse.json(
        { message: 'Supplier wajib diisi untuk retur ke supplier' },
        { status: 400 }
      );
    }
    if (!productBarcode || !Number.isInteger(qty) || qty <= 0 || !alasan || !status) {
      return NextResponse.json(
        { message: 'Produk, jumlah, alasan, dan status wajib diisi dengan benar' },
        { status: 400 }
      );
    }
    if (!STATUS_VALID.includes(status)) {
      return NextResponse.json({ message: 'Status tidak valid' }, { status: 400 });
    }

    await connection.beginTransaction();

    // 1. Ambil data retur lama
    const [returRows] = await connection.query<RowDataPacket[]>(
      'SELECT jenis, product_barcode, qty, status FROM barang_retur WHERE id = ? FOR UPDATE',
      [id]
    );

    if (returRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Data retur tidak ditemukan' }, { status: 404 });
    }

    const lama = returRows[0] as {
      jenis: string;
      product_barcode: string;
      qty: number;
      status: string;
    };

    const efekLama = efekStok(lama.jenis, lama.status, lama.qty);
    const efekBaru = efekStok(jenis, status, qty);

    // 2. Sesuaikan stok
    if (lama.product_barcode === productBarcode) {
      // produk sama -> cukup terapkan selisihnya
      await ubahStok(connection, productBarcode, efekBaru - efekLama);
    } else {
      // produk diganti -> batalkan efek di produk lama, terapkan di produk baru
      await ubahStok(connection, lama.product_barcode, -efekLama);
      await ubahStok(connection, productBarcode, efekBaru);
    }

    // 3. Update data returnya
    await connection.query<ResultSetHeader>(
      `UPDATE barang_retur
       SET tanggal = COALESCE(?, tanggal),
           jenis = ?,
           supplier = ?,
           product_barcode = ?,
           qty = ?,
           alasan = ?,
           status = ?,
           catatan = ?
       WHERE id = ?`,
      [
        tanggal || null,
        jenis,
        jenis === 'ke_supplier' ? supplier : null,
        productBarcode,
        qty,
        alasan,
        status,
        catatan ?? null,
        id,
      ]
    );

    await connection.commit();

    return NextResponse.json({ message: 'Perubahan berhasil disimpan' });
  } catch (error) {
    await connection.rollback();
    if (error instanceof StokError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json(
      { message: 'Gagal menyimpan perubahan retur' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// DELETE /api/inventory/barang-retur/[id]
// Kalau retur yang dihapus sudah Selesai, efek stoknya dibatalkan dulu.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ message: 'ID retur tidak valid' }, { status: 400 });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT jenis, product_barcode, qty, status FROM barang_retur WHERE id = ? FOR UPDATE',
      [id]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Data retur tidak ditemukan' }, { status: 404 });
    }

    const lama = rows[0];
    await ubahStok(connection, lama.product_barcode, -efekStok(lama.jenis, lama.status, lama.qty));

    await connection.query('DELETE FROM barang_retur WHERE id = ?', [id]);

    await connection.commit();

    return NextResponse.json({ message: 'Data retur berhasil dihapus' });
  } catch (error) {
    await connection.rollback();
    if (error instanceof StokError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json(
      { message: 'Gagal menghapus data retur' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}