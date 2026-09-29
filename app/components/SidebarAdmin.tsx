"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
} from "lucide-react";

const menu = [
  { nama: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
  { nama: "Kasir", href: "/dashboard/kasir", icon: ShoppingCart, alias: ["/transaksi"] },
  { nama: "Inventory", href: "/dashboard/inventory", icon: Package },
  { nama: "Warehouse", href: "/dashboard/warehouse", icon: Warehouse },
];

// onNavigate: dipanggil saat menu diklik (dipakai untuk menutup drawer di HP)
export default function SidebarAdmin({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="w-full border-r border-slate-100 bg-white">
      <div className="flex min-h-screen flex-col">
        <div className="flex h-20 items-center justify-center border-b border-slate-100">
          <img
            src="/logo-indomart2.png"
            alt="Indomart"
            className="w-[125px] max-w-[60%]"
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
              (item.href !== "/dashboard/admin" && pathname.startsWith(`${item.href}/`)) ||
              (item.alias ?? []).some(
                (a) => pathname === a || pathname.startsWith(`${a}/`)
              );

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
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