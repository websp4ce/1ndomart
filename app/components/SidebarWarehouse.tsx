"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Home,
  PackageOpen,
  Warehouse,
  BarChart3,
  ArrowLeft,
  Truck,
  PackageSearch,
  PackageCheck,
  Send,
  ArrowLeftRight,
  MapPin,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  // MENU WAREHOUSE UTAMA
  { label: "Dashboard Warehouse", href: "/dashboard/warehouse", icon: Home },
  { label: "Pengadaan & Penerimaan", href: "/warehouse/pengadaan-penerimaan", icon: PackageOpen },
  { label: "Pengelolaan Gudang", href: "/warehouse/pengelolaan", icon: Warehouse },

  // FITUR TEMAN
  { label: "Data Gudang", href: "/warehouse/data-gudang", icon: Warehouse },
  { label: "Data Supplier", href: "/warehouse/data-supplier", icon: Truck },
  { label: "Picking", href: "/warehouse/picking", icon: PackageSearch },
  { label: "Packing", href: "/warehouse/packing", icon: PackageCheck },
  { label: "Pengiriman Barang", href: "/warehouse/pengiriman", icon: Send },
  { label: "Transfer Antar Gudang", href: "/warehouse/transfer-gudang", icon: ArrowLeftRight },
  { label: "Lokasi Rak", href: "/warehouse/lokasi-rak", icon: MapPin },
  { label: "Laporan Warehouse", href: "/warehouse/laporan", icon: BarChart3 },
];

/* Isi sidebar: dipakai di desktop dan di drawer HP */
function Isi({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* LOGO */}
      <div className="flex h-[72px] shrink-0 items-center border-b border-slate-100 px-5 md:h-[82px]">
        <div className="relative h-12 w-[160px] md:h-14 md:w-[180px]">
          <Image
            src="/logo-indomart2.png"
            alt="Indomart"
            fill
            priority
            sizes="180px"
            className="object-contain object-left"
          />
        </div>
      </div>

      {/* MENU */}
      <nav aria-label="Menu warehouse" className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Menu Warehouse</p>

        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard/warehouse" && pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[13px] font-semibold transition-all focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                    : "text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={1.8}
                  className={`shrink-0 ${active ? "text-white" : "text-blue-500 group-hover:text-blue-600"}`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* KEMBALI + FOOTER */}
      <div className="shrink-0 border-t border-slate-100 p-3">
        <Link
          href="/dashboard/admin"
          onClick={onNavigate}
          className="flex h-11 w-full items-center gap-3 rounded-xl bg-blue-50 px-3 text-[13px] font-semibold text-blue-600 transition-all hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-100"
        >
          <ArrowLeft size={18} strokeWidth={1.8} className="shrink-0" />
          <span>Kembali ke Admin</span>
        </Link>

        <div className="mt-2 rounded-xl bg-slate-50 px-3 py-3 [@media(max-height:520px)]:hidden">
          <p className="text-[10px] text-slate-400">Sistem Warehouse</p>
          <p className="mt-1 text-[11px] font-bold text-slate-700">Indomart Management</p>
        </div>
      </div>
    </div>
  );
}

export default function SidebarWarehouse() {
  const pathname = usePathname();
  const [buka, setBuka] = useState(false);

  // tutup drawer saat pindah halaman
  useEffect(() => setBuka(false), [pathname]);

  // Escape menutup drawer + kunci scroll halaman saat terbuka
  useEffect(() => {
    if (!buka) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setBuka(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [buka]);

  return (
    <>
      {/* DESKTOP (lg+): sidebar tetap */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 self-start border-r border-slate-100 bg-white lg:block">
        <Isi pathname={pathname} />
      </aside>

      {/* HP & TABLET: top bar + drawer */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 border-b border-slate-200 bg-white/95 px-3 backdrop-blur lg:hidden">
        <button
          onClick={() => setBuka(true)}
          aria-label="Buka menu"
          aria-expanded={buka}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-blue-900 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
        >
          <Menu size={22} />
        </button>
        <div className="relative h-8 w-28">
          <Image src="/logo-indomart2.png" alt="Indomart" fill sizes="112px" className="object-contain object-left" />
        </div>
        <span className="ml-auto truncate text-sm font-semibold text-blue-900">Warehouse</span>
      </div>

      <div
        className={`fixed inset-0 z-[90] transition-[visibility] duration-300 lg:hidden ${buka ? "visible" : "invisible"}`}
        aria-hidden={!buka}
      >
        <div
          onClick={() => setBuka(false)}
          className={`absolute inset-0 bg-blue-950/50 backdrop-blur-[2px] transition-opacity duration-300 motion-reduce:transition-none ${buka ? "opacity-100" : "opacity-0"}`}
        />
        <div
          className={`absolute inset-y-0 left-0 w-64 max-w-[80vw] bg-white shadow-2xl transition-transform duration-300 motion-reduce:transition-none ${buka ? "translate-x-0" : "-translate-x-full"}`}
        >
          <button
            onClick={() => setBuka(false)}
            aria-label="Tutup menu"
            className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
          <Isi pathname={pathname} onNavigate={() => setBuka(false)} />
        </div>
      </div>
    </>
  );
}