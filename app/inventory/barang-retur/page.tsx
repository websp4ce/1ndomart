'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Search,
  Undo2,
  Truck,
  Store,
  Box,
  Hash,
  Tag,
  Clock,
  Pencil,
  Trash2,
  X,
  Send,
  Check,
  Plus,
  Minus,
  ChevronDown,
  ChevronLeft,
  ArrowRight,
  PackageCheck,
  Loader2,
  Ban,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import SidebarInventory from '../../components/SidebarInventory'; // sesuaikan path sesuai lokasi asli

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

type Produk = {
  id: string; // barcode
  nama: string;
  stok: number;
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

// class ditulis lengkap supaya Tailwind tidak membuangnya saat build
const statusOption: Record<
  StatusRetur,
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
    desc: 'Sedang berjalan',
    icon: RefreshCw,
    iconBox: 'bg-red-50 text-red-500',
    activeCard: 'border-red-400 bg-red-50/50',
    badge: 'bg-red-500',
  },
  Selesai: {
    desc: 'Sudah tuntas',
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

const jenisOption: Record<
  JenisRetur,
  { icon: typeof Truck; activeCard: string; iconBox: string }
> = {
  ke_supplier: {
    icon: Truck,
    activeCard: 'border-orange-400 bg-orange-50/50 text-orange-600',
    iconBox: 'bg-orange-50 text-orange-500',
  },
  dari_pelanggan: {
    icon: Store,
    activeCard: 'border-blue-400 bg-blue-50/50 text-blue-600',
    iconBox: 'bg-blue-50 text-blue-600',
  },
};

const ALASAN_LIST = ['Barang bocor', 'Barang rusak', 'Expired', 'Tidak sesuai', 'Salah kirim'];
const STATUS_LIST: StatusRetur[] = ['Menunggu', 'Diproses', 'Selesai', 'Dibuang'];

function formatTanggal(tgl: string) {
  return new Date(tgl).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function toDateInputValue(tgl: string) {
  // ambil YYYY-MM-DD dari string tanggal apapun formatnya
  const d = new Date(tgl);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

/* ============================================================
   KOMPONEN MODAL (dipakai bersama oleh Tambah, Edit, & Hapus)
   ============================================================ */

const headerTone = {
  blue: {
    bg: 'bg-gradient-to-r from-blue-600 to-blue-500',
    sub: 'text-blue-100',
  },
  red: {
    bg: 'bg-gradient-to-r from-red-600 to-red-500',
    sub: 'text-red-100',
  },
};

function ModalShell({
  icon,
  title,
  subtitle,
  onClose,
  onBack,
  footer,
  tone = 'blue',
  maxWidth = 'max-w-xl',
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClose: () => void;
  onBack?: () => void;
  footer?: ReactNode;
  tone?: 'blue' | 'red';
  maxWidth?: string;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className={`flex max-h-[92vh] w-full ${maxWidth} flex-col overflow-hidden rounded-3xl bg-white shadow-2xl`}>
        {/* HEADER */}
        <div className={`relative shrink-0 overflow-hidden px-6 py-5 ${headerTone[tone].bg}`}>
          <div className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-12 right-16 h-24 w-24 rounded-full bg-white/10" />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {onBack && (
                <button
                  onClick={onBack}
                  aria-label="Kembali"
                  className="-ml-2 rounded-lg p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white">
                {icon}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{title}</h2>
                <p className={`text-xs ${headerTone[tone].sub}`}>{subtitle}</p>
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
        {footer && (
          <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <label className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
      {icon}
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

function SelectField({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} appearance-none pr-9 text-slate-600`}
      >
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function StatusPicker({
  value,
  onChange,
}: {
  value: StatusRetur | '';
  onChange: (s: StatusRetur) => void;
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

function JenisToggle({
  value,
  onChange,
}: {
  value: JenisRetur;
  onChange: (j: JenisRetur) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(['ke_supplier', 'dari_pelanggan'] as JenisRetur[]).map((j) => {
        const opt = jenisOption[j];
        const Icon = opt.icon;
        const active = value === j;
        return (
          <button
            key={j}
            type="button"
            onClick={() => onChange(j)}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 px-2 py-2.5 text-xs font-semibold transition ${
              active
                ? opt.activeCard
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Icon size={14} />
            {jenisLabel[j]}
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
      <span className="pr-1 text-xs font-medium text-slate-400">pcs</span>
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
      <CalendarDays size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
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

function ErrorBox({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-600">
      {message}
    </p>
  );
}

function StokPreview({
  jenis,
  stok,
  jumlah,
}: {
  jenis: JenisRetur;
  stok: number;
  jumlah: number;
}) {
  const hasil = jenis === 'ke_supplier' ? stok - jumlah : stok + jumlah;
  const warna =
    jenis === 'ke_supplier'
      ? 'border-orange-100 bg-orange-50/60 text-orange-600'
      : 'border-blue-100 bg-blue-50/60 text-blue-600';
  return (
    <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${warna}`}>
      <span className="text-xs font-semibold">Stok setelah retur</span>
      <span className="flex items-center gap-2 text-sm font-bold">
        {stok} pcs
        <ArrowRight size={14} />
        {hasil} pcs
      </span>
    </div>
  );
}

const btnBatal =
  'rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-60';
const btnPrimary =
  'flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-60';

/* ============================================================
   HALAMAN
   ============================================================ */

export default function BarangReturPage() {
  const [data, setData] = useState<BarangRetur[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [errorMuat, setErrorMuat] = useState('');

  const [produkList, setProdukList] = useState<Produk[]>([]);

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'Semua' | StatusRetur>('Semua');
  const [showModal, setShowModal] = useState(false);

  // step modal tambah: pilih jenis dulu, baru form
  const [step, setStep] = useState<'pilih_jenis' | 'form'>('pilih_jenis');
  const [jenis, setJenis] = useState<JenisRetur | null>(null);

  // form state (tambah)
  const [supplier, setSupplier] = useState('');
  const [produkBarcode, setProdukBarcode] = useState('');
  const [jumlah, setJumlah] = useState(1);
  const [alasan, setAlasan] = useState('');
  const [statusForm, setStatusForm] = useState<StatusRetur | ''>('');
  const [mengirim, setMengirim] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  // ==== EDIT MODAL ====
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editTanggal, setEditTanggal] = useState('');
  const [editJenis, setEditJenis] = useState<JenisRetur>('ke_supplier');
  const [editSupplier, setEditSupplier] = useState('');
  const [editProdukBarcode, setEditProdukBarcode] = useState('');
  const [editJumlah, setEditJumlah] = useState(1);
  const [editAlasan, setEditAlasan] = useState('');
  const [editStatus, setEditStatus] = useState<StatusRetur | ''>('');
  const [editCatatan, setEditCatatan] = useState('');
  const [editMengirim, setEditMengirim] = useState(false);
  const [errorEdit, setErrorEdit] = useState('');

  // ==== HAPUS MODAL ====
  const [showHapusModal, setShowHapusModal] = useState(false);
  const [hapusId, setHapusId] = useState<number | null>(null);
  const [menghapus, setMenghapus] = useState(false);
  const [showHapusSukses, setShowHapusSukses] = useState(false);

  async function ambilRetur() {
    setMemuat(true);
    setErrorMuat('');
    try {
      const res = await fetch('/api/inventory/barang-retur');
      const json = await res.json();
      if (!res.ok) {
        setErrorMuat(json.message || 'Gagal mengambil data barang retur.');
        return;
      }
      setData(json);
    } catch (err) {
      console.error(err);
      setErrorMuat('Terjadi kesalahan koneksi saat mengambil data.');
    } finally {
      setMemuat(false);
    }
  }

  async function ambilProduk() {
    try {
      const res = await fetch('/api/products');
      const json = await res.json();
      if (res.ok) {
        setProdukList(json.map((p: any) => ({ id: p.id, nama: p.nama, stok: p.stok })));
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    ambilRetur();
    ambilProduk();
  }, []);

  const filtered = useMemo(() => {
    return data.filter((d) => {
      const matchSearch =
        !search ||
        d.produk.toLowerCase().includes(search.toLowerCase()) ||
        (d.supplier ?? '').toLowerCase().includes(search.toLowerCase()) ||
        d.alasan.toLowerCase().includes(search.toLowerCase());

      const matchTab = tab === 'Semua' || d.status === tab;

      return matchSearch && matchTab;
    });
  }, [data, search, tab]);

  const countMenunggu = data.filter((d) => d.status === 'Menunggu').length;
  const countDiproses = data.filter((d) => d.status === 'Diproses').length;
  const countSelesai = data.filter((d) => d.status === 'Selesai').length;

  const produkTerpilih = produkList.find((p) => p.id === produkBarcode) || null;
  const produkTerpilihEdit = produkList.find((p) => p.id === editProdukBarcode) || null;

  // ===== TAMBAH RETUR =====
  function resetForm() {
    setSupplier('');
    setProdukBarcode('');
    setJumlah(1);
    setAlasan('');
    setStatusForm('');
    setErrorForm('');
  }

  function bukaModal() {
    setStep('pilih_jenis');
    setJenis(null);
    resetForm();
    setShowModal(true);
  }

  function tutupModal() {
    setShowModal(false);
  }

  function pilihJenis(j: JenisRetur) {
    setJenis(j);
    setStep('form');
  }

  async function handleProsesRetur() {
    setErrorForm('');

    if (!jenis) return;
    if (jenis === 'ke_supplier' && !supplier) {
      setErrorForm('Pilih supplier tujuan retur dulu.');
      return;
    }
    if (!produkBarcode || !jumlah || jumlah <= 0 || !alasan || !statusForm) {
      setErrorForm('Lengkapi semua data retur dulu ya.');
      return;
    }
    if (jenis === 'ke_supplier' && statusForm === 'Selesai' && produkTerpilih && jumlah > produkTerpilih.stok) {
      setErrorForm(`Jumlah melebihi stok yang ada (stok saat ini ${produkTerpilih.stok} pcs).`);
      return;
    }

    setMengirim(true);
    try {
      const res = await fetch('/api/inventory/barang-retur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jenis,
          supplier: jenis === 'ke_supplier' ? supplier : null,
          productBarcode: produkBarcode,
          qty: jumlah,
          alasan,
          status: statusForm,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorForm(json.message || 'Gagal mencatat retur.');
        return;
      }

      await ambilRetur();
      await ambilProduk();
      resetForm();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setErrorForm('Terjadi kesalahan koneksi saat mencatat retur.');
    } finally {
      setMengirim(false);
    }
  }

  // ===== EDIT RETUR =====
  function bukaEdit(item: BarangRetur) {
    setEditId(item.id);
    setEditTanggal(toDateInputValue(item.tanggal));
    setEditJenis(item.jenis);
    setEditSupplier(item.supplier ?? '');
    setEditProdukBarcode(item.productBarcode);
    setEditJumlah(item.qty);
    setEditAlasan(item.alasan);
    setEditStatus(item.status);
    setEditCatatan(item.catatan ?? '');
    setErrorEdit('');
    setShowEditModal(true);
  }

  function tutupEdit() {
    setShowEditModal(false);
    setEditId(null);
  }

  async function handleSimpanPerubahan() {
    setErrorEdit('');

    if (editJenis === 'ke_supplier' && !editSupplier) {
      setErrorEdit('Pilih supplier tujuan retur dulu.');
      return;
    }
    if (!editProdukBarcode || !editJumlah || editJumlah <= 0 || !editAlasan || !editStatus) {
      setErrorEdit('Lengkapi semua data retur dulu ya.');
      return;
    }
    if (editId == null) return;

    setEditMengirim(true);
    try {
      const res = await fetch(`/api/inventory/barang-retur/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal: editTanggal || undefined,
          jenis: editJenis,
          supplier: editJenis === 'ke_supplier' ? editSupplier : null,
          productBarcode: editProdukBarcode,
          qty: editJumlah,
          alasan: editAlasan,
          status: editStatus,
          catatan: editCatatan || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorEdit(json.message || 'Gagal menyimpan perubahan.');
        return;
      }

      await ambilRetur();
      await ambilProduk();
      tutupEdit();
    } catch (err) {
      console.error(err);
      setErrorEdit('Terjadi kesalahan koneksi saat menyimpan perubahan.');
    } finally {
      setEditMengirim(false);
    }
  }

  // ===== HAPUS RETUR =====
  function bukaHapus(id: number) {
    setHapusId(id);
    setShowHapusModal(true);
  }

  function tutupHapus() {
    setShowHapusModal(false);
    setHapusId(null);
  }

  async function handleKonfirmasiHapus() {
    if (hapusId == null) return;
    setMenghapus(true);
    try {
      const res = await fetch(`/api/inventory/barang-retur/${hapusId}`, {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMuat(json.message || 'Gagal menghapus data retur.');
        tutupHapus();
        return;
      }

      setData((prev) => prev.filter((d) => d.id !== hapusId));
      tutupHapus();
      setShowHapusSukses(true);
      setTimeout(() => setShowHapusSukses(false), 2500);
    } catch (err) {
      console.error(err);
      setErrorMuat('Terjadi kesalahan koneksi saat menghapus data.');
      tutupHapus();
    } finally {
      setMenghapus(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarInventory />

      <main className="flex-1 p-6 lg:p-8">
        {/* HEADER */}
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-50 to-slate-50 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-200">
              <Undo2 className="text-white" size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Stok &amp; Inventori
              </p>
              <h1 className="text-xl font-bold text-slate-800">Barang Retur</h1>
              <p className="text-sm text-slate-500">
                Catat retur ke supplier atau retur dari pelanggan/toko.
              </p>
            </div>
          </div>
        </div>

        {errorMuat && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-600">
            {errorMuat}
          </div>
        )}

        {/* SEARCH + FILTER + TOMBOL INPUT */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition focus-within:border-blue-300 focus-within:bg-white md:w-72">
              <Search size={16} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk, supplier, atau alasan..."
                style={{ color: '#334155' }}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap gap-1 rounded-xl bg-slate-50 p-1">
              {(['Semua', ...STATUS_LIST] as const).map((t) => (
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

          <button
            onClick={bukaModal}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Send size={14} />
            Catat Retur Baru
          </button>
        </div>

        {/* STAT CARDS */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-blue-500" />
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <Box className="text-blue-500" size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-500">Total Retur</span>
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

        {/* TABLE */}
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
                  <th className="p-4 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {memuat && (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-slate-400">
                      <Loader2 size={18} className="mx-auto mb-2 animate-spin" />
                      Memuat data retur...
                    </td>
                  </tr>
                )}

                {!memuat && filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-slate-400">
                      Tidak ada data retur untuk ditampilkan
                    </td>
                  </tr>
                )}

                {!memuat &&
                  filtered.map((item, idx) => (
                    <tr key={item.id} className="border-b border-slate-50 transition hover:bg-slate-50/70">
                      <td className="p-4 text-slate-500">{idx + 1}</td>
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
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => bukaEdit(item)}
                            title="Edit"
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => bukaHapus(item.id)}
                            title="Hapus"
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {!memuat && filtered.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 p-4 text-xs text-slate-400">
              <span>Menampilkan {filtered.length} dari {data.length} data</span>
            </div>
          )}
        </div>

        {/* MODAL TAMBAH RETUR */}
        {showModal && (
          <ModalShell
            icon={<Undo2 size={22} />}
            title="Retur Barang"
            subtitle={
              step === 'pilih_jenis'
                ? 'Retur ini ditujukan ke mana?'
                : jenis === 'ke_supplier'
                ? 'Kembalikan barang ke supplier'
                : 'Catat barang yang dikembalikan pelanggan ke toko'
            }
            onClose={tutupModal}
            onBack={step === 'form' ? () => setStep('pilih_jenis') : undefined}
            footer={
              step === 'form' ? (
                <>
                  <button onClick={resetForm} disabled={mengirim} className={btnBatal}>
                    Reset
                  </button>
                  <button onClick={handleProsesRetur} disabled={mengirim} className={btnPrimary}>
                    {mengirim ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    {mengirim ? 'Memproses...' : 'Proses Retur'}
                  </button>
                </>
              ) : undefined
            }
          >
            {/* STEP 1: PILIH JENIS */}
            {step === 'pilih_jenis' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  onClick={() => pilihJenis('ke_supplier')}
                  className="group flex flex-col items-start gap-3 rounded-2xl border-2 border-slate-200 p-5 text-left transition hover:border-orange-300 hover:bg-orange-50/40"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 transition group-hover:bg-orange-100">
                    <Truck size={22} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Ke Supplier</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      Toko mengembalikan barang ke supplier/distributor.
                      <span className="mt-1 block font-semibold text-orange-500">Stok berkurang saat Selesai</span>
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => pilihJenis('dari_pelanggan')}
                  className="group flex flex-col items-start gap-3 rounded-2xl border-2 border-slate-200 p-5 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
                    <Store size={22} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Dari Pelanggan</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      Pelanggan mengembalikan barang ke toko.
                      <span className="mt-1 block font-semibold text-blue-600">Stok bertambah saat Selesai</span>
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* STEP 2: FORM */}
            {step === 'form' && jenis && (
              <>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {jenis === 'ke_supplier' && (
                    <div>
                      <SectionLabel icon={<Truck size={13} className="text-blue-500" />}>Supplier</SectionLabel>
                      <input
                        type="text"
                        value={supplier}
                        onChange={(e) => setSupplier(e.target.value)}
                        placeholder="Ketik nama supplier..."
                        style={{ color: '#334155' }}
                        className={inputClass}
                      />
                    </div>
                  )}

                  <div className={jenis === 'dari_pelanggan' ? 'md:col-span-2' : ''}>
                    <SectionLabel icon={<Box size={13} className="text-blue-500" />}>Produk</SectionLabel>
                    <SelectField value={produkBarcode} onChange={setProdukBarcode}>
                      <option value="">Pilih produk...</option>
                      {produkList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nama} (stok: {p.stok})
                        </option>
                      ))}
                    </SelectField>
                  </div>

                  <div>
                    <SectionLabel icon={<Tag size={13} className="text-blue-500" />}>Alasan Retur</SectionLabel>
                    <SelectField value={alasan} onChange={setAlasan}>
                      <option value="">Pilih alasan...</option>
                      {ALASAN_LIST.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </SelectField>
                  </div>

                  <div>
                    <SectionLabel icon={<Hash size={13} className="text-blue-500" />}>Jumlah Retur</SectionLabel>
                    <QtyStepper value={jumlah} onChange={setJumlah} />
                    {jenis === 'ke_supplier' && produkTerpilih && (
                      <p className="mt-1.5 text-[11px] text-slate-400">
                        Stok saat ini: {produkTerpilih.stok} pcs
                      </p>
                    )}
                  </div>

                  {produkTerpilih && jumlah > 0 && statusForm === 'Selesai' && (
                    <div className="md:col-span-2">
                      <StokPreview jenis={jenis} stok={produkTerpilih.stok} jumlah={jumlah} />
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <SectionLabel icon={<Ban size={13} className="text-blue-500" />}>Status Retur</SectionLabel>
                    <StatusPicker value={statusForm} onChange={setStatusForm} />
                    <p className="mt-2 text-[11px] text-slate-400">
                      Stok produk baru berubah saat status Selesai.
                    </p>
                  </div>
                </div>

                <ErrorBox message={errorForm} />
              </>
            )}
          </ModalShell>
        )}

        {/* MODAL EDIT RETUR */}
        {showEditModal && (
          <ModalShell
            icon={<Pencil size={22} />}
            title="Edit Barang Retur"
            subtitle="Perbarui data retur ini"
            onClose={tutupEdit}
            footer={
              <>
                <button onClick={tutupEdit} disabled={editMengirim} className={btnBatal}>
                  Batal
                </button>
                <button onClick={handleSimpanPerubahan} disabled={editMengirim} className={btnPrimary}>
                  {editMengirim ? <Loader2 size={15} className="animate-spin" /> : <Check size={16} />}
                  {editMengirim ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </>
            }
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <SectionLabel icon={<CalendarDays size={13} className="text-blue-500" />}>Tanggal</SectionLabel>
                <DateField value={editTanggal} onChange={setEditTanggal} />
              </div>

              <div>
                <SectionLabel icon={<Undo2 size={13} className="text-blue-500" />}>Jenis</SectionLabel>
                <JenisToggle value={editJenis} onChange={setEditJenis} />
              </div>

              {editJenis === 'ke_supplier' && (
                <div>
                  <SectionLabel icon={<Truck size={13} className="text-blue-500" />}>Supplier</SectionLabel>
                  <input
                    type="text"
                    value={editSupplier}
                    onChange={(e) => setEditSupplier(e.target.value)}
                    placeholder="Ketik nama supplier..."
                    style={{ color: '#334155' }}
                    className={inputClass}
                  />
                </div>
              )}

              <div className={editJenis === 'dari_pelanggan' ? 'md:col-span-2' : ''}>
                <SectionLabel icon={<Box size={13} className="text-blue-500" />}>Produk</SectionLabel>
                <SelectField value={editProdukBarcode} onChange={setEditProdukBarcode}>
                  <option value="">Pilih produk...</option>
                  {produkList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama} (stok: {p.stok})
                    </option>
                  ))}
                </SelectField>
              </div>

              <div>
                <SectionLabel icon={<Hash size={13} className="text-blue-500" />}>Jumlah</SectionLabel>
                <QtyStepper value={editJumlah} onChange={setEditJumlah} />
                {produkTerpilihEdit && (
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Stok saat ini: {produkTerpilihEdit.stok} pcs
                  </p>
                )}
              </div>

              <div>
                <SectionLabel icon={<Tag size={13} className="text-blue-500" />}>Alasan</SectionLabel>
                <SelectField value={editAlasan} onChange={setEditAlasan}>
                  <option value="">Pilih alasan...</option>
                  {ALASAN_LIST.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </SelectField>
              </div>

              <div className="md:col-span-2">
                <SectionLabel icon={<Ban size={13} className="text-blue-500" />}>Status</SectionLabel>
                <StatusPicker value={editStatus} onChange={setEditStatus} />
                <p className="mt-2 text-[11px] text-slate-400">
                  Stok produk baru berubah saat status Selesai.
                </p>
              </div>

              <div className="md:col-span-2">
                <SectionLabel>
                  Catatan <span className="font-normal normal-case tracking-normal text-slate-400">(opsional)</span>
                </SectionLabel>
                <textarea
                  value={editCatatan}
                  onChange={(e) => setEditCatatan(e.target.value.slice(0, 200))}
                  placeholder="Tambahkan catatan jika ada..."
                  rows={2}
                  style={{ color: '#334155' }}
                  className={`${inputClass} resize-none`}
                />
                <p className="mt-1 text-right text-[11px] text-slate-400">{editCatatan.length}/200</p>
              </div>
            </div>

            <ErrorBox message={errorEdit} />
          </ModalShell>
        )}

        {/* MODAL KONFIRMASI HAPUS */}
        {showHapusModal && (
          <ModalShell
            icon={<Trash2 size={22} />}
            title="Hapus Data Retur"
            subtitle="Tindakan ini tidak bisa dibatalkan"
            tone="red"
            maxWidth="max-w-md"
            onClose={tutupHapus}
            footer={
              <>
                <button onClick={tutupHapus} disabled={menghapus} className={btnBatal}>
                  Batal
                </button>
                <button
                  onClick={handleKonfirmasiHapus}
                  disabled={menghapus}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-200 hover:bg-red-700 disabled:opacity-60"
                >
                  {menghapus ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  {menghapus ? 'Menghapus...' : 'Hapus'}
                </button>
              </>
            }
          >
            <p className="text-sm leading-relaxed text-slate-500">
              Apakah kamu yakin ingin menghapus data retur ini? Data yang dihapus tidak dapat dikembalikan.
            </p>
          </ModalShell>
        )}

        {/* TOAST SUKSES HAPUS */}
        {showHapusSukses && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600 shadow-lg">
            <CheckCircle2 size={16} />
            Data retur berhasil dihapus
            <button
              onClick={() => setShowHapusSukses(false)}
              className="ml-1 text-emerald-500 hover:text-emerald-700"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}