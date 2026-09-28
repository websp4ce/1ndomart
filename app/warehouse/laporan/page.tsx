"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import SidebarWarehouse from "@/app/components/SidebarWarehouse";
import HeaderWarehouse from "@/app/components/HeaderWarehouse";

import {
  FileText,
  ShoppingCart,
  PackageCheck,
  ShieldCheck,
  Warehouse,
  ClipboardCheck,
  RefreshCw,
  Database,
  Truck,
  ArrowLeftRight,
  MapPin,
  PackageSearch,
  BarChart3,
  CheckCircle2,
  Clock3,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";

type Laporan = {
  id: number;
  nomor: string;
  tanggal: string;
  status: string;
  keterangan: string;
};

const menuLaporan = [
  { nama: "Purchase Order", deskripsi: "Laporan pengadaan barang", icon: ShoppingCart, href: "/warehouse/pengadaan-penerimaan" },
  { nama: "Penerimaan Barang", deskripsi: "Riwayat penerimaan barang", icon: PackageCheck, href: "/warehouse/pengadaan-penerimaan" },
  { nama: "Quality Check", deskripsi: "Hasil pemeriksaan barang", icon: ShieldCheck, href: "/warehouse/pengelolaan" },
  { nama: "Putaway", deskripsi: "Penempatan barang ke lokasi", icon: Warehouse, href: "/warehouse/pengelolaan" },
  { nama: "Stock Opname", deskripsi: "Pemeriksaan stok fisik", icon: ClipboardCheck, href: "/warehouse/pengelolaan" },
  { nama: "Data Gudang", deskripsi: "Pengelolaan data gudang", icon: Database, href: "/warehouse/pengelolaan" },
  { nama: "Data Supplier", deskripsi: "Informasi supplier", icon: Truck, href: "/warehouse/pengadaan-penerimaan" },
  { nama: "Picking", deskripsi: "Pengambilan barang", icon: PackageSearch, href: "/warehouse/pengelolaan" },
  { nama: "Packing", deskripsi: "Proses pengemasan barang", icon: PackageCheck, href: "/warehouse/pengelolaan" },
  { nama: "Pengiriman Barang", deskripsi: "Aktivitas pengiriman", icon: Truck, href: "/warehouse/pengelolaan" },
  { nama: "Transfer Antar Gudang", deskripsi: "Perpindahan stok antar gudang", icon: ArrowLeftRight, href: "/warehouse/pengelolaan" },
  { nama: "Lokasi Rak", deskripsi: "Informasi lokasi penyimpanan", icon: MapPin, href: "/warehouse/pengelolaan" },
  { nama: "Retur Supplier", deskripsi: "Riwayat retur barang", icon: RefreshCw, href: "/warehouse/pengadaan-penerimaan" },
];

export default function LaporanWarehousePage() {
  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(true);

  const ambilData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/warehouse/laporan", {
        cache: "no-store",
      });
      const result = await response.json();

      if (response.ok && Array.isArray(result.data)) {
        setLaporan(result.data);
      } else {
        setLaporan([]);
      }
    } catch (error) {
      console.error("Gagal mengambil laporan:", error);
      setLaporan([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ambilData();
  }, []);

  const totalLaporan = laporan.length;

  const totalSelesai = laporan.filter((item) =>
    item.status.toLowerCase().includes("selesai")
  ).length;

  const totalProses = laporan.filter((item) => {
    const status = item.status.toLowerCase();
    return (
      status.includes("proses") ||
      status.includes("diproses") ||
      status.includes("menunggu")
    );
  }).length;

  const totalLainnya = totalLaporan - totalSelesai - totalProses;

  const grafikStatus = useMemo(() => {
    const statusMap: Record<string, number> = {};

    laporan.forEach((item) => {
      const status = item.status || "Tidak diketahui";
      statusMap[status] = (statusMap[status] || 0) + 1;
    });

    return Object.entries(statusMap)
      .map(([status, jumlah]) => ({ status, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah)
      .slice(0, 5);
  }, [laporan]);

  const nilaiGrafik =
    grafikStatus.length > 0
      ? Math.max(...grafikStatus.map((item) => item.jumlah))
      : 1;

  const aktivitasTerbaru = [...laporan]
    .sort(
      (a, b) =>
        new Date(b.tanggal).getTime() -
        new Date(a.tanggal).getTime()
    )
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#f7f9fc] md:flex">
      <SidebarWarehouse />

      <main className="min-w-0 flex-1">
        <HeaderWarehouse
          title="Laporan Warehouse"
          onRefresh={ambilData}
          loading={loading}
        />

        <div className="p-4 md:p-5">

          {/* HERO — DIPERKECIL */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-6 py-4 text-white shadow-md shadow-blue-100 md:px-7">
            <div className="relative z-10 flex min-h-[82px] items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-blue-50">
                  Warehouse Analytics
                </p>

                <h2 className="mt-1 text-xl font-bold leading-tight md:text-2xl">
                  Laporan Warehouse
                </h2>

                <p className="mt-1 max-w-3xl text-[11px] leading-4 text-blue-50 md:text-xs">
                  Pantau aktivitas pengadaan, penerimaan, pemeriksaan,
                  pengelolaan, dan operasional warehouse dalam satu halaman.
                </p>
              </div>

              <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm md:flex">
                <BarChart3 size={27} strokeWidth={1.8} />
              </div>
            </div>

            <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-16 right-24 h-24 w-24 rounded-full bg-white/10" />
          </section>

          {/* RINGKASAN */}
          <section className="mt-4">
            <div className="mb-2 flex items-end justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Ringkasan Warehouse
                </h2>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Ringkasan aktivitas operasional warehouse
                </p>
              </div>

              <div className="hidden items-center gap-1.5 text-[11px] text-slate-400 sm:flex">
                <BarChart3 size={13} />
                Data laporan
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">

              <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <FileText size={16} />
                  </div>

                  <span className="text-[9px] font-semibold text-slate-400">
                    Total
                  </span>
                </div>

                <p className="mt-2 text-xl font-bold text-slate-800">
                  {totalLaporan}
                </p>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  Total laporan
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={16} />
                  </div>

                  <span className="text-[9px] font-semibold text-emerald-500">
                    Selesai
                  </span>
                </div>

                <p className="mt-2 text-xl font-bold text-slate-800">
                  {totalSelesai}
                </p>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  Laporan selesai
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Clock3 size={16} />
                  </div>

                  <span className="text-[9px] font-semibold text-amber-500">
                    Proses
                  </span>
                </div>

                <p className="mt-2 text-xl font-bold text-slate-800">
                  {totalProses}
                </p>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  Sedang diproses
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <AlertCircle size={16} />
                  </div>

                  <span className="text-[9px] font-semibold text-slate-400">
                    Lainnya
                  </span>
                </div>

                <p className="mt-2 text-xl font-bold text-slate-800">
                  {totalLainnya}
                </p>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  Status lainnya
                </p>
              </div>

            </div>
          </section>

          {/* GRAFIK + AKTIVITAS */}
          <section className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">

            <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    Distribusi Status Laporan
                  </h2>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Distribusi status berdasarkan data laporan
                  </p>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <BarChart3 size={16} />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {loading ? (
                  <div className="py-5 text-center text-[11px] text-slate-400">
                    Memuat grafik...
                  </div>
                ) : grafikStatus.length === 0 ? (
                  <div className="py-5 text-center text-[11px] text-slate-400">
                    Belum ada data laporan.
                  </div>
                ) : (
                  grafikStatus.map((item) => (
                    <div key={item.status}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-600">
                          {item.status}
                        </span>

                        <span className="text-[11px] font-bold text-blue-600">
                          {item.jumlah}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all duration-700"
                          style={{
                            width: `${(item.jumlah / nilaiGrafik) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    Aktivitas Terbaru
                  </h2>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Aktivitas warehouse terbaru
                  </p>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                  <FileText size={16} />
                </div>
              </div>

              <div className="mt-3 divide-y divide-slate-100">
                {loading ? (
                  <div className="py-5 text-center text-[11px] text-slate-400">
                    Memuat aktivitas...
                  </div>
                ) : aktivitasTerbaru.length === 0 ? (
                  <div className="py-5 text-center text-[11px] text-slate-400">
                    Belum ada aktivitas.
                  </div>
                ) : (
                  aktivitasTerbaru.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <FileText size={13} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-bold text-slate-700">
                          {item.nomor}
                        </p>

                        <p className="mt-0.5 truncate text-[9px] text-slate-400">
                          {item.keterangan}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600">
                          {item.status}
                        </span>

                        <p className="mt-0.5 text-[9px] text-slate-400">
                          {item.tanggal}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* MODUL */}
          <section className="mt-4 pb-6">
            <div className="mb-2">
              <h2 className="text-sm font-bold text-slate-800">
                Modul Warehouse
              </h2>

              <p className="mt-0.5 text-[10px] text-slate-400">
                Pilih modul untuk melihat aktivitas warehouse.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-4">
              {menuLaporan.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.nama}
                    href={item.href}
                    className="group rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                        <Icon size={14} />
                      </div>

                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-50 text-slate-400 transition group-hover:bg-blue-50 group-hover:text-blue-600">
                        <ArrowUpRight size={11} />
                      </div>
                    </div>

                    <h3 className="mt-2 text-[11px] font-bold text-slate-700 transition group-hover:text-blue-600">
                      {item.nama}
                    </h3>

                    <p className="mt-0.5 text-[9px] leading-3.5 text-slate-400">
                      {item.deskripsi}
                    </p>

                    <div className="mt-1.5 flex items-center gap-1 text-[9px] font-semibold text-blue-500 opacity-0 transition group-hover:opacity-100">
                      Buka modul
                      <ArrowUpRight size={10} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}