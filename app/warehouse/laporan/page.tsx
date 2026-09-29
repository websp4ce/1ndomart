"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SidebarWarehouse from "@/app/components/SidebarWarehouse";
import {
  FileText, ShoppingCart, PackageCheck, ShieldCheck, Warehouse, ClipboardCheck, RefreshCw,
  Database, Truck, ArrowLeftRight, MapPin, PackageSearch, BarChart3, CheckCircle2, Clock3,
  AlertCircle, ChevronRight, CircleCheck,
} from "lucide-react";

type Laporan = { id: number; nomor: string; tanggal: string; status: string; keterangan: string };

const menuLaporan = [
  { grup: "Pengadaan & penerimaan", item: [
    { nama: "Purchase Order", deskripsi: "Laporan pengadaan barang", icon: ShoppingCart, href: "/warehouse/pengadaan-penerimaan" },
    { nama: "Penerimaan Barang", deskripsi: "Riwayat penerimaan barang", icon: PackageCheck, href: "/warehouse/pengadaan-penerimaan" },
    { nama: "Retur Supplier", deskripsi: "Riwayat retur barang", icon: RefreshCw, href: "/warehouse/pengadaan-penerimaan" },
  ]},
  { grup: "Pengelolaan gudang", item: [
    { nama: "Quality Check", deskripsi: "Hasil pemeriksaan barang", icon: ShieldCheck, href: "/warehouse/pengelolaan" },
    { nama: "Putaway", deskripsi: "Penempatan barang ke lokasi", icon: Warehouse, href: "/warehouse/pengelolaan" },
    { nama: "Stock Opname", deskripsi: "Pemeriksaan stok fisik", icon: ClipboardCheck, href: "/warehouse/pengelolaan" },
    { nama: "Lokasi Rak", deskripsi: "Informasi lokasi penyimpanan", icon: MapPin, href: "/warehouse/lokasi-rak" },
  ]},
  { grup: "Distribusi", item: [
    { nama: "Picking", deskripsi: "Pengambilan barang", icon: PackageSearch, href: "/warehouse/picking" },
    { nama: "Packing", deskripsi: "Proses pengemasan barang", icon: PackageCheck, href: "/warehouse/packing" },
    { nama: "Pengiriman Barang", deskripsi: "Aktivitas pengiriman", icon: Truck, href: "/warehouse/pengiriman" },
    { nama: "Transfer Antar Gudang", deskripsi: "Perpindahan stok antar gudang", icon: ArrowLeftRight, href: "/warehouse/transfer-gudang" },
  ]},
  { grup: "Data master", item: [
    { nama: "Data Gudang", deskripsi: "Pengelolaan data gudang", icon: Database, href: "/warehouse/data-gudang" },
    { nama: "Data Supplier", deskripsi: "Informasi supplier", icon: Truck, href: "/warehouse/data-supplier" },
  ]},
];

const nada = ["bg-blue-700 text-white", "bg-red-600 text-white", "bg-yellow-400 text-blue-900"];

const fmtTanggal = (t: string) => {
  const d = new Date(t);
  return isNaN(d.getTime()) ? t : d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

const kartu = "rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)]";

const Garis = ({ className = "" }: { className?: string }) => (
  <div className={`flex h-1.5 ${className}`}>
    <span className="flex-1 bg-blue-600" /><span className="flex-1 bg-red-600" /><span className="flex-1 bg-yellow-400" />
  </div>
);

const kelompok = (s: string) => {
  const x = (s || "").toLowerCase();
  if (x.includes("selesai") || x.includes("lulus")) return "selesai";
  if (["proses", "menunggu", "dipesan", "sebagian", "draft"].some((k) => x.includes(k))) return "proses";
  return "lainnya";
};

function statusStyle(status: string) {
  const k = kelompok(status);
  if (k === "selesai") return { cls: "bg-blue-50 text-blue-700", dot: "bg-blue-600", bar: "bg-blue-600" };
  if (k === "proses") return { cls: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-500", bar: "bg-yellow-400" };
  if (/tolak|batal|gagal/i.test(status || "")) return { cls: "bg-red-50 text-red-600", dot: "bg-red-500", bar: "bg-red-600" };
  return { cls: "bg-slate-100 text-slate-600", dot: "bg-slate-400", bar: "bg-slate-400" };
}

const StatusBadge = ({ status }: { status: string }) => {
  const s = statusStyle(status);
  const Ikon = kelompok(status) === "selesai" ? CircleCheck : Clock3;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${s.cls}`}>
      <Ikon size={12} /> {status || "Tidak diketahui"}
    </span>
  );
};

export default function LaporanWarehousePage() {
  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(true);
  const [gagal, setGagal] = useState(false);

  const ambilData = async () => {
    try {
      setLoading(true);
      setGagal(false);
      const res = await fetch("/api/warehouse/laporan", { cache: "no-store" });
      const result = await res.json();
      if (res.ok && Array.isArray(result.data)) setLaporan(result.data);
      else { setLaporan([]); setGagal(true); }
    } catch (e) {
      console.error("Gagal mengambil laporan:", e);
      setLaporan([]);
      setGagal(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ambilData();
  }, []);

  const total = laporan.length;
  const selesai = laporan.filter((x) => kelompok(x.status) === "selesai").length;
  const proses = laporan.filter((x) => kelompok(x.status) === "proses").length;
  const lainnya = total - selesai - proses;

  const grafikStatus = useMemo(() => {
    const map: Record<string, number> = {};
    laporan.forEach((x) => {
      const s = x.status || "Tidak diketahui";
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map)
      .map(([status, jumlah]) => ({ status, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah)
      .slice(0, 5);
  }, [laporan]);

  const nilaiMax = grafikStatus.length ? Math.max(...grafikStatus.map((x) => x.jumlah)) : 1;

  const aktivitasTerbaru = useMemo(
    () => [...laporan].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).slice(0, 5),
    [laporan]
  );

  const ringkasan = [
    { label: "Total laporan", nilai: total, note: "Seluruh aktivitas tercatat", icon: FileText },
    { label: "Selesai", nilai: selesai, note: "Sudah rampung", icon: CheckCircle2 },
    { label: "Sedang berjalan", nilai: proses, note: "Diproses atau menunggu", icon: Clock3 },
    { label: "Status lainnya", nilai: lainnya, note: "Di luar dua kelompok di atas", icon: AlertCircle },
  ];

  return (
    <div className="flex min-h-screen bg-white text-slate-800">
      <style>{`
        @keyframes naikMuncul { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes melayang { 0%, 100% { transform: translateY(0) rotate(-6deg); } 50% { transform: translateY(-8px) rotate(-3deg); } }
        .anim-naik { animation: naikMuncul .5s cubic-bezier(.22,1,.36,1) both; }
        .anim-melayang { animation: melayang 5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .anim-naik, .anim-melayang { animation: none; } }
      `}</style>

      <SidebarWarehouse />

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1320px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          {/* HERO */}
          <section className="anim-naik relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 px-7 py-8 text-white shadow-xl shadow-blue-100">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-yellow-400/20" />
            <div className="pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-red-500/20" />
            <BarChart3 className="anim-melayang pointer-events-none absolute bottom-6 right-8 hidden h-28 w-28 text-white/15 sm:block" />

            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-xs text-blue-200">Warehouse › Laporan</p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Laporan Warehouse</h1>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-blue-100">
                    Pantau aktivitas pengadaan, penerimaan, pemeriksaan, dan operasional gudang Indomart dalam satu halaman.
                  </p>
                </div>
                <button
                  onClick={ambilData}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3.5 text-sm font-bold text-blue-900 shadow-lg shadow-blue-950/20 transition hover:bg-yellow-300 focus:outline-none focus:ring-4 focus:ring-yellow-200/60 disabled:opacity-70"
                >
                  <RefreshCw size={17} strokeWidth={2.5} className={loading ? "animate-spin" : ""} />
                  {loading ? "Memuat..." : "Muat ulang"}
                </button>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {ringkasan.map(({ label, nilai, note, icon: Icon }) => (
                  <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-blue-100">{label}</p>
                      <Icon size={17} className="text-yellow-300" />
                    </div>
                    <p className="mt-2 text-3xl font-bold tracking-tight">{loading ? "..." : nilai.toLocaleString("id-ID")}</p>
                    <p className="mt-0.5 text-[11px] text-blue-200">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {gagal && !loading && (
            <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              <AlertCircle size={18} className="shrink-0" />
              Data laporan tidak dapat dimuat. Periksa koneksi lalu tekan Muat ulang.
            </div>
          )}

          {/* GRAFIK + AKTIVITAS */}
          <section className="anim-naik grid grid-cols-1 gap-6 xl:grid-cols-2" style={{ animationDelay: "120ms" }}>
            <div className={`${kartu} overflow-hidden`}>
              <div className="border-b border-slate-100 p-5">
                <h2 className="text-lg font-bold text-blue-900">Distribusi status laporan</h2>
                <p className="mt-0.5 text-xs text-slate-400">Lima status terbanyak dari {total} laporan</p>
              </div>

              <div className="space-y-4 p-5">
                {loading && [0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}

                {!loading && grafikStatus.length === 0 && (
                  <div className="py-10 text-center">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-300"><BarChart3 size={30} /></div>
                    <p className="text-sm font-medium text-slate-500">Belum ada data laporan</p>
                  </div>
                )}

                {!loading && grafikStatus.map((x) => {
                  const s = statusStyle(x.status);
                  return (
                    <div key={x.status}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <span className={`h-2 w-2 rounded-full ${s.dot}`} /> {x.status}
                        </span>
                        <span className="text-sm font-bold text-blue-900">
                          {x.jumlah} <span className="text-xs font-medium text-slate-400">({Math.round((x.jumlah / total) * 100)}%)</span>
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${s.bar} transition-all duration-700`} style={{ width: `${(x.jumlah / nilaiMax) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`${kartu} overflow-hidden`}>
              <div className="border-b border-slate-100 p-5">
                <h2 className="text-lg font-bold text-blue-900">Aktivitas terbaru</h2>
                <p className="mt-0.5 text-xs text-slate-400">Lima laporan terakhir berdasarkan tanggal</p>
              </div>

              <div className="divide-y divide-slate-100">
                {loading && [0, 1, 2].map((i) => <div key={i} className="px-5 py-4"><div className="h-10 animate-pulse rounded-lg bg-slate-100" /></div>)}

                {!loading && aktivitasTerbaru.length === 0 && (
                  <div className="py-10 text-center">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-300"><FileText size={30} /></div>
                    <p className="text-sm font-medium text-slate-500">Belum ada aktivitas</p>
                  </div>
                )}

                {!loading && aktivitasTerbaru.map((x, i) => (
                  <div key={x.id} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-blue-50/40">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${nada[i % 3]}`}><FileText size={17} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-sm font-semibold text-blue-800">{x.nomor}</p>
                      <p className="truncate text-xs text-slate-400">{x.keterangan}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <StatusBadge status={x.status} />
                      <p className="mt-1 text-[11px] text-slate-400">{fmtTanggal(x.tanggal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* MODUL */}
          <section className={`${kartu} anim-naik overflow-hidden`} style={{ animationDelay: "200ms" }}>
            <Garis />
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-blue-900">Modul warehouse</h2>
              <p className="mt-0.5 text-xs text-slate-400">Pilih modul untuk melihat aktivitasnya</p>
            </div>

            <div className="space-y-6 p-5">
              {menuLaporan.map(({ grup, item }) => (
                <div key={grup}>
                  <p className="mb-3 text-sm font-semibold text-slate-500">{grup}</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {item.map(({ nama, deskripsi, icon: Icon, href }, i) => (
                      <Link
                        key={nama}
                        href={href}
                        className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/40 focus:outline-none focus:ring-4 focus:ring-blue-100"
                      >
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${nada[i % 3]}`}><Icon size={19} /></div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-bold text-blue-900">{nama}</h3>
                          <p className="truncate text-xs text-slate-400">{deskripsi}</p>
                        </div>
                        <ChevronRight size={18} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-700" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}