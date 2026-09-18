'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import {
  Search,
  CalendarClock,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  X,
  Lightbulb,
  Save,
  ChevronDown,
} from 'lucide-react';
import SidebarInventory from '../../components/SidebarInventory'; // sesuaikan path sesuai lokasi asli

type BarangExpired = {
  barcode: string;
  nama: string;
  gambar: string | null;
  kategori: string;
  batch: string;
  tgl_expired: string;
  sisa_hari: number;
  status: 'Expired' | 'Hampir Expired' | 'Aman';
};

const statusPill: Record<BarangExpired['status'], string> = {
  Expired: 'bg-red-50 text-red-600 ring-1 ring-red-100',
  'Hampir Expired': 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
  Aman: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
};

function formatTanggal(tgl: string) {
  return new Date(tgl).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function BarangExpiredPage() {
  const [data, setData] = useState<BarangExpired[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'Semua' | 'Expired' | 'Hampir Expired' | 'Aman'>('Semua');
  const [editing, setEditing] = useState<BarangExpired | null>(null);
  const [newTgl, setNewTgl] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams({ search, status: tab });
      const res = await fetch(`/api/barang-expired?${params.toString()}`);
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          (json && json.message) || `Gagal memuat data (status ${res.status})`
        );
      }

      // dukung dua kemungkinan bentuk response: array langsung atau { data: [...] }
      const list: BarangExpired[] = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
        ? json.data
        : [];

      setData(list);
    } catch (err) {
      console.error(err);
      setData([]); // fallback biar .filter di bawah tidak error
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal mengambil data barang expired'
      );
    } finally {
      setLoading(false);
    }
  }, [search, tab]);

  useEffect(() => {
    const timeout = setTimeout(fetchData, 300);
    return () => clearTimeout(timeout);
  }, [fetchData]);

  const countExpired = data.filter((d) => d.status === 'Expired').length;
  const countHampir = data.filter((d) => d.status === 'Hampir Expired').length;
  const countAman = data.filter((d) => d.status === 'Aman').length;

  async function handleSimpanTanggal() {
    if (!editing || !newTgl) return;
    try {
      const res = await fetch(`/api/barang-expired/${editing.barcode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tgl_expired: newTgl }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.message ?? `Gagal update (status ${res.status})`);
      }

      setEditing(null);
      setNewTgl('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Gagal mengubah tanggal expired');
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarInventory />

      <main className="flex-1 p-6 lg:p-8">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-200">
              <CalendarClock className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Barang Expired</h1>
              <p className="text-sm text-slate-500">
                Pantau produk yang sudah atau akan melewati tanggal kedaluwarsa
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {/* ERROR BANNER */}
        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
            <AlertTriangle size={16} />
            {errorMsg}
          </div>
        )}

        {/* STAT CARDS */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-red-500" />
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                <AlertTriangle className="text-red-500" size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-500">Expired</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{countExpired}</p>
            <p className="mt-1 text-xs text-slate-400">Sudah melewati tanggal expired</p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-amber-500" />
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                <Clock className="text-amber-500" size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Hampir Expired</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{countHampir}</p>
            <p className="mt-1 text-xs text-slate-400">Kurang dari 7 hari lagi</p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <CheckCircle2 className="text-emerald-500" size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Aman</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{countAman}</p>
            <p className="mt-1 text-xs text-slate-400">Masih jauh dari tanggal expired</p>
          </div>
        </div>

        {/* SEARCH + TAB */}
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition focus-within:border-blue-300 focus-within:bg-white md:w-80">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk / kategori..."
              style={{ color: '#334155' }}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-50 p-1">
            {(['Semua', 'Expired', 'Hampir Expired', 'Aman'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  tab === t
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                    : 'text-slate-500 hover:bg-white hover:text-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="p-4 font-semibold">No</th>
                  <th className="p-4 font-semibold">Nama Produk</th>
                  <th className="p-4 font-semibold">Batch</th>
                  <th className="p-4 font-semibold">Tgl Expired</th>
                  <th className="p-4 font-semibold">Sisa Hari</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={7} className="p-10 text-center text-slate-400">Memuat data...</td></tr>
                )}
                {!loading && data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400">
                      Tidak ada data untuk ditampilkan
                    </td>
                  </tr>
                )}
                {!loading && data.map((item, idx) => (
                  <tr key={item.barcode} className="border-b border-slate-50 transition hover:bg-slate-50/70">
                    <td className="p-4 text-slate-500">{idx + 1}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-100">
                          {item.gambar && (
                            <Image src={item.gambar} alt={item.nama} fill className="object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700">{item.nama}</p>
                          <p className="text-xs text-slate-400">{item.kategori}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500">{item.batch}</td>
                    <td className="p-4">
                     <p className="font-medium text-slate-600">
  {formatTanggal(item.tgl_expired)}
</p>
                    </td>
                    <td className="p-4 font-bold text-slate-600">
                      {item.status === 'Expired' ? '-' : item.sisa_hari}
                    </td>
                    <td className="p-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPill[item.status]}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => {
                          setEditing(item);
                          setNewTgl(item.tgl_expired.slice(0, 10));
                        }}
                        className="rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-600 hover:text-white"
                      >
                        Ubah Tanggal
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TIPS FOOTER */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
            <Lightbulb className="text-blue-500" size={16} />
          </div>
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-600">Tips:</span> Segera lakukan penjualan atau
            pengecekan untuk produk yang sudah melewati tanggal expired.
          </p>
        </div>

        {/* MODAL UBAH TANGGAL */}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <div className="w-[420px] rounded-2xl bg-white p-6 shadow-2xl">
              {/* Header modal */}
              <div className="mb-5 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <CalendarClock className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">
                      Ubah Tanggal <span className="text-blue-600">Expired</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Atur kembali tanggal expired produk sesuai kebutuhan.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditing(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Kartu produk */}
              <div className="mb-5 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-slate-100">
                  {editing.gambar && (
                    <Image src={editing.gambar} alt={editing.nama} fill className="object-cover" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{editing.nama}</p>
                  <p className="text-xs text-slate-400">Batch {editing.batch}</p>
                </div>
              </div>

              {/* Input tanggal */}
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Tanggal Expired
              </label>
              <div className="relative mb-6">
                <CalendarClock
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-500"
                />
                <input
                  type="date"
                  value={newTgl}
                  onChange={(e) => setNewTgl(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 py-2.5 pl-10 pr-10 text-sm text-slate-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  onClick={() => setEditing(null)}
                  className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  onClick={handleSimpanTanggal}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 hover:bg-blue-700"
                >
                  <Save size={15} />
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}