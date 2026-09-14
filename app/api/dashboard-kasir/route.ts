import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // =========================
    // PENJUALAN HARI INI
    // =========================
    const [todayRows]: any = await db.query(`
      SELECT
        COUNT(*) AS transaksi,
        COALESCE(SUM(total), 0) AS penjualan,
        COALESCE(AVG(total), 0) AS rata_rata
      FROM laporan_penjualan
      WHERE DATE(tanggal) = CURDATE()
    `);

    // =========================
    // TRANSAKSI PENDING
    // =========================
    const [pendingRows]: any = await db.query(`
      SELECT COUNT(*) AS total
      FROM laporan_penjualan
      WHERE status = 'Pending'
    `);

    // =========================
    // GRAFIK 7 HARI
    // =========================
    const [chartRows]: any = await db.query(`
      SELECT
        DATE(tanggal) AS tanggal,
        COALESCE(SUM(total), 0) AS total
      FROM laporan_penjualan
      WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(tanggal)
      ORDER BY tanggal ASC
    `);

    // =========================
    // TRANSAKSI TERBARU
    // =========================
    const [recentRows]: any = await db.query(`
      SELECT
        id,
        transaksi,
        tanggal,
        kasir,
        total,
        pembayaran,
        status
      FROM laporan_penjualan
      ORDER BY id DESC
      LIMIT 5
    `);

    // =========================
    // TOTAL MEMBER
    // =========================
    const [memberRows]: any = await db.query(`
      SELECT COUNT(*) AS total
      FROM member
    `);

    // =========================
    // PROMO AKTIF
    // =========================
    const [promoRows]: any = await db.query(`
      SELECT COUNT(*) AS total
      FROM promo
      WHERE status = 'Aktif'
    `);

    // =========================
    // SHIFT AKTIF
    // =========================
    const [shiftRows]: any = await db.query(`
      SELECT
        id,
        kasir,
        shift,
        mulai,
        uang_awal,
        total_penjualan,
        transaksi,
        status
      FROM shift_kasir
      WHERE status = 'Aktif'
      ORDER BY id DESC
      LIMIT 1
    `);

    return NextResponse.json({
      statistik: {
        transaksi: Number(todayRows[0]?.transaksi || 0),
        penjualan: Number(todayRows[0]?.penjualan || 0),
        rataRata: Number(todayRows[0]?.rata_rata || 0),
        pending: Number(pendingRows[0]?.total || 0),
      },

      grafik: chartRows.map((item: any) => ({
        tanggal: item.tanggal,
        total: Number(item.total || 0),
      })),

      transaksiTerbaru: recentRows.map((item: any) => ({
        id: item.id,
        transaksi: item.transaksi,
        tanggal: item.tanggal,
        kasir: item.kasir || '-',
        total: Number(item.total || 0),
        pembayaran: item.pembayaran || '-',
        status: item.status || 'Selesai',
      })),

      member: Number(memberRows[0]?.total || 0),
      promoAktif: Number(promoRows[0]?.total || 0),

      shiftAktif: shiftRows.length
        ? {
            id: shiftRows[0].id,
            kasir: shiftRows[0].kasir,
            shift: shiftRows[0].shift,
            mulai: shiftRows[0].mulai,
            uangAwal: Number(shiftRows[0].uang_awal || 0),
            totalPenjualan: Number(shiftRows[0].total_penjualan || 0),
            transaksi: Number(shiftRows[0].transaksi || 0),
            status: shiftRows[0].status,
          }
        : null,
    });
  } catch (error) {
    console.error('Dashboard API Error:', error);

    return NextResponse.json(
      { error: 'Gagal mengambil data dashboard' },
      { status: 500 }
    );
  }
}