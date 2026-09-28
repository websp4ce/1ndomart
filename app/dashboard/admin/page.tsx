"use client";

import Link from "next/link";
import {
  ShoppingCart,
  Package,
  Warehouse,
  BarChart3,
  ArrowUpRight,
  Users,
  Tag,
  RotateCcw,
  Boxes,
  ClipboardCheck,
} from "lucide-react";

import SidebarAdmin from "@/app/components/SidebarAdmin";

const modul = [
  {
    nama: "Kasir",
    deskripsi: "Kelola transaksi penjualan dan pembayaran.",
    href: "/transaksi",
    icon: ShoppingCart,
  },
  {
    nama: "Inventory",
    deskripsi: "Kelola produk, kategori, dan stok barang.",
    href: "/inventory/produk",
    icon: Package,
  },
  {
    nama: "Warehouse",
    deskripsi: "Kelola pengadaan dan operasional gudang.",
    href: "/dashboard/warehouse",
    icon: Warehouse,
  },
  {
    nama: "Laporan",
    deskripsi: "Pantau laporan aktivitas warehouse.",
    href: "/warehouse/laporan",
    icon: BarChart3,
  },
];

const kasirMenu = [
  {
    nama: "Transaksi",
    href: "/transaksi",
    icon: ShoppingCart,
  },
  {
    nama: "Promo",
    href: "/manajemen/promo",
    icon: Tag,
  },
  {
    nama: "Member",
    href: "/manajemen/member",
    icon: Users,
  },
  {
    nama: "Retur",
    href: "/manajemen/retur",
    icon: RotateCcw,
  },
];

const inventoryMenu = [
  {
    nama: "Produk",
    href: "/inventory/produk",
    icon: Package,
  },
  {
    nama: "Stok",
    href: "/inventory/stok",
    icon: Boxes,
  },
  {
    nama: "Stok Minimum",
    href: "/inventory/stok-minimum",
    icon: ClipboardCheck,
  },
];

const warehouseMenu = [
  {
    nama: "Pengadaan & Penerimaan",
    href: "/warehouse/pengadaan-penerimaan",
    icon: Package,
  },
  {
    nama: "Pengelolaan Gudang",
    href: "/warehouse/pengelolaan",
    icon: Warehouse,
  },
  {
    nama: "Laporan Warehouse",
    href: "/warehouse/laporan",
    icon: BarChart3,
  },
];

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-[#f7f9fc] text-slate-800">
      {/* SIDEBAR ADMIN */}
      <SidebarAdmin />

      {/* CONTENT */}
      <main className="min-w-0 flex-1">
        {/* HEADER */}
        <header className="flex h-[68px] items-center justify-between border-b border-slate-100 bg-white px-5 md:px-7">
          <div>
            <p className="text-[11px] font-semibold text-blue-500">
              Admin Management
            </p>

            <h1 className="mt-1 text-xl font-bold text-slate-800">
              Dashboard Admin
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600">
              AD
            </div>

            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-700">
                Administrator
              </p>

              <p className="text-[10px] text-slate-400">
                Admin
              </p>
            </div>
          </div>
        </header>

        <div className="p-5 md:p-7">
          {/* HERO */}
          <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-6 py-6 text-white shadow-lg shadow-blue-100 md:px-8">
            <div className="relative z-10">
              <p className="text-xs font-medium text-blue-100">
                Indomart Management System
              </p>

              <h2 className="mt-1.5 text-2xl font-bold md:text-3xl">
                Dashboard Admin
              </h2>

              <p className="mt-2 max-w-2xl text-xs leading-5 text-blue-50 md:text-sm">
                Kelola seluruh aktivitas Kasir, Inventory, dan Warehouse
                dalam satu dashboard.
              </p>
            </div>

            <div className="absolute -right-10 -top-16 h-36 w-36 rounded-full bg-white/10" />

            <div className="absolute -bottom-20 right-28 h-40 w-40 rounded-full bg-white/10" />
          </section>

          {/* MODUL SISTEM */}
          <section className="mb-6">
            <div className="mb-3">
              <h2 className="text-base font-bold text-slate-800">
                Modul Sistem
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Akses seluruh modul yang tersedia untuk administrator.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {modul.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.nama}
                    href={item.href}
                    className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                        <Icon size={19} />
                      </div>

                      <ArrowUpRight
                        size={16}
                        className="text-slate-300 transition group-hover:text-blue-600"
                      />
                    </div>

                    <h3 className="mt-3 text-sm font-bold text-slate-800 group-hover:text-blue-600">
                      {item.nama}
                    </h3>

                    <p className="mt-1 text-[11px] leading-4 text-slate-400">
                      {item.deskripsi}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* AKSES CEPAT */}
          <section>
            <div className="mb-3">
              <h2 className="text-base font-bold text-slate-800">
                Akses Cepat
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Pilih halaman yang ingin dikelola.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {[...kasirMenu, ...inventoryMenu, ...warehouseMenu].map(
                (item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition hover:border-blue-100 hover:shadow-md"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                        <Icon size={17} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-700 group-hover:text-blue-600">
                          {item.nama}
                        </p>

                        <p className="text-[10px] text-slate-400">
                          Buka halaman
                        </p>
                      </div>

                      <ArrowUpRight
                        size={14}
                        className="shrink-0 text-slate-300 group-hover:text-blue-600"
                      />
                    </Link>
                  );
                }
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}