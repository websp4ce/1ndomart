import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

// POST /api/login
// Dipakai di halaman Login buat gantiin daftarAkun.find(...).
// Body: { email, password, role }
//
// CATATAN: password di sini masih dibandingkan sebagai teks polos,
// sama seperti data contoh di database (admin123, kasir123, dst).
// Sebelum dipakai beneran, ganti jadi bandingkan pakai bcrypt.compare()
// dan simpan password sebagai hash — jangan simpan plain text di production.
export async function POST(request: Request) {
  try {
    const { email, password, role } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email/Username dan Password wajib diisi' },
        { status: 400 }
      );
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, nama, email, role, password FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: 'Email/Username atau Password salah' },
        { status: 401 }
      );
    }

    const user = rows[0];

    // TODO: ganti jadi bcrypt.compare(password, user.password) setelah
    // password di database di-hash.
    if (user.password !== password) {
      return NextResponse.json(
        { message: 'Email/Username atau Password salah' },
        { status: 401 }
      );
    }

    if (role && user.role !== role) {
      return NextResponse.json(
        {
          message: `Akun ini terdaftar sebagai "${user.role}", bukan role yang dipilih.`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Gagal login' }, { status: 500 });
  }
}