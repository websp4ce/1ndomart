import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const [produk] = await db.query(`
      SELECT
        p.id,
        p.kode_produk,
        p.nama,
        p.kategori_id,
        k.nama AS kategori,
        p.harga,
        p.stok,
        p.created_at
      FROM produk p
      LEFT JOIN kategori k ON p.kategori_id = k.id
      ORDER BY p.id DESC
    `);

    const [kategori] = await db.query(`
      SELECT id, nama
      FROM kategori
      ORDER BY nama ASC
    `);

    return NextResponse.json({
      produk,
      kategori,
    });
  } catch (error) {
    console.error("GET PRODUK ERROR:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data produk" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      kode_produk,
      nama,
      kategori_id,
      harga,
      stok,
    } = body;

    if (!kode_produk || !nama) {
      return NextResponse.json(
        { message: "Kode produk dan nama produk wajib diisi" },
        { status: 400 }
      );
    }

    const [cek] = await db.query(
      "SELECT id FROM produk WHERE kode_produk = ?",
      [kode_produk]
    );

    if ((cek as any[]).length > 0) {
      return NextResponse.json(
        { message: "Kode produk sudah digunakan" },
        { status: 400 }
      );
    }

    await db.query(
      `
      INSERT INTO produk
      (kode_produk, nama, kategori_id, harga, stok)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        kode_produk,
        nama,
        kategori_id || null,
        Number(harga) || 0,
        Number(stok) || 0,
      ]
    );

    return NextResponse.json({
      message: "Produk berhasil ditambahkan",
    });
  } catch (error) {
    console.error("POST PRODUK ERROR:", error);

    return NextResponse.json(
      { message: "Gagal menambahkan produk" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      id,
      kode_produk,
      nama,
      kategori_id,
      harga,
      stok,
    } = body;

    if (!id || !kode_produk || !nama) {
      return NextResponse.json(
        { message: "Data produk belum lengkap" },
        { status: 400 }
      );
    }

    const [cek] = await db.query(
      `
      SELECT id
      FROM produk
      WHERE kode_produk = ?
      AND id != ?
      `,
      [kode_produk, id]
    );

    if ((cek as any[]).length > 0) {
      return NextResponse.json(
        { message: "Kode produk sudah digunakan" },
        { status: 400 }
      );
    }

    await db.query(
      `
      UPDATE produk
      SET
        kode_produk = ?,
        nama = ?,
        kategori_id = ?,
        harga = ?,
        stok = ?
      WHERE id = ?
      `,
      [
        kode_produk,
        nama,
        kategori_id || null,
        Number(harga) || 0,
        Number(stok) || 0,
        id,
      ]
    );

    return NextResponse.json({
      message: "Produk berhasil diperbarui",
    });
  } catch (error) {
    console.error("PUT PRODUK ERROR:", error);

    return NextResponse.json(
      { message: "Gagal memperbarui produk" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: "ID produk tidak ditemukan" },
        { status: 400 }
      );
    }

    await db.query(
      "DELETE FROM produk WHERE id = ?",
      [id]
    );

    return NextResponse.json({
      message: "Produk berhasil dihapus",
    });
  } catch (error) {
    console.error("DELETE PRODUK ERROR:", error);

    return NextResponse.json(
      { message: "Gagal menghapus produk" },
      { status: 500 }
    );
  }
}