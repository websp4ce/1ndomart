"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Boxes,
  Plus,
  ChevronRight,
} from "lucide-react";
import SidebarInventory from "@/app/components/SidebarInventory";

const menu = [
  {
    title: "Produk & Kategori",
    desc: "Tambah, edit, hapus produk dan kelola kategori",
    icon: Package,
    href: "/inventory/produk",
  },
  {
    title: "Stok Barang",
    desc: "Kelola stok masuk dan stok keluar",
    icon: Boxes,
    href: "/inventory/stok",
  },
];

export default function InventoryDashboard() {
  const router = useRouter();

  const [nama, setNama] = useState("Staff Inventory");

  const [stats, setStats] = useState({
    produk: 0,
    stok: 0,
  });

  useEffect(() => {
    const login = localStorage.getItem("login");
    const userData = localStorage.getItem("indomart_user");

    // Cek login
    if (login !== "inventory" && login !== "admin") {
      router.push("/login");
      return;
    }

    // Ambil nama user
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setNama(user.nama || "Staff Inventory");
      } catch {
        setNama("Staff Inventory");
      }
    }

    // Data sementara
    setStats({
      produk: 120,
      stok: 1850,
    });
  }, [router]);

  const logout = () => {
    localStorage.removeItem("login");
    localStorage.removeItem("email");
    localStorage.removeItem("indomart_user");

    window.dispatchEvent(new Event("login"));
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* SIDEBAR */}
      <SidebarInventory />

      {/* CONTENT */}
      <main className="min-w-0 flex-1">

        {/* HEADER */}
        <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 backdrop-blur">
          <div className="flex h-[82px] items-center justify-between px-6 lg:px-8">

            <div>
              <p className="text-xs font-medium text-slate-400">
                Inventory Management
              </p>

              <h1 className="mt-1 text-xl font-bold text-slate-800">
                Dashboard Inventory
              </h1>
            </div>

            <div className="flex items-center gap-3">

              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-700">
                  {nama}
                </p>

                <p className="text-[11px] text-slate-400">
                  Staff Inventory
                </p>
              </div>

              <button
                onClick={logout}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
              >
                Keluar
              </button>

            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1400px] px-6 py-7 lg:px-8">

          {/* WELCOME */}
          <section className="relative mb-7 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 px-6 py-6 shadow-sm">

            <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">

              <div>
                <p className="text-xs font-medium text-blue-100">
                  Selamat datang kembali,
                </p>

                <h2 className="mt-1 text-2xl font-bold text-white">
                  {nama} 👋
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
                  Pantau stok dan kelola data produk toko
                  melalui satu dashboard inventory.
                </p>
              </div>

              <button
                onClick={() => router.push("/inventory/produk")}
                className="flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
              >
                <Plus size={17} />
                Tambah Produk
              </button>

            </div>

            {/* DEKORASI */}
            <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10" />

            <div className="absolute -bottom-20 right-32 h-40 w-40 rounded-full bg-white/5" />

          </section>

          {/* STATISTIK */}
          <section className="mb-8">

            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                Ringkasan Inventory
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Kondisi data inventory saat ini
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <StatCard
                title="Total Produk"
                value={stats.produk}
                desc="Produk terdaftar"
                icon={<Package size={21} />}
              />

              <StatCard
                title="Total Stok"
                value={stats.stok}
                desc="Jumlah barang"
                icon={<Boxes size={21} />}
              />

            </div>

          </section>

          {/* MENU */}
          <section>

            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                Manajemen Inventory
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Kelola produk, kategori, dan stok barang
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              {menu.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.title}
                    onClick={() => router.push(item.href)}
                    className="group flex min-h-[110px] items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  >

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-all duration-200 group-hover:bg-blue-600 group-hover:text-white">
                      <Icon size={22} strokeWidth={1.8} />
                    </div>

                    <div className="min-w-0 flex-1">

                      <h3 className="text-sm font-bold text-slate-700">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {item.desc}
                      </p>

                    </div>

                    <ChevronRight
                      size={18}
                      className="shrink-0 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-blue-600"
                    />

                  </button>
                );
              })}

            </div>

          </section>

          {/* INFO */}
          <section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">

            <div className="flex items-start gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Boxes size={19} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Pengelolaan Inventory
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Kelola data produk dan kategori melalui menu
                  Produk & Kategori. Untuk pencatatan barang yang
                  diterima dan barang yang keluar dari toko,
                  gunakan menu Stok Barang.
                </p>
              </div>

            </div>

          </section>

        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  desc,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  desc: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
          {icon}
        </div>

        <span className="text-[10px] font-medium text-slate-300">
          Inventory
        </span>

      </div>

      <p className="mt-5 text-xs font-medium text-slate-400">
        {title}
      </p>

      <h3 className="mt-1 text-2xl font-bold text-slate-800">
        {value.toLocaleString("id-ID")}
      </h3>

      <p className="mt-1 text-[11px] text-slate-400">
        {desc}
      </p>

    </div>
  );
}