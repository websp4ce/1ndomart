import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface ProdukRow extends RowDataPacket {
  barcode: string;
  nama: string;
  stok: number;
}

// GET /api/warehouse/lokasi-rak/:id/produk -> daftar produk yang ditempatkan di rak ini
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [rows] = await pool.query<ProdukRow[]>(
      'SELECT barcode, nama, stok FROM products WHERE rak_id = ? ORDER BY nama ASC',
      [id]
    );
    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error('GET /api/warehouse/lokasi-rak/[id]/produk error:', err);
    return NextResponse.json({ error: 'Gagal mengambil produk di rak ini.' }, { status: 500 });
  }
}

// POST /api/warehouse/lokasi-rak/:id/produk  { barcode }
// Naruh 1 produk ke rak ini (kalau produk itu sebelumnya di rak lain, otomatis pindah)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const barcode = String(body.barcode ?? '').trim();

    if (!barcode) {
      return NextResponse.json({ error: 'Barcode produk wajib diisi.' }, { status: 400 });
    }

    const [rakRows] = await pool.query<RowDataPacket[]>('SELECT id, kapasitas FROM lokasi_rak WHERE id = ? LIMIT 1', [id]);
    if (rakRows.length === 0) {
      return NextResponse.json({ error: 'Rak tidak ditemukan.' }, { status: 404 });
    }
    const kapasitas = rakRows[0].kapasitas as number;

    const [produkRows] = await pool.query<RowDataPacket[]>(
      'SELECT barcode, rak_id FROM products WHERE barcode = ? LIMIT 1',
      [barcode]
    );
    if (produkRows.length === 0) {
      return NextResponse.json({ error: `Produk dengan barcode "${barcode}" tidak ditemukan.` }, { status: 404 });
    }

    if (kapasitas > 0) {
      const [countRows] = await pool.query<RowDataPacket[]>(
        'SELECT COUNT(*) AS jumlah FROM products WHERE rak_id = ?',
        [id]
      );
      const sudahTerisi = countRows[0].jumlah as number;
      const produkSudahDiRakIni = produkRows[0].rak_id === Number(id);
      if (!produkSudahDiRakIni && sudahTerisi >= kapasitas) {
        return NextResponse.json(
          { error: `Rak ini sudah penuh (kapasitas ${kapasitas}).` },
          { status: 400 }
        );
      }
    }

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE products SET rak_id = ? WHERE barcode = ?',
      [id, barcode]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Gagal menempatkan produk.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Produk berhasil ditempatkan di rak ini.' }, { status: 201 });
  } catch (err) {
    console.error('POST /api/warehouse/lokasi-rak/[id]/produk error:', err);
    return NextResponse.json({ error: 'Gagal menempatkan produk ke rak.' }, { status: 500 });
  }
}

// DELETE /api/warehouse/lokasi-rak/:id/produk?barcode=xxx -> lepas produk dari rak ini
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const barcode = req.nextUrl.searchParams.get('barcode')?.trim();

    if (!barcode) {
      return NextResponse.json({ error: 'Barcode produk wajib diisi.' }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE products SET rak_id = NULL WHERE barcode = ? AND rak_id = ?',
      [barcode, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan di rak ini.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Produk berhasil dilepas dari rak ini.' });
  } catch (err) {
    console.error('DELETE /api/warehouse/lokasi-rak/[id]/produk error:', err);
    return NextResponse.json({ error: 'Gagal melepas produk dari rak.' }, { status: 500 });
  }
}