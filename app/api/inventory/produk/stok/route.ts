import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [produk] = await db.query(`
      SELECT
        p.id,
        p.kode_produk,
        p.nama,
        k.nama AS kategori,
        p.harga,
        p.stok
      FROM produk p
      LEFT JOIN kategori k ON p.kategori_id = k.id
      ORDER BY p.id DESC
    `);

    const [masuk] = await db.query(`
      SELECT
        sm.id,
        sm.produk_id,
        p.kode_produk,
        p.nama AS produk,
        sm.jumlah,
        sm.tanggal,
        sm.keterangan
      FROM stok_masuk sm
      JOIN produk p ON sm.produk_id = p.id
      ORDER BY sm.id DESC
    `);

    const [keluar] = await db.query(`
      SELECT
        sk.id,
        sk.produk_id,
        p.kode_produk,
        p.nama AS produk,
        sk.jumlah,
        sk.tanggal,
        sk.keterangan
      FROM stok_keluar sk
      JOIN produk p ON sk.produk_id = p.id
      ORDER BY sk.id DESC
    `);

    return NextResponse.json({
      produk,
      masuk,
      keluar,
    });
  } catch (error) {
    console.error("GET STOK ERROR:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data stok" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      produk_id,
      jumlah,
      tanggal,
      keterangan,
      tipe,
    } = body;

    if (!produk_id || !jumlah || !tanggal || !tipe) {
      return NextResponse.json(
        { message: "Data stok belum lengkap" },
        { status: 400 }
      );
    }

    const qty = Number(jumlah);

    if (qty <= 0) {
      return NextResponse.json(
        { message: "Jumlah stok harus lebih dari 0" },
        { status: 400 }
      );
    }

    // =========================
    // STOK MASUK
    // =========================
    if (tipe === "masuk") {
      await db.query(
        `
        INSERT INTO stok_masuk
        (produk_id, jumlah, tanggal, keterangan)
        VALUES (?, ?, ?, ?)
        `,
        [
          produk_id,
          qty,
          tanggal,
          keterangan || null,
        ]
      );

      await db.query(
        `
        UPDATE produk
        SET stok = stok + ?
        WHERE id = ?
        `,
        [qty, produk_id]
      );

      return NextResponse.json({
        message: "Stok masuk berhasil ditambahkan",
      });
    }

    // =========================
    // STOK KELUAR
    // =========================
    if (tipe === "keluar") {
      const [rows] = await db.query(
        `
        SELECT stok
        FROM produk
        WHERE id = ?
        `,
        [produk_id]
      );

      const data = rows as any[];

      if (data.length === 0) {
        return NextResponse.json(
          { message: "Produk tidak ditemukan" },
          { status: 404 }
        );
      }

      if (Number(data[0].stok) < qty) {
        return NextResponse.json(
          { message: "Stok tidak mencukupi" },
          { status: 400 }
        );
      }

      await db.query(
        `
        INSERT INTO stok_keluar
        (produk_id, jumlah, tanggal, keterangan)
        VALUES (?, ?, ?, ?)
        `,
        [
          produk_id,
          qty,
          tanggal,
          keterangan || null,
        ]
      );

      await db.query(
        `
        UPDATE produk
        SET stok = stok - ?
        WHERE id = ?
        `,
        [qty, produk_id]
      );

      return NextResponse.json({
        message: "Stok keluar berhasil ditambahkan",
      });
    }

    return NextResponse.json(
      { message: "Tipe stok tidak valid" },
      { status: 400 }
    );
  } catch (error) {
    console.error("POST STOK ERROR:", error);

    return NextResponse.json(
      { message: "Gagal menyimpan stok" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      id,
      tipe,
    } = body;

    if (!id || !tipe) {
      return NextResponse.json(
        { message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    if (tipe === "masuk") {
      const [rows] = await db.query(
        `
        SELECT produk_id, jumlah
        FROM stok_masuk
        WHERE id = ?
        `,
        [id]
      );

      const data = rows as any[];

      if (data.length === 0) {
        return NextResponse.json(
          { message: "Data stok masuk tidak ditemukan" },
          { status: 404 }
        );
      }

      const { produk_id, jumlah } = data[0];

      const [produk] = await db.query(
        `SELECT stok FROM produk WHERE id = ?`,
        [produk_id]
      );

      const stokData = produk as any[];

      if (
        stokData.length === 0 ||
        Number(stokData[0].stok) < Number(jumlah)
      ) {
        return NextResponse.json(
          {
            message:
              "Data tidak bisa dihapus karena stok saat ini tidak mencukupi",
          },
          { status: 400 }
        );
      }

      await db.query(
        `DELETE FROM stok_masuk WHERE id = ?`,
        [id]
      );

      await db.query(
        `
        UPDATE produk
        SET stok = stok - ?
        WHERE id = ?
        `,
        [jumlah, produk_id]
      );
    }

    if (tipe === "keluar") {
      const [rows] = await db.query(
        `
        SELECT produk_id, jumlah
        FROM stok_keluar
        WHERE id = ?
        `,
        [id]
      );

      const data = rows as any[];

      if (data.length === 0) {
        return NextResponse.json(
          { message: "Data stok keluar tidak ditemukan" },
          { status: 404 }
        );
      }

      const { produk_id, jumlah } = data[0];

      await db.query(
        `DELETE FROM stok_keluar WHERE id = ?`,
        [id]
      );

      await db.query(
        `
        UPDATE produk
        SET stok = stok + ?
        WHERE id = ?
        `,
        [jumlah, produk_id]
      );
    }

    return NextResponse.json({
      message: "Data stok berhasil dihapus",
    });
  } catch (error) {
    console.error("DELETE STOK ERROR:", error);

    return NextResponse.json(
      { message: "Gagal menghapus data stok" },
      { status: 500 }
    );
  }
}