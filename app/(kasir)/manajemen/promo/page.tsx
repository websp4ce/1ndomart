'use client';

import { useEffect, useState } from 'react';
import SidebarKasir from '@/app/components/SidebarKasir';
import HeaderKasir from '@/app/components/HeaderKasir';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Tag,
  Percent,
  CalendarDays,
  X,
} from 'lucide-react';

type Promo = {
  id: number;
  nama: string;
  diskon: number;
  periode: string;
  status: 'Aktif' | 'Berakhir';
};

export default function PromoPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [nama, setNama] = useState('');
  const [diskon, setDiskon] = useState('');
  const [periode, setPeriode] = useState('');

  // AMBIL DATA DARI DATABASE
  const ambilData = async () => {
    try {
      const res = await fetch('/api/manajemen?menu=promo');
      const hasil = await res.json();

      if (res.ok) {
        setPromos(hasil);
      } else {
        alert(hasil.error);
      }
    } catch (error) {
      console.error(error);
      alert('Gagal terhubung ke server');
    }
  };

  useEffect(() => {
    ambilData();
  }, []);

  // FILTER SEARCH
  const filtered = promos.filter((item) =>
    item.nama.toLowerCase().includes(search.toLowerCase())
  );

  // TAMBAH
  const bukaTambah = () => {
    setEditId(null);
    setNama('');
    setDiskon('');
    setPeriode('');
    setShowForm(true);
  };

  // EDIT
  const bukaEdit = (item: Promo) => {
    setEditId(item.id);
    setNama(item.nama);
    setDiskon(String(item.diskon));
    setPeriode(item.periode);
    setShowForm(true);
  };

  // RESET FORM
  const reset = () => {
    setShowForm(false);
    setEditId(null);
    setNama('');
    setDiskon('');
    setPeriode('');
  };

  // SIMPAN / UPDATE
  const simpan = async () => {
    if (!nama.trim() || !diskon || !periode.trim()) {
      alert('Semua data harus diisi!');
      return;
    }

    try {
      const res = await fetch('/api/manajemen', {
        method: editId !== null ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menu: 'promo',
          id: editId,
          nama,
          diskon: Number(diskon),
          periode,
          status: 'Aktif',
        }),
      });

      const hasil = await res.json();

      if (res.ok) {
        await ambilData();
        reset();
      } else {
        alert(hasil.error || 'Gagal menyimpan promo');
      }
    } catch (error) {
      console.error(error);
      alert('Gagal terhubung ke server');
    }
  };

  // HAPUS
  const hapus = async (id: number) => {
    if (!confirm('Yakin ingin menghapus promo ini?')) return;

    try {
      const res = await fetch('/api/manajemen', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menu: 'promo',
          id,
        }),
      });

      const hasil = await res.json();

      if (res.ok) {
        await ambilData();
      } else {
        alert(hasil.error || 'Gagal menghapus promo');
      }
    } catch (error) {
      console.error(error);
      alert('Gagal terhubung ke server');
    }
  };

  const promoAktif = promos.filter(
    (item) => item.status === 'Aktif'
  ).length;

  const totalDiskon = promos.reduce(
    (total, item) => total + Number(item.diskon),
    0
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarKasir />

      <div className="min-w-0 flex-1">
        <HeaderKasir />

        <main className="p-6">

          {/* HEADER */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Promo & Diskon
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Kelola promo dan diskon produk Indomart
              </p>
            </div>

            <button
              onClick={bukaTambah}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-100 transition hover:bg-blue-700"
            >
              <Plus size={18} />
              Tambah Promo
            </button>
          </div>

          {/* STATISTIK */}
          <div className="mb-6 grid grid-cols-3 gap-4">

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Tag size={20} className="text-blue-600" />
              </div>

              <p className="text-sm text-slate-500">
                Total Promo
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-800">
                {promos.length}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <Percent size={20} className="text-green-600" />
              </div>

              <p className="text-sm text-slate-500">
                Promo Aktif
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-800">
                {promoAktif}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                <CalendarDays size={20} className="text-orange-500" />
              </div>

              <p className="text-sm text-slate-500">
                Total Potongan
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-800">
                {totalDiskon}%
              </p>
            </div>

          </div>

          {/* TABLE */}
          <div className="rounded-2xl bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-slate-100 p-5">

              <div>
                <h2 className="font-bold text-slate-800">
                  Daftar Promo
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Promo dan diskon yang tersedia
                </p>
              </div>

              <div className="relative w-72">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  placeholder="Cari promo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">

                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500">
                    <th className="px-5 py-4 font-semibold">
                      NAMA PROMO
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      DISKON
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      PERIODE
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      STATUS
                    </th>

                    <th className="px-5 py-4 text-center font-semibold">
                      AKSI
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                            <Tag
                              size={17}
                              className="text-blue-600"
                            />
                          </div>

                          <span className="text-sm font-semibold text-slate-700">
                            {item.nama}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-orange-50 px-3 py-1 text-sm font-bold text-orange-600">
                          {item.diskon}%
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {item.periode}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === 'Aktif'
                              ? 'bg-green-50 text-green-600'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2">

                          <button
                            onClick={() => bukaEdit(item)}
                            className="rounded-lg p-2 text-blue-500 hover:bg-blue-50"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            onClick={() => hapus(item.id)}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={17} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>

              {filtered.length === 0 && (
                <div className="py-12 text-center text-sm text-slate-400">
                  Promo tidak ditemukan
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

            <div className="mb-5 flex items-center justify-between">

              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {editId !== null
                    ? 'Edit Promo'
                    : 'Tambah Promo'}
                </h2>

                <p className="text-xs text-slate-400">
                  Masukkan informasi promo
                </p>
              </div>

              <button
                onClick={reset}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>

            </div>

            <div className="space-y-4">

              {/* NAMA */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-600">
                  Nama Promo
                </label>

                <input
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Promo Hemat"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* DISKON */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-600">
                  Diskon (%)
                </label>

                <input
                  type="number"
                  min="1"
                  max="100"
                  value={diskon}
                  onChange={(e) => setDiskon(e.target.value)}
                  placeholder="Contoh: 20"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* PERIODE */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-600">
                  Periode Promo
                </label>

                <input
                  value={periode}
                  onChange={(e) => setPeriode(e.target.value)}
                  placeholder="Contoh: 10 - 15 Sep 2026"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

            </div>

            {/* BUTTON */}
            <div className="mt-6 flex justify-end gap-2">

              <button
                onClick={reset}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100"
              >
                Batal
              </button>

              <button
                onClick={simpan}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {editId !== null ? 'Update' : 'Simpan'}
              </button>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}