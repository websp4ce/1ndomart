'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Send,
  Search,
  Plus,
  Loader2,
  Truck,
  CheckCircle2,
  Pencil,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Hash,
  Package,
  Calendar,
} from 'lucide-react';
import SidebarWarehouse from '../../components/SidebarWarehouse'; // sesuaikan path import dengan lokasi file aslimu

type StatusPengiriman = 'Dalam Proses' | 'Dikirim' | 'Terkirim';

interface Pengiriman {
  id: number;
  kodePengiriman: string;
  kodePacking: string;
  tujuan: string;
  tanggal: string;
  status: StatusPengiriman;
}

const FILTERS: Array<'Semua' | StatusPengiriman> = ['Semua', 'Dalam Proses', 'Dikirim', 'Terkirim'];

// Urutan status yang valid — dipakai buat nentuin status berikutnya pas tombol edit diklik
const STATUS_URUTAN: StatusPengiriman[] = ['Dalam Proses', 'Dikirim', 'Terkirim'];

function formatTanggal(value: string) {
  const datePart = value.slice(0, 10);
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return value;
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function StatusBadge({ status }: { status: StatusPengiriman }) {
  const map: Record<StatusPengiriman, string> = {
    'Dalam Proses': 'bg-blue-100 text-blue-600',
    Dikirim: 'bg-amber-100 text-amber-600',
    Terkirim: 'bg-emerald-100 text-emerald-600',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${map[status]}`}>
      {status}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  desc,
  barColor,
  iconBg,
  iconColor,
}: {
  icon: typeof Send;
  label: string;
  value: number;
  desc: string;
  barColor: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className={`h-1 w-full ${barColor}`} />
      <div className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
            <Icon size={16} className={iconColor} />
          </span>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
        </div>
        <p className="text-3xl font-extrabold text-slate-800">{value}</p>
        <p className="mt-1 text-xs text-slate-400">{desc}</p>
      </div>
    </div>
  );
}

export default function PengirimanBarangPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'Semua' | StatusPengiriman>('Semua');
  const [data, setData] = useState<Pengiriman[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ==== MODAL BUAT PENGIRIMAN ====
  const [showModal, setShowModal] = useState(false);
  const [kodePengiriman, setKodePengiriman] = useState('');
  const [kodePacking, setKodePacking] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));

  // hasil auto-cek kode packing
  const [ceking, setCeking] = useState(false);
  const [tujuanPreview, setTujuanPreview] = useState<string | null>(null);
  const [errorPacking, setErrorPacking] = useState('');

  const [mengirim, setMengirim] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  // ==== Ambil data list dari API ====
  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      if (filter !== 'Semua') params.set('status', filter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/warehouse/pengiriman?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil data');
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal memuat data pengiriman dari server.');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  // ==== Auto-cek kode packing (debounce) tiap kali diketik di modal ====
  useEffect(() => {
    if (!showModal) return;
    setTujuanPreview(null);
    setErrorPacking('');

    if (kodePacking.trim().length < 3) return;

    const t = setTimeout(async () => {
      setCeking(true);
      try {
        const res = await fetch(`/api/warehouse/pengiriman/lookup-packing?kode=${encodeURIComponent(kodePacking.trim())}`);
        const json = await res.json();
        if (!res.ok) {
          setErrorPacking(json.error || 'Kode packing tidak valid.');
          return;
        }
        setTujuanPreview(json.tujuan);
      } catch (err) {
        console.error(err);
        setErrorPacking('Terjadi kesalahan koneksi saat memeriksa kode packing.');
      } finally {
        setCeking(false);
      }
    }, 400);

    return () => clearTimeout(t);
  }, [kodePacking, showModal]);

  function bukaModal() {
    setKodePengiriman('');
    setKodePacking('');
    setTanggal(new Date().toISOString().slice(0, 10));
    setTujuanPreview(null);
    setErrorPacking('');
    setErrorForm('');
    setShowModal(true);
  }

  function tutupModal() {
    setShowModal(false);
  }

  async function handleSimpan() {
    setErrorForm('');

    if (!kodePengiriman.trim() || !kodePacking.trim() || !tanggal.trim()) {
      setErrorForm('Lengkapi semua data dulu ya.');
      return;
    }
    if (!tujuanPreview) {
      setErrorForm('Kode packing belum valid — tujuan belum ditemukan.');
      return;
    }

    setMengirim(true);
    try {
      const res = await fetch('/api/warehouse/pengiriman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kodePengiriman: kodePengiriman.trim(),
          kodePacking: kodePacking.trim(),
          tanggal: tanggal.trim(),
          status: 'Dalam Proses',
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorForm(json.error || 'Gagal menyimpan data pengiriman.');
        return;
      }

      await fetchData();
      tutupModal();
    } catch (err) {
      console.error(err);
      setErrorForm('Terjadi kesalahan koneksi saat menyimpan data.');
    } finally {
      setMengirim(false);
    }
  }

  // ==== Ubah status (Dalam Proses -> Dikirim -> Terkirim) ====
  async function handleEdit(p: Pengiriman) {
    const idxSekarang = STATUS_URUTAN.indexOf(p.status);
    if (idxSekarang === STATUS_URUTAN.length - 1) {
      alert('Pengiriman ini sudah "Terkirim" dan tidak bisa diubah lagi.');
      return;
    }
    const statusBerikutnya = STATUS_URUTAN[idxSekarang + 1];
    if (!window.confirm(`Ubah status ${p.kodePengiriman} menjadi "${statusBerikutnya}"?`)) return;

    try {
      const res = await fetch(`/api/warehouse/pengiriman/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusBerikutnya }),
      });
      if (!res.ok) throw new Error('Gagal memperbarui data');
      fetchData();
    } catch (err) {
      alert('Gagal memperbarui status pengiriman');
    }
  }

  async function handleDelete(p: Pengiriman) {
    if (!window.confirm(`Hapus data pengiriman ${p.kodePengiriman}?`)) return;
    try {
      const res = await fetch(`/api/warehouse/pengiriman/${p.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus data');
      fetchData();
    } catch (err) {
      alert('Gagal menghapus data pengiriman');
    }
  }

  const stats = useMemo(
    () => ({
      total: data.length,
      dalamProses: data.filter((p) => p.status === 'Dalam Proses').length,
      dikirim: data.filter((p) => p.status === 'Dikirim').length,
      terkirim: data.filter((p) => p.status === 'Terkirim').length,
    }),
    [data]
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarWarehouse />

      <main className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-blue-50 via-blue-50 to-white p-6">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-md shadow-blue-200">
            <Send size={26} className="text-white" />
          </span>

          <div>
            <p className="text-[11px] font-bold tracking-wider text-blue-600">WAREHOUSE</p>
            <h1 className="text-2xl font-extrabold text-slate-800">Pengiriman Barang</h1>
            <p className="mt-1 text-sm text-slate-500">
              Kelola pengiriman barang hasil packing ke tujuan toko.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-600">
            {errorMsg}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="relative w-full md:max-w-xs">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kode pengiriman atau tujuan..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-wrap gap-1 rounded-xl bg-slate-50 p-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filter === f ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={bukaModal}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-100 transition-colors hover:bg-blue-700"
          >
            <Plus size={16} />
            Buat Pengiriman
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Send}
            label="Total Pengiriman"
            value={stats.total}
            desc="Seluruh data pengiriman"
            barColor="bg-blue-500"
            iconBg="bg-blue-50"
            iconColor="text-blue-500"
          />
          <StatCard
            icon={Loader2}
            label="Dalam Proses"
            value={stats.dalamProses}
            desc="Sedang disiapkan"
            barColor="bg-sky-500"
            iconBg="bg-sky-50"
            iconColor="text-sky-500"
          />
          <StatCard
            icon={Truck}
            label="Dikirim"
            value={stats.dikirim}
            desc="Sedang dalam perjalanan"
            barColor="bg-amber-400"
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
          />
          <StatCard
            icon={CheckCircle2}
            label="Terkirim"
            value={stats.terkirim}
            desc="Sudah sampai tujuan"
            barColor="bg-emerald-500"
            iconBg="bg-emerald-50"
            iconColor="text-emerald-500"
          />
        </div>

        {/* Tabel */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-semibold">No</th>
                  <th className="px-5 py-3 font-semibold">Kode Pengiriman</th>
                  <th className="px-5 py-3 font-semibold">Kode Packing</th>
                  <th className="px-5 py-3 font-semibold">Tujuan</th>
                  <th className="px-5 py-3 font-semibold">Tanggal</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                      Memuat data...
                    </td>
                  </tr>
                )}

                {!loading && data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                      Tidak ada data pengiriman untuk ditampilkan
                    </td>
                  </tr>
                )}

                {!loading &&
                  data.map((p, idx) => (
                    <tr key={p.id} className="border-b border-slate-50 text-slate-700 last:border-0 hover:bg-slate-50/60">
                      <td className="px-5 py-3">{idx + 1}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{p.kodePengiriman}</td>
                      <td className="px-5 py-3 text-slate-500">{p.kodePacking}</td>
                      <td className="px-5 py-3">{p.tujuan}</td>
                      <td className="px-5 py-3">{formatTanggal(p.tanggal)}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            title="Ubah status"
                            onClick={() => handleEdit(p)}
                            className="text-blue-500 transition-colors hover:text-blue-700"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            title="Hapus"
                            onClick={() => handleDelete(p)}
                            className="text-red-500 transition-colors hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL BUAT PENGIRIMAN */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
              {/* Header dengan gradient */}
              <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 px-7 pb-8 pt-6">
                <button
                  onClick={tutupModal}
                  className="absolute right-5 top-5 rounded-full p-1.5 text-blue-100 transition hover:bg-white/15 hover:text-white"
                >
                  <X size={18} />
                </button>
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                    <Send className="text-white" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Buat Pengiriman</h2>
                    <p className="text-xs text-blue-100">Masukkan kode packing yang sudah selesai dikemas</p>
                  </div>
                </div>
              </div>

              {/* Form, ditarik naik nutupin sedikit header biar ada efek "card melayang" */}
              <div className="-mt-4 rounded-t-3xl bg-white px-7 pb-7 pt-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">
                      Kode Pengiriman
                    </label>
                    <div className="relative">
                      <Hash size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input
                        type="text"
                        value={kodePengiriman}
                        onChange={(e) => setKodePengiriman(e.target.value)}
                        placeholder="Contoh: KIR-2026-003"
                        style={{ color: '#1e293b' }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">
                      Kode Packing
                    </label>
                    <div className="relative">
                      <Package size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input
                        type="text"
                        value={kodePacking}
                        onChange={(e) => setKodePacking(e.target.value)}
                        placeholder="Contoh: PKG-2026-002"
                        style={{ color: '#1e293b' }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-9 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      />
                      {ceking && (
                        <Loader2
                          size={16}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
                        />
                      )}
                    </div>

                    {!ceking && tujuanPreview && (
                      <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-600">
                        <CheckCircle size={14} />
                        Tujuan ditemukan: <span className="font-semibold">{tujuanPreview}</span>
                      </p>
                    )}
                    {!ceking && errorPacking && (
                      <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                        <AlertCircle size={14} />
                        {errorPacking}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">
                      Tanggal
                    </label>
                    <div className="relative">
                      <Calendar size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input
                        type="date"
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                        style={{ color: '#1e293b' }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-3.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  </div>
                </div>

                {errorForm && (
                  <p className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-600">
                    {errorForm}
                  </p>
                )}

                <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-5">
                  <button
                    onClick={tutupModal}
                    disabled={mengirim}
                    className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-200 disabled:opacity-60"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSimpan}
                    disabled={mengirim || !tujuanPreview}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {mengirim ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                    Simpan Pengiriman
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}