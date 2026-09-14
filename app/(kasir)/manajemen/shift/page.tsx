'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Clock3,
  CheckCircle,
  Eye,
} from 'lucide-react';

import SidebarKasir from '@/app/components/SidebarKasir';
import HeaderKasir from '@/app/components/HeaderKasir';

type Shift = {
  id: number;
  kasir: string;
  shift: string;
  mulai: string;
  selesai: string;
  transaksi: number;
  uang_awal: number;
  total_penjualan: number;
  status: 'Aktif' | 'Selesai';
};

export default function ShiftPage() {
  const [data, setData] = useState<Shift[]>([]);
  const [modal, setModal] = useState(false);
  const [detail, setDetail] = useState<Shift | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState({
    kasir: '',
    shift: 'Pagi',
    mulai: '',
    selesai: '',
    transaksi: 0,
    uangAwal: 0,
    totalPenjualan: 0,
    status: 'Aktif' as 'Aktif' | 'Selesai',
  });

  const ambilData = async () => {
    try {
      const res = await fetch('/api/manajemen?menu=shift');
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
      kasir: '',
      shift: 'Pagi',
      mulai: '',
      selesai: '',
      transaksi: 0,
      uangAwal: 0,
      totalPenjualan: 0,
      status: 'Aktif',
    });

    setEditId(null);
  };

  const bukaTambah = () => {
    resetForm();
    setModal(true);
  };

  const bukaEdit = (item: Shift) => {
    setEditId(item.id);

    setForm({
      kasir: item.kasir,
      shift: item.shift,
      mulai: item.mulai
        ? new Date(item.mulai).toISOString().slice(0, 16)
        : '',
      selesai: item.selesai
        ? new Date(item.selesai).toISOString().slice(0, 16)
        : '',
      transaksi: item.transaksi,
      uangAwal: item.uang_awal,
      totalPenjualan: item.total_penjualan,
      status: item.status,
    });

    setModal(true);
  };

  const simpan = async () => {
    if (!form.kasir || !form.mulai) {
      alert('Nama kasir dan waktu mulai wajib diisi.');
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
          menu: 'shift',
          id: editId,
          ...form,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || 'Gagal menyimpan shift.');
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

  const tutupShift = async (item: Shift) => {
    if (!confirm(`Tutup shift ${item.shift} milik ${item.kasir}?`)) {
      return;
    }

    try {
      const res = await fetch('/api/manajemen', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menu: 'shift',
          id: item.id,
          kasir: item.kasir,
          shift: item.shift,
          mulai: item.mulai,
          selesai: new Date().toISOString(),
          transaksi: item.transaksi,
          uangAwal: item.uang_awal,
          totalPenjualan: item.total_penjualan,
          status: 'Selesai',
        }),
      });

      if (!res.ok) {
        alert('Gagal menutup shift.');
        return;
      }

      ambilData();
    } catch (error) {
      console.error(error);
    }
  };

  const hapus = async (id: number) => {
    if (!confirm('Yakin ingin menghapus data shift ini?')) {
      return;
    }

    try {
      const res = await fetch('/api/manajemen', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menu: 'shift',
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

  const rupiah = (angka: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(angka) || 0);

  const aktif = data.filter((item) => item.status === 'Aktif').length;
  const selesai = data.filter((item) => item.status === 'Selesai').length;

  const totalPenjualan = data.reduce(
    (total, item) => total + Number(item.total_penjualan || 0),
    0
  );

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
                Tutup Kasir / Shift
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Kelola shift kasir dan tutup kasir
              </p>
            </div>

            <button
              onClick={bukaTambah}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-100 transition hover:bg-blue-700"
            >
              <Plus size={18} />
              Buka Shift
            </button>
          </div>

          {/* STATISTIK */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Clock3 size={20} />
              </div>

              <p className="text-sm text-slate-500">Total Shift</p>

              <h2 className="mt-1 text-2xl font-bold text-slate-800">
                {data.length}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <Clock3 size={20} />
              </div>

              <p className="text-sm text-slate-500">Shift Aktif</p>

              <h2 className="mt-1 text-2xl font-bold text-orange-500">
                {aktif}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <CheckCircle size={20} />
              </div>

              <p className="text-sm text-slate-500">Total Penjualan</p>

              <h2 className="mt-1 text-xl font-bold text-green-600">
                {rupiah(totalPenjualan)}
              </h2>
            </div>
          </div>

          {/* TABEL */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-bold text-slate-800">
                Riwayat Shift Kasir
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Shift aktif dan shift yang sudah ditutup
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-4 font-semibold text-slate-500">
                      Kasir
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-500">
                      Shift
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-500">
                      Mulai
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-500">
                      Selesai
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-500">
                      Transaksi
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-500">
                      Penjualan
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
                  {data.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-50 transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {item.kasir}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {item.shift}
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {item.mulai
                          ? new Date(item.mulai).toLocaleString('id-ID')
                          : '-'}
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {item.selesai
                          ? new Date(item.selesai).toLocaleString('id-ID')
                          : '-'}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {item.transaksi}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {rupiah(item.total_penjualan)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === 'Aktif'
                              ? 'bg-orange-50 text-orange-600'
                              : 'bg-green-50 text-green-600'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setDetail(item)}
                            title="Detail"
                            className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                          >
                            <Eye size={16} />
                          </button>

                          {item.status === 'Aktif' && (
                            <button
                              onClick={() => tutupShift(item)}
                              title="Tutup Shift"
                              className="rounded-lg bg-green-50 p-2 text-green-600 hover:bg-green-100"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}

                          <button
                            onClick={() => bukaEdit(item)}
                            title="Edit"
                            className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() => hapus(item.id)}
                            title="Hapus"
                            className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {data.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-12 text-center text-sm text-slate-400"
                      >
                        Belum ada data shift.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* MODAL TAMBAH / EDIT */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {editId ? 'Edit Shift' : 'Buka Shift Baru'}
                </h2>

                <p className="text-xs text-slate-400">
                  Masukkan informasi shift kasir
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
                  Nama Kasir
                </label>

                <input
                  type="text"
                  value={form.kasir}
                  onChange={(e) =>
                    setForm({ ...form, kasir: e.target.value })
                  }
                  placeholder="Contoh: Kasir 01"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Shift
                </label>

                <select
                  value={form.shift}
                  onChange={(e) =>
                    setForm({ ...form, shift: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="Pagi">Pagi</option>
                  <option value="Siang">Siang</option>
                  <option value="Malam">Malam</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Waktu Mulai
                  </label>

                  <input
                    type="datetime-local"
                    value={form.mulai}
                    onChange={(e) =>
                      setForm({ ...form, mulai: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Uang Awal
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.uangAwal}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        uangAwal: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Jumlah Transaksi
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.transaksi}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        transaksi: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Total Penjualan
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.totalPenjualan}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        totalPenjualan: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {editId && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as 'Aktif' | 'Selesai',
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              )}
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
                {editId ? 'Simpan Perubahan' : 'Buka Shift'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Detail Shift
                </h2>

                <p className="text-xs text-slate-400">
                  Informasi lengkap shift kasir
                </p>
              </div>

              <button
                onClick={() => setDetail(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Kasir</span>
                <span className="font-semibold text-slate-800">
                  {detail.kasir}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Shift</span>
                <span className="font-semibold text-slate-800">
                  {detail.shift}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-slate-500">
                  Jumlah Transaksi
                </span>
                <span className="font-semibold text-slate-800">
                  {detail.transaksi}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Uang Awal</span>
                <span className="font-semibold text-slate-800">
                  {rupiah(detail.uang_awal)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-slate-500">
                  Total Penjualan
                </span>
                <span className="font-bold text-blue-600">
                  {rupiah(detail.total_penjualan)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Status</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    detail.status === 'Aktif'
                      ? 'bg-orange-50 text-orange-600'
                      : 'bg-green-50 text-green-600'
                  }`}
                >
                  {detail.status}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 p-5">
              <button
                onClick={() => setDetail(null)}
                className="w-full rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}