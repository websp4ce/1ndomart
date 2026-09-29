'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftRight, Search, Plus, Clock, Loader2, CheckCircle2,
  Eye, MoreVertical, Trash2, ChevronLeft, ChevronRight, X,
  Package, Send, RotateCcw,
} from 'lucide-react';
import SidebarWarehouse from '../../components/SidebarWarehouse';

type StatusTransfer = 'Dalam Proses' | 'Dikirim' | 'Terkirim';

interface TransferGudang {
  id: number;
  kode_transfer: string;
  tanggal: string;
  status: StatusTransfer;
  catatan: string | null;
  dari_gudang: string;
  ke_gudang: string;
  jumlah_item: number;
}

interface TransferGudangDetail extends TransferGudang {
  items: {
    id: number;
    barcode: string;
    nama_produk: string;
    qty: number;
  }[];
}

interface Gudang {
  id: number;
  nama: string;
}

interface ProdukRingkas {
  id: string;
  nama: string;
}

interface ItemForm {
  barcode: string;
  nama_produk: string;
  qty: number;
}

const FILTERS: Array<'Semua' | StatusTransfer> = [
  'Semua', 'Dalam Proses', 'Dikirim', 'Terkirim'
];

const URUTAN_STATUS: StatusTransfer[] = [
  'Dalam Proses', 'Dikirim', 'Terkirim'
];

const PER_PAGE = 10;

const arr = <T,>(json: any, keys = ['data']): T[] => {
  if (Array.isArray(json)) return json;
  for (const key of keys) {
    if (Array.isArray(json?.[key])) return json[key];
  }
  return [];
};

function StatusBadge({ status }: { status: StatusTransfer }) {
  const map: Record<StatusTransfer, string> = {
    'Dalam Proses': 'bg-amber-100 text-amber-600',
    Dikirim: 'bg-blue-100 text-blue-600',
    Terkirim: 'bg-emerald-100 text-emerald-600',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${map[status]}`}>
      {status}
    </span>
  );
}

function StatCard({
  icon: Icon, label, value, desc, barColor, iconBg, iconColor,
}: {
  icon: typeof ArrowLeftRight;
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

export default function TransferAntarGudangPage() {
  const [data, setData] = useState<TransferGudang[]>([]);
  const [gudangList, setGudangList] = useState<Gudang[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'Semua' | StatusTransfer>('Semua');
  const [page, setPage] = useState(1);
  const [bukaForm, setBukaForm] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [menuAktif, setMenuAktif] = useState<number | null>(null);

  const muatTransfer = async () => {
    try {
      const res = await fetch('/api/warehouse/transfer-gudang');
      const json = await res.json();

      if (!res.ok) {
        console.error('Gagal memuat transfer gudang:', json);
        setData([]);
        return;
      }

      setData(arr<TransferGudang>(json, ['data', 'transfers']));
    } catch (error) {
      console.error('Gagal mengambil data transfer gudang:', error);
      setData([]);
    }
  };

  const muatGudang = async () => {
    try {
      const res = await fetch('/api/warehouse/gudang');
      const json = await res.json();

      if (!res.ok) {
        console.error('Gagal memuat gudang:', json);
        setGudangList([]);
        return;
      }

      setGudangList(arr<Gudang>(json, ['data', 'gudang']));
    } catch (error) {
      console.error('Gagal mengambil data gudang:', error);
      setGudangList([]);
    }
  };

  useEffect(() => {
    Promise.all([muatTransfer(), muatGudang()]).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return data.filter((t) =>
      (!q ||
        String(t.kode_transfer ?? '').toLowerCase().includes(q) ||
        String(t.dari_gudang ?? '').toLowerCase().includes(q) ||
        String(t.ke_gudang ?? '').toLowerCase().includes(q)) &&
      (filter === 'Semua' || t.status === filter)
    );
  }, [data, search, filter]);

  const stats = useMemo(() => ({
    total: data.length,
    dalamProses: data.filter(t => t.status === 'Dalam Proses').length,
    dikirim: data.filter(t => t.status === 'Dikirim').length,
    terkirim: data.filter(t => t.status === 'Terkirim').length,
  }), [data]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const ubahStatus = async (id: number, status: StatusTransfer) => {
    setMenuAktif(null);

    try {
      const res = await fetch(`/api/warehouse/transfer-gudang/${id}`, {
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
    } catch {
      alert('Terjadi kesalahan saat mengubah status');
    }
  };

  const hapusTransfer = async (id: number) => {
    setMenuAktif(null);

    if (!confirm('Yakin mau hapus transfer ini beserta semua itemnya?')) return;

    try {
      const res = await fetch(`/api/warehouse/transfer-gudang/${id}`, {
        method: 'DELETE',
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.message ?? 'Gagal menghapus transfer');
        return;
      }

      await muatTransfer();
    } catch {
      alert('Terjadi kesalahan saat menghapus transfer');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarWarehouse />

      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-blue-50 via-blue-50 to-white p-6">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-md shadow-blue-200">
            <ArrowLeftRight size={26} className="text-white" />
          </span>
          <div>
            <p className="text-[11px] font-bold tracking-wider text-blue-600">WAREHOUSE</p>
            <h1 className="text-2xl font-extrabold text-slate-800">Transfer Antar Gudang</h1>
            <p className="mt-1 text-sm text-slate-500">
              Pindahkan stok antar gudang pusat dan cabang dengan mudah dan terpantau.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="relative w-full md:max-w-xs">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari kode transfer..."
                style={{ color: '#334155' }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-wrap gap-1 rounded-xl bg-slate-50 p-1">
              {FILTERS.map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setFilter(f);
                    setPage(1);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setBukaForm(true)}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-100 transition-colors hover:bg-blue-700"
          >
            <Plus size={16} /> Buat Transfer
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={ArrowLeftRight} label="Total Transfer" value={stats.total} desc="Seluruh data transfer gudang" barColor="bg-blue-500" iconBg="bg-blue-50" iconColor="text-blue-500" />
          <StatCard icon={Clock} label="Dalam Proses" value={stats.dalamProses} desc="Sedang disiapkan" barColor="bg-amber-400" iconBg="bg-amber-50" iconColor="text-amber-500" />
          <StatCard icon={Loader2} label="Dikirim" value={stats.dikirim} desc="Sedang dalam perjalanan" barColor="bg-sky-500" iconBg="bg-sky-50" iconColor="text-sky-500" />
          <StatCard icon={CheckCircle2} label="Terkirim" value={stats.terkirim} desc="Sudah sampai tujuan" barColor="bg-emerald-500" iconBg="bg-emerald-50" iconColor="text-emerald-500" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                  {['No', 'Kode Transfer', 'Dari Gudang', 'Ke Gudang', 'Tanggal', 'Item', 'Status', 'Aksi'].map(h => (
                    <th key={h} className={`px-5 py-3 font-semibold ${h === 'Aksi' ? 'text-center' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-slate-400">Memuat data...</td>
                  </tr>
                )}

                {!loading && paginated.map((t, idx) => (
                  <tr key={t.id} className="border-b border-slate-50 text-slate-700 last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3">{(page - 1) * PER_PAGE + idx + 1}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{t.kode_transfer}</td>
                    <td className="px-5 py-3">{t.dari_gudang}</td>
                    <td className="px-5 py-3">{t.ke_gudang}</td>
                    <td className="px-5 py-3">
                      {new Date(t.tanggal).toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-3">{t.jumlah_item} produk</td>
                    <td className="px-5 py-3"><StatusBadge status={t.status} /></td>

                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          title="Detail"
                          onClick={() => setDetailId(t.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                        >
                          <Eye size={16} />
                        </button>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setMenuAktif(menuAktif === t.id ? null : t.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {menuAktif === t.id && (
                            <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl">
                              {URUTAN_STATUS.filter(s => s !== t.status).map(s => (
                                <button
                                  key={s}
                                  onClick={() => ubahStatus(t.id, s)}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] font-medium text-blue-600 transition hover:bg-blue-50"
                                >
                                  Tandai {s}
                                </button>
                              ))}

                              <button
                                onClick={() => hapusTransfer(t.id)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] font-medium text-rose-600 transition hover:bg-rose-50"
                              >
                                <Trash2 size={14} /> Hapus
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && paginated.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                      Tidak ada data transfer untuk ditampilkan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 border-t border-slate-100 px-4 py-3">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-lg text-xs font-semibold ${
                    p === page
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {bukaForm && (
          <ModalBuatTransfer
            gudangList={gudangList}
            onTutup={() => setBukaForm(false)}
            onBerhasil={async () => {
              setBukaForm(false);
              await muatTransfer();
            }}
          />
        )}

        {detailId !== null && (
          <ModalDetail id={detailId} onTutup={() => setDetailId(null)} />
        )}
      </main>
    </div>
  );
}

function ModalBuatTransfer({
  gudangList, onTutup, onBerhasil,
}: {
  gudangList: Gudang[];
  onTutup: () => void;
  onBerhasil: () => void;
}) {
  const [dariGudangId, setDariGudangId] = useState<number | ''>('');
  const [keGudangId, setKeGudangId] = useState<number | ''>('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [catatan, setCatatan] = useState('');
  const [items, setItems] = useState<ItemForm[]>([]);
  const [cariProduk, setCariProduk] = useState('');
  const [saran, setSaran] = useState<ProdukRingkas[]>([]);
  const [error, setError] = useState('');
  const [mengirim, setMengirim] = useState(false);

  useEffect(() => {
    if (!cariProduk.trim()) {
      setSaran([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?cari=${encodeURIComponent(cariProduk)}`);
        const json = await res.json();
        setSaran(arr<ProdukRingkas>(json, ['data', 'products']));
      } catch {
        setSaran([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [cariProduk]);

  const tambahItem = (p: ProdukRingkas) => {
    if (items.some(it => it.barcode === p.id)) {
      setCariProduk('');
      setSaran([]);
      return;
    }

    setItems(prev => [...prev, { barcode: p.id, nama_produk: p.nama, qty: 1 }]);
    setCariProduk('');
    setSaran([]);
  };

  const ubahQty = (barcode: string, qty: number) =>
    setItems(prev => prev.map(it => it.barcode === barcode ? { ...it, qty } : it));

  const hapusItem = (barcode: string) =>
    setItems(prev => prev.filter(it => it.barcode !== barcode));

  const reset = () => {
    setDariGudangId('');
    setKeGudangId('');
    setCatatan('');
    setItems([]);
    setCariProduk('');
    setError('');
  };

  const kirim = async () => {
    if (!dariGudangId || !keGudangId)
      return setError('Pilih gudang asal dan tujuan dulu.');

    if (dariGudangId === keGudangId)
      return setError('Gudang asal dan tujuan tidak boleh sama.');

    if (!tanggal) return setError('Isi tanggal transfer.');
    if (!items.length) return setError('Tambahkan minimal satu produk.');
    if (items.some(it => it.qty < 1))
      return setError('Qty tiap produk minimal 1.');

    setMengirim(true);

    try {
      const res = await fetch('/api/warehouse/transfer-gudang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dari_gudang_id: dariGudangId,
          ke_gudang_id: keGudangId,
          tanggal,
          catatan,
          items,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.message ?? 'Gagal membuat transfer');
        return;
      }

      onBerhasil();
    } catch {
      setError('Terjadi kesalahan saat menyimpan transfer.');
    } finally {
      setMengirim(false);
    }
  };

  return (
    <div onClick={onTutup} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div onClick={e => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl shadow-slate-900/20">
        <div className="sticky top-0 z-10 bg-blue-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <ArrowLeftRight size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-white">Transfer Antar Gudang Baru</h3>
                <p className="text-[11.5px] text-blue-100">
                  Satu transfer bisa berisi beberapa produk sekaligus
                </p>
              </div>
            </div>
            <button onClick={onTutup} className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-100 transition hover:bg-white/15 hover:text-white">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              ['Dari gudang', dariGudangId, setDariGudangId],
              ['Ke gudang', keGudangId, setKeGudangId],
            ].map(([label, value, setter]: any, index) => (
              <div key={label}>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-slate-700">{label}</label>
                <select
                  value={value}
                  onChange={e => setter(e.target.value ? Number(e.target.value) : '')}
                  style={{ color: '#334155' }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-[12.5px] outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                >
                  <option value="">Pilih gudang {index ? 'tujuan' : 'asal'}</option>
                  {gudangList
                    .filter(g => index === 0 || g.id !== dariGudangId)
                    .map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-slate-700">Tanggal</label>
              <input
                type="date"
                value={tanggal}
                onChange={e => setTanggal(e.target.value)}
                style={{ color: '#334155' }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-[12.5px] outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-slate-700">Catatan (opsional)</label>
              <input
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                placeholder="Catatan tambahan..."
                style={{ color: '#334155' }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-[12.5px] outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-slate-700">Tambah produk</label>
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={cariProduk}
                onChange={e => setCariProduk(e.target.value)}
                placeholder="Cari nama produk atau barcode..."
                style={{ color: '#334155' }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3 text-[12.5px] outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />

              {saran.length > 0 && (
                <div className="absolute z-10 mt-1.5 max-h-44 w-full overflow-y-auto rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-200/70">
                  {saran.map(p => (
                    <button
                      key={p.id}
                      onClick={() => tambahItem(p)}
                      className="block w-full rounded-lg px-3 py-2 text-left text-[12.5px] text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
                    >
                      {p.nama}
                      <span className="ml-1 text-[10.5px] text-slate-400">({p.id})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {items.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[10.5px] uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2 font-semibold">Produk</th>
                    <th className="px-3 py-2 font-semibold">Qty</th>
                    <th className="px-3 py-2 font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {items.map(it => (
                    <tr key={it.barcode} className="border-b border-slate-50 last:border-0">
                      <td className="px-3 py-2">
                        <p className="font-medium text-slate-700">{it.nama_produk}</p>
                        <p className="text-[10.5px] text-slate-400">{it.barcode}</p>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={1}
                          value={it.qty}
                          onChange={e => ubahQty(it.barcode, Number(e.target.value))}
                          style={{ color: '#334155' }}
                          className="h-9 w-20 rounded-lg border border-slate-200 px-2 text-[12.5px] outline-none focus:border-blue-300"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => hapusItem(it.barcode)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {error && (
            <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[12px] font-medium text-rose-600">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={reset}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <RotateCcw size={15} /> Reset
            </button>
            <button
              onClick={kirim}
              disabled={mengirim}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 text-[13px] font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60"
            >
              <Send size={15} />
              {mengirim ? 'Menyimpan...' : 'Simpan transfer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalDetail({
  id, onTutup,
}: {
  id: number;
  onTutup: () => void;
}) {
  const [detail, setDetail] = useState<TransferGudangDetail | null>(null);
  const [errorMuat, setErrorMuat] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/warehouse/transfer-gudang/${id}`);
        const json = await res.json();

        if (!res.ok) {
          setErrorMuat(json.message ?? 'Gagal memuat detail transfer.');
          return;
        }

        const d = json?.data ?? json;
        setDetail({
          ...d,
          items: Array.isArray(d?.items) ? d.items : [],
        });
      } catch {
        setErrorMuat('Terjadi kesalahan koneksi saat memuat detail.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div onClick={onTutup} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div onClick={e => e.stopPropagation()} className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <h3 className="text-[15px] font-semibold text-slate-900">Detail transfer</h3>
          <button onClick={onTutup} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {loading && <p className="p-6 text-center text-sm text-slate-400">Memuat detail...</p>}

        {!loading && errorMuat && (
          <p className="p-6 text-center text-sm font-medium text-rose-500">{errorMuat}</p>
        )}

        {!loading && !errorMuat && detail && (
          <div className="space-y-4 p-6">
            <div className="space-y-3">
              {[
                ['Kode transfer', detail.kode_transfer],
                ['Tanggal', new Date(detail.tanggal).toLocaleDateString('id-ID')],
                ['Dari', detail.dari_gudang],
                ['Ke', detail.ke_gudang],
                ['Catatan', detail.catatan || '-'],
              ].map(([label, isi]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-slate-50 pb-2.5 text-[12.5px] last:border-0 last:pb-0">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-right font-medium text-slate-700">{isi}</span>
                </div>
              ))}

              <div className="flex items-center justify-between gap-4 text-[12.5px]">
                <span className="text-slate-400">Status</span>
                <StatusBadge status={detail.status} />
              </div>
            </div>

            <div>
              <p className="mb-2 text-[12px] font-semibold text-slate-600">
                Produk ({detail.items.length})
              </p>

              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-100">
                <table className="w-full text-left text-[12.5px]">
                  <tbody>
                    {detail.items.map(it => (
                      <tr key={it.id} className="border-b border-slate-50 last:border-0">
                        <td className="flex items-center gap-2.5 px-3 py-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                            <Package size={13} />
                          </span>
                          <div>
                            <p className="font-medium text-slate-700">{it.nama_produk}</p>
                            <p className="text-[10.5px] text-slate-400">{it.barcode}</p>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-slate-600">
                          {it.qty} pcs
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}