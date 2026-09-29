'use client';

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import Image from 'next/image';
import {
  Search,
  Plus,
  Minus,
  Package,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Pencil,
  X,
  Check,
  Clock,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import SidebarInventory from '../../components/SidebarInventory'; // sesuaikan path

type Status = 'Menunggu' | 'Diproses' | 'Selesai' | 'Dibuang';

type BarangRusak = {
  id: number;
  tanggal: string;
  barcode: string;
  nama: string;
  gambar: string | null;
  kategori: string;
  qty: number;
  keterangan: string;
  status: Status;
};

type ProdukOption = {
  id: string; // barcode
  nama: string;
};

const STATUS_LIST: Status[] = ['Menunggu', 'Diproses', 'Selesai', 'Dibuang'];

const statusPill: Record<Status, string> = {
  Menunggu: 'bg-amber-50 text-amber-600',
  Diproses: 'bg-red-50 text-red-500',
  Selesai: 'bg-emerald-50 text-emerald-600',
  Dibuang: 'bg-purple-50 text-purple-600',
};

// class ditulis lengkap supaya Tailwind tidak membuangnya saat build
const statusOption: Record<
  Status,
  {
    desc: string;
    icon: typeof Clock;
    iconBox: string;
    activeCard: string;
    badge: string;
  }
> = {
  Menunggu: {
    desc: 'Belum ditangani',
    icon: Clock,
    iconBox: 'bg-amber-50 text-amber-500',
    activeCard: 'border-amber-400 bg-amber-50/50',
    badge: 'bg-amber-500',
  },
  Diproses: {
    desc: 'Sedang ditangani',
    icon: RefreshCw,
    iconBox: 'bg-red-50 text-red-500',
    activeCard: 'border-red-400 bg-red-50/50',
    badge: 'bg-red-500',
  },
  Selesai: {
    desc: 'Sudah beres',
    icon: CheckCircle2,
    iconBox: 'bg-emerald-50 text-emerald-500',
    activeCard: 'border-emerald-400 bg-emerald-50/50',
    badge: 'bg-emerald-500',
  },
  Dibuang: {
    desc: 'Tidak bisa dipakai',
    icon: Trash2,
    iconBox: 'bg-purple-50 text-purple-500',
    activeCard: 'border-purple-400 bg-purple-50/50',
    badge: 'bg-purple-500',
  },
};

function formatTanggal(tgl: string) {
  return new Date(tgl).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const PER_PAGE = 5;

/* ============================================================
   KOMPONEN MODAL (dipakai bersama oleh Tambah & Edit)
   ============================================================ */

function ModalShell({
  icon,
  title,
  subtitle,
  onClose,
  footer,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-[480px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5">
          <div className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-12 right-16 h-24 w-24 rounded-full bg-white/10" />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white">
                {icon}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{title}</h2>
                <p className="text-xs text-blue-100">{subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">{children}</div>

        {/* FOOTER */}
        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
          {footer}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
      {children}
    </label>
  );
}

function StatusPicker({
  value,
  onChange,
}: {
  value: Status;
  onChange: (s: Status) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {STATUS_LIST.map((s) => {
        const opt = statusOption[s];
        const Icon = opt.icon;
        const active = value === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={`relative flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${
              active
                ? opt.activeCard
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${opt.iconBox}`}>
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700">{s}</p>
              <p className="truncate text-[11px] text-slate-400">{opt.desc}</p>
            </div>
            {active && (
              <span
                className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-white ${opt.badge}`}
              >
                <Check size={12} strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function QtyStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="px-3 py-3 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        aria-label="Kurangi"
      >
        <Minus size={14} />
      </button>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ color: '#334155' }}
        className="w-full min-w-0 bg-transparent py-2.5 text-center text-sm font-semibold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="px-3 py-3 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        aria-label="Tambah"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function DateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <Calendar size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ color: '#334155' }}
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

function ErrorBox({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-600">
      {message}
    </p>
  );
}

/* ============================================================
   HALAMAN
   ============================================================ */

export default function BarangRusakPage() {
  const [data, setData] = useState<BarangRusak[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tanggalFilter, setTanggalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [page, setPage] = useState(1);

  const [produkOptions, setProdukOptions] = useState<ProdukOption[]>([]);

  // ==== TAMBAH MODAL ====
  const [showModal, setShowModal] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState('');
  const [form, setForm] = useState({
    barcode: '',
    tanggal: '',
    qty: 1,
    keterangan: '',
    status: 'Menunggu' as Status,
  });

  // ==== EDIT MODAL ====
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editProduk, setEditProduk] = useState<{ nama: string; kategori: string } | null>(null);
  const [editTanggal, setEditTanggal] = useState('');
  const [editQty, setEditQty] = useState(1);
  const [editKeterangan, setEditKeterangan] = useState('');
  const [editStatus, setEditStatus] = useState<Status>('Menunggu');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        tanggal: tanggalFilter,
      });
      const res = await fetch(`/api/barang-rusak?${params.toString()}`);
      const json = await res.json();
      setData(json);
      setPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, tanggalFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchData, 300);
    return () => clearTimeout(timeout);
  }, [fetchData]);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((json) =>
        setProdukOptions(json.map((p: { id: string; nama: string }) => ({ id: p.id, nama: p.nama })))
      )
      .catch(console.error);
  }, []);

  const countTotal = data.length;
  const countMenunggu = data.filter((d) => d.status === 'Menunggu').length;
  const countSelesai = data.filter((d) => d.status === 'Selesai').length;
  const countDibuang = data.filter((d) => d.status === 'Dibuang').length;

  const totalPages = Math.max(1, Math.ceil(data.length / PER_PAGE));
  const paginated = data.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ===== TAMBAH BARANG RUSAK =====
  function bukaTambah() {
    setAddError('');
    setShowModal(true);
  }

  function tutupTambah() {
    setShowModal(false);
    setAddError('');
  }

  async function handleTambahData() {
    setAddError('');

    if (!form.barcode || !form.tanggal || !form.keterangan) {
      setAddError('Produk, tanggal, dan keterangan wajib diisi.');
      return;
    }
    if (form.qty <= 0) {
      setAddError('Qty minimal 1.');
      return;
    }

    setAddSubmitting(true);
    try {
      const res = await fetch('/api/barang-rusak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setAddError(json?.message ?? 'Gagal menambahkan data.');
        return;
      }

      tutupTambah();
      setForm({ barcode: '', tanggal: '', qty: 1, keterangan: '', status: 'Menunggu' });
      fetchData();
    } catch (err) {
      console.error(err);
      setAddError('Terjadi kesalahan koneksi saat menyimpan data.');
    } finally {
      setAddSubmitting(false);
    }
  }

  async function handleHapus(id: number) {
    if (!confirm('Yakin mau menghapus data ini?')) return;
    try {
      const res = await fetch(`/api/barang-rusak/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus data');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus data');
    }
  }

  // ===== EDIT BARANG RUSAK =====
  function bukaEdit(item: BarangRusak) {
    setEditId(item.id);
    setEditProduk({ nama: item.nama, kategori: item.kategori });
    setEditTanggal(item.tanggal.slice(0, 10)); // pastikan format YYYY-MM-DD buat input date
    setEditQty(item.qty);
    setEditKeterangan(item.keterangan);
    setEditStatus(item.status);
    setEditError('');
    setShowEditModal(true);
  }

  function tutupEdit() {
    setShowEditModal(false);
    setEditId(null);
    setEditProduk(null);
  }

  async function handleSimpanEdit() {
    setEditError('');

    if (!editTanggal || !editKeterangan || editQty <= 0) {
      setEditError('Tanggal, qty, dan keterangan wajib diisi dengan benar.');
      return;
    }
    if (editId == null) return;

    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/barang-rusak/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal: editTanggal,
          qty: editQty,
          keterangan: editKeterangan,
          status: editStatus,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setEditError(json.message || 'Gagal menyimpan perubahan.');
        return;
      }

      tutupEdit();
      fetchData();
    } catch (err) {
      console.error(err);
      setEditError('Terjadi kesalahan koneksi saat menyimpan perubahan.');
    } finally {
      setEditSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarInventory />

      <main className="flex-1 p-6 lg:p-8">
        {/* HERO HEADER */}
        <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-50 via-blue-50/70 to-slate-50 p-6">
          <div className="relative z-10 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
              <AlertTriangle className="text-white" size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-500">Stok &amp; Inventori</p>
              <h1 className="text-2xl font-bold text-slate-800">Barang Rusak</h1>
              <p className="mt-1 text-sm text-slate-500">
                Berikut adalah daftar barang yang rusak atau tidak layak jual.
              </p>
            </div>
          </div>
        </div>

        {/* SEARCH + FILTER + TAMBAH */}
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk, nama, atau keterangan..."
              style={{ color: '#334155' }}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <input
            type="date"
            value={tanggalFilter}
            onChange={(e) => setTanggalFilter(e.target.value)}
            style={{ color: '#334155' }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 shadow-sm outline-none"
          >
            {['Semua', ...STATUS_LIST].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <button
            onClick={bukaTambah}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 hover:bg-blue-700"
          >
            <Plus size={16} />
            Input Barang Rusak
          </button>
        </div>

        {/* STAT CARDS */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
              <Package className="text-slate-500" size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Barang Rusak</p>
              <p className="text-lg font-bold text-slate-800">
                {countTotal} <span className="text-xs font-normal text-slate-400">item</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="text-red-500" size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Menunggu Penanganan</p>
              <p className="text-lg font-bold text-slate-800">
                {countMenunggu} <span className="text-xs font-normal text-slate-400">item</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="text-emerald-500" size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Sudah Diproses</p>
              <p className="text-lg font-bold text-slate-800">
                {countSelesai} <span className="text-xs font-normal text-slate-400">item</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50">
              <Trash2 className="text-purple-500" size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Dibuang</p>
              <p className="text-lg font-bold text-slate-800">
                {countDibuang} <span className="text-xs font-normal text-slate-400">item</span>
              </p>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="p-4 font-semibold">No</th>
                  <th className="p-4 font-semibold">Tanggal</th>
                  <th className="p-4 font-semibold">Produk</th>
                  <th className="p-4 font-semibold">Qty</th>
                  <th className="p-4 font-semibold">Keterangan</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400">
                      Memuat data...
                    </td>
                  </tr>
                )}
                {!loading && paginated.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400">
                      Tidak ada data
                    </td>
                  </tr>
                )}
                {!loading &&
                  paginated.map((item, idx) => (
                    <tr key={item.id} className="border-b border-slate-50 transition hover:bg-slate-50/70">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">{(page - 1) * PER_PAGE + idx + 1}</span>
                          <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-100">
                            {item.gambar && (
                              <Image src={item.gambar} alt={item.nama} fill className="object-cover" />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-500">{formatTanggal(item.tanggal)}</td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-700">{item.nama}</p>
                        <p className="text-xs text-slate-400">{item.kategori}</p>
                      </td>
                      <td className="p-4 font-medium text-slate-600">{item.qty}</td>
                      <td className="p-4 text-slate-500">{item.keterangan}</td>
                      <td className="p-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPill[item.status]}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => bukaEdit(item)}
                            className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleHapus(item.id)}
                            className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
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

          {/* PAGINATION */}
          {!loading && data.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <p className="text-xs text-slate-400">
                Menampilkan {(page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, data.length)} dari {data.length} data
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-8 w-8 rounded-lg text-xs font-semibold ${
                      p === page ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL TAMBAH DATA */}
        {showModal && (
          <ModalShell
            icon={<AlertTriangle size={22} />}
            title="Tambah Barang Rusak"
            subtitle="Catat produk yang rusak atau tidak layak jual"
            onClose={tutupTambah}
            footer={
              <>
                <button
                  onClick={tutupTambah}
                  disabled={addSubmitting}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  onClick={handleTambahData}
                  disabled={addSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-60"
                >
                  <Plus size={16} />
                  {addSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </>
            }
          >
            <div>
              <SectionLabel>Produk</SectionLabel>
              <select
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                className={`${inputClass} text-slate-600`}
              >
                <option value="">Pilih produk...</option>
                {produkOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <SectionLabel>Tanggal</SectionLabel>
                <DateField value={form.tanggal} onChange={(v) => setForm({ ...form, tanggal: v })} />
              </div>
              <div>
                <SectionLabel>Qty</SectionLabel>
                <QtyStepper value={form.qty} onChange={(n) => setForm({ ...form, qty: n })} />
              </div>
            </div>

            <div>
              <SectionLabel>Keterangan</SectionLabel>
              <input
                type="text"
                value={form.keterangan}
                onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                placeholder="Contoh: Kemasan rusak, bocor, basah..."
                style={{ color: '#334155' }}
                className={inputClass}
              />
            </div>

            <div>
              <SectionLabel>Status</SectionLabel>
              <StatusPicker value={form.status} onChange={(s) => setForm({ ...form, status: s })} />
            </div>

            <ErrorBox message={addError} />
          </ModalShell>
        )}

        {/* MODAL EDIT BARANG RUSAK */}
        {showEditModal && (
          <ModalShell
            icon={<Pencil size={22} />}
            title="Edit Barang Rusak"
            subtitle="Perbarui data barang rusak ini"
            onClose={tutupEdit}
            footer={
              <>
                <button
                  onClick={tutupEdit}
                  disabled={editSubmitting}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  onClick={handleSimpanEdit}
                  disabled={editSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-60"
                >
                  <Check size={16} />
                  {editSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </>
            }
          >
            {editProduk && (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-500 shadow-sm">
                  <Package size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-700">{editProduk.nama}</p>
                  <p className="text-xs text-slate-400">{editProduk.kategori}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <SectionLabel>Tanggal</SectionLabel>
                <DateField value={editTanggal} onChange={setEditTanggal} />
              </div>
              <div>
                <SectionLabel>Qty</SectionLabel>
                <QtyStepper value={editQty} onChange={setEditQty} />
              </div>
            </div>

            <div>
              <SectionLabel>Keterangan</SectionLabel>
              <input
                type="text"
                value={editKeterangan}
                onChange={(e) => setEditKeterangan(e.target.value)}
                placeholder="Contoh: Kemasan rusak, bocor, basah..."
                style={{ color: '#334155' }}
                className={inputClass}
              />
            </div>

            <div>
              <SectionLabel>Status</SectionLabel>
              <StatusPicker value={editStatus} onChange={setEditStatus} />
            </div>

            <ErrorBox message={editError} />
          </ModalShell>
        )}
      </main>
    </div>
  );
}