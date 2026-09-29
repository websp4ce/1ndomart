import { NextResponse } from 'next/server';
import db from '@/lib/db';

const tabel: Record<string, string> = {
  promo: 'promo',
  member: 'member',
  retur: 'retur_penjualan',
  shift: 'shift_kasir',
  laporan: 'laporan_penjualan',
};

// Menu yang ditangani secara generik (kolom dibaca dari database)
const menuGenerik = ['retur', 'shift'];

const labelMenu: Record<string, string> = {
  promo: 'Promo',
  member: 'Member',
  retur: 'Retur',
  shift: 'Shift',
};

const errorResponse = (label: string, error: unknown) =>
  NextResponse.json(
    {
      error: label,
      detail: error instanceof Error ? error.message : String(error),
    },
    { status: 500 }
  );

const bad = (pesan: string, status = 400) =>
  NextResponse.json({ error: pesan }, { status });

// Ambil daftar kolom asli tabel (nama kolom berasal dari database, bukan dari user)
const cacheKolom: Record<string, { nama: string; auto: boolean }[]> = {};

async function ambilKolom(namaTabel: string) {
  if (cacheKolom[namaTabel]) return cacheKolom[namaTabel];
  const [rows] = await db.execute(`SHOW COLUMNS FROM \`${namaTabel}\``);
  const kolom = (rows as any[]).map((r) => ({
    nama: r.Field as string,
    auto: String(r.Extra || '').includes('auto_increment'),
  }));
  cacheKolom[namaTabel] = kolom;
  return kolom;
}

// Ambil hanya field body yang cocok dengan kolom tabel (selain id)
async function ambilData(menu: string, body: Record<string, any>) {
  const kolom = await ambilKolom(tabel[menu]);
  const data: Record<string, any> = {};
  for (const k of kolom) {
    if (k.nama === 'id' || k.auto) continue;
    if (body[k.nama] === undefined) continue;
    const v = body[k.nama];
    data[k.nama] = typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v;
  }
  return data;
}

// ======================================================
// GET
// ======================================================

export async function GET(req: Request) {
  try {
    const menu = new URL(req.url).searchParams.get('menu');

    if (!menu || !tabel[menu]) return bad('Menu tidak valid');

    const [rows] = await db.execute(
      `SELECT * FROM ${tabel[menu]} ORDER BY id DESC`
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET ERROR:', error);
    return errorResponse('Gagal mengambil data', error);
  }
}

// ======================================================
// POST (tambah)
// ======================================================

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ---------- PROMO ----------
    if (body.menu === 'promo') {
      const { nama, diskon, periode, status } = body;
      const nilai = Number(diskon);

      if (!nama?.trim() || !periode?.trim()) return bad('Nama dan periode promo wajib diisi');
      if (!Number.isFinite(nilai) || nilai < 1 || nilai > 100) return bad('Diskon harus antara 1 dan 100');

      const [result] = await db.execute(
        `INSERT INTO promo (nama, diskon, periode, status) VALUES (?, ?, ?, ?)`,
        [nama.trim(), nilai, periode.trim(), status === 'Berakhir' ? 'Berakhir' : 'Aktif']
      );

      return NextResponse.json({
        success: true,
        message: 'Promo berhasil ditambahkan',
        id: (result as any).insertId,
      });
    }

    // ---------- MEMBER ----------
    if (body.menu === 'member') {
      const { nama, telepon, poin, tanggal } = body;

      if (!nama?.trim() || !telepon?.trim()) return bad('Nama dan nomor telepon wajib diisi');

      const [result] = await db.execute(
        `INSERT INTO member (nama, telepon, poin, tanggal) VALUES (?, ?, ?, ?)`,
        [
          nama.trim(),
          telepon.trim(),
          Number(poin) || 0,
          tanggal || new Date().toISOString().split('T')[0],
        ]
      );

      return NextResponse.json({
        success: true,
        message: 'Member berhasil ditambahkan',
        id: (result as any).insertId,
      });
    }

    // ---------- RETUR & SHIFT (generik) ----------
    if (menuGenerik.includes(body.menu)) {
      const data = await ambilData(body.menu, body);
      const nama = Object.keys(data);

      if (nama.length === 0) {
        const kolom = (await ambilKolom(tabel[body.menu])).map((k) => k.nama).join(', ');
        return bad(
          `Tidak ada field yang cocok dengan kolom tabel. Kolom tabel: ${kolom}. Field dikirim: ${Object.keys(body).join(', ')}`
        );
      }

      const [result] = await db.execute(
        `INSERT INTO ${tabel[body.menu]} (${nama.map((n) => `\`${n}\``).join(', ')}) VALUES (${nama.map(() => '?').join(', ')})`,
        nama.map((n) => data[n])
      );

      return NextResponse.json({
        success: true,
        message: `${labelMenu[body.menu]} berhasil ditambahkan`,
        id: (result as any).insertId,
      });
    }

    return bad('Menu tidak valid');
  } catch (error) {
    console.error('POST ERROR:', error);
    return errorResponse('Gagal menambahkan data', error);
  }
}

// ======================================================
// PUT (ubah)
// ======================================================

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    // ---------- PROMO ----------
    if (body.menu === 'promo') {
      const { id, nama, diskon, periode, status } = body;
      const nilai = Number(diskon);

      if (!id || !nama?.trim() || !periode?.trim()) return bad('Data promo belum lengkap');
      if (!Number.isFinite(nilai) || nilai < 1 || nilai > 100) return bad('Diskon harus antara 1 dan 100');

      const [result] = await db.execute(
        `UPDATE promo SET nama = ?, diskon = ?, periode = ?, status = ? WHERE id = ?`,
        [nama.trim(), nilai, periode.trim(), status === 'Berakhir' ? 'Berakhir' : 'Aktif', id]
      );

      if ((result as any).affectedRows === 0) return bad('Promo tidak ditemukan', 404);

      return NextResponse.json({ success: true, message: 'Promo berhasil diperbarui' });
    }

    // ---------- MEMBER ----------
    if (body.menu === 'member') {
      const { id, nama, telepon, poin } = body;

      if (!id || !nama?.trim() || !telepon?.trim()) return bad('Data member belum lengkap');

      const [result] = await db.execute(
        `UPDATE member SET nama = ?, telepon = ?, poin = ? WHERE id = ?`,
        [nama.trim(), telepon.trim(), Number(poin) || 0, id]
      );

      if ((result as any).affectedRows === 0) return bad('Member tidak ditemukan', 404);

      return NextResponse.json({ success: true, message: 'Member berhasil diperbarui' });
    }

    // ---------- RETUR & SHIFT (generik) ----------
    if (menuGenerik.includes(body.menu)) {
      if (!body.id) return bad('ID data wajib diisi');

      const data = await ambilData(body.menu, body);
      const nama = Object.keys(data);

      if (nama.length === 0) {
        const kolom = (await ambilKolom(tabel[body.menu])).map((k) => k.nama).join(', ');
        return bad(
          `Tidak ada field yang cocok dengan kolom tabel. Kolom tabel: ${kolom}. Field dikirim: ${Object.keys(body).join(', ')}`
        );
      }

      const [result] = await db.execute(
        `UPDATE ${tabel[body.menu]} SET ${nama.map((n) => `\`${n}\` = ?`).join(', ')} WHERE id = ?`,
        [...nama.map((n) => data[n]), body.id]
      );

      if ((result as any).affectedRows === 0) return bad(`${labelMenu[body.menu]} tidak ditemukan`, 404);

      return NextResponse.json({
        success: true,
        message: `${labelMenu[body.menu]} berhasil diperbarui`,
      });
    }

    return bad('Menu tidak valid');
  } catch (error) {
    console.error('PUT ERROR:', error);
    return errorResponse('Gagal memperbarui data', error);
  }
}

// ======================================================
// DELETE (hapus)
// ======================================================

export async function DELETE(req: Request) {
  try {
    const { menu, id } = await req.json();

    if (!labelMenu[menu] || !id) return bad('Data tidak valid');

    const [result] = await db.execute(`DELETE FROM ${tabel[menu]} WHERE id = ?`, [id]);

    if ((result as any).affectedRows === 0) return bad(`${labelMenu[menu]} tidak ditemukan`, 404);

    return NextResponse.json({
      success: true,
      message: `${labelMenu[menu]} berhasil dihapus`,
    });
  } catch (error) {
    console.error('DELETE ERROR:', error);
    return errorResponse('Gagal menghapus data', error);
  }
}