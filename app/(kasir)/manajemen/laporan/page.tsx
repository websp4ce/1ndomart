'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Printer,
  Search,
  FileText,
  ShoppingCart,
  Banknote,
  TrendingUp,
} from 'lucide-react';

import SidebarKasir from '@/app/components/SidebarKasir';
import HeaderKasir from '@/app/components/HeaderKasir';

type Laporan = {
  id: number;
  transaksi: string;
  tanggal: string;
  kasir: string;
  total: number;
  pembayaran: string;
  status: string;
};

export default function LaporanPage() {
  const [data, setData] = useState<Laporan[]>([]);
  const [search, setSearch] = useState('');
  const [periode, setPeriode] = useState('Semua');

  const ambilData = async () => {
    try {
      const res = await fetch('/api/manajemen?menu=laporan');
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

  const rupiah = (angka: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(angka) || 0);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const cocokSearch =
        item.transaksi.toLowerCase().includes(search.toLowerCase()) ||
        item.kasir.toLowerCase().includes(search.toLowerCase()) ||
        item.pembayaran.toLowerCase().includes(search.toLowerCase());

      if (!cocokSearch) return false;

      if (periode === 'Semua') return true;

      const tanggal = new Date(item.tanggal);
      const sekarang = new Date();

      if (periode === 'Hari Ini') {
        return tanggal.toDateString() === sekarang.toDateString();
      }

      if (periode === 'Bulan Ini') {
        return (
          tanggal.getMonth() === sekarang.getMonth() &&
          tanggal.getFullYear() === sekarang.getFullYear()
        );
      }

      return true;
    });
  }, [data, search, periode]);

  const totalPenjualan = filteredData.reduce(
    (total, item) => total + Number(item.total || 0),
    0
  );

  const totalTransaksi = filteredData.length;

  const rataRata =
    totalTransaksi > 0 ? totalPenjualan / totalTransaksi : 0;

  const transaksiSelesai = filteredData.filter(
    (item) => item.status === 'Selesai'
  ).length;

  const cetakLaporan = () => {
    window.print();
  };

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
                Laporan Penjualan
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Lihat dan pantau laporan transaksi penjualan
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={cetakLaporan}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <Printer size={17} />
                Cetak
              </button>

              <button
                onClick={() => alert('Fitur export akan segera tersedia.')}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-100 transition hover:bg-blue-700"
              >
                <Download size={17} />
                Export
              </button>
            </div>
          </div>

          {/* FILTER */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex gap-2">
              {['Semua', 'Hari Ini', 'Bulan Ini'].map((item) => (
                <button
                  key={item}
                  onClick={() => setPeriode(item)}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                    periode === item
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="relative w-64">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Cari transaksi / kasir..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* STATISTIK */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <TrendingUp size={20} />
              </div>

              <p className="text-sm text-slate-500">Total Penjualan</p>

              <h2 className="mt-1 text-xl font-bold text-blue-600">
                {rupiah(totalPenjualan)}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <ShoppingCart size={20} />
              </div>

              <p className="text-sm text-slate-500">Total Transaksi</p>

              <h2 className="mt-1 text-2xl font-bold text-slate-800">
                {totalTransaksi}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <Banknote size={20} />
              </div>

              <p className="text-sm text-slate-500">Rata-rata Transaksi</p>

              <h2 className="mt-1 text-xl font-bold text-green-600">
                {rupiah(rataRata)}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <FileText size={20} />
              </div>

              <p className="text-sm text-slate-500">Transaksi Selesai</p>

              <h2 className="mt-1 text-2xl font-bold text-slate-800">
                {transaksiSelesai}
              </h2>
            </div>
          </div>

          {/* TABEL */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-bold text-slate-800">
                Riwayat Penjualan
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Daftar transaksi penjualan
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-4 font-semibold text-slate-500">
                      No. Transaksi
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-500">
                      Tanggal
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-500">
                      Kasir
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-500">
                      Total
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-500">
                      Pembayaran
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-500">
                      Status
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

                      <td className="px-5 py-4 text-slate-500">
                        {item.tanggal
                          ? new Date(item.tanggal).toLocaleString('id-ID')
                          : '-'}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {item.kasir}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {rupiah(item.total)}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                          {item.pembayaran}
                        </span>
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
                    </tr>
                  ))}

                  {filteredData.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-12 text-center text-sm text-slate-400"
                      >
                        Belum ada data penjualan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}