'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import SidebarInventory from '../../../components/SidebarInventory';
import {
  ArrowLeft,
  ArrowLeftRight,
  Search,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Store,
  RotateCcw,
  Send,
  Ban,
  RefreshCw,
  Loader2,
  Info,
} from 'lucide-react';

/* ---------------------------------------------------------
   TIPE
--------------------------------------------------------- */

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

type Gudang = {
  id: number;
  nama: string;
  tipe: string;
};

type ProdukRingkas = {
  id: string; // ini barcode-nya, dinamai "id" biar konsisten sama /api/products
  nama: string;
};

const STATUS_PILL: Record<StatusTransfer, string> = {
  Selesai: 'bg-emerald-50 text-emerald-600',
  Proses: 'bg-blue-50 text-blue-600',
  Menunggu: 'bg-amber-50 text-amber-600',
  Dibatalkan: 'bg-rose-50 text-rose-600',
};

const STATUS_LIST: StatusTransfer[] = ['Menunggu', 'Proses', 'Selesai', 'Dibatalkan'];
const FILTER_LIST = ['Semua', ...STATUS_LIST] as const;

// class ditulis lengkap supaya Tailwind tidak membuangnya saat build
const statusOption: Record<
  StatusTransfer,
  { desc: string; icon: typeof Clock; iconBox: string; activeCard: string; badge: string }
> = {
  Menunggu: {
    desc: 'Belum dikirim',
    icon: Clock,
    iconBox: 'bg-amber-50 text-amber-500',
    activeCard: 'border-amber-400 bg-amber-50/50',
    badge: 'bg-amber-500',
  },
  Proses: {
    desc: 'Sedang dikirim',
    icon: RefreshCw,
    iconBox: 'bg-blue-50 text-blue-500',
    activeCard: 'border-blue-400 bg-blue-50/50',
    badge: 'bg-blue-500',
  },
  Selesai: {
    desc: 'Sudah sampai tujuan',
    icon: CheckCircle2,
    iconBox: 'bg-emerald-50 text-emerald-500',
    activeCard: 'border-emerald-400 bg-emerald-50/50',
    badge: 'bg-emerald-500',
  },
  Dibatalkan: {
    desc: 'Transfer batal',
    icon: Ban,
    iconBox: 'bg-rose-50 text-rose-500',
    activeCard: 'border-rose-400 bg-rose-50/50',
    badge: 'bg-rose-500',
  },
};

// Nama gudang asal yang dikunci — semua transfer stok dianggap berasal dari sini
const NAMA_GUDANG_ASAL_DEFAULT = 'Gudang Pusat';

function formatTanggal(tgl: string) {
  return new Date(tgl).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Penjelasan efek ke stok kalau status diubah dari "lama" ke "baru"
function infoEfekStok(t: Transfer, baru: StatusTransfer): string {
  if (t.status !== 'Selesai' && baru === 'Selesai') {
    return `Stok ${t.jumlah} pcs akan dipindah dari ${t.dari_gudang} ke ${t.ke_gudang}.`;
  }
  if (t.status === 'Selesai' && baru !== 'Selesai') {
    return `Perpindahan stok dibatalkan: ${t.jumlah} pcs dikembalikan dari ${t.ke_gudang} ke ${t.dari_gudang}.`;
  }
  return 'Stok tidak berubah pada status ini.';
}

/* ---------------------------------------------------------
   KOMPONEN MODAL (dipakai bersama semua modal di halaman ini)
--------------------------------------------------------- */

const headerTone = {
  blue: { bg: 'bg-gradient-to-r from-blue-600 to-blue-500', sub: 'text-blue-100' },
  red: { bg: 'bg-gradient-to-r from-red-600 to-red-500', sub: 'text-red-100' },
};

function ModalShell({
  icon,
  title,
  subtitle,
  onClose,
  footer,
  tone = 'blue',
  maxWidth = 'max-w-[480px]',
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClose: () => void;
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

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
      {children}
    </label>
  );
}

function ErrorBox({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-600">{message}</p>
  );
}

function StatusPicker({
  value,
  onChange,
}: {
  value: StatusTransfer;
  onChange: (s: StatusTransfer) => void;
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

const btnBatal =
  'rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-60';
const btnPrimary =
  'flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-60';

/* ---------------------------------------------------------
   HALAMAN
--------------------------------------------------------- */

export default function TransferStokPage() {
  const [data, setData] = useState<Transfer[]>([]);
  const [gudangList, setGudangList] = useState<Gudang[]>([]);
  const [loading, setLoading] = useState(true);
  const [cari, setCari] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Semua' | StatusTransfer>('Semua');
  const [bukaForm, setBukaForm] = useState(false);
  const [detail, setDetail] = useState<Transfer | null>(null);

  // ==== EDIT (ubah status) ====
  const [editItem, setEditItem] = useState<Transfer | null>(null);
  const [editStatus, setEditStatus] = useState<StatusTransfer>('Menunggu');
  const [editMengirim, setEditMengirim] = useState(false);
  const [errorEdit, setErrorEdit] = useState('');

  // ==== HAPUS ====
  const [hapusItem, setHapusItem] = useState<Transfer | null>(null);
  const [menghapus, setMenghapus] = useState(false);
  const [errorHapus, setErrorHapus] = useState('');

  const muatTransfer = async () => {
    const res = await fetch('/api/transfer-stok');
    const json = await res.json();
    setData(json);
  };

  const muatGudang = async () => {
    const res = await fetch('/api/gudang');
    const json = await res.json();
    setGudangList(json);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([muatTransfer(), muatGudang()]);
      setLoading(false);
    })();
  }, []);

  const ringkasan = useMemo(
    () => ({
      total: data.length,
      proses: data.filter((d) => d.status === 'Proses').length,
      selesai: data.filter((d) => d.status === 'Selesai').length,
      batal: data.filter((d) => d.status === 'Dibatalkan').length,
    }),
    [data]
  );

  const hasilFilter = useMemo(() => {
    const q = cari.toLowerCase().trim();

    return data.filter((d) => {
      const cocokStatus = filterStatus === 'Semua' || d.status === filterStatus;
      const cocokCari =
        !q ||
        d.produk.toLowerCase().includes(q) ||
        d.no_transfer.toLowerCase().includes(q) ||
        d.dari_gudang.toLowerCase().includes(q) ||
        d.ke_gudang.toLowerCase().includes(q);

      return cocokStatus && cocokCari;
    });
  }, [data, cari, filterStatus]);

  /* ----- EDIT ----- */
  function bukaEdit(t: Transfer) {
    setEditItem(t);
    setEditStatus(t.status);
    setErrorEdit('');
  }

  function tutupEdit() {
    setEditItem(null);
    setErrorEdit('');
  }

  async function handleSimpanEdit() {
    if (!editItem) return;
    setErrorEdit('');

    if (editStatus === editItem.status) {
      tutupEdit();
      return;
    }

    setEditMengirim(true);
    try {
      const res = await fetch(`/api/transfer-stok/${editItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: editStatus }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorEdit(json.message ?? 'Gagal mengubah status.');
        return;
      }

      await muatTransfer();
      tutupEdit();
    } catch (err) {
      console.error(err);
      setErrorEdit('Terjadi kesalahan koneksi saat menyimpan perubahan.');
    } finally {
      setEditMengirim(false);
    }
  }

  /* ----- HAPUS ----- */
  function bukaHapus(t: Transfer) {
    setHapusItem(t);
    setErrorHapus('');
  }

  function tutupHapus() {
    setHapusItem(null);
    setErrorHapus('');
  }

  async function handleKonfirmasiHapus() {
    if (!hapusItem) return;
    setErrorHapus('');
    setMenghapus(true);
    try {
      const res = await fetch(`/api/transfer-stok/${hapusItem.id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorHapus(json.message ?? 'Gagal menghapus transfer.');
        return;
      }

      await muatTransfer();
      tutupHapus();
    } catch (err) {
      console.error(err);
      setErrorHapus('Terjadi kesalahan koneksi saat menghapus data.');
    } finally {
      setMenghapus(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarInventory />

      <main className="min-w-0 flex-1 p-4 md:p-8">
        {/* ================= HEADER ================= */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-blue-50 to-slate-50 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/inventory"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-100 transition hover:text-blue-600"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
              <ArrowLeftRight className="text-white" size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Stok &amp; Inventori
              </p>
              <h1 className="text-xl font-bold text-slate-800">Transfer Stok</h1>
              <p className="text-sm text-slate-500">
                Pindahkan stok antar gudang atau toko dengan mudah dan terpantau.
              </p>
            </div>
          </div>
        </div>

        {/* ================= SEARCH + FILTER + AKSI ================= */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 lg:max-w-xs">
            <Search size={16} className="text-slate-400" />
            <input
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari produk, nomor transfer, atau gudang..."
              style={{ color: '#334155' }}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {FILTER_LIST.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`rounded-lg px-3.5 py-2 text-[12.5px] font-semibold transition ${
                  filterStatus === s
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={() => setBukaForm(true)}
            className="inline-flex h-10.5 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-[13px] font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98]"
          >
            <Send size={15} strokeWidth={2.2} />
            Buat Transfer Stok
          </button>
        </div>

        {/* ================= RINGKASAN ================= */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KartuRingkasan
            warna="blue"
            icon={<Package size={17} />}
            label="Total Transfer"
            nilai={ringkasan.total}
            deskripsi="Seluruh data transfer stok"
          />
          <KartuRingkasan
            warna="amber"
            icon={<Clock size={17} />}
            label="Proses"
            nilai={ringkasan.proses}
            deskripsi="Sedang berjalan"
          />
          <KartuRingkasan
            warna="emerald"
            icon={<CheckCircle2 size={17} />}
            label="Selesai"
            nilai={ringkasan.selesai}
            deskripsi="Sudah sampai tujuan"
          />
          <KartuRingkasan
            warna="rose"
            icon={<XCircle size={17} />}
            label="Dibatalkan"
            nilai={ringkasan.batal}
            deskripsi="Transfer yang batal"
          />
        </div>

        {/* ================= TABEL ================= */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
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
                  <th className="p-4 text-center font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400">
                      Memuat data...
                    </td>
                  </tr>
                )}

                {!loading &&
                  hasilFilter.map((t, idx) => (
                    <tr key={t.id} className="border-b border-slate-50 transition hover:bg-slate-50/70">
                      <td className="p-4 text-slate-500">{idx + 1}</td>
                      <td className="p-4 text-slate-500">{formatTanggal(t.tanggal)}</td>
                      <td className="p-4 font-semibold text-blue-600">{t.no_transfer}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                            <Package size={16} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-700">{t.produk}</p>
                            <p className="text-xs text-slate-400">Barcode: {t.barcode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-500">
                        <span className="text-slate-600">{t.dari_gudang}</span>
                        <span className="mx-1.5 text-slate-300">→</span>
                        <span className="font-medium text-slate-700">{t.ke_gudang}</span>
                      </td>
                      <td className="p-4 font-medium text-slate-600">{t.jumlah} Pcs</td>
                      <td className="p-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_PILL[t.status]}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setDetail(t)}
                            title="Detail"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => bukaEdit(t)}
                            title="Edit status"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-400 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => bukaHapus(t)}
                            title="Hapus"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {!loading && hasilFilter.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400">
                      Belum ada transfer yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-400">
              Menampilkan {hasilFilter.length} dari {data.length} data
            </p>
            <div className="flex items-center gap-1">
              <button className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50 disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              <button className="h-8 w-8 rounded-lg bg-blue-600 text-xs font-semibold text-white">1</button>
              <button className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50 disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ================= MODAL BUAT TRANSFER ================= */}
        {bukaForm && (
          <ModalFormTransfer
            gudangList={gudangList}
            onTutup={() => setBukaForm(false)}
            onBerhasil={async () => {
              setBukaForm(false);
              await muatTransfer();
            }}
          />
        )}

        {/* ================= MODAL DETAIL ================= */}
        {detail && <ModalDetail transfer={detail} onTutup={() => setDetail(null)} />}

        {/* ================= MODAL EDIT STATUS ================= */}
        {editItem && (
          <ModalShell
            icon={<Pencil size={22} />}
            title="Edit Transfer Stok"
            subtitle={`Ubah status ${editItem.no_transfer}`}
            onClose={tutupEdit}
            footer={
              <>
                <button onClick={tutupEdit} disabled={editMengirim} className={btnBatal}>
                  Batal
                </button>
                <button onClick={handleSimpanEdit} disabled={editMengirim} className={btnPrimary}>
                  {editMengirim ? <Loader2 size={15} className="animate-spin" /> : <Check size={16} />}
                  {editMengirim ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </>
            }
          >
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-500 shadow-sm">
                <Package size={18} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-700">{editItem.produk}</p>
                <p className="text-xs text-slate-400">
                  {editItem.dari_gudang} → {editItem.ke_gudang} · {editItem.jumlah} Pcs
                </p>
              </div>
            </div>

            <div>
              <SectionLabel>Status</SectionLabel>
              <StatusPicker value={editStatus} onChange={setEditStatus} />
            </div>

            {editStatus !== editItem.status && (
              <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs leading-relaxed text-blue-700">
                <Info size={15} className="mt-0.5 shrink-0" />
                {infoEfekStok(editItem, editStatus)}
              </div>
            )}

            <ErrorBox message={errorEdit} />
          </ModalShell>
        )}

        {/* ================= MODAL HAPUS ================= */}
        {hapusItem && (
          <ModalShell
            icon={<Trash2 size={22} />}
            title="Hapus Transfer"
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
              Apakah kamu yakin ingin menghapus transfer{' '}
              <span className="font-semibold text-slate-700">{hapusItem.no_transfer}</span> (
              {hapusItem.produk}, {hapusItem.jumlah} Pcs)? Data yang dihapus tidak dapat dikembalikan.
            </p>

            {hapusItem.status === 'Selesai' && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-xs leading-relaxed text-amber-700">
                <Info size={15} className="mt-0.5 shrink-0" />
                Transfer ini sudah Selesai, jadi {hapusItem.jumlah} pcs akan dikembalikan dari{' '}
                {hapusItem.ke_gudang} ke {hapusItem.dari_gudang} sebelum datanya dihapus.
              </div>
            )}

            <ErrorBox message={errorHapus} />
          </ModalShell>
        )}
      </main>
    </div>
  );
}

const WARNA_KARTU = {
  blue: { bar: 'bg-blue-500', iconBg: 'bg-blue-50', iconText: 'text-blue-500', label: 'text-blue-600' },
  amber: { bar: 'bg-amber-500', iconBg: 'bg-amber-50', iconText: 'text-amber-500', label: 'text-amber-600' },
  emerald: { bar: 'bg-emerald-500', iconBg: 'bg-emerald-50', iconText: 'text-emerald-500', label: 'text-emerald-600' },
  rose: { bar: 'bg-rose-500', iconBg: 'bg-rose-50', iconText: 'text-rose-500', label: 'text-rose-600' },
} as const;

function KartuRingkasan({
  warna,
  icon,
  label,
  nilai,
  deskripsi,
}: {
  warna: keyof typeof WARNA_KARTU;
  icon: ReactNode;
  label: string;
  nilai: number;
  deskripsi: string;
}) {
  const w = WARNA_KARTU[warna];
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
      <div className={`h-1 ${w.bar}`} />
      <div className="p-4.5">
        <div className="mb-3 flex items-center gap-2.5">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${w.iconBg} ${w.iconText}`}>
            {icon}
          </div>
          <p className={`text-[11px] font-bold uppercase tracking-wider ${w.label}`}>{label}</p>
        </div>
        <p className="text-3xl font-bold leading-tight text-slate-800">{nilai}</p>
        <p className="mt-1 text-xs text-slate-400">{deskripsi}</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   MODAL FORM TRANSFER — fetch produk, gudang, & stok dari API
   "Dari gudang" dikunci otomatis ke Gudang Pusat, tidak bisa dipilih manual.
--------------------------------------------------------- */

function ModalFormTransfer({
  gudangList,
  onTutup,
  onBerhasil,
}: {
  gudangList: Gudang[];
  onTutup: () => void;
  onBerhasil: () => void;
}) {
  const [cariProduk, setCariProduk] = useState('');
  const [saran, setSaran] = useState<ProdukRingkas[]>([]);
  const [produkDipilih, setProdukDipilih] = useState<ProdukRingkas | null>(null);
  const [cariTujuan, setCariTujuan] = useState('');
  const [stokAsal, setStokAsal] = useState<number | null>(null);
  const [jumlah, setJumlah] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [mengirim, setMengirim] = useState(false);

  // Gudang asal dikunci ke "Gudang Pusat" — dicari dari daftar gudang yang sudah di-fetch
  const gudangAsal = useMemo(
    () => gudangList.find((g) => g.nama.trim().toLowerCase() === NAMA_GUDANG_ASAL_DEFAULT.toLowerCase()) ?? null,
    [gudangList]
  );
  const dariGudangId = gudangAsal?.id ?? null;

  const gudangCocok = gudangList.filter(
    (g) => g.id !== dariGudangId && g.nama.toLowerCase().includes(cariTujuan.trim().toLowerCase())
  );

  // Cari produk tiap kali user ngetik (debounce sederhana)
  useEffect(() => {
    if (!cariProduk.trim() || produkDipilih) {
      setSaran([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/products?cari=${encodeURIComponent(cariProduk)}`);
      setSaran(await res.json());
    }, 300);
    return () => clearTimeout(timer);
  }, [cariProduk, produkDipilih]);

  // Cek stok tiap kali produk dipilih (gudang asal sudah otomatis Gudang Pusat)
  useEffect(() => {
    if (!produkDipilih || !dariGudangId) {
      setStokAsal(null);
      return;
    }
    (async () => {
      const res = await fetch(`/api/stok-lokasi?barcode=${produkDipilih.id}&gudang_id=${dariGudangId}`);
      const json = await res.json();
      setStokAsal(json.stok);
    })();
  }, [produkDipilih, dariGudangId]);

  const reset = () => {
    setCariProduk('');
    setProdukDipilih(null);
    setCariTujuan('');
    setStokAsal(null);
    setJumlah('');
    setError('');
  };

  const kirim = async () => {
    if (!produkDipilih) return setError('Pilih produk yang mau ditransfer dulu.');
    if (!dariGudangId) return setError(`Gudang asal "${NAMA_GUDANG_ASAL_DEFAULT}" tidak ditemukan di data gudang.`);
    if (!cariTujuan.trim()) return setError('Isi gudang atau toko tujuan.');
    if (cariTujuan.trim().toLowerCase() === (gudangAsal?.nama ?? '').toLowerCase()) {
      return setError('Gudang asal dan tujuan tidak boleh sama.');
    }
    if (!jumlah || jumlah < 1) return setError('Isi jumlah transfer minimal 1 pcs.');
    if (stokAsal !== null && jumlah > stokAsal) return setError(`Stok tersedia hanya ${stokAsal} pcs di gudang asal.`);

    setMengirim(true);
    const res = await fetch('/api/transfer-stok', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barcode: produkDipilih.id,
        dari_gudang_id: dariGudangId,
        ke_gudang_nama: cariTujuan.trim(),
        jumlah: Number(jumlah),
      }),
    });
    const json = await res.json();
    setMengirim(false);

    if (!res.ok) return setError(json.message ?? 'Gagal membuat transfer');
    onBerhasil();
  };

  return (
    <ModalShell
      icon={<ArrowLeftRight size={22} />}
      title="Transfer Stok Baru"
      subtitle="Lengkapi detail transfer di bawah ini"
      onClose={onTutup}
      footer={
        <>
          <button onClick={reset} disabled={mengirim} className={`${btnBatal} flex items-center gap-2`}>
            <RotateCcw size={15} /> Reset
          </button>
          <button onClick={kirim} disabled={mengirim} className={btnPrimary}>
            {mengirim ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {mengirim ? 'Menyimpan...' : 'Simpan Transfer'}
          </button>
        </>
      }
    >
      {/* Produk */}
      <div>
        <SectionLabel>Produk</SectionLabel>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={produkDipilih ? produkDipilih.nama : cariProduk}
            onChange={(e) => {
              setCariProduk(e.target.value);
              setProdukDipilih(null);
            }}
            placeholder="Cari nama produk atau barcode..."
            style={{ color: '#334155' }}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          {saran.length > 0 && !produkDipilih && (
            <div className="absolute z-10 mt-1.5 max-h-44 w-full overflow-y-auto rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-200/70">
              {saran.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setProdukDipilih(p);
                    setCariProduk('');
                    setStokAsal(null);
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
                >
                  {p.nama} <span className="ml-1 text-[11px] text-slate-400">({p.id})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {produkDipilih && (
          <div className="mt-2.5 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-500 shadow-sm">
              <Package size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-700">{produkDipilih.nama}</p>
              <p className="text-[11px] text-slate-400">Barcode: {produkDipilih.id}</p>
            </div>
            <button
              onClick={() => {
                setProdukDipilih(null);
                setStokAsal(null);
              }}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-rose-500"
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Dari gudang — dikunci ke Gudang Pusat, tidak ada pilihan lain */}
      <div>
        <SectionLabel>Dari gudang</SectionLabel>
        <div className="flex w-full items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50/60 px-3.5 py-2.5 text-sm font-medium text-slate-700">
          <Store size={15} className="text-blue-500" />
          {gudangAsal ? gudangAsal.nama : `Gudang "${NAMA_GUDANG_ASAL_DEFAULT}" tidak ditemukan`}
        </div>
        {stokAsal !== null && (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
            <Package size={12} /> Stok tersedia di gudang ini:{' '}
            <span className="font-medium text-slate-500">{stokAsal} Pcs</span>
          </p>
        )}
        {!gudangAsal && (
          <p className="mt-2 text-[11px] text-rose-500">
            Pastikan ada gudang bernama "{NAMA_GUDANG_ASAL_DEFAULT}" di data gudang.
          </p>
        )}
      </div>

      {/* Ke gudang */}
      <div>
        <SectionLabel>Ke gudang / toko tujuan</SectionLabel>
        <div className="relative">
          <ArrowLeftRight size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400" />
          <input
            value={cariTujuan}
            onChange={(e) => setCariTujuan(e.target.value)}
            disabled={!produkDipilih}
            placeholder="Ketik nama gudang atau toko tujuan..."
            style={{ color: '#334155' }}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
          />
          {cariTujuan.trim() && gudangCocok.length > 0 && (
            <div className="absolute z-10 mt-1.5 max-h-44 w-full overflow-y-auto rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-200/70">
              {gudangCocok.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setCariTujuan(g.nama)}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
                >
                  {g.nama}
                </button>
              ))}
            </div>
          )}
        </div>
        {cariTujuan.trim() && gudangCocok.length === 0 && (
          <p className="mt-1.5 text-[11px] text-slate-400">
            "{cariTujuan.trim()}" belum ada di daftar gudang — akan dibuatkan otomatis saat transfer disimpan.
          </p>
        )}
      </div>

      {/* Jumlah */}
      <div>
        <SectionLabel>Jumlah transfer</SectionLabel>
        <div className="relative">
          <input
            type="number"
            min={1}
            value={jumlah}
            onChange={(e) => setJumlah(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="0"
            style={{ color: '#334155' }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-12 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">Pcs</span>
        </div>
      </div>

      <ErrorBox message={error} />
    </ModalShell>
  );
}

/* ---------------------------------------------------------
   MODAL DETAIL
--------------------------------------------------------- */

function ModalDetail({ transfer, onTutup }: { transfer: Transfer; onTutup: () => void }) {
  const baris: [string, string][] = [
    ['No. transfer', transfer.no_transfer],
    ['Tanggal', formatTanggal(transfer.tanggal)],
    ['Produk', `${transfer.produk} (${transfer.barcode})`],
    ['Dari', transfer.dari_gudang],
    ['Tujuan', transfer.ke_gudang],
    ['Jumlah', `${transfer.jumlah} Pcs`],
  ];

  return (
    <ModalShell
      icon={<Eye size={22} />}
      title="Detail Transfer"
      subtitle={transfer.no_transfer}
      onClose={onTutup}
      maxWidth="max-w-md"
      footer={
        <button onClick={onTutup} className={btnBatal}>
          Tutup
        </button>
      }
    >
      <div className="space-y-3.5">
        {baris.map(([label, isi]) => (
          <div key={label} className="flex justify-between gap-4 border-b border-slate-50 pb-3 text-sm last:border-0 last:pb-0">
            <span className="text-slate-400">{label}</span>
            <span className="text-right font-medium text-slate-700">{isi}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 pt-1 text-sm">
          <span className="text-slate-400">Status</span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_PILL[transfer.status]}`}>
            {transfer.status}
          </span>
        </div>
      </div>
    </ModalShell>
  );
}