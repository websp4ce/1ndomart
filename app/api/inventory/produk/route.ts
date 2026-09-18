import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    // DATA PRODUK
    const [produk] = await db.query(`
      SELECT
        p.id,
        p.kode_produk,
        p.nama,
        p.kategori_id,
        COALESCE(k.nama, 'Tanpa Kategori') AS kategori,
        p.harga,
        p.stok
      FROM produk p
      LEFT JOIN kategori k
        ON p.kategori_id = k.id
      ORDER BY p.id DESC
    `);

    // DATA KATEGORI
    const [kategori] = await db.query(`
      SELECT
        id,
        nama
      FROM kategori
      ORDER BY id ASC
    `);

    return NextResponse.json({
      success: true,
      produk,
      kategori,
    });
  } catch (error: any) {
    console.error("GET PRODUK ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data produk",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}