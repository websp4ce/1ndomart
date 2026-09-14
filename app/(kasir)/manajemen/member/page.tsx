'use client';

import { useEffect, useState } from 'react';
import SidebarKasir from '@/app/components/SidebarKasir';
import HeaderKasir from '@/app/components/HeaderKasir';

import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  Phone,
  Star,
  X,
} from 'lucide-react';


// ======================================================
// TYPE DATA MEMBER
// ======================================================

type Member = {
  id: number;
  nama: string;
  telepon: string;
  poin: number;
  tanggal: string;
};


// ======================================================
// HALAMAN MEMBER
// ======================================================

export default function MemberPage() {

  // -----------------------------
  // DATA MEMBER
  // -----------------------------

  const [members, setMembers] = useState<Member[]>([]);

  // Search
  const [search, setSearch] = useState('');

  // Modal
  const [showForm, setShowForm] = useState(false);

  // ID ketika edit
  const [editId, setEditId] = useState<number | null>(null);

  // Loading
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // FORM
  // -----------------------------

  const [nama, setNama] = useState('');
  const [telepon, setTelepon] = useState('');
  const [poin, setPoin] = useState('0');


  // ======================================================
  // AMBIL DATA MEMBER
  // ======================================================

  const ambilData = async () => {

    try {

      const response = await fetch(
        '/api/manajemen?menu=member',
        {
          method: 'GET',
          cache: 'no-store',
        }
      );

      const text = await response.text();

      let hasil;

      try {

        hasil = text ? JSON.parse(text) : [];

      } catch {

        console.error(
          'Response API bukan JSON:',
          text
        );

        alert(
          'Server mengirim response yang tidak valid.'
        );

        return;
      }


      if (!response.ok) {

        console.error(
          'GET MEMBER ERROR:',
          hasil
        );

        alert(
          hasil.error ||
          hasil.detail ||
          'Gagal mengambil data member'
        );

        return;
      }


      if (Array.isArray(hasil)) {

        setMembers(hasil);

      } else {

        setMembers([]);

      }

    } catch (error) {

      console.error(
        'AMBIL DATA MEMBER ERROR:',
        error
      );

      alert(
        'Gagal terhubung ke server.'
      );
    }
  };


  // ======================================================
  // LOAD DATA SAAT HALAMAN DIBUKA
  // ======================================================

  useEffect(() => {

    ambilData();

  }, []);


  // ======================================================
  // SEARCH MEMBER
  // ======================================================

  const filtered = members.filter((item) => {

    const namaMember =
      String(item.nama || '').toLowerCase();

    const nomorTelepon =
      String(item.telepon || '');

    const keyword =
      search.toLowerCase();

    return (
      namaMember.includes(keyword) ||
      nomorTelepon.includes(search)
    );
  });


  // ======================================================
  // BUKA FORM TAMBAH
  // ======================================================

  const bukaTambah = () => {

    setEditId(null);

    setNama('');

    setTelepon('');

    setPoin('0');

    setShowForm(true);
  };


  // ======================================================
  // BUKA FORM EDIT
  // ======================================================

  const bukaEdit = (item: Member) => {

    setEditId(item.id);

    setNama(item.nama);

    setTelepon(item.telepon);

    setPoin(String(item.poin ?? 0));

    setShowForm(true);
  };


  // ======================================================
  // RESET FORM
  // ======================================================

  const reset = () => {

    setShowForm(false);

    setEditId(null);

    setNama('');

    setTelepon('');

    setPoin('0');

    setLoading(false);
  };


  // ======================================================
  // SIMPAN MEMBER
  // ======================================================

  const simpan = async () => {

    // Validasi nama
    if (!nama.trim()) {

      alert(
        'Nama member harus diisi!'
      );

      return;
    }


    // Validasi telepon
    if (!telepon.trim()) {

      alert(
        'Nomor telepon harus diisi!'
      );

      return;
    }


    // Validasi poin
    const nilaiPoin =
      Number(poin) || 0;


    if (nilaiPoin < 0) {

      alert(
        'Poin tidak boleh kurang dari 0!'
      );

      return;
    }


    try {

      setLoading(true);


      // Kalau ada editId berarti UPDATE
      // Kalau tidak ada berarti INSERT

      const method =
        editId !== null
          ? 'PUT'
          : 'POST';


      const response =
        await fetch(
          '/api/manajemen',
          {
            method,

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({

              menu: 'member',

              id: editId,

              nama: nama.trim(),

              telepon:
                telepon.trim(),

              poin:
                nilaiPoin,

              tanggal:
                new Date()
                  .toISOString()
                  .split('T')[0],

            }),
          }
        );


      const text =
        await response.text();


      let hasil;

      try {

        hasil =
          text
            ? JSON.parse(text)
            : {};

      } catch {

        console.error(
          'Response bukan JSON:',
          text
        );

        alert(
          `Response server tidak valid.\nStatus: ${response.status}`
        );

        return;
      }


      // Jika gagal

      if (!response.ok) {

        console.error(
          'SIMPAN MEMBER ERROR:',
          hasil
        );

        alert(
          hasil.error ||
          hasil.detail ||
          'Gagal menyimpan member'
        );

        return;
      }


      // Berhasil

      alert(
        editId !== null
          ? 'Member berhasil diperbarui!'
          : 'Member berhasil ditambahkan!'
      );


      // Refresh data

      await ambilData();


      // Tutup modal

      reset();

    } catch (error) {

      console.error(
        'SIMPAN MEMBER ERROR:',
        error
      );

      alert(
        'Gagal terhubung ke server.\n\nPastikan Next.js dan MySQL Laragon sedang berjalan.'
      );

    } finally {

      setLoading(false);

    }
  };


  // ======================================================
  // HAPUS MEMBER
  // ======================================================

  const hapus = async (id: number) => {

    const yakin =
      confirm(
        'Yakin ingin menghapus member ini?'
      );


    if (!yakin) return;


    try {

      const response =
        await fetch(
          '/api/manajemen',
          {
            method: 'DELETE',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({

              menu: 'member',

              id,

            }),
          }
        );


      const text =
        await response.text();


      let hasil;

      try {

        hasil =
          text
            ? JSON.parse(text)
            : {};

      } catch {

        alert(
          'Response server tidak valid.'
        );

        return;
      }


      if (!response.ok) {

        console.error(
          'HAPUS ERROR:',
          hasil
        );

        alert(
          hasil.error ||
          hasil.detail ||
          'Gagal menghapus member'
        );

        return;
      }


      alert(
        'Member berhasil dihapus!'
      );


      await ambilData();

    } catch (error) {

      console.error(
        'HAPUS MEMBER ERROR:',
        error
      );

      alert(
        'Gagal terhubung ke server.'
      );
    }
  };


  // ======================================================
  // TOTAL POIN
  // ======================================================

  const totalPoin =
    members.reduce(
      (total, item) =>
        total + Number(item.poin || 0),
      0
    );


  // ======================================================
  // TAMPILAN
  // ======================================================

  return (

    <div className="flex min-h-screen bg-slate-50">

      {/* SIDEBAR */}

      <SidebarKasir />


      {/* CONTENT */}

      <div className="min-w-0 flex-1">

        <HeaderKasir />


        <main className="p-6">


          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="mb-6 flex items-center justify-between">

            <div>

              <h1 className="text-2xl font-bold text-slate-800">
                Member & Pelanggan
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Kelola data member dan pelanggan Indomart
              </p>

            </div>


            <button
              onClick={bukaTambah}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-100 transition hover:bg-blue-700"
            >

              <Plus size={18} />

              Tambah Member

            </button>

          </div>



          {/* ==================================================
              STATISTIK
          ================================================== */}

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">


            {/* TOTAL MEMBER */}

            <div className="rounded-2xl bg-white p-5 shadow-sm">

              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">

                <Users
                  size={20}
                  className="text-blue-600"
                />

              </div>

              <p className="text-sm text-slate-500">
                Total Member
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-800">
                {members.length}
              </p>

            </div>



            {/* MEMBER TERDAFTAR */}

            <div className="rounded-2xl bg-white p-5 shadow-sm">

              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">

                <Phone
                  size={20}
                  className="text-green-600"
                />

              </div>

              <p className="text-sm text-slate-500">
                Member Terdaftar
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-800">
                {members.length}
              </p>

            </div>



            {/* TOTAL POIN */}

            <div className="rounded-2xl bg-white p-5 shadow-sm">

              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">

                <Star
                  size={20}
                  className="text-orange-500"
                />

              </div>

              <p className="text-sm text-slate-500">
                Total Poin
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-800">
                {totalPoin}
              </p>

            </div>

          </div>



          {/* ==================================================
              TABLE
          ================================================== */}

          <div className="rounded-2xl bg-white shadow-sm">


            {/* TABLE HEADER */}

            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">

              <div>

                <h2 className="font-bold text-slate-800">
                  Daftar Member
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Data pelanggan yang terdaftar
                </p>

              </div>


              {/* SEARCH */}

              <div className="relative w-full md:w-72">

                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  placeholder="Cari nama atau nomor..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

            </div>



            {/* TABLE */}

            <div className="overflow-x-auto">

              <table className="w-full text-left">


                <thead>

                  <tr className="bg-slate-50 text-xs text-slate-500">

                    <th className="px-5 py-4 font-semibold">
                      NAMA MEMBER
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      TELEPON
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      POIN
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      TANGGAL
                    </th>

                    <th className="px-5 py-4 text-center font-semibold">
                      AKSI
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filtered.map(
                    (item) => (

                      <tr
                        key={item.id}
                        className="border-t border-slate-100 transition hover:bg-slate-50"
                      >


                        {/* NAMA */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">

                              <Users
                                size={17}
                                className="text-blue-600"
                              />

                            </div>

                            <span className="text-sm font-semibold text-slate-700">
                              {item.nama}
                            </span>

                          </div>

                        </td>


                        {/* TELEPON */}

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {item.telepon}
                        </td>


                        {/* POIN */}

                        <td className="px-5 py-4">

                          <span className="rounded-lg bg-orange-50 px-3 py-1 text-sm font-bold text-orange-600">
                            {item.poin} poin
                          </span>

                        </td>


                        {/* TANGGAL */}

                        <td className="px-5 py-4 text-sm text-slate-500">

                          {item.tanggal
                            ? new Date(
                                item.tanggal
                              ).toLocaleDateString(
                                'id-ID'
                              )
                            : '-'}

                        </td>


                        {/* AKSI */}

                        <td className="px-5 py-4">

                          <div className="flex justify-center gap-2">


                            {/* EDIT */}

                            <button
                              onClick={() =>
                                bukaEdit(item)
                              }
                              title="Edit member"
                              className="rounded-lg p-2 text-blue-500 transition hover:bg-blue-50"
                            >

                              <Pencil size={17} />

                            </button>


                            {/* HAPUS */}

                            <button
                              onClick={() =>
                                hapus(item.id)
                              }
                              title="Hapus member"
                              className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                            >

                              <Trash2 size={17} />

                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>


              {/* DATA KOSONG */}

              {filtered.length === 0 && (

                <div className="py-12 text-center">

                  <Users
                    size={40}
                    className="mx-auto mb-3 text-slate-300"
                  />

                  <p className="text-sm text-slate-400">
                    {search
                      ? 'Member tidak ditemukan'
                      : 'Belum ada data member'}
                  </p>

                </div>

              )}

            </div>

          </div>

        </main>

      </div>



      {/* ==================================================
          MODAL TAMBAH / EDIT
      ================================================== */}

      {showForm && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]">


          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">


            {/* MODAL HEADER */}

            <div className="mb-5 flex items-center justify-between">

              <div>

                <h2 className="text-xl font-bold text-slate-800">

                  {editId !== null
                    ? 'Edit Member'
                    : 'Tambah Member'}

                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Masukkan informasi member
                </p>

              </div>


              <button
                onClick={reset}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >

                <X size={20} />

              </button>

            </div>



            {/* FORM */}

            <div className="space-y-4">


              {/* NAMA */}

              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                  Nama Member
                </label>

                <input
                  type="text"
                  value={nama}
                  onChange={(e) =>
                    setNama(e.target.value)
                  }
                  placeholder="Contoh: Andi Saputra"
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />

              </div>



              {/* TELEPON */}

              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                  Nomor Telepon
                </label>

                <input
                  type="tel"
                  value={telepon}
                  onChange={(e) =>
                    setTelepon(
                      e.target.value.replace(
                        /[^0-9+]/g,
                        ''
                      )
                    )
                  }
                  placeholder="Contoh: 081234567890"
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />

              </div>



              {/* POIN */}

              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                  Poin
                </label>

                <input
                  type="number"
                  min="0"
                  value={poin}
                  onChange={(e) =>
                    setPoin(e.target.value)
                  }
                  placeholder="Contoh: 100"
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />

              </div>

            </div>



            {/* BUTTON */}

            <div className="mt-6 flex justify-end gap-2">


              <button
                onClick={reset}
                disabled={loading}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Batal
              </button>


              <button
                onClick={simpan}
                disabled={loading}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading
                  ? 'Menyimpan...'
                  : editId !== null
                    ? 'Update'
                    : 'Simpan'}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}