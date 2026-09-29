import { NextResponse } from "next/server";
import db from "@/lib/db";

const res = (ok: boolean, message: string, status = 200) =>
  NextResponse.json({ success: ok, message, error: ok ? undefined : message }, { status });

const isKategori = (req: Request) => new URL(req.url).searchParams.get("tipe") === "kategori";

const ambil = (b: any) => [
  String(b.kode_produk ?? b.kode ?? "").trim(),
  String(b.nama ?? "").trim(),
  b.kategori_id ? Number(b.kategori_id) : null,
  Number(b.harga) || 0,
  Number(b.stok) || 0,
];

export async function GET() {
  try {
    const [produk] = await db.query(`
      SELECT p.id, p.kode_produk, p.nama, p.kategori_id,
             COALESCE(k.nama, 'Tanpa Kategori') AS kategori, p.harga, p.stok
      FROM produk p LEFT JOIN kategori k ON p.kategori_id = k.id
      ORDER BY p.id DESC
    `);
    const [kategori] = await db.query(`SELECT id, nama FROM kategori ORDER BY id ASC`);
    return NextResponse.json({ success: true, produk, kategori });
  } catch (e: any) {
    return res(false, e?.message || "Gagal mengambil data produk", 500);
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();

    if (isKategori(req)) {
      const n = String(b.nama ?? "").trim();
      if (!n) return res(false, "Nama kategori wajib diisi", 400);
      const [ada] = await db.execute(`SELECT id FROM kategori WHERE LOWER(nama) = LOWER(?)`, [n]);
      if ((ada as any[]).length) return res(false, "Kategori sudah ada", 409);
      await db.execute(`INSERT INTO kategori (nama) VALUES (?)`, [n]);
      return res(true, "Kategori berhasil ditambahkan");
    }

    const v = ambil(b);
    if (!v[0] || !v[1]) return res(false, "Kode dan nama produk wajib diisi", 400);
    await db.execute(
      `INSERT INTO produk (kode_produk, nama, kategori_id, harga, stok) VALUES (?, ?, ?, ?, ?)`, v);
    return res(true, "Produk berhasil ditambahkan");
  } catch (e: any) {
    return res(false, e?.message || "Gagal menambahkan data", 500);
  }
}

export async function PUT(req: Request) {
  try {
    const b = await req.json();
    const v = ambil(b);
    if (!b.id || !v[0] || !v[1]) return res(false, "Data produk belum lengkap", 400);
    await db.execute(
      `UPDATE produk SET kode_produk=?, nama=?, kategori_id=?, harga=?, stok=? WHERE id=?`, [...v, b.id]);
    return res(true, "Produk berhasil diperbarui");
  } catch (e: any) {
    return res(false, e?.message || "Gagal memperbarui produk", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const b = await req.json().catch(() => ({}));
    const id = b.id ?? new URL(req.url).searchParams.get("id");
    if (!id) return res(false, "ID wajib diisi", 400);

    if (isKategori(req)) {
      // Produk di kategori ini menjadi "Tanpa Kategori"
      await db.execute(`UPDATE produk SET kategori_id = NULL WHERE kategori_id = ?`, [id]);
      const [r] = await db.execute(`DELETE FROM kategori WHERE id = ?`, [id]);
      if ((r as any).affectedRows === 0) return res(false, "Kategori tidak ditemukan", 404);
      return res(true, "Kategori berhasil dihapus");
    }

    await db.execute(`DELETE FROM produk WHERE id = ?`, [id]);
    return res(true, "Produk berhasil dihapus");
  } catch (e: any) {
    return res(false, e?.message || "Gagal menghapus data", 500);
  }
}