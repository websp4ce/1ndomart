import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

interface RakRow extends RowDataPacket {
  id: number;
  kode_rak: string;
  keterangan: string | null;
  kapasitas: number | string | null;
  jumlah_produk: number | string;
}

export async function GET(req: NextRequest) {
  try {
    const search =
      req.nextUrl.searchParams.get("search")?.trim() || "";

    let sql = `
      SELECT
        r.id,
        r.kode_rak,
        r.keterangan,
        r.kapasitas,
        COUNT(pr.id) AS jumlah_produk
      FROM lokasi_rak r
      LEFT JOIN produk_rak pr
        ON pr.rak_id = r.id
    `;

    const values: string[] = [];

    if (search) {
      sql += `
        WHERE r.kode_rak LIKE ?
        OR r.keterangan LIKE ?
      `;

      values.push(
        `%${search}%`,
        `%${search}%`
      );
    }

    sql += `
      GROUP BY
        r.id,
        r.kode_rak,
        r.keterangan,
        r.kapasitas
      ORDER BY r.kode_rak ASC
    `;

    const [rows] = await pool.query<RakRow[]>(
      sql,
      values
    );

    return NextResponse.json({
      data: rows.map((row) => ({
        id: Number(row.id),
        kodeRak: row.kode_rak,
        keterangan: row.keterangan ?? "",
        kapasitas: Number(row.kapasitas) || 0,
        jumlahProduk: Number(row.jumlah_produk) || 0,
      })),
    });
  } catch (error: any) {
    console.error(
      "GET /api/warehouse/lokasi-rak error:",
      error
    );

    return NextResponse.json(
      {
        error: "Gagal mengambil data lokasi rak.",
        detail: error?.message || "Database error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const kodeRak = String(
      body.kodeRak ?? ""
    ).trim();

    const keterangan = String(
      body.keterangan ?? ""
    ).trim();

    const kapasitas = Number(
      body.kapasitas ?? 0
    );

    if (!kodeRak) {
      return NextResponse.json(
        { error: "Kode rak wajib diisi." },
        { status: 400 }
      );
    }

    if (kapasitas < 0) {
      return NextResponse.json(
        {
          error: "Kapasitas tidak boleh kurang dari 0.",
        },
        { status: 400 }
      );
    }

    const [existing] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT id
          FROM lokasi_rak
          WHERE kode_rak = ?
          LIMIT 1
        `,
        [kodeRak]
      );

    if (existing.length > 0) {
      return NextResponse.json(
        {
          error: `Kode rak "${kodeRak}" sudah dipakai.`,
        },
        { status: 409 }
      );
    }

    const [result] =
      await pool.query<ResultSetHeader>(
        `
          INSERT INTO lokasi_rak
            (kode_rak, keterangan, kapasitas)
          VALUES (?, ?, ?)
        `,
        [
          kodeRak,
          keterangan || null,
          kapasitas,
        ]
      );

    return NextResponse.json(
      {
        id: result.insertId,
        kodeRak,
        keterangan,
        kapasitas,
        jumlahProduk: 0,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      "POST /api/warehouse/lokasi-rak error:",
      error
    );

    return NextResponse.json(
      {
        error: "Gagal menambah lokasi rak.",
        detail: error?.message || "Database error",
      },
      { status: 500 }
    );
  }
}