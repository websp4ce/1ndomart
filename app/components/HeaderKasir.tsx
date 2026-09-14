'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, User, ChevronDown, LogOut } from 'lucide-react';

export type UserSesi = {
  nama: string;
  email: string;
  role: 'admin' | 'kasir' | 'inventory' | 'warehouse';
};

const roleLabel: Record<UserSesi['role'], string> = {
  admin: 'Admin',
  kasir: 'Kasir',
  inventory: 'Staff Inventory',
  warehouse: 'Staff Warehouse',
};

type Props = {
  judul: string;
  breadcrumb: string;
};

export default function HeaderKasir({ judul, breadcrumb }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<UserSesi | null>(null);
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem('indomart_user');
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    function handleClickLuar(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuTerbuka(false);
      }
    }
    document.addEventListener('mousedown', handleClickLuar);
    return () => document.removeEventListener('mousedown', handleClickLuar);
  }, []);

  function handleLogout() {
    localStorage.removeItem('indomart_user');
    router.push('/login');
  }

  const nama = user?.nama ?? 'Pengguna';
  const role = user ? roleLabel[user.role] : '-';

  return (
    <header className="flex items-center justify-between border-b border-slate-100 bg-white px-8 py-4">
      <div>
        <h1 className="text-[15px] font-bold text-slate-900">{judul}</h1>
        <p className="text-[12px] text-slate-400">{breadcrumb}</p>
      </div>

      <div className="flex items-center gap-5">
        <button className="relative text-slate-500 hover:text-slate-700">
          <Bell size={19} strokeWidth={1.8} />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuTerbuka((v) => !v)}
            className="flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-900 text-white">
              <User size={17} strokeWidth={1.8} />
            </div>

            <div className="text-left leading-tight">
              <div className="text-[13px] font-semibold text-slate-800">
                {nama}
              </div>
              <div className="text-[11px] text-slate-400">{role}</div>
            </div>

            <ChevronDown
              size={16}
              strokeWidth={2}
              className={`text-slate-400 transition-transform ${
                menuTerbuka ? 'rotate-180' : ''
              }`}
            />
          </button>

          {menuTerbuka && (
            <div className="absolute right-0 top-12 w-44 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-3 text-[13px] font-medium text-red-500 hover:bg-red-50"
              >
                <LogOut size={16} strokeWidth={1.8} />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}