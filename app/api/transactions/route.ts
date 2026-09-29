import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

type ItemBody = {
  id: string;
  nama: string;
  harga: number;
  qty: number;
};

type KasirRow = RowDataPacket & {
  id: number;
};

type StokRow = RowDataPacket & {
  stok: number;
};

type IdRow = RowDataPacket & {
  next_id: number;
};

// ============================================================
// GET /api/transactions
// ============================================================

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tanggal = searchParams.get('tanggal');

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         t.id,
         t.tanggal,
         t.grand_total,
         COALESCE(SUM(ti.qty), 0) AS jumlah_item,
         p.status AS status_pembayaran
       FROM transactions t
       LEFT JOIN transaction_items ti
         ON ti.transaction_id = t.id
       LEFT JOIN payments p
         ON p.transaction_id = t.id
       WHERE DATE(t.tanggal) = COALESCE(?, CURDATE())
       GROUP BY
         t.id,
         t.tanggal,
         t.grand_total,
         p.status
       ORDER BY t.tanggal DESC`,
      [tanggal]
    );

    const hasil = rows.map((row) => ({
      id: row.id,
      nomor: `#TRX-${String(row.id).padStart(3, '0')}`,
      waktu: row.tanggal,
      jumlahItem: Number(row.jumlah_item),
      total: Number(row.grand_total),
      status: row.status_pembayaran ?? 'Belum Bayar',
    }));

    return NextResponse.json(hasil);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: 'Gagal mengambil riwayat transaksi' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/transactions
// ============================================================

export async function POST(request: Request) {
  const connection = await pool.getConnection();

  let transactionStarted = false;
  let lockDidGet = false;

  try {
    const body = await request.json();

    const {
      kasirId,
      items,
      diskon = 0,
      kodePromo = null,
      metode,
      jumlahDibayar,
      kembalian = 0,
    }: {
      kasirId: string;
      items: ItemBody[];
      diskon?: number;
      kodePromo?: string | null;
      metode: string;
      jumlahDibayar: number;
      kembalian?: number;
    } = body;

    // ========================================================
    // VALIDASI
    // ========================================================

    if (!kasirId || !items || items.length === 0 || !metode) {
      return NextResponse.json(
        {
          message:
            'Data transaksi belum lengkap (kasirId, items, metode wajib ada)',
        },
        { status: 400 }
      );
    }

    // ========================================================
    // CARI ID KASIR
    // ========================================================

    const [kasirRows] = await connection.query<KasirRow[]>(
      `SELECT id
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [kasirId]
    );

    if (!kasirRows || kasirRows.length === 0) {
      return NextResponse.json(
        {
          message: `Kasir dengan email "${kasirId}" tidak ditemukan`,
        },
        { status: 404 }
      );
    }

    const kasirIdAsli = Number(kasirRows[0].id);

    // ========================================================
    // HITUNG TOTAL
    // ========================================================

    const totalBelanja = items.reduce(
      (sum, item) =>
        sum + Number(item.harga) * Number(item.qty),
      0
    );

    const nilaiDiskon = Math.max(Number(diskon) || 0, 0);

    const grandTotal = Math.max(
      totalBelanja - nilaiDiskon,
      0
    );

    // ========================================================
    // LOCK PEMBUATAN ID
    //
    // Karena id di 3 tabel belum AUTO_INCREMENT,
    // kita buat ID manual.
    // ========================================================

    const [lockRows] = await connection.query<RowDataPacket[]>(
      `SELECT GET_LOCK('indomart_transaction_id_lock', 10) AS lock_result`
    );

    if (
      !lockRows ||
      lockRows.length === 0 ||
      Number(lockRows[0].lock_result) !== 1
    ) {
      return NextResponse.json(
        {
          message:
            'Gagal mendapatkan kunci transaksi. Silakan coba lagi.',
        },
        { status: 500 }
      );
    }

    lockDidGet = true;

    // ========================================================
    // MULAI TRANSACTION DATABASE
    // ========================================================

    await connection.beginTransaction();
    transactionStarted = true;

    // ========================================================
    // BUAT ID TRANSACTIONS
    // ========================================================

    const [transactionIdRows] =
      await connection.query<IdRow[]>(
        `SELECT COALESCE(MAX(id), 0) + 1 AS next_id
         FROM transactions`
      );

    const transactionId = Number(
      transactionIdRows[0]?.next_id || 1
    );

    // ========================================================
    // BUAT ID PERTAMA TRANSACTION_ITEMS
    // ========================================================

    const [itemIdRows] =
      await connection.query<IdRow[]>(
        `SELECT COALESCE(MAX(id), 0) + 1 AS next_id
         FROM transaction_items`
      );

    let nextItemId = Number(
      itemIdRows[0]?.next_id || 1
    );

    // ========================================================
    // BUAT ID PAYMENTS
    // ========================================================

    const [paymentIdRows] =
      await connection.query<IdRow[]>(
        `SELECT COALESCE(MAX(id), 0) + 1 AS next_id
         FROM payments`
      );

    const paymentId = Number(
      paymentIdRows[0]?.next_id || 1
    );

    // ========================================================
    // CEK STOK SEMUA BARANG
    // ========================================================

    for (const item of items) {
      const [stokRows] = await connection.query<StokRow[]>(
        `SELECT stok
         FROM products
         WHERE barcode = ?
         FOR UPDATE`,
        [item.id]
      );

      if (!stokRows || stokRows.length === 0) {
        await connection.rollback();
        transactionStarted = false;

        return NextResponse.json(
          {
            message:
              `Produk dengan barcode ${item.id} tidak ditemukan`,
          },
          { status: 404 }
        );
      }

      const stokSekarang = Number(stokRows[0].stok);
      const qty = Number(item.qty);

      if (stokSekarang < qty) {
        await connection.rollback();
        transactionStarted = false;

        return NextResponse.json(
          {
            message:
              `Stok "${item.nama}" tidak cukup ` +
              `(tersisa ${stokSekarang}, diminta ${qty})`,
          },
          { status: 400 }
        );
      }
    }

    // ========================================================
    // INSERT TRANSACTIONS
    // ========================================================

    await connection.query(
      `INSERT INTO transactions
        (
          id,
          kasir_id,
          total_belanja,
          diskon,
          kode_promo,
          grand_total
        )
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        transactionId,
        kasirIdAsli,
        totalBelanja,
        nilaiDiskon,
        kodePromo,
        grandTotal,
      ]
    );

    // ========================================================
    // INSERT TRANSACTION_ITEMS
    // ========================================================

    for (const item of items) {
      const harga = Number(item.harga);
      const qty = Number(item.qty);
      const subtotal = harga * qty;

      await connection.query(
        `INSERT INTO transaction_items
          (
            id,
            transaction_id,
            barcode,
            nama_produk,
            harga_satuan,
            qty,
            subtotal
          )
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          nextItemId,
          transactionId,
          item.id,
          item.nama,
          harga,
          qty,
          subtotal,
        ]
      );

      nextItemId++;

      // Kurangi stok
      await connection.query(
        `UPDATE products
         SET stok = stok - ?
         WHERE barcode = ?`,
        [qty, item.id]
      );
    }

    // ========================================================
    // INSERT PAYMENTS
    // ========================================================

    await connection.query(
      `INSERT INTO payments
        (
          id,
          transaction_id,
          metode,
          jumlah_dibayar,
          kembalian,
          status
        )
       VALUES (?, ?, ?, ?, ?, 'Berhasil')`,
      [
        paymentId,
        transactionId,
        metode,
        Number(jumlahDibayar) || 0,
        Number(kembalian) || 0,
      ]
    );

    // ========================================================
    // COMMIT
    // ========================================================

    await connection.commit();
    transactionStarted = false;

    return NextResponse.json(
      {
        message: 'Transaksi berhasil disimpan',
        transactionId,
      },
      { status: 201 }
    );
  } catch (error) {
    if (transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          'Rollback error:',
          rollbackError
        );
      }
    }

    console.error(
      'POST /api/transactions error:',
      error
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : 'Gagal menyimpan transaksi',
      },
      { status: 500 }
    );
  } finally {
    if (lockDidGet) {
      try {
        await connection.query(
          `SELECT RELEASE_LOCK(
            'indomart_transaction_id_lock'
          )`
        );
      } catch (lockError) {
        console.error(
          'Release lock error:',
          lockError
        );
      }
    }

    connection.release();
  }
}