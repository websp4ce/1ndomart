'use client';

import { useEffect, useMemo, useState } from 'react';
import SidebarInventory from '../../components/SidebarInventory';
import {
  AlertTriangle,
  Bell,
  Boxes,
  CheckCircle2,
  ImageOff,
  Loader2,
  Minus,
  MoveRight,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';

type StatusStok = 'kritis' | 'menipis' | 'aman';

type ProdukStok = {
  id: string;
  namaProduk: string;
  kategori: string;
  stokSaatIni: number;
  stokMinimum: number;
  gambar: string | null;
};

function hitungStatus(stokSaatIni: number, stokMinimum: number): StatusStok {
  if (stokSaatIni <= stokMinimum * 0.5) return 'kritis';
  if (stokSaatIni <= stokMinimum) return 'menipis';
  return 'aman';
}

const statusConfig: Record<
  StatusStok,
  { label: string; badge: string; dot: string; bar: string; Icon: typeof AlertTriangle }
> = {
  kritis: {
    label: 'Kritis',
    badge: 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-100',
    dot: 'bg-red-500',
    bar: 'bg-gradient-to-r from-red-400 to-red-500',
    Icon: AlertTriangle,
  },
  menipis: {
    label: 'Menipis',
    badge: 'bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100',
    dot: 'bg-amber-500',
    bar: 'bg-gradient-to-r from-amber-400 to-amber-500',
    Icon: Bell,
  },
  aman: {
    label: 'Aman',
    badge: 'bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100',
    dot: 'bg-emerald-500',
    bar: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
    Icon: CheckCircle2,
  },
};

const filterOptions: { id: StatusStok | 'semua'; label: string }[] = [
  { id: 'semua', label: 'Semua' },
  { id: 'kritis', label: 'Kritis' },
  { id: 'menipis', label: 'Menipis' },
  { id: 'aman', label: 'Aman' },
];

export default function StokMinimumPage() {
  const [dataStok, setDataStok] = useState<ProdukStok[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState('');
  const [pencarian, setPencarian] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusStok | 'semua'>('semua');

  // State modal restock
  const [produkRestock, setProdukRestock] = useState<ProdukStok | null>(null);

  async function ambilData() {
    setMemuat(true);
    setError('');
    try {
      const res = await fetch('/api/inventory/stok-minimum');
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Gagal mengambil data stok minimum.');
        return;
      }

      setDataStok(data);
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan koneksi saat mengambil data.');
    } finally {
      setMemuat(false);
    }
  }

  useEffect(() => {
    ambilData();
  }, []);

  const dataDenganStatus = useMemo(
    () =>
      dataStok.map((item) => ({
        ...item,
        status: hitungStatus(item.stokSaatIni, item.stokMinimum),
      })),
    [dataStok]
  );

  const jumlahPerStatus: Record<StatusStok, number> = {
    kritis: dataDenganStatus.filter((i) => i.status === 'kritis').length,
    menipis: dataDenganStatus.filter((i) => i.status === 'menipis').length,
    aman: dataDenganStatus.filter((i) => i.status === 'aman').length,
  };

  const dataTersaring = dataDenganStatus.filter((item) => {
    const cocokPencarian =
      item.namaProduk.toLowerCase().includes(pencarian.toLowerCase()) ||
      item.kategori.toLowerCase().includes(pencarian.toLowerCase());
    const cocokFilter = filterStatus === 'semua' || item.status === filterStatus;
    return cocokPencarian && cocokFilter;
  });

  const produkPerluPerhatian = dataDenganStatus
    .filter((item) => item.status !== 'aman')
    .sort((a, b) => a.stokSaatIni / a.stokMinimum - b.stokSaatIni / b.stokMinimum);

  // Dipanggil setelah restock sukses di modal -> update stok di state tanpa reload semua
  function terapkanHasilRestock(id: string, stokBaru: number) {
    setDataStok((prev) =>
      prev.map((item) => (item.id === id ? { ...item, stokSaatIni: stokBaru } : item))
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarInventory />

      <main className="flex-1 min-w-0 px-5 py-6 md:px-8 md:py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-md shadow-blue-200/70">
              <Boxes size={21} strokeWidth={2} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800">Stok Minimum</h1>
              <p className="text-sm text-slate-400">
                Pantau produk yang hampir habis dan perlu segera diisi ulang
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={ambilData}
            disabled={memuat}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            {memuat ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* Notifikasi produk perlu perhatian */}
        {!memuat && produkPerluPerhatian.length > 0 && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5">
            <AlertTriangle size={19} strokeWidth={2} className="mt-0.5 shrink-0 text-red-500" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-red-700">
                {produkPerluPerhatian.length} produk butuh perhatian
              </p>
              <p className="mt-0.5 truncate text-xs text-red-500">
                {produkPerluPerhatian.slice(0, 3).map((p) => p.namaProduk).join(', ')}
                {produkPerluPerhatian.length > 3 &&
                  ` +${produkPerluPerhatian.length - 3} lainnya`}{' '}
                — segera lakukan restock.
              </p>
            </div>
          </div>
        )}

        {/* Stat cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(['kritis', 'menipis', 'aman'] as const).map((s) => {
            const cfg = statusConfig[s];
            return (
              <div
                key={s}
                className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100"
              >
                <div className={`absolute inset-x-0 top-0 h-1 ${cfg.bar}`} />
                <div className="mb-2 flex items-center gap-2">
                  <cfg.Icon size={16} strokeWidth={2.2} className={cfg.dot.replace('bg-', 'text-')} />
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    {cfg.label}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-slate-800">{jumlahPerStatus[s]}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {s === 'kritis' && 'Stok di bawah 50% batas minimum'}
                  {s === 'menipis' && 'Sudah menyentuh batas minimum'}
                  {s === 'aman' && 'Stok masih di atas batas minimum'}
                </p>
              </div>
            );
          })}
        </div>

        {/* Panel utama */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-100">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} strokeWidth={2} className="text-slate-400" />
              <h2 className="text-sm font-extrabold text-slate-700">
                Daftar Produk
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                  {dataTersaring.length}
                </span>
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search
                  size={16}
                  strokeWidth={2}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={pencarian}
                  onChange={(e) => setPencarian(e.target.value)}
                  placeholder="Cari produk / kategori..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                {filterOptions.map((opt) => {
                  const isActive = filterStatus === opt.id;
                  const count = opt.id === 'semua' ? dataDenganStatus.length : jumlahPerStatus[opt.id];
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFilterStatus(opt.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {opt.label}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                          isActive ? 'bg-blue-50 text-blue-600' : 'bg-white text-slate-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {memuat && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-slate-400">
              <Loader2 size={20} className="animate-spin" />
              Memuat data stok...
            </div>
          )}

          {!memuat && dataTersaring.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
              <ImageOff size={22} className="mb-1 text-slate-300" />
              <p className="text-sm font-semibold text-slate-500">
                Tidak ada produk yang cocok
              </p>
              <p className="text-xs text-slate-400">Coba ubah kata kunci atau filter status.</p>
            </div>
          )}

          {!memuat && dataTersaring.length > 0 && (
            <ul className="divide-y divide-slate-50">
              {dataTersaring.map((item) => {
                const cfg = statusConfig[item.status];
                const rasio = item.stokMinimum > 0 ? item.stokSaatIni / item.stokMinimum : 1;
                const lebarBar = Math.min(Math.max(rasio, 0.04), 1) * 100;

                return (
                  <li
                    key={item.id}
                    className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:gap-5"
                  >
                    {/* Thumbnail + status accent */}
                    <div className="flex items-center gap-3 sm:w-64 sm:shrink-0">
                      <span className={`h-9 w-1 shrink-0 rounded-full ${cfg.dot}`} />

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                        {item.gambar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.gambar}
                            alt={item.namaProduk}
                            className="h-full w-full object-contain p-1.5"
                          />
                        ) : (
                          <ImageOff size={16} className="text-slate-300" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-700">
                          {item.namaProduk}
                        </p>
                        <p className="truncate text-xs text-slate-400">{item.kategori}</p>
                      </div>
                    </div>

                    {/* Progress bar stok vs minimum */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">
                          {item.stokSaatIni} <span className="font-medium text-slate-400">pcs</span>
                        </span>
                        <span className="text-slate-400">min. {item.stokMinimum} pcs</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${cfg.bar} transition-all duration-500`}
                          style={{ width: `${lebarBar}%` }}
                        />
                      </div>
                    </div>

                    {/* Status + aksi */}
                    <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end sm:gap-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${cfg.badge}`}
                      >
                        <cfg.Icon size={12} strokeWidth={2.4} />
                        {cfg.label}
                      </span>

                      <button
                        type="button"
                        onClick={() => setProdukRestock(item)}
                        className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-blue-100 transition-colors hover:bg-blue-700"
                      >
                        <PackagePlus size={14} strokeWidth={2.2} />
                        Restock
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      {/* ================= MODAL RESTOCK ================= */}
      {produkRestock && (
        <ModalRestock
          produk={produkRestock}
          onTutup={() => setProdukRestock(null)}
          onBerhasil={terapkanHasilRestock}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   MODAL RESTOCK
--------------------------------------------------------- */

function ModalRestock({
  produk,
  onTutup,
  onBerhasil,
}: {
  produk: ProdukStok;
  onTutup: () => void;
  onBerhasil: (id: string, stokBaru: number) => void;
}) {
  const [jumlah, setJumlah] = useState(10);
  const [mengirim, setMengirim] = useState(false);
  const [error, setError] = useState('');

  const stokSetelah = produk.stokSaatIni + jumlah;
  const statusSetelah = hitungStatus(stokSetelah, produk.stokMinimum);
  const cfgSetelah = statusConfig[statusSetelah];

  const ubahJumlah = (delta: number) => {
    setJumlah((prev) => Math.max(1, prev + delta));
  };

  const kirimRestock = async () => {
    if (jumlah < 1) {
      setError('Jumlah restock minimal 1 pcs.');
      return;
    }

    setMengirim(true);
    setError('');

    try {
      const res = await fetch('/api/inventory/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: produk.id, jumlah }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Gagal melakukan restock.');
        return;
      }

      // Stok baru dari database (sumber kebenaran), bukan cuma dihitung di frontend
      onBerhasil(produk.id, data.data.stokSaatIni);
      onTutup();
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan koneksi saat restock.');
    } finally {
      setMengirim(false);
    }
  };

  return (
    <div
      onClick={onTutup}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-900/10"
      >
        {/* Header modal */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-sm shadow-blue-200/70">
              <Boxes size={18} strokeWidth={2} className="text-white" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-800">Restock Produk</h3>
              <p className="text-[11.5px] text-slate-400">Tambahkan stok untuk produk ini</p>
            </div>
          </div>

          <button
            onClick={onTutup}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">

          {/* Info produk */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-100">
              {produk.gambar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={produk.gambar}
                  alt={produk.namaProduk}
                  className="h-full w-full object-contain p-1.5"
                />
              ) : (
                <ImageOff size={18} className="text-slate-300" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-bold text-slate-800">{produk.namaProduk}</p>
              <p className="truncate text-[11.5px] text-slate-400">{produk.kategori}</p>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px]">
                <span className="flex items-center gap-1 text-slate-500">
                  <Boxes size={12} className="text-slate-400" />
                  Stok saat ini <b className="text-slate-700">{produk.stokSaatIni} pcs</b>
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <AlertTriangle size={12} className="text-amber-400" />
                  Batas minimum <b className="text-slate-700">{produk.stokMinimum} pcs</b>
                </span>
              </div>
            </div>
          </div>

          {/* Jumlah restock */}
          <div>
            <p className="mb-2 text-[12.5px] font-bold text-slate-700">Jumlah Restock</p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => ubahJumlah(-1)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                <Minus size={16} />
              </button>

              <div className="relative flex-1">
                <input
                  type="number"
                  min={1}
                  value={jumlah}
                  onChange={(e) => setJumlah(Math.max(1, Number(e.target.value) || 1))}
                  className="h-10 w-full rounded-xl border border-slate-200 text-center text-[15px] font-bold text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11.5px] text-slate-400">
                  pcs
                </span>
              </div>

              <button
                type="button"
                onClick={() => ubahJumlah(1)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Preview stok setelah restock */}
          <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <MoveRight size={15} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-blue-500">Stok setelah restock</p>
                <p className="text-[13.5px] font-bold text-slate-800">
                  {produk.stokSaatIni} pcs <span className="text-slate-400">→</span> {stokSetelah} pcs
                </p>
              </div>
            </div>

            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${cfgSetelah.badge}`}>
              <cfgSetelah.Icon size={11} strokeWidth={2.4} />
              {cfgSetelah.label}
            </span>
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-[12px] font-medium text-rose-600">
              {error}
            </p>
          )}

          {/* Tombol */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onTutup}
              disabled={mengirim}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={kirimRestock}
              disabled={mengirim}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 text-[13px] font-semibold text-white shadow-md shadow-blue-100 transition hover:bg-blue-700 disabled:opacity-60"
            >
              {mengirim ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <PackagePlus size={15} />
              )}
              Restock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}