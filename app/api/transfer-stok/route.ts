import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET /api/transfer-stok — daftar semua transfer, sudah di-join biar dapat nama produk & gudang
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        t.id,
        t.no_transfer,
        t.tanggal,
        t.barcode,
        p.nama AS produk,
        t.jumlah,
        t.status,
        gasal.nama AS dari_gudang,
        gtujuan.nama AS ke_gudang
      FROM transfer_stok t
      JOIN products p ON p.barcode = t.barcode
      JOIN gudang gasal ON gasal.id = t.dari_gudang_id
      JOIN gudang gtujuan ON gtujuan.id = t.ke_gudang_id
      ORDER BY t.created_at DESC
    `);
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Gagal mengambil data transfer' }, { status: 500 });
  }
}

// POST /api/transfer-stok — bikin transfer baru (status awal selalu "Menunggu")
// Body: { barcode, dari_gudang_id, ke_gudang_nama, jumlah }
// Kalau "ke_gudang_nama" belum ada di tabel gudang, otomatis di-insert dulu
// (sama persis pola-nya kayak kategori di /api/products)
export async function POST(request: Request) {
  const body = await request.json();
  const { barcode, dari_gudang_id, ke_gudang_nama, jumlah } = body;

  if (!barcode || !dari_gudang_id || !ke_gudang_nama || !jumlah) {
    return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
  }
  if (Number(jumlah) < 1) {
    return NextResponse.json({ message: 'Jumlah minimal 1' }, { status: 400 });
  }

  const connection = await pool.getConnection();
  try {
    // 1. Cek gudang tujuan sudah ada atau belum (case-insensitive biar "toko surabaya" = "Toko Surabaya")
    const [existingGudang] = await connection.query<RowDataPacket[]>(
      'SELECT id, nama FROM gudang WHERE LOWER(nama) = LOWER(?)',
      [ke_gudang_nama.trim()],
    );

    let keGudangId: number;
    if (existingGudang.length > 0) {
      keGudangId = existingGudang[0].id;
    } else {
      // Gudang/toko baru -> insert dulu ke tabel gudang
      const [insertGudang] = await connection.query<ResultSetHeader>(
        `INSERT INTO gudang (nama, tipe) VALUES (?, 'toko')`,
        [ke_gudang_nama.trim()],
      );
      keGudangId = insertGudang.insertId;
    }

    if (keGudangId === Number(dari_gudang_id)) {
      connection.release();
      return NextResponse.json({ message: 'Gudang asal dan tujuan tidak boleh sama' }, { status: 400 });
    }

    // 2. Cek stok di gudang asal cukup atau tidak
    const [stokRows] = await connection.query<RowDataPacket[]>(
      'SELECT stok FROM stok_lokasi WHERE barcode = ? AND gudang_id = ?',
      [barcode, dari_gudang_id],
    );

    const stokTersedia = stokRows[0]?.stok ?? 0;
    if (stokTersedia < Number(jumlah)) {
      connection.release();
      return NextResponse.json(
        { message: `Stok tidak cukup. Tersedia hanya ${stokTersedia} pcs di gudang asal.` },
        { status: 400 },
      );
    }

    // 3. Generate nomor transfer, misal TRF-0009
    const [countRows] = await connection.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM transfer_stok',
    );
    const nomorUrut = (countRows[0].total as number) + 1;
    const noTransfer = `TRF-${String(nomorUrut).padStart(4, '0')}`;

    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO transfer_stok (no_transfer, tanggal, barcode, dari_gudang_id, ke_gudang_id, jumlah, status)
       VALUES (?, CURDATE(), ?, ?, ?, ?, 'Menunggu')`,
      [noTransfer, barcode, dari_gudang_id, keGudangId, jumlah],
    );

    connection.release();
    return NextResponse.json({ id: result.insertId, no_transfer: noTransfer }, { status: 201 });
  } catch (err) {
    connection.release();
    console.error(err);
    return NextResponse.json({ message: 'Gagal membuat transfer' }, { status: 500 });
  }
}