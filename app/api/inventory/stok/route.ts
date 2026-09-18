import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    // =========================
    // DATA PRODUK
    // =========================
    const [produk] = await db.query(`
      SELECT
        p.id,
        p.kode_produk,
        p.nama,
        p.harga,
        p.stok,
        p.kategori_id,
        COALESCE(k.nama, 'Tanpa Kategori') AS kategori
      FROM produk p
      LEFT JOIN kategori k ON p.kategori_id = k.id
      ORDER BY p.id DESC
    `);

    // =========================
    // DATA STOK MASUK
    // =========================
    let masuk: any[] = [];

    try {
      const [rows] = await db.query(`
        SELECT
          sm.id,
          sm.produk_id,
          p.kode_produk,
          p.nama AS produk,
          sm.jumlah,
          sm.tanggal,
          sm.keterangan
        FROM stok_masuk sm
        INNER JOIN produk p ON p.id = sm.produk_id
        ORDER BY sm.id DESC
      `);

      masuk = rows as any[];
    } catch (error) {
      console.error("STOK MASUK ERROR:", error);
      masuk = [];
    }

    // =========================
    // DATA STOK KELUAR
    // =========================
    let keluar: any[] = [];

    try {
      const [rows] = await db.query(`
        SELECT
          sk.id,
          sk.produk_id,
          p.kode_produk,
          p.nama AS produk,
          sk.jumlah,
          sk.tanggal,
          sk.keterangan
        FROM stok_keluar sk
        INNER JOIN produk p ON p.id = sk.produk_id
        ORDER BY sk.id DESC
      `);

      keluar = rows as any[];
    } catch (error) {
      console.error("STOK KELUAR ERROR:", error);
      keluar = [];
    }

    return NextResponse.json({
      success: true,
      produk,
      masuk,
      keluar,
    });
  } catch (error: any) {
    console.error("GET PRODUK ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Tidak dapat terhubung ke database/server.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let connection: any = null;
  let transactionStarted = false;

  try {
    const body = await req.json();

    const produk_id = Number(body.produk_id);
    const jumlah = Number(body.jumlah);
    const tanggal = body.tanggal;
    const keterangan = body.keterangan || null;
    const tipe = body.tipe;

    // =========================
    // VALIDASI
    // =========================
    if (!produk_id || !jumlah || !tanggal || !tipe) {
      return NextResponse.json(
        {
          success: false,
          message: "Produk, jumlah, tanggal, dan tipe stok wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (jumlah <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Jumlah stok harus lebih dari 0.",
        },
        { status: 400 }
      );
    }

    if (tipe !== "masuk" && tipe !== "keluar") {
      return NextResponse.json(
        {
          success: false,
          message: "Tipe stok tidak valid.",
        },
        { status: 400 }
      );
    }

    // =========================
    // KONEKSI
    // =========================
    connection = await db.getConnection();

    await connection.beginTransaction();
    transactionStarted = true;

    // =========================
    // CEK PRODUK
    // =========================
    const [produkRows]: any = await connection.query(
      `
      SELECT id, stok
      FROM produk
      WHERE id = ?
      FOR UPDATE
      `,
      [produk_id]
    );

    if (!produkRows || produkRows.length === 0) {
      await connection.rollback();
      transactionStarted = false;

      return NextResponse.json(
        {
          success: false,
          message: "Produk tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    const stokSekarang = Number(produkRows[0].stok || 0);

    // =========================
    // STOK MASUK
    // =========================
    if (tipe === "masuk") {
      await connection.query(
        `
        INSERT INTO stok_masuk
        (
          produk_id,
          jumlah,
          tanggal,
          keterangan
        )
        VALUES (?, ?, ?, ?)
        `,
        [produk_id, jumlah, tanggal, keterangan]
      );

      await connection.query(
        `
        UPDATE produk
        SET stok = stok + ?
        WHERE id = ?
        `,
        [jumlah, produk_id]
      );
    }

    // =========================
    // STOK KELUAR
    // =========================
    if (tipe === "keluar") {
      if (stokSekarang < jumlah) {
        await connection.rollback();
        transactionStarted = false;

        return NextResponse.json(
          {
            success: false,
            message: `Stok tidak cukup. Stok saat ini hanya ${stokSekarang}.`,
          },
          { status: 400 }
        );
      }

      await connection.query(
        `
        INSERT INTO stok_keluar
        (
          produk_id,
          jumlah,
          tanggal,
          keterangan
        )
        VALUES (?, ?, ?, ?)
        `,
        [produk_id, jumlah, tanggal, keterangan]
      );

      await connection.query(
        `
        UPDATE produk
        SET stok = stok - ?
        WHERE id = ?
        `,
        [jumlah, produk_id]
      );
    }

    await connection.commit();
    transactionStarted = false;

    return NextResponse.json({
      success: true,
      message:
        tipe === "masuk"
          ? "Stok masuk berhasil ditambahkan."
          : "Stok keluar berhasil ditambahkan.",
    });
  } catch (error: any) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch {}
    }

    console.error("POST STOK ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal menyimpan data stok.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function DELETE(req: NextRequest) {
  let connection: any = null;
  let transactionStarted = false;

  try {
    const body = await req.json();

    const id = Number(body.id);
    const tipe = body.tipe;

    if (!id || !tipe) {
      return NextResponse.json(
        {
          success: false,
          message: "ID dan tipe stok wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (tipe !== "masuk" && tipe !== "keluar") {
      return NextResponse.json(
        {
          success: false,
          message: "Tipe stok tidak valid.",
        },
        { status: 400 }
      );
    }

    connection = await db.getConnection();

    await connection.beginTransaction();
    transactionStarted = true;

    // =========================
    // HAPUS STOK MASUK
    // =========================
    if (tipe === "masuk") {
      const [rows]: any = await connection.query(
        `
        SELECT produk_id, jumlah
        FROM stok_masuk
        WHERE id = ?
        FOR UPDATE
        `,
        [id]
      );

      if (!rows || rows.length === 0) {
        await connection.rollback();
        transactionStarted = false;

        return NextResponse.json(
          {
            success: false,
            message: "Data stok masuk tidak ditemukan.",
          },
          { status: 404 }
        );
      }

      const produkId = Number(rows[0].produk_id);
      const jumlah = Number(rows[0].jumlah);

      const [produkRows]: any = await connection.query(
        `
        SELECT stok
        FROM produk
        WHERE id = ?
        FOR UPDATE
        `,
        [produkId]
      );

      if (!produkRows || produkRows.length === 0) {
        await connection.rollback();
        transactionStarted = false;

        return NextResponse.json(
          {
            success: false,
            message: "Produk tidak ditemukan.",
          },
          { status: 404 }
        );
      }

      const stokSekarang = Number(produkRows[0].stok || 0);

      if (stokSekarang < jumlah) {
        await connection.rollback();
        transactionStarted = false;

        return NextResponse.json(
          {
            success: false,
            message: "Data tidak dapat dihapus karena stok sudah digunakan.",
          },
          { status: 400 }
        );
      }

      await connection.query(
        `
        UPDATE produk
        SET stok = stok - ?
        WHERE id = ?
        `,
        [jumlah, produkId]
      );

      await connection.query(
        `
        DELETE FROM stok_masuk
        WHERE id = ?
        `,
        [id]
      );
    }

    // =========================
    // HAPUS STOK KELUAR
    // =========================
    if (tipe === "keluar") {
      const [rows]: any = await connection.query(
        `
        SELECT produk_id, jumlah
        FROM stok_keluar
        WHERE id = ?
        FOR UPDATE
        `,
        [id]
      );

      if (!rows || rows.length === 0) {
        await connection.rollback();
        transactionStarted = false;

        return NextResponse.json(
          {
            success: false,
            message: "Data stok keluar tidak ditemukan.",
          },
          { status: 404 }
        );
      }

      const produkId = Number(rows[0].produk_id);
      const jumlah = Number(rows[0].jumlah);

      await connection.query(
        `
        UPDATE produk
        SET stok = stok + ?
        WHERE id = ?
        `,
        [jumlah, produkId]
      );

      await connection.query(
        `
        DELETE FROM stok_keluar
        WHERE id = ?
        `,
        [id]
      );
    }

    await connection.commit();
    transactionStarted = false;

    return NextResponse.json({
      success: true,
      message:
        tipe === "masuk"
          ? "Data stok masuk berhasil dihapus dan stok dikembalikan."
          : "Data stok keluar berhasil dihapus dan stok dikembalikan.",
    });
  } catch (error: any) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch {}
    }

    console.error("DELETE STOK ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal menghapus data stok.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}