"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import {
  Home,
  PackageOpen,
  Warehouse,
  BarChart3,
  ArrowLeft,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard Warehouse",
    href: "/dashboard/warehouse",
    icon: Home,
  },
  {
    label: "Pengadaan & Penerimaan",
    href: "/warehouse/pengadaan-penerimaan",
    icon: PackageOpen,
  },
  {
    label: "Pengelolaan Gudang",
    href: "/warehouse/pengelolaan",
    icon: Warehouse,
  },
  {
    label: "Laporan Warehouse",
    href: "/warehouse/laporan",
    icon: BarChart3,
  },
];

export default function SidebarWarehouse() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-[72px] shrink-0 flex-col border-r border-slate-100 bg-white md:w-56">
      {/* LOGO */}
      <div className="flex h-[82px] shrink-0 items-center justify-center border-b border-slate-100 px-2 md:justify-start md:px-5">
        <div className="relative h-12 w-12 md:h-14 md:w-[180px]">
          <Image
            src="/logo-indomart2.png"
            alt="Indomart"
            fill
            priority
            className="object-contain md:object-left"
          />
        </div>
      </div>

      {/* MENU */}
      <nav className="flex-1 overflow-y-auto px-2 py-5 md:px-3">
        <p className="mb-3 hidden px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 md:block">
          Menu Warehouse
        </p>

        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              (item.href !== "/dashboard/warehouse" &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`group flex h-11 w-full items-center justify-center gap-3 rounded-xl px-2 text-[12px] font-semibold transition-all md:justify-start md:px-3 ${
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                    : "text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={1.8}
                  className={
                    active
                      ? "text-white"
                      : "text-blue-500 group-hover:text-blue-600"
                  }
                />

                <span className="hidden md:block">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* KEMBALI + FOOTER */}
      <div className="shrink-0 border-t border-slate-100 p-2 md:p-3">
        <Link
          href="/dashboard/admin"
          title="Kembali ke Admin"
          className="group mb-2 flex h-11 w-full items-center justify-center gap-3 rounded-xl bg-blue-50 px-2 text-[12px] font-semibold text-blue-600 transition-all hover:bg-blue-600 hover:text-white md:justify-start md:px-3"
        >
          <ArrowLeft
            size={18}
            strokeWidth={1.8}
            className="shrink-0"
          />

          <span className="hidden md:block">
            Kembali ke Admin
          </span>
        </Link>

        <div className="rounded-xl bg-slate-50 px-2 py-3 text-center md:px-3 md:text-left">
          <p className="hidden text-[10px] text-slate-400 md:block">
            Sistem Warehouse
          </p>

          <p className="text-[10px] font-bold text-slate-700 md:mt-1 md:text-[11px]">
            <span className="md:hidden">IM</span>

            <span className="hidden md:block">
              Indomart Management
            </span>
          </p>
        </div>
      </div>
    </aside>
  );
}