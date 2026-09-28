'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  PackageCheck,
  Search,
  Plus,
  Loader2,
  CheckCircle2,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import SidebarWarehouse from '../../components/SidebarWarehouse'; // sesuaikan path import dengan lokasi file aslimu

// ==== Tipe data (sekarang datanya dari DB lewat /api/warehouse/packing) ====
type StatusPacking = 'Proses' | 'Selesai';

interface Packing {
  id: number;
  kodePacking: string;
  kodePicking: string;
  tanggal: string;
  status: StatusPacking;
}

interface PackingItem {
  id: number;
  barcodeProduk: string;
  namaProduk: string;
  jumlah: number;
}

interface StokUpdate {
  namaProduk: string;
  barcodeProduk: string;
  stokSebelum: number;
  stokSesudah: number;
}

const FILTERS: Array<'Semua' | StatusPacking> = ['Semua', 'Proses', 'Selesai'];

// Format 'YYYY-MM-DD' (atau ISO string) jadi "22 Sep 2026" tanpa kena geser timezone
function formatTanggal(value: string) {
  const datePart = value.slice(0, 10); // ambil YYYY-MM-DD saja
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return value;
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function StatusBadge({ status }: { status: StatusPacking }) {
  const isProses = status === 'Proses';
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
        isProses ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'
      }`}
    >
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
  icon: typeof PackageCheck;
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

export default function PackingPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'Semua' | StatusPacking>('Semua');
  const [data, setData] = useState<Packing[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ==== Detail item packing (diambil dari picking_items terkait) ====
  const [showDetail, setShowDetail] = useState(false);
  const [detailPacking, setDetailPacking] = useState<Packing | null>(null);
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [errorItems, setErrorItems] = useState('');

  // ==== Toast perubahan stok ====
  const [stokUpdates, setStokUpdates] = useState<StokUpdate[] | null>(null);

  // ==== MODAL KONFIRMASI HAPUS PACKING ====
  const [showHapusModal, setShowHapusModal] = useState(false);
  const [hapusTarget, setHapusTarget] = useState<Packing | null>(null);
  const [menghapus, setMenghapus] = useState(false);
  const [showHapusSukses, setShowHapusSukses] = useState(false);

  // ==== Ambil data dari API ====
  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      if (filter !== 'Semua') params.set('status', filter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/warehouse/packing?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil data');
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal memuat data packing dari server.');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    // debounce kecil biar tidak fetch di tiap ketikan
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  // Toast otomatis ilang setelah beberapa detik
  useEffect(() => {
    if (!stokUpdates) return;
    const t = setTimeout(() => setStokUpdates(null), 6000);
    return () => clearTimeout(t);
  }, [stokUpdates]);

  // ==== Tambah data baru (form sederhana pakai prompt, silakan ganti dengan modal) ====
  const handleAdd = async () => {
    const kodePacking = window.prompt('Kode Packing (mis. PKG-2025-006):');
    if (!kodePacking) return;
    const kodePicking = window.prompt('Kode Picking terkait (mis. PK-2025-006):');
    if (!kodePicking) return;
    const tanggal = window.prompt('Tanggal (YYYY-MM-DD):', new Date().toISOString().slice(0, 10));
    if (!tanggal) return;

    try {
      const res = await fetch('/api/warehouse/packing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kodePacking, kodePicking, tanggal, status: 'Proses' }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Gagal menambah data');
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal menambah data packing');
    }
  };

  // ==== Edit status (contoh sederhana, silakan ganti dengan modal edit) ====
  const handleEdit = async (p: Packing) => {
    const nextStatus = p.status === 'Proses' ? 'Selesai' : 'Proses';
    if (!window.confirm(`Ubah status ${p.kodePacking} menjadi "${nextStatus}"?`)) return;

    try {
      const res = await fetch(`/api/warehouse/packing/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...p, status: nextStatus }),
      });
      if (!res.ok) throw new Error('Gagal memperbarui data');

      const json = await res.json().catch(() => ({}));
      if (Array.isArray(json.stokUpdates) && json.stokUpdates.length > 0) {
        setStokUpdates(json.stokUpdates);
      }

      fetchData();
    } catch (err) {
      alert('Gagal memperbarui data packing');
    }
  };

  // ==== Hapus data (pakai modal konfirmasi custom) ====
  function bukaHapus(p: Packing) {
    setHapusTarget(p);
    setShowHapusModal(true);
  }

  function tutupHapus() {
    setShowHapusModal(false);
    setHapusTarget(null);
  }

  async function handleKonfirmasiHapus() {
    if (!hapusTarget) return;
    setMenghapus(true);
    try {
      const res = await fetch(`/api/warehouse/packing/${hapusTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus data');

      setData((prev) => prev.filter((d) => d.id !== hapusTarget.id));
      tutupHapus();
      setShowHapusSukses(true);
      setTimeout(() => setShowHapusSukses(false), 2500);
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus data packing');
      tutupHapus();
    } finally {
      setMenghapus(false);
    }
  }

  // ==== Buka detail item packing (dari picking_items terkait) ====
  const bukaDetail = async (p: Packing) => {
    setDetailPacking(p);
    setShowDetail(true);
    setLoadingItems(true);
    setErrorItems('');
    try {
      const res = await fetch(`/api/warehouse/packing/${p.id}/items`);
      const json = await res.json();
      if (!res.ok) {
        setErrorItems(json.error || 'Gagal mengambil item packing.');
        return;
      }
      setItems(json.data);
    } catch (err) {
      console.error(err);
      setErrorItems('Terjadi kesalahan koneksi saat mengambil item.');
    } finally {
      setLoadingItems(false);
    }
  };

  const tutupDetail = () => {
    setShowDetail(false);
    setDetailPacking(null);
    setItems([]);
  };

  const stats = useMemo(
    () => ({
      total: data.length,
      proses: data.filter((p) => p.status === 'Proses').length,
      selesai: data.filter((p) => p.status === 'Selesai').length,
    }),
    [data]
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar warehouse (sudah dibuat sebelumnya) */}
      <SidebarWarehouse />

      {/* Konten utama */}
      <main className="flex-1 space-y-6 p-6">
        {/* Header — font & style disamakan dengan halaman Picking (font-bold, bukan font-extrabold) */}
        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-blue-50 via-blue-50 to-white p-6">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-md shadow-blue-200">
            <PackageCheck size={26} className="text-white" />
          </span>

          <div>
            <p className="text-[11px] font-bold tracking-wider text-blue-600">WAREHOUSE</p>
            <h1 className="text-2xl font-bold text-slate-800">Packing</h1>
            <p className="mt-1 text-sm text-slate-500">
              Kelola daftar packing barang hasil picking sebelum dikirim.
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="relative w-full md:max-w-xs">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kode packing..."
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
            onClick={handleAdd}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-100 transition-colors hover:bg-blue-700"
          >
            <Plus size={16} />
            Buat Packing
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={PackageCheck}
            label="Total Packing"
            value={stats.total}
            desc="Seluruh data packing"
            barColor="bg-blue-500"
            iconBg="bg-blue-50"
            iconColor="text-blue-500"
          />
          <StatCard
            icon={Loader2}
            label="Diproses"
            value={stats.proses}
            desc="Sedang dikemas"
            barColor="bg-orange-500"
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
          />
          <StatCard
            icon={CheckCircle2}
            label="Selesai"
            value={stats.selesai}
            desc="Siap lanjut ke pengiriman"
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
                  <th className="px-5 py-3 font-semibold">Kode Packing</th>
                  <th className="px-5 py-3 font-semibold">Picking</th>
                  <th className="px-5 py-3 font-semibold">Tanggal</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                      Memuat data...
                    </td>
                  </tr>
                )}

                {!loading && errorMsg && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-red-400">
                      {errorMsg}
                    </td>
                  </tr>
                )}

                {!loading &&
                  !errorMsg &&
                  data.map((p, idx) => (
                    <tr
                      key={p.id}
                      onClick={() => bukaDetail(p)}
                      className="cursor-pointer border-b border-slate-50 text-slate-700 last:border-0 hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-3">{idx + 1}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{p.kodePacking}</td>
                      <td className="px-5 py-3">{p.kodePicking}</td>
                      <td className="px-5 py-3">{formatTanggal(p.tanggal)}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => handleEdit(p)}
                            className="text-blue-500 transition-colors hover:text-blue-700"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            title="Hapus"
                            onClick={() => bukaHapus(p)}
                            className="text-red-500 transition-colors hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {!loading && !errorMsg && data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                      Tidak ada data packing untuk ditampilkan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL DETAIL ITEM PACKING (diambil dari picking_items) */}
        {showDetail && detailPacking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-100 p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <PackageCheck className="text-blue-600" size={20} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Detail Packing</h2>
                    <p className="text-xs text-slate-400">
                      {detailPacking.kodePacking} &middot; dari {detailPacking.kodePicking} &middot;{' '}
                      {formatTanggal(detailPacking.tanggal)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={tutupDetail}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {loadingItems && (
                  <div className="p-8 text-center text-sm text-slate-400">
                    <Loader2 size={18} className="mx-auto mb-2 animate-spin" />
                    Memuat item...
                  </div>
                )}

                {!loadingItems && errorItems && (
                  <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{errorItems}</p>
                )}

                {!loadingItems && !errorItems && items.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                    Tidak ada produk pada picking ini.
                  </div>
                )}

                {!loadingItems && !errorItems && items.length > 0 && (
                  <div className="overflow-hidden rounded-xl border border-slate-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-400">
                          <th className="p-3 font-semibold">Produk</th>
                          <th className="p-3 font-semibold">Barcode</th>
                          <th className="p-3 font-semibold">Jumlah</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it) => (
                          <tr key={it.id} className="border-b border-slate-50 last:border-0">
                            <td className="p-3 font-medium text-slate-700">{it.namaProduk}</td>
                            <td className="p-3 text-slate-500">{it.barcodeProduk}</td>
                            <td className="p-3 text-slate-700">{it.jumlah}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t border-slate-100 p-4">
                <button
                  onClick={tutupDetail}
                  className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL KONFIRMASI HAPUS PACKING */}
        {showHapusModal && hapusTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                    <Trash2 className="text-red-500" size={18} />
                  </div>
                  <h2 className="text-base font-bold text-slate-800">Hapus Data Packing</h2>
                </div>
                <button
                  onClick={tutupHapus}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="mb-6 text-sm text-slate-500">
                Apakah kamu yakin ingin menghapus data packing{' '}
                <span className="font-semibold text-slate-700">{hapusTarget.kodePacking}</span>? Data yang dihapus
                tidak dapat dikembalikan.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={tutupHapus}
                  disabled={menghapus}
                  className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-200 disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  onClick={handleKonfirmasiHapus}
                  disabled={menghapus}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-red-200 hover:bg-red-700 disabled:opacity-60"
                >
                  {menghapus ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TOAST SUKSES HAPUS */}
        {showHapusSukses && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600 shadow-lg">
            <CheckCircle2 size={16} />
            Data packing berhasil dihapus
            <button
              onClick={() => setShowHapusSukses(false)}
              className="ml-1 text-emerald-500 hover:text-emerald-700"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* TOAST PERUBAHAN STOK */}
        {stokUpdates && stokUpdates.length > 0 && (
          <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm rounded-2xl border border-emerald-100 bg-white p-4 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                <CheckCircle2 size={16} />
                Stok produk diperbarui
              </div>
              <button
                onClick={() => setStokUpdates(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            </div>
            <ul className="space-y-1 text-sm text-slate-600">
              {stokUpdates.map((u) => (
                <li key={u.barcodeProduk} className="flex items-center justify-between">
                  <span>{u.namaProduk}</span>
                  <span className="font-semibold text-slate-800">
                    {u.stokSebelum} <span className="text-slate-400">&rarr;</span> {u.stokSesudah}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}