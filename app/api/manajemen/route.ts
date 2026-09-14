import { NextResponse } from 'next/server';
import db from '@/lib/db';

// ======================================================
// MEMASTIKAN TABEL MEMBER ADA
// ======================================================

async function pastikanTabelMember() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS member (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nama VARCHAR(100) NOT NULL,
      telepon VARCHAR(20) NOT NULL,
      poin INT NOT NULL DEFAULT 0,
      tanggal DATE NOT NULL
    )
  `);
}


// ======================================================
// GET - AMBIL DATA MEMBER
// ======================================================

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const menu = searchParams.get('menu');

    if (menu !== 'member') {
      return NextResponse.json(
        { error: 'Menu tidak valid' },
        { status: 400 }
      );
    }

    // Pastikan tabel tersedia
    await pastikanTabelMember();

    const [rows] = await db.execute(`
      SELECT
        id,
        nama,
        telepon,
        poin,
        tanggal
      FROM member
      ORDER BY id DESC
    `);

    return NextResponse.json(rows);

  } catch (error) {
    console.error('GET MEMBER ERROR:', error);

    return NextResponse.json(
      {
        error: 'Gagal mengambil data member',
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}


// ======================================================
// POST - TAMBAH MEMBER
// ======================================================

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      menu,
      nama,
      telepon,
      poin,
      tanggal,
    } = body;

    if (menu !== 'member') {
      return NextResponse.json(
        { error: 'Menu tidak valid' },
        { status: 400 }
      );
    }

    if (!nama?.trim()) {
      return NextResponse.json(
        { error: 'Nama member harus diisi' },
        { status: 400 }
      );
    }

    if (!telepon?.trim()) {
      return NextResponse.json(
        { error: 'Nomor telepon harus diisi' },
        { status: 400 }
      );
    }

    await pastikanTabelMember();

    const nilaiPoin = Number(poin) || 0;

    const tanggalMember =
      tanggal ||
      new Date().toISOString().split('T')[0];

    const [result] = await db.execute(
      `
        INSERT INTO member
        (nama, telepon, poin, tanggal)
        VALUES (?, ?, ?, ?)
      `,
      [
        nama.trim(),
        telepon.trim(),
        nilaiPoin,
        tanggalMember,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Member berhasil ditambahkan',
        id: (result as any).insertId,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST MEMBER ERROR:', error);

    return NextResponse.json(
      {
        error: 'Gagal menambahkan member',
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}


// ======================================================
// PUT - EDIT MEMBER
// ======================================================

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const {
      menu,
      id,
      nama,
      telepon,
      poin,
    } = body;

    if (menu !== 'member') {
      return NextResponse.json(
        { error: 'Menu tidak valid' },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID member tidak ditemukan' },
        { status: 400 }
      );
    }

    if (!nama?.trim()) {
      return NextResponse.json(
        { error: 'Nama member harus diisi' },
        { status: 400 }
      );
    }

    if (!telepon?.trim()) {
      return NextResponse.json(
        { error: 'Nomor telepon harus diisi' },
        { status: 400 }
      );
    }

    await pastikanTabelMember();

    const nilaiPoin = Number(poin) || 0;

    const [result] = await db.execute(
      `
        UPDATE member
        SET
          nama = ?,
          telepon = ?,
          poin = ?
        WHERE id = ?
      `,
      [
        nama.trim(),
        telepon.trim(),
        nilaiPoin,
        id,
      ]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Member tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Member berhasil diperbarui',
    });

  } catch (error) {
    console.error('PUT MEMBER ERROR:', error);

    return NextResponse.json(
      {
        error: 'Gagal memperbarui member',
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}


// ======================================================
// DELETE - HAPUS MEMBER
// ======================================================

export async function DELETE(req: Request) {
  try {
    const body = await req.json();

    const {
      menu,
      id,
    } = body;

    if (menu !== 'member') {
      return NextResponse.json(
        { error: 'Menu tidak valid' },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID member tidak ditemukan' },
        { status: 400 }
      );
    }

    await pastikanTabelMember();

    const [result] = await db.execute(
      `
        DELETE FROM member
        WHERE id = ?
      `,
      [id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Member tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Member berhasil dihapus',
    });

  } catch (error) {
    console.error('DELETE MEMBER ERROR:', error);

    return NextResponse.json(
      {
        error: 'Gagal menghapus member',
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}