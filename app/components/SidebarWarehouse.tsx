'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home,
  Warehouse,
  Truck,
  PackageSearch,
  PackageCheck,
  Send,
  ArrowLeftRight,
  MapPin,
} from 'lucide-react';

// Item dasar/bareng (JANGAN diubah label/href/urutannya — dipakai juga oleh halaman teman)
const navItems = [
  ['Dashboard', '/dashboard/warehouse', Home],
] as const;

// Item tugas sendiri (Data Gudang, Data Supplier, Picking, Packing, Pengiriman Barang, Transfer Antar Gudang, Lokasi Rak)
const navItemsTambahan = [
  ['Data Gudang', '/wearehouse/data-gudang', Warehouse],
  ['Data Supplier', '/wearehouse/data-supplier', Truck],
  ['Picking', '/wearehouse/picking', PackageSearch],
  ['Packing', '/wearehouse/packing', PackageCheck],
  ['Pengiriman Barang', '/wearehouse/pengiriman', Send],
  ['Transfer Antar Gudang', '/wearehouse/transfer-gudang', ArrowLeftRight],
  ['Lokasi Rak', '/wearehouse/lokasi-rak', MapPin],
] as const;

export default function SidebarWarehouse() {
  const pathname = usePathname();

  const renderMenuItem = ([label, href, Icon]: readonly [string, string, typeof Home]) => {
    // startsWith supaya sub-halaman (mis. /wearehouse/data-gudang/123) tetap ke-highlight
    const active = pathname === href || pathname.startsWith(`${href}/`);

    return (
      <Link
        key={label}
        href={href}
        title={label}
        className={`group flex h-11 w-full items-center justify-center gap-3 rounded-xl px-2 text-[12px] font-semibold transition-all md:justify-start md:px-3 ${
          active
            ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
            : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'
        }`}
      >
        <Icon
          size={19}
          strokeWidth={1.8}
          className={active ? 'text-white' : 'text-blue-500'}
        />

        <span className="hidden md:block">{label}</span>
      </Link>
    );
  };

  return (
    <aside className="flex min-h-screen w-[72px] shrink-0 self-stretch flex-col border-r border-slate-100 bg-white md:w-56">

      {/* LOGO */}
      <div className="flex h-[82px] shrink-0 items-center justify-center border-b border-slate-100 px-2 md:justify-start md:px-5">
        <div className="relative h-12 w-12 md:h-14 md:w-[180px]">
          <Image
            src="/logo-indomart2.png"
            alt="Indomart"
            fill
            priority
            sizes="(min-width: 768px) 180px, 48px"
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
          {navItems.map(renderMenuItem)}
        </div>

        <div className="mt-1 space-y-1">
          {navItemsTambahan.map(renderMenuItem)}
        </div>
      </nav>

      {/* FOOTER */}
      <div className="shrink-0 border-t border-slate-100 p-2 md:p-3">
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