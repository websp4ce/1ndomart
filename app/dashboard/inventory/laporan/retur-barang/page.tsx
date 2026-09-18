'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Undo2,
  Box,
  Clock,
  Loader2,
  PackageCheck,
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import SidebarInventory from '../../../components/SidebarInventory'; // sesuaikan path

type StatusRetur = 'Menunggu' | 'Diproses' | 'Selesai' | 'Dibuang';
type JenisRetur = 'ke_supplier' | 'dari_pelanggan';

type BarangRetur = {
  id: number;
  tanggal: string;
  jenis: JenisRetur;
  supplier: string | null;
  produk: string;
  productBarcode: string;
  qty: number;
  alasan: string;
  status: StatusRetur;
  catatan?: string | null;
};

const statusPill: Record<StatusRetur, string> = {
  Menunggu: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
  Diproses: 'bg-red-50 text-red-600 ring-1 ring-red-100',
  Selesai: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
  Dibuang: 'bg-purple-50 text-purple-600 ring-1 ring-purple-100',
};

const jenisPill: Record<JenisRetur, string> = {
  ke_supplier: 'bg-orange-50 text-orange-600 ring-1 ring-orange-100',
  dari_pelanggan: 'bg-blue-50 text-blue-600 ring-1 ring-blue-100',
};

const jenisLabel: Record<JenisRetur, string> = {
  ke_supplier: 'Ke Supplier',
  dari_pelanggan: 'Dari Pelanggan',
};

const STATUS_LIST: StatusRetur[] = ['Menunggu', 'Diproses', 'Selesai', 'Dibuang'];

function formatTanggal(tgl: string) {
  return new Date(tgl).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const PER_PAGE = 10;

export default function LaporanReturBarangPage() {
  const [data, setData] = useState<BarangRetur[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMuat, setErrorMuat] = useState('');

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'Semua' | StatusRetur>('Semua');
  const [page, setPage] = useState(1);

  // Halaman LAPORAN: cuma nampilin data dari database, gak ada tambah/edit/hapus.
  // Fetch dari endpoint yang sama dengan halaman manajemen Barang Retur,
  // jadi begitu ada perubahan di sana, laporan ini otomatis ikut ter-update
  // setiap kali dibuka/refresh.
  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMuat('');
    try {
      const res = await fetch('/api/inventory/barang-retur');
      const json = await res.json();
      if (!res.ok) {
        setErrorMuat(json.message || 'Gagal mengambil data laporan.');
        return;
      }
      setData(json);
    } catch (err) {
      console.error(err);
      setErrorMuat('Terjadi kesalahan koneksi saat mengambil data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = data.filter((d) => {
    const matchSearch =
      !search ||
      d.produk.toLowerCase().includes(search.toLowerCase()) ||
      (d.supplier ?? '').toLowerCase().includes(search.toLowerCase()) ||
      d.alasan.toLowerCase().includes(search.toLowerCase());

    const matchTab = tab === 'Semua' || d.status === tab;

    return matchSearch && matchTab;
  });

  const countMenunggu = data.filter((d) => d.status === 'Menunggu').length;
  const countDiproses = data.filter((d) => d.status === 'Diproses').length;
  const countSelesai = data.filter((d) => d.status === 'Selesai').length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarInventory />

      <main className="flex-1 p-6 lg:p-8">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-purple-50 to-slate-50 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/inventory/laporan"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-100 transition hover:text-purple-500"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-200">
              <Undo2 className="text-white" size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                Laporan Inventory
              </p>
              <h1 className="text-xl font-bold text-slate-800">Retur Barang</h1>
              <p className="text-sm text-slate-500">
                Data barang yang dikembalikan oleh pelanggan atau ke supplier.
              </p>
            </div>
          </div>
        </div>

        {errorMuat && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-600">
            {errorMuat}
          </div>
        )}

        {/* SEARCH + FILTER STATUS */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition focus-within:border-purple-300 focus-within:bg-white md:w-72">
              <Search size={16} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari produk, supplier, atau alasan..."
                style={{ color: '#334155' }}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap gap-1 rounded-xl bg-slate-50 p-1">
              {(['Semua', ...STATUS_LIST] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTab(t);
                    setPage(1);
                  }}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                    tab === t
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
                      : 'text-slate-500 hover:bg-white hover:text-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-purple-500" />
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                <Box className="text-purple-500" size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-500">Total Retur</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{data.length}</p>
            <p className="mt-1 text-xs text-slate-400">Seluruh data retur barang</p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-amber-500" />
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                <Clock className="text-amber-500" size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Menunggu</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{countMenunggu}</p>
            <p className="mt-1 text-xs text-slate-400">Belum ditindaklanjuti</p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-red-500" />
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                <Loader2 className="text-red-500" size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-500">Diproses</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{countDiproses}</p>
            <p className="mt-1 text-xs text-slate-400">Sedang berjalan</p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <PackageCheck className="text-emerald-500" size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Selesai</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{countSelesai}</p>
            <p className="mt-1 text-xs text-slate-400">Sudah diproses tuntas</p>
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
                  <th className="p-4 font-semibold">Jenis</th>
                  <th className="p-4 font-semibold">Supplier</th>
                  <th className="p-4 font-semibold">Produk</th>
                  <th className="p-4 font-semibold">Qty</th>
                  <th className="p-4 font-semibold">Alasan</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400">
                      <Loader2 size={18} className="mx-auto mb-2 animate-spin" />
                      Memuat laporan...
                    </td>
                  </tr>
                )}

                {!loading && paginated.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400">
                      Tidak ada data retur untuk ditampilkan
                    </td>
                  </tr>
                )}

                {!loading &&
                  paginated.map((item, idx) => (
                    <tr key={item.id} className="border-b border-slate-50 transition hover:bg-slate-50/70">
                      <td className="p-4 text-slate-500">{(page - 1) * PER_PAGE + idx + 1}</td>
                      <td className="p-4 text-slate-600">{formatTanggal(item.tanggal)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${jenisPill[item.jenis]}`}>
                          {item.jenis === 'ke_supplier' ? (
                            <ArrowUpCircle size={12} />
                          ) : (
                            <ArrowDownCircle size={12} />
                          )}
                          {jenisLabel[item.jenis]}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-700">{item.supplier ?? '—'}</td>
                      <td className="p-4 text-slate-600">{item.produk}</td>
                      <td className="p-4 font-bold text-slate-600">{item.qty}</td>
                      <td className="p-4 text-slate-500">{item.alasan}</td>
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

          {!loading && filtered.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <p className="text-xs text-slate-400">
                Menampilkan {(page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, filtered.length)} dari {filtered.length} data
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
                        p === page ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-100'
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