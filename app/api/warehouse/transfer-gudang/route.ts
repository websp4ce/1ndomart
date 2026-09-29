import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT
        tg.id,
        tg.kode_transfer,
        tg.tanggal,
        tg.status,
        tg.catatan,
        gasal.nama AS dari_gudang,
        gtujuan.nama AS ke_gudang,
        COUNT(tgi.id) AS jumlah_item
      FROM transfer_gudang tg
      JOIN gudang gasal ON gasal.id = tg.dari_gudang_id
      JOIN gudang gtujuan ON gtujuan.id = tg.ke_gudang_id
      LEFT JOIN transfer_gudang_items tgi
        ON tgi.transfer_gudang_id = tg.id
      GROUP BY
        tg.id,
        tg.kode_transfer,
        tg.tanggal,
        tg.status,
        tg.catatan,
        gasal.nama,
        gtujuan.nama
      ORDER BY tg.id DESC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET transfer gudang error:', error);

    return NextResponse.json(
      { message: 'Gagal mengambil data transfer antar gudang.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const connection = await pool.getConnection();

  try {
    const {
      dari_gudang_id,
      ke_gudang_id,
      tanggal,
      catatan,
      items,
    } = await req.json();

    if (!dari_gudang_id || !ke_gudang_id || !tanggal) {
      return NextResponse.json(
        { message: 'Lengkapi gudang asal, gudang tujuan, dan tanggal dulu ya.' },
        { status: 400 }
      );
    }

    if (dari_gudang_id === ke_gudang_id) {
      return NextResponse.json(
        { message: 'Gudang asal dan tujuan tidak boleh sama.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: 'Tambahkan minimal satu produk untuk ditransfer.' },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.barcode || !item.nama_produk || item.qty < 1) {
        return NextResponse.json(
          { message: 'Setiap produk wajib punya barcode, nama, dan qty minimal 1.' },
          { status: 400 }
        );
      }
    }

    await connection.beginTransaction();

    const tahun = new Date(tanggal).getFullYear();

    const [countRows]: any = await connection.query(
      `SELECT COUNT(*) AS total
       FROM transfer_gudang
       WHERE YEAR(tanggal) = ?`,
      [tahun]
    );

    const urutan = String(Number(countRows[0].total) + 1).padStart(3, '0');
    const kodeTransfer = `TRF-${tahun}-${urutan}`;

    const [result]: any = await connection.query(
      `INSERT INTO transfer_gudang
       (kode_transfer, dari_gudang_id, ke_gudang_id, tanggal, catatan)
       VALUES (?, ?, ?, ?, ?)`,
      [
        kodeTransfer,
        dari_gudang_id,
        ke_gudang_id,
        tanggal,
        catatan || null,
      ]
    );

    const values = items.map((item: any) => [
      result.insertId,
      item.barcode,
      item.nama_produk,
      item.qty,
    ]);

    await connection.query(
      `INSERT INTO transfer_gudang_items
       (transfer_gudang_id, barcode, nama_produk, qty)
       VALUES ?`,
      [values]
    );

    await connection.commit();

    return NextResponse.json(
      {
        id: result.insertId,
        kode_transfer: kodeTransfer,
      },
      { status: 201 }
    );
  } catch (error) {
    await connection.rollback();

    console.error('POST transfer gudang error:', error);

    return NextResponse.json(
      { message: 'Gagal membuat transfer antar gudang.' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}