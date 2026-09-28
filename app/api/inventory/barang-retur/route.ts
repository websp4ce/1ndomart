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

// GET /api/inventory/barang-retur
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         br.id,
         br.tanggal,
         br.jenis,
         br.supplier,
         p.nama AS produk,
         br.product_barcode AS productBarcode,
         br.qty,
         br.alasan,
         br.status,
         br.catatan
       FROM barang_retur br
       JOIN products p ON p.barcode = br.product_barcode
       ORDER BY br.tanggal DESC, br.id DESC`
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Gagal mengambil data barang retur' },
      { status: 500 }
    );
  }
}

// POST /api/inventory/barang-retur
// Body: { jenis, supplier?, productBarcode, qty, alasan, status }
// Stok produk cuma berubah kalau status awalnya langsung "Selesai".
export async function POST(request: Request) {
  const connection = await pool.getConnection();

  try {
    const body = await request.json();
    const { jenis, supplier, productBarcode, alasan, status } = body;
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

    // cek stok / update stok (kalau status Selesai) dalam satu transaksi dengan insert
    const stokBaru = await ubahStok(connection, productBarcode, efekStok(jenis, status, qty));

    const [insertResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO barang_retur (jenis, supplier, product_barcode, qty, alasan, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [jenis, jenis === 'ke_supplier' ? supplier : null, productBarcode, qty, alasan, status]
    );

    await connection.commit();

    return NextResponse.json(
      {
        message: 'Retur berhasil dicatat',
        data: { id: insertResult.insertId, stokBaru },
      },
      { status: 201 }
    );
  } catch (error) {
    await connection.rollback();
    if (error instanceof StokError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json(
      { message: 'Gagal mencatat retur barang' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}