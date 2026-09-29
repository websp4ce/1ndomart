'use client';

import { useEffect, useMemo, useState } from 'react';
import SidebarKasir from '@/app/components/SidebarKasir';
import {
  Download, Printer, Search, FileText, ShoppingCart, Banknote,
  TrendingUp, AlertCircle,
} from 'lucide-react';

type Laporan = {
  id: number;
  transaksi: string;
  tanggal: string;
  kasir: string;
  total: number;
  pembayaran: string;
  status: string;
};

const PERIODE = ['Semua', 'Hari Ini', 'Bulan Ini'];

const rupiah = (angka: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(angka) || 0);

const ringkas = (angka: number) =>
  new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(angka);

// Warna chip pembayaran: tunai kuning, QRIS merah, lainnya biru
const chipBayar = (p: string) => {
  const s = String(p || '').toLowerCase();
  if (s.includes('tunai') || s.includes('cash')) return 'bg-yellow-100 text-yellow-800';
  if (s.includes('qris')) return 'bg-red-50 text-red-600';
  return 'bg-blue-50 text-blue-700';
};

export default function LaporanPage() {
  const [data, setData] = useState<Laporan[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [periode, setPeriode] = useState('Semua');

  // AMBIL DATA
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/manajemen?menu=laporan', { cache: 'no-store' });
        const hasil = await res.json();
        if (!res.ok) throw new Error(hasil.error || 'Gagal mengambil data laporan.');
        setData(Array.isArray(hasil) ? hasil : []);
      } catch (e: any) {
        setError(e.message || 'Gagal terhubung ke server.');
      } finally {
        setMemuat(false);
      }
    })();
  }, []);

  // FILTER PERIODE + SEARCH
  const filtered = useMemo(() => {
    const kw = search.toLowerCase();
    const sekarang = new Date();

    return data.filter((i) => {
      const cocok = [i.transaksi, i.kasir, i.pembayaran].some((v) =>
        String(v || '').toLowerCase().includes(kw)
      );
      if (!cocok) return false;
      if (periode === 'Semua') return true;

      const t = new Date(i.tanggal);
      if (periode === 'Hari Ini') return t.toDateString() === sekarang.toDateString();
      return t.getMonth() === sekarang.getMonth() && t.getFullYear() === sekarang.getFullYear();
    });
  }, [data, search, periode]);

  // STATISTIK
  const totalPenjualan = filtered.reduce((t, i) => t + Number(i.total || 0), 0);
  const totalTransaksi = filtered.length;
  const rataRata = totalTransaksi ? totalPenjualan / totalTransaksi : 0;
  const selesai = filtered.filter((i) => i.status === 'Selesai').length;

  // GRAFIK: penjualan per hari (7 hari terakhir yang ada datanya)
  const grafik = useMemo(() => {
    const perHari: Record<string, number> = {};
    filtered.forEach((i) => {
      if (!i.tanggal) return;
      const k = new Date(i.tanggal).toLocaleDateString('en-CA');
      perHari[k] = (perHari[k] || 0) + Number(i.total || 0);
    });
    return Object.entries(perHari)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([tgl, total]) => ({ tgl, total }));
  }, [filtered]);

  const maks = Math.max(...grafik.map((g) => g.total), 1);

  // EXPORT CSV
  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const kolom = ['No. Transaksi', 'Tanggal', 'Kasir', 'Total', 'Pembayaran', 'Status'];
    const baris = filtered.map((i) =>
      [
        i.transaksi,
        i.tanggal ? new Date(i.tanggal).toLocaleString('id-ID') : '',
        i.kasir,
        i.total,
        i.pembayaran,
        i.status,
      ]
        .map(esc)
        .join(';')
    );
    const csv = '\uFEFF' + [kolom.map(esc).join(';'), ...baris].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-penjualan-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statKecil = [
    { icon: ShoppingCart, warna: 'bg-red-600', label: 'Total transaksi', nilai: totalTransaksi },
    { icon: Banknote, warna: 'bg-yellow-400 !text-blue-900', label: 'Rata-rata transaksi', nilai: rupiah(rataRata) },
    { icon: FileText, warna: 'bg-blue-700', label: 'Transaksi selesai', nilai: selesai },
  ];

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar disembunyikan saat dicetak */}
      <div className="contents print:hidden">
        <SidebarKasir />
      </div>

      <main className="min-w-0 flex-1 px-5 py-8 md:px-10 print:p-0">
        <div className="mx-auto max-w-6xl">
          {/* ================= JUDUL ================= */}
          <header className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-blue-900">Laporan Penjualan</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Pantau transaksi penjualan Indomart berdasarkan periode.
              </p>
              <p className="mt-1 hidden text-xs text-slate-400 print:block">
                Dicetak pada {new Date().toLocaleString('id-ID')} · Periode: {periode}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 print:hidden">
              {/* Pilihan periode */}
              <div className="flex rounded-xl bg-slate-100 p-1">
                {PERIODE.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriode(p)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      periode === p
                        ? 'bg-blue-700 text-white shadow'
                        : 'text-slate-500 hover:text-blue-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <Printer size={17} />
                Cetak
              </button>

              <button
                onClick={exportCsv}
                disabled={filtered.length === 0}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-100 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={17} />
                Export CSV
              </button>
            </div>
          </header>

          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* ================= RINGKASAN + GRAFIK ================= */}
          <section className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Kartu besar: total + grafik */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.05)] lg:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Total penjualan</p>
                  <p className="mt-1 text-4xl font-bold tracking-tight text-blue-900">
                    {memuat ? '...' : rupiah(totalPenjualan)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 shadow-md shadow-blue-100">
                  <TrendingUp size={22} className="text-white" />
                </div>
              </div>

              {/* Grafik batang per hari */}
              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold text-slate-500">Penjualan per hari</p>

                {grafik.length === 0 ? (
                  <div className="flex h-40 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
                    Belum ada data untuk ditampilkan
                  </div>
                ) : (
                  <div className="flex h-44 items-end gap-3 border-b border-slate-200 px-1">
                    {grafik.map((g) => {
                      const tertinggi = g.total === maks;
                      return (
                        <div
                          key={g.tgl}
                          title={`${g.tgl}: ${rupiah(g.total)}`}
                          className="flex h-full flex-1 flex-col items-center justify-end"
                        >
                          <span className="mb-1 text-[11px] font-semibold text-slate-500">{ringkas(g.total)}</span>
                          <div
                            className={`w-full max-w-[56px] rounded-t-lg ${tertinggi ? 'bg-yellow-400' : 'bg-blue-700'}`}
                            style={{ height: `${Math.max((g.total / maks) * 78, 4)}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {grafik.length > 0 && (
                  <div className="mt-2 flex gap-3 px-1">
                    {grafik.map((g) => (
                      <span key={g.tgl} className="flex-1 text-center text-[11px] text-slate-400">
                        {new Date(g.tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tiga statistik kecil dalam satu kartu */}
            <div className="flex flex-col divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
              {statKecil.map(({ icon: Icon, warna, label, nilai }) => (
                <div key={label} className="flex flex-1 items-center gap-4 p-5">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${warna}`}>
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="truncate text-xl font-bold text-blue-900">{nilai}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ================= TABEL ================= */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-blue-900">Riwayat penjualan</h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  {filtered.length} transaksi · periode {periode.toLowerCase()}
                </p>
              </div>

              <div className="relative w-full md:w-80 print:hidden">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari transaksi, kasir, pembayaran..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-blue-900 text-sm text-white">
                    {['No. transaksi', 'Tanggal', 'Kasir', 'Pembayaran', 'Status'].map((h) => (
                      <th key={h} className="px-5 py-3.5 font-semibold">{h}</th>
                    ))}
                    <th className="px-5 py-3.5 text-right font-semibold">Total</th>
                  </tr>
                </thead>

                <tbody>
                  {memuat &&
                    [0, 1, 2, 3].map((i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td colSpan={6} className="px-5 py-4">
                          <div className="flex animate-pulse items-center gap-4">
                            <div className="h-3 w-32 rounded bg-slate-100" />
                            <div className="h-3 w-24 rounded bg-slate-100" />
                            <div className="ml-auto h-3 w-20 rounded bg-slate-100" />
                          </div>
                        </td>
                      </tr>
                    ))}

                  {!memuat &&
                    filtered.map((i) => (
                      <tr key={i.id} className="border-b border-slate-100 transition hover:bg-blue-50/40">
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-sm font-semibold text-blue-800">
                          {i.transaksi}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                          {i.tanggal
                            ? new Date(i.tanggal).toLocaleString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">{i.kasir}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${chipBayar(i.pembayaran)}`}>
                            {i.pembayaran}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                              i.status === 'Selesai' ? 'bg-blue-50 text-blue-700' : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${i.status === 'Selesai' ? 'bg-blue-600' : 'bg-yellow-500'}`} />
                            {i.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-blue-900">
                          {rupiah(i.total)}
                        </td>
                      </tr>
                    ))}
                </tbody>

                {!memuat && filtered.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-yellow-300 bg-blue-50/60">
                      <td colSpan={5} className="px-5 py-4 text-sm font-semibold text-blue-900">
                        Total {totalTransaksi} transaksi
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-base font-bold text-blue-900">
                        {rupiah(totalPenjualan)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>

              {!memuat && filtered.length === 0 && (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                    <FileText size={30} className="text-blue-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    {search || periode !== 'Semua' ? 'Tidak ada transaksi yang cocok' : 'Belum ada data penjualan'}
                  </p>
                  {(search || periode !== 'Semua') && (
                    <p className="mt-1 text-xs text-slate-400">Coba ubah kata kunci atau pilih periode lain.</p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}