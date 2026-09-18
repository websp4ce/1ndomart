'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SidebarInventory from '../../../components/SidebarInventory';
import {
  ArrowLeft,
  ArrowLeftRight,
  Plus,
  Search,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  X,
  Store,
  RotateCcw,
  Send,
  Ban,
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

const FILTER_LIST = ['Semua', 'Menunggu', 'Proses', 'Selesai', 'Dibatalkan'] as const;

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
  const [menuAktif, setMenuAktif] = useState<number | null>(null);

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

  const ringkasan = useMemo(() => ({
    total: data.length,
    proses: data.filter((d) => d.status === 'Proses').length,
    selesai: data.filter((d) => d.status === 'Selesai').length,
    batal: data.filter((d) => d.status === 'Dibatalkan').length,
  }), [data]);

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

  const ubahStatus = async (id: number, status: StatusTransfer) => {
    setMenuAktif(null);
    const res = await fetch(`/api/transfer-stok/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json.message ?? 'Gagal mengubah status');
      return;
    }
    await muatTransfer();
  };

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
                  <th className="p-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400">Memuat data...</td>
                  </tr>
                )}

                {!loading && hasilFilter.map((t, idx) => (
                  <tr key={t.id} className="border-b border-slate-50 transition hover:bg-slate-50/70">
                    <td className="p-4 text-slate-500">{idx + 1}</td>
                    <td className="p-4 text-slate-500">{new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
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
                        <button onClick={() => setDetail(t)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-blue-600">
                          <Eye size={16} />
                        </button>
                        <div className="relative">
                          <button onClick={() => setMenuAktif(menuAktif === t.id ? null : t.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100">
                            <MoreVertical size={16} />
                          </button>
                          {menuAktif === t.id && (
                            <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl">
                              {t.status === 'Menunggu' && (
                                <button
                                  onClick={() => ubahStatus(t.id, 'Proses')}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] font-medium text-blue-600 transition hover:bg-blue-50"
                                >
                                  <Clock size={14} />
                                  Proses
                                </button>
                              )}
                              {t.status === 'Proses' && (
                                <button
                                  onClick={() => ubahStatus(t.id, 'Selesai')}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] font-medium text-emerald-600 transition hover:bg-emerald-50"
                                >
                                  <CheckCircle2 size={14} />
                                  Tandai Selesai
                                </button>
                              )}
                              {(t.status === 'Menunggu' || t.status === 'Proses') && (
                                <button
                                  onClick={() => ubahStatus(t.id, 'Dibatalkan')}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] font-medium text-rose-600 transition hover:bg-rose-50"
                                >
                                  <Ban size={14} />
                                  Batalkan
                                </button>
                              )}
                            </div>
                          )}
                        </div>
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
            <p className="text-xs text-slate-400">Menampilkan {hasilFilter.length} dari {data.length} data</p>
            <div className="flex items-center gap-1">
              <button className="rounded-lg border border-slate-200 p-1.5 text-slate-400 disabled:opacity-40 hover:bg-slate-50"><ChevronLeft size={16} /></button>
              <button className="h-8 w-8 rounded-lg bg-blue-600 text-xs font-semibold text-white">1</button>
              <button className="rounded-lg border border-slate-200 p-1.5 text-slate-400 disabled:opacity-40 hover:bg-slate-50"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>

        {bukaForm && (
          <ModalFormTransfer
            gudangList={gudangList}
            onTutup={() => setBukaForm(false)}
            onBerhasil={async () => { setBukaForm(false); await muatTransfer(); }}
          />
        )}

        {detail && <ModalDetail transfer={detail} onTutup={() => setDetail(null)} />}
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
  icon: React.ReactNode;
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
  const [dariGudangId, setDariGudangId] = useState<number | ''>('');
  const [cariTujuan, setCariTujuan] = useState('');
  const [stokAsal, setStokAsal] = useState<number | null>(null);
  const [jumlah, setJumlah] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [mengirim, setMengirim] = useState(false);

  const gudangCocok = gudangList.filter(
    (g) => g.id !== dariGudangId && g.nama.toLowerCase().includes(cariTujuan.trim().toLowerCase()),
  );

  // Cari produk tiap kali user ngetik (debounce sederhana)
  useEffect(() => {
    if (!cariProduk.trim() || produkDipilih) { setSaran([]); return; }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/products?cari=${encodeURIComponent(cariProduk)}`);
      setSaran(await res.json());
    }, 300);
    return () => clearTimeout(timer);
  }, [cariProduk, produkDipilih]);

  // Cek stok tiap kali produk + gudang asal berubah
  useEffect(() => {
    if (!produkDipilih || !dariGudangId) { setStokAsal(null); return; }
    (async () => {
      const res = await fetch(`/api/stok-lokasi?barcode=${produkDipilih.id}&gudang_id=${dariGudangId}`);
      const json = await res.json();
      setStokAsal(json.stok);
    })();
  }, [produkDipilih, dariGudangId]);

  const reset = () => {
    setCariProduk(''); setProdukDipilih(null);
    setDariGudangId(''); setCariTujuan('');
    setStokAsal(null); setJumlah(''); setError('');
  };

  const kirim = async () => {
    if (!produkDipilih) return setError('Pilih produk yang mau ditransfer dulu.');
    if (!dariGudangId) return setError('Pilih gudang asal.');
    if (!cariTujuan.trim()) return setError('Isi gudang atau toko tujuan.');
    if (cariTujuan.trim().toLowerCase() === gudangList.find((g) => g.id === dariGudangId)?.nama.toLowerCase()) {
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
    <div onClick={onTutup} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl shadow-slate-900/20">
        <div className="sticky top-0 z-10 bg-blue-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <ArrowLeftRight size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-white">Transfer Stok Baru</h3>
                <p className="text-[11.5px] text-blue-100">Lengkapi detail transfer di bawah ini</p>
              </div>
            </div>
            <button onClick={onTutup} className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-100 transition hover:bg-white/15 hover:text-white">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-6">
          {/* Produk */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-blue-600 text-[10.5px] font-bold text-white">1</span>
              <span className="text-[12.5px] font-semibold text-slate-700">Pilih produk</span>
            </div>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={produkDipilih ? produkDipilih.nama : cariProduk}
                onChange={(e) => { setCariProduk(e.target.value); setProdukDipilih(null); }}
                placeholder="Cari nama produk atau barcode..."
                style={{ color: '#334155' }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3 text-[12.5px] outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
              {saran.length > 0 && !produkDipilih && (
                <div className="absolute z-10 mt-1.5 max-h-44 w-full overflow-y-auto rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-200/70">
                  {saran.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setProdukDipilih(p); setCariProduk(''); setDariGudangId(''); setStokAsal(null); }}
                      className="block w-full rounded-lg px-3 py-2 text-left text-[12.5px] text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
                    >
                      {p.nama} <span className="ml-1 text-[10.5px] text-slate-400">({p.id})</span>
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
                  <p className="truncate text-[12.5px] font-semibold text-slate-700">{produkDipilih.nama}</p>
                  <p className="text-[10.5px] text-slate-400">Barcode: {produkDipilih.id}</p>
                </div>
                <button
                  onClick={() => { setProdukDipilih(null); setDariGudangId(''); setStokAsal(null); }}
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-rose-500"
                >
                  <X size={15} />
                </button>
              </div>
            )}
          </div>

          {/* Dari gudang */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-blue-600 text-[10.5px] font-bold text-white">2</span>
              <span className="text-[12.5px] font-semibold text-slate-700">Dari gudang</span>
            </div>
            <div className="relative">
              <Store size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400" />
              <select
                value={dariGudangId}
                onChange={(e) => { setDariGudangId(e.target.value ? Number(e.target.value) : ''); setCariTujuan(''); }}
                disabled={!produkDipilih}
                style={{ color: '#334155' }}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-8 text-[12.5px] outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:opacity-50"
              >
                <option value="">Pilih gudang asal</option>
                {gudangList.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
              </select>
            </div>
            {stokAsal !== null && (
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                <Package size={12} /> Stok tersedia di gudang ini: <span className="font-medium text-slate-500">{stokAsal} Pcs</span>
              </p>
            )}
          </div>

          {/* Ke gudang */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-blue-600 text-[10.5px] font-bold text-white">3</span>
              <span className="text-[12.5px] font-semibold text-slate-700">Ke gudang / toko tujuan</span>
            </div>
            <div className="relative">
              <ArrowLeftRight size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400" />
              <input
                value={cariTujuan}
                onChange={(e) => setCariTujuan(e.target.value)}
                disabled={!dariGudangId}
                placeholder="Ketik nama gudang atau toko tujuan..."
                style={{ color: '#334155' }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3 text-[12.5px] outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:opacity-50"
              />
              {cariTujuan.trim() && gudangCocok.length > 0 && (
                <div className="absolute z-10 mt-1.5 max-h-44 w-full overflow-y-auto rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-200/70">
                  {gudangCocok.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setCariTujuan(g.nama)}
                      className="block w-full rounded-lg px-3 py-2 text-left text-[12.5px] text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
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
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-blue-600 text-[10.5px] font-bold text-white">4</span>
              <span className="text-[12.5px] font-semibold text-slate-700">Jumlah transfer</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min={1}
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                style={{ color: '#334155' }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 pr-12 text-[12.5px] outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11.5px] font-medium text-slate-400">Pcs</span>
            </div>
          </div>

          {error && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[12px] font-medium text-rose-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button onClick={reset} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50">
              <RotateCcw size={15} /> Reset
            </button>
            <button
              onClick={kirim}
              disabled={mengirim}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 text-[13px] font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60"
            >
              <Send size={15} /> {mengirim ? 'Menyimpan...' : 'Simpan transfer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalDetail({ transfer, onTutup }: { transfer: Transfer; onTutup: () => void }) {
  const baris: [string, string][] = [
    ['No. transfer', transfer.no_transfer],
    ['Tanggal', new Date(transfer.tanggal).toLocaleDateString('id-ID')],
    ['Produk', `${transfer.produk} (${transfer.barcode})`],
    ['Dari', transfer.dari_gudang],
    ['Tujuan', transfer.ke_gudang],
    ['Jumlah', `${transfer.jumlah} Pcs`],
  ];

  return (
    <div onClick={onTutup} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <h3 className="text-[15px] font-semibold text-slate-900">Detail transfer</h3>
          <button onClick={onTutup} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3.5 p-6">
          {baris.map(([label, isi]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-slate-50 pb-3 text-[12.5px] last:border-0 last:pb-0">
              <span className="text-slate-400">{label}</span>
              <span className="text-right font-medium text-slate-700">{isi}</span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 pt-1 text-[12.5px]">
            <span className="text-slate-400">Status</span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_PILL[transfer.status]}`}>
              {transfer.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}