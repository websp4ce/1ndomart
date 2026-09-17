import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

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
    const { tanggal, jenis, supplier, productBarcode, qty, alasan, status, catatan } = body;

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
    if (!productBarcode || !qty || qty <= 0 || !alasan || !status) {
      return NextResponse.json(
        { message: 'Produk, jumlah, alasan, dan status wajib diisi dengan benar' },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    // 1. Ambil data retur lama
    const [returRows] = await connection.query<RowDataPacket[]>(
      'SELECT jenis, product_barcode, qty FROM barang_retur WHERE id = ? FOR UPDATE',
      [id]
    );

    if (returRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Data retur tidak ditemukan' }, { status: 404 });
    }

    const lama = returRows[0] as { jenis: JenisReturDb; product_barcode: string; qty: number };

    // 2. Balikin efek stok yang lama ke produk lama
    const [produkLamaRows] = await connection.query<RowDataPacket[]>(
      'SELECT stok FROM products WHERE barcode = ? FOR UPDATE',
      [lama.product_barcode]
    );
    if (produkLamaRows.length > 0) {
      const stokLamaSekarang = produkLamaRows[0].stok as number;
      const stokLamaDikoreksi =
        lama.jenis === 'ke_supplier' ? stokLamaSekarang + lama.qty : stokLamaSekarang - lama.qty;
      await connection.query('UPDATE products SET stok = ? WHERE barcode = ?', [
        stokLamaDikoreksi,
        lama.product_barcode,
      ]);
    }

    // 3. Terapkan efek stok yang baru ke produk baru
    const [produkBaruRows] = await connection.query<RowDataPacket[]>(
      'SELECT stok FROM products WHERE barcode = ? FOR UPDATE',
      [productBarcode]
    );
    if (produkBaruRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Produk tidak ditemukan' }, { status: 404 });
    }
    const stokBaruSekarang = produkBaruRows[0].stok as number;

    if (jenis === 'ke_supplier' && qty > stokBaruSekarang) {
      await connection.rollback();
      return NextResponse.json(
        { message: `Jumlah retur melebihi stok yang ada (stok saat ini ${stokBaruSekarang} pcs)` },
        { status: 400 }
      );
    }

    const stokBaruSetelah =
      jenis === 'ke_supplier' ? stokBaruSekarang - qty : stokBaruSekarang + qty;

    await connection.query('UPDATE products SET stok = ? WHERE barcode = ?', [
      stokBaruSetelah,
      productBarcode,
    ]);

    // 4. Update data returnya
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
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ message: 'ID retur tidak valid' }, { status: 400 });
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM barang_retur WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Data retur tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Data retur berhasil dihapus' });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Gagal menghapus data retur' },
      { status: 500 }
    );
  }
}

type JenisReturDb = 'ke_supplier' | 'dari_pelanggan';