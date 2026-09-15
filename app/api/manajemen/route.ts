import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: Request) {
  try {
    const menu = new URL(req.url).searchParams.get('menu');

    const tabel: Record<string, string> = {
      promo: 'promo',
      member: 'member',
      retur: 'retur_penjualan',
      shift: 'shift_kasir',
      laporan: 'laporan_penjualan',
    };

    if (!menu || !tabel[menu]) {
      return NextResponse.json(
        { error: 'Menu tidak valid' },
        { status: 400 }
      );
    }

    const [rows] = await db.execute(
      `SELECT * FROM ${tabel[menu]} ORDER BY id DESC`
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET ERROR:', error);

    return NextResponse.json(
      {
        error: 'Gagal mengambil data',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


// ======================================================
// MEMBER
// ======================================================

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.menu !== 'member') {
      return NextResponse.json(
        { error: 'Menu tidak valid' },
        { status: 400 }
      );
    }

    const { nama, telepon, poin, tanggal } = body;

    if (!nama?.trim() || !telepon?.trim()) {
      return NextResponse.json(
        { error: 'Nama dan nomor telepon wajib diisi' },
        { status: 400 }
      );
    }

    const [result] = await db.execute(
      `
        INSERT INTO member
        (nama, telepon, poin, tanggal)
        VALUES (?, ?, ?, ?)
      `,
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
  } catch (error) {
    console.error('POST ERROR:', error);

    return NextResponse.json(
      {
        error: 'Gagal menambahkan member',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


export async function PUT(req: Request) {
  try {
    const body = await req.json();

    if (body.menu !== 'member') {
      return NextResponse.json(
        { error: 'Menu tidak valid' },
        { status: 400 }
      );
    }

    const { id, nama, telepon, poin } = body;

    if (!id || !nama?.trim() || !telepon?.trim()) {
      return NextResponse.json(
        { error: 'Data member belum lengkap' },
        { status: 400 }
      );
    }

    const [result] = await db.execute(
      `
        UPDATE member
        SET nama = ?, telepon = ?, poin = ?
        WHERE id = ?
      `,
      [
        nama.trim(),
        telepon.trim(),
        Number(poin) || 0,
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
    console.error('PUT ERROR:', error);

    return NextResponse.json(
      {
        error: 'Gagal memperbarui member',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


export async function DELETE(req: Request) {
  try {
    const { menu, id } = await req.json();

    if (menu !== 'member' || !id) {
      return NextResponse.json(
        { error: 'Data tidak valid' },
        { status: 400 }
      );
    }

    const [result] = await db.execute(
      `DELETE FROM member WHERE id = ?`,
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
    console.error('DELETE ERROR:', error);

    return NextResponse.json(
      {
        error: 'Gagal menghapus member',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}