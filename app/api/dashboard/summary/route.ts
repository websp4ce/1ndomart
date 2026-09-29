import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

// GET /api/dashboard/summary
// Dipakai di Dashboard Kasir untuk kartu: Total Penjualan Hari Ini,
// Jumlah Item Terjual (hari ini), dan Total Penjualan Keseluruhan.
export async function GET() {
  try {
    const [hariIniRows] = await pool.query<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS transaksi,
         COALESCE(SUM(grand_total), 0) AS total
       FROM transactions
       WHERE DATE(tanggal) = CURDATE()`
    );

    const [itemRows] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(ti.qty), 0) AS item
       FROM transaction_items ti
       JOIN transactions t ON t.id = ti.transaction_id
       WHERE DATE(t.tanggal) = CURDATE()`
    );

    const [keseluruhanRows] = await pool.query<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS transaksi,
         COALESCE(SUM(grand_total), 0) AS total
       FROM transactions`
    );

    return NextResponse.json({
      hariIni: {
        totalPenjualan: Number(hariIniRows[0].total),
        jumlahTransaksi: Number(hariIniRows[0].transaksi),
        jumlahItem: Number(itemRows[0].item),
      },
      keseluruhan: {
        totalPenjualan: Number(keseluruhanRows[0].total),
        jumlahTransaksi: Number(keseluruhanRows[0].transaksi),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Gagal mengambil ringkasan penjualan' },
      { status: 500 }
    );
  }
}