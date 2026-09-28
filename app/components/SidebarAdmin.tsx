"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  BarChart3,
} from "lucide-react";

const menu = [
  {
    nama: "Dashboard",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
  },
  {
    nama: "Kasir",
    href: "/transaksi",
    icon: ShoppingCart,
  },
  {
    nama: "Inventory",
    href: "/inventory/produk",
    icon: Package,
  },
  {
    nama: "Warehouse",
    href: "/dashboard/warehouse",
    icon: Warehouse,
  },
];

export default function SidebarAdmin() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-slate-100 bg-white">
      <div className="flex min-h-screen flex-col">
        <div className="flex h-20 items-center justify-center border-b border-slate-100">
          <img
            src="/logo-indomart2.png"
            alt="Indomart"
            className="w-[125px]"
          />
        </div>

        <nav className="flex-1 space-y-2 px-3 py-5">
          <p className="mb-4 px-3 text-xs font-bold uppercase tracking-wide text-slate-400">
            Admin
          </p>

          {menu.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              (item.href !== "/dashboard/admin" &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                    : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                <Icon size={20} />
                <span>{item.nama}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}