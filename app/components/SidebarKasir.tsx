'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home,
  Receipt,
  ScanLine,
  Wallet,
} from 'lucide-react';

type NavItem = {
  label: string;
  href: string;
  Icon: typeof Home;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/kasir', Icon: Home },
  { label: 'Transaksi', href: '/transaksi', Icon: Receipt },
  { label: 'Scan Barcode', href: '/scan-barcode', Icon: ScanLine },
  { label: 'Pembayaran', href: '/pembayaran', Icon: Wallet },
];

export default function SidebarKasir() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-shrink-0 flex-col border-r border-slate-100 bg-white px-3 py-5">
      {/* Logo */}
      <div className="mb-6 flex items-center px-2">
        <div className="relative h-14 w-[200px]">
  <Image
    src="/logo-indomart2.png"
    alt="Logo Indomart"
    fill
    className="object-contain object-left scale-125 origin-left"
    priority
  />
</div>
      </div>

      {/* Menu */}
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ label, href, Icon }) => {
          const aktif = pathname === href;

          return (
            <Link
              key={label}
              href={href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-150 ${
                aktif
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icon
                size={18}
                strokeWidth={1.8}
                className={
                  aktif
                    ? 'text-white'
                    : 'text-blue-500 group-hover:text-blue-600'
                }
              />

              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}