'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Calendar,
  ArrowLeftRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import SidebarInventory from '../../../components/SidebarInventory'; // sesuaikan path

type StatusTransfer = 'Selesai' | 'Proses' | 'Menunggu' | 'Dibatalkan';

type Transfer = {
  id: number;
  no_transfer: string;
  tanggal: string;
  barcode: string;
  produk: string;
  jumlah: number;
  status: StatusTransfer;
  dari_gudang: string;
  ke_gudang: string;
};

const statusPill: Record<StatusTransfer, string> = {
  Menunggu: 'bg-amber-50 text-amber-600',
  Proses: 'bg-blue-50 text-blue-600',
  Selesai: 'bg-emerald-50 text-emerald-600',
  Dibatalkan: 'bg-rose-50 text-rose-600',
};

function formatTanggal(tgl: string) {
  return new Date(tgl).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const PER_PAGE = 10;

export default function LaporanTransferStokPage() {
  const [data, setData] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMuat, setErrorMuat] = useState('');

  const [search, setSearch] = useState('');
  const [tanggalFilter, setTanggalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [page, setPage] = useState(1);

  // Halaman LAPORAN: cuma nampilin data, tanpa kolom Aksi.
  // Data diambil dari API yang sama dengan halaman manajemen Transfer Stok,
  // jadi begitu ada transfer baru / status berubah di sana, laporan ini
  // otomatis ikut ter-update setiap kali dibuka/refresh.
  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMuat('');
    try {
      const res = await fetch('/api/transfer-stok');
      const json = await res.json();
      if (!res.ok) {
        setErrorMuat(json.message || 'Gagal mengambil data laporan.');
        return;
      }
      setData(json);
      setPage(1);
    } catch (err) {
      console.error(err);
      setErrorMuat('Terjadi kesalahan koneksi saat mengambil data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchData, 300);
    return () => clearTimeout(timeout);
  }, [fetchData]);

  // Filter dilakukan di client karena /api/transfer-stok belum punya query params
  const hasilFilter = useMemo(() => {
    const q = search.toLowerCase().trim();
    return data.filter((d) => {
      const cocokSearch =
        !q ||
        d.produk.toLowerCase().includes(q) ||
        d.no_transfer.toLowerCase().includes(q) ||
        d.dari_gudang.toLowerCase().includes(q) ||
        d.ke_gudang.toLowerCase().includes(q);
      const cocokStatus = statusFilter === 'Semua' || d.status === statusFilter;
      const cocokTanggal = !tanggalFilter || d.tanggal?.slice(0, 10) === tanggalFilter;
      return cocokSearch && cocokStatus && cocokTanggal;
    });
  }, [data, search, statusFilter, tanggalFilter]);

  const countTotal = hasilFilter.length;
  const countProses = hasilFilter.filter((d) => d.status === 'Proses').length;
  const countSelesai = hasilFilter.filter((d) => d.status === 'Selesai').length;
  const countDibatalkan = hasilFilter.filter((d) => d.status === 'Dibatalkan').length;

  const totalPages = Math.max(1, Math.ceil(hasilFilter.length / PER_PAGE));
  const paginated = hasilFilter.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarInventory />

      <main className="flex-1 p-6 lg:p-8">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-teal-50 to-slate-50 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/inventory/laporan"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-100 transition hover:text-teal-500"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-200">
              <ArrowLeftRight className="text-white" size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">
                Laporan Inventory
              </p>
              <h1 className="text-xl font-bold text-slate-800">Transfer Stok</h1>
              <p className="text-sm text-slate-500">
                Data perpindahan stok antar gudang atau toko.
              </p>
            </div>
          </div>
        </div>

        {errorMuat && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-600">
            {errorMuat}
          </div>
        )}

        {/* SEARCH + FILTER */}
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk, nomor transfer, atau gudang..."
              style={{ color: '#334155' }}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="relative">
            <Calendar
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="date"
              value={tanggalFilter}
              onChange={(e) => setTanggalFilter(e.target.value)}
              style={{ color: '#334155' }}
              className="rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 shadow-sm outline-none"
          >
            {['Semua', 'Menunggu', 'Proses', 'Selesai', 'Dibatalkan'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* STAT CARDS */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
              <ArrowLeftRight className="text-slate-500" size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Transfer</p>
              <p className="text-lg font-bold text-slate-800">{countTotal} <span className="text-xs font-normal text-slate-400">data</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
              <Clock className="text-blue-500" size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Proses</p>
              <p className="text-lg font-bold text-slate-800">{countProses} <span className="text-xs font-normal text-slate-400">data</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="text-emerald-500" size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Selesai</p>
              <p className="text-lg font-bold text-slate-800">{countSelesai} <span className="text-xs font-normal text-slate-400">data</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50">
              <XCircle className="text-rose-500" size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Dibatalkan</p>
              <p className="text-lg font-bold text-slate-800">{countDibatalkan} <span className="text-xs font-normal text-slate-400">data</span></p>
            </div>
          </div>
        </div>

        {/* TABLE (read-only, tanpa kolom Aksi) */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="p-4 font-semibold">No</th>
                  <th className="p-4 font-semibold">Tanggal</th>
                  <th className="p-4 font-semibold">No. Transfer</th>
                  <th className="p-4 font-semibold">Produk</th>
                  <th className="p-4 font-semibold">Rute</th>
                  <th className="p-4 font-semibold">Jumlah</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400">
                      <Loader2 size={18} className="mx-auto mb-2 animate-spin" />
                      Memuat laporan...
                    </td>
                  </tr>
                )}

                {!loading && paginated.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400">
                      Tidak ada data untuk ditampilkan
                    </td>
                  </tr>
                )}

                {!loading &&
                  paginated.map((item, idx) => (
                    <tr key={item.id} className="border-b border-slate-50 transition hover:bg-slate-50/70">
                      <td className="p-4 text-slate-500">{(page - 1) * PER_PAGE + idx + 1}</td>
                      <td className="p-4 text-slate-500">{formatTanggal(item.tanggal)}</td>
                      <td className="p-4 font-semibold text-teal-600">{item.no_transfer}</td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-700">{item.produk}</p>
                        <p className="text-xs text-slate-400">Barcode: {item.barcode}</p>
                      </td>
                      <td className="p-4 text-slate-500">
                        <span className="text-slate-600">{item.dari_gudang}</span>
                        <span className="mx-1.5 text-slate-300">→</span>
                        <span className="font-medium text-slate-700">{item.ke_gudang}</span>
                      </td>
                      <td className="p-4 font-medium text-slate-600">{item.jumlah} Pcs</td>
                      <td className="p-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPill[item.status]}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {!loading && hasilFilter.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <p className="text-xs text-slate-400">
                Menampilkan {(page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, hasilFilter.length)} dari {hasilFilter.length} data
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-400 disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`h-8 w-8 rounded-lg text-xs font-semibold ${
                        p === page ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-400 disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}