'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';

import SidebarKasir from '@/app/components/SidebarKasir';
import HeaderKasir from '@/app/components/HeaderKasir';

type Retur = {
  id: number;
  transaksi: string;
  produk: string;
  jumlah: number;
  alasan: string;
  tanggal: string;
  status: 'Diproses' | 'Selesai';
};

export default function ReturPage() {
  const [data, setData] = useState<Retur[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState({
    transaksi: '',
    produk: '',
    jumlah: 1,
    alasan: '',
    tanggal: '',
    status: 'Diproses' as 'Diproses' | 'Selesai',
  });

  const ambilData = async () => {
    try {
      const res = await fetch('/api/manajemen?menu=retur');
      const result = await res.json();

      if (Array.isArray(result)) {
        setData(result);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    ambilData();
  }, []);

  const resetForm = () => {
    setForm({
      transaksi: '',
      produk: '',
      jumlah: 1,
      alasan: '',
      tanggal: '',
      status: 'Diproses',
    });
    setEditId(null);
  };

  const bukaTambah = () => {
    resetForm();
    setModal(true);
  };

  const bukaEdit = (item: Retur) => {
    setEditId(item.id);

    setForm({
      transaksi: item.transaksi,
      produk: item.produk,
      jumlah: item.jumlah,
      alasan: item.alasan,
      tanggal: item.tanggal?.slice(0, 10) || '',
      status: item.status,
    });

    setModal(true);
  };

  const simpan = async () => {
    if (!form.transaksi || !form.produk || !form.tanggal) {
      alert('Transaksi, produk, dan tanggal wajib diisi.');
      return;
    }

    try {
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch('/api/manajemen', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menu: 'retur',
          id: editId,
          ...form,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || 'Gagal menyimpan data.');
        return;
      }

      setModal(false);
      resetForm();
      ambilData();
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan.');
    }
  };

  const hapus = async (id: number) => {
    if (!confirm('Yakin ingin menghapus data retur ini?')) return;

    try {
      const res = await fetch('/api/manajemen', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menu: 'retur',
          id,
        }),
      });

      if (!res.ok) {
        alert('Gagal menghapus data.');
        return;
      }

      ambilData();
    } catch (error) {
      console.error(error);
    }
  };

  const selesaikan = async (item: Retur) => {
    try {
      const res = await fetch('/api/manajemen', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menu: 'retur',
          id: item.id,
          transaksi: item.transaksi,
          produk: item.produk,
          jumlah: item.jumlah,
          alasan: item.alasan,
          tanggal: item.tanggal?.slice(0, 10),
          status: 'Selesai',
        }),
      });

      if (!res.ok) {
        alert('Gagal mengubah status.');
        return;
      }

      ambilData();
    } catch (error) {
      console.error(error);
    }
  };

  const filteredData = data.filter(
    (item) =>
      item.transaksi.toLowerCase().includes(search.toLowerCase()) ||
      item.produk.toLowerCase().includes(search.toLowerCase())
  );

  const totalRetur = data.length;
  const diproses = data.filter((item) => item.status === 'Diproses').length;
  const selesai = data.filter((item) => item.status === 'Selesai').length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarKasir />

      <div className="flex min-w-0 flex-1 flex-col">
        <HeaderKasir />

        <main className="p-6">
          {/* HEADER */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Retur Penjualan
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Kelola pengembalian barang dari pelanggan
              </p>
            </div>

            <button
              onClick={bukaTambah}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-100 transition hover:bg-blue-700"
            >
              <Plus size={18} />
              Tambah Retur
            </button>
          </div>

          {/* STATISTIK */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <RotateCcw size={20} />
              </div>

              <p className="text-sm text-slate-500">Total Retur</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-800">
                {totalRetur}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <RotateCcw size={20} />
              </div>

              <p className="text-sm text-slate-500">Sedang Diproses</p>
              <h2 className="mt-1 text-2xl font-bold text-orange-500">
                {diproses}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <CheckCircle size={20} />
              </div>

              <p className="text-sm text-slate-500">Selesai</p>
              <h2 className="mt-1 text-2xl font-bold text-green-600">
                {selesai}
              </h2>
            </div>
          </div>

          {/* TABEL */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h2 className="font-bold text-slate-800">Data Retur</h2>

              <div className="relative w-64">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  placeholder="Cari transaksi / produk..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-4 font-semibold text-slate-500">
                      Transaksi
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-500">
                      Produk
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-500">
                      Jumlah
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-500">
                      Alasan
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-500">
                      Tanggal
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-500">
                      Status
                    </th>
                    <th className="px-5 py-4 text-right font-semibold text-slate-500">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredData.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-50 transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {item.transaksi}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {item.produk}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {item.jumlah}
                      </td>

                      <td className="max-w-[180px] px-5 py-4 text-slate-500">
                        {item.alasan || '-'}
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {item.tanggal
                          ? new Date(item.tanggal).toLocaleDateString(
                              'id-ID'
                            )
                          : '-'}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === 'Selesai'
                              ? 'bg-green-50 text-green-600'
                              : 'bg-orange-50 text-orange-600'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {item.status === 'Diproses' && (
                            <button
                              onClick={() => selesaikan(item)}
                              title="Selesaikan"
                              className="rounded-lg bg-green-50 p-2 text-green-600 transition hover:bg-green-100"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}

                          <button
                            onClick={() => bukaEdit(item)}
                            title="Edit"
                            className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() => hapus(item.id)}
                            title="Hapus"
                            className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredData.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-12 text-center text-sm text-slate-400"
                      >
                        Belum ada data retur.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {editId ? 'Edit Retur' : 'Tambah Retur'}
                </h2>

                <p className="text-xs text-slate-400">
                  Masukkan data pengembalian barang
                </p>
              </div>

              <button
                onClick={() => {
                  setModal(false);
                  resetForm();
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  No. Transaksi
                </label>

                <input
                  type="text"
                  value={form.transaksi}
                  onChange={(e) =>
                    setForm({ ...form, transaksi: e.target.value })
                  }
                  placeholder="Contoh: TRX-20260910-001"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Produk
                </label>

                <input
                  type="text"
                  value={form.produk}
                  onChange={(e) =>
                    setForm({ ...form, produk: e.target.value })
                  }
                  placeholder="Nama produk"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Jumlah
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={form.jumlah}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        jumlah: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Tanggal
                  </label>

                  <input
                    type="date"
                    value={form.tanggal}
                    onChange={(e) =>
                      setForm({ ...form, tanggal: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Alasan Retur
                </label>

                <textarea
                  rows={3}
                  value={form.alasan}
                  onChange={(e) =>
                    setForm({ ...form, alasan: e.target.value })
                  }
                  placeholder="Contoh: Produk rusak / salah produk"
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as 'Diproses' | 'Selesai',
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="Diproses">Diproses</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 p-5">
              <button
                onClick={() => {
                  setModal(false);
                  resetForm();
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                onClick={simpan}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {editId ? 'Simpan Perubahan' : 'Simpan Retur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}