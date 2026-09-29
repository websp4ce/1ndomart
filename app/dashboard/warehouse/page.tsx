"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import SidebarWarehouse from "@/app/components/SidebarWarehouse";

import {
  CalendarDays,
  ArrowDownToLine,
  AlertTriangle,
  Clock3,
  TrendingUp,
  Boxes,
  ShoppingCart,
  Truck,
  ClipboardCheck,
  PackageCheck,
  ClipboardList,
  ArrowUpRight,
  ChevronRight,
  ChevronDown,
  Warehouse,
  Building2,
  Package,
  ArrowLeftRight,
  MapPin,
  LogOut,
} from "lucide-react";

/* =========================
   DATA
========================= */

const activities = [
  { title: "Penerimaan Barang", desc: "PO-2026-0089 berhasil diterima", time: "10 menit lalu", icon: ArrowDownToLine, tone: "bg-blue-700 text-white" },
  { title: "Quality Check", desc: "QC-2026-0042 menunggu pemeriksaan", time: "25 menit lalu", icon: ClipboardCheck, tone: "bg-yellow-400 text-blue-900" },
  { title: "Putaway", desc: "15 item berhasil ditempatkan", time: "1 jam lalu", icon: PackageCheck, tone: "bg-red-600 text-white" },
  { title: "Stock Opname", desc: "Opname area A-02 selesai", time: "2 jam lalu", icon: ClipboardList, tone: "bg-blue-700 text-white" },
];

const stats = [
  { title: "PO aktif", value: 18, desc: "+3 dari minggu lalu", icon: ShoppingCart, tone: "bg-blue-700 shadow-blue-100 text-white", trend: true },
  { title: "Penerimaan hari ini", value: 24, desc: "Barang diterima", icon: ArrowDownToLine, tone: "bg-red-600 shadow-red-100 text-white" },
  { title: "Menunggu quality check", value: 7, desc: "Perlu pemeriksaan", icon: ClipboardCheck, tone: "bg-yellow-400 shadow-yellow-100 text-blue-900", warning: true },
  { title: "Putaway pending", value: 12, desc: "Belum ditempatkan", icon: PackageCheck, tone: "bg-blue-700 shadow-blue-100 text-white", warning: true },
];

const statusList = [
  { title: "Penerimaan barang", done: 24, total: 30, icon: Truck, bar: "from-blue-700 to-blue-500" },
  { title: "Quality check", done: 17, total: 24, icon: ClipboardCheck, bar: "from-yellow-500 to-yellow-300" },
  { title: "Putaway", done: 38, total: 50, icon: PackageCheck, bar: "from-red-600 to-red-400" },
  { title: "Stock opname", done: 8, total: 10, icon: ClipboardList, bar: "from-blue-700 to-blue-500" },
];

const quickMenu = [
  { title: "Pengadaan & Penerimaan", href: "/warehouse/pengadaan-penerimaan", icon: ShoppingCart },
  { title: "Pengelolaan", href: "/warehouse/pengelolaan", icon: ClipboardList },
  { title: "Data Gudang", href: "/warehouse/data-gudang", icon: Warehouse },
  { title: "Data Supplier", href: "/warehouse/data-supplier", icon: Building2 },
  { title: "Picking", href: "/warehouse/picking", icon: PackageCheck },
  { title: "Packing", href: "/warehouse/packing", icon: Package },
  { title: "Pengiriman", href: "/warehouse/pengiriman", icon: Truck },
  { title: "Transfer Gudang", href: "/warehouse/transfer-gudang", icon: ArrowLeftRight },
  { title: "Lokasi Rak", href: "/warehouse/lokasi-rak", icon: MapPin },
  { title: "Laporan", href: "/warehouse/laporan", icon: TrendingUp },
];

const kartu = "rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)]";

// Halaman tujuan setelah logout dan kunci localStorage yang dihapus
const HALAMAN_LOGIN = "/login";
const KUNCI_LOGIN = ["indomart_user", "login"];

/* =========================
   HELPER
========================= */

const tunda = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

const Garis = ({ className = "" }: { className?: string }) => (
  <div className={`flex h-1.5 ${className}`}>
    <span className="flex-1 bg-blue-600" />
    <span className="flex-1 bg-red-600" />
    <span className="flex-1 bg-yellow-400" />
  </div>
);

// Angka naik dari 0 ke nilai akhir
function CountUp({ to, durasi = 1000 }: { to: number; durasi?: number }) {
  const [v, setV] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(to);
      return;
    }
    let raf = 0;
    const mulai = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - mulai) / durasi);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, durasi]);

  return <>{v}</>;
}

/* =========================
   HALAMAN
========================= */

export default function WarehouseDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("Warehouse");
  const [date, setDate] = useState("");
  const [siap, setSiap] = useState(false);

  const [menuBuka, setMenuBuka] = useState(false);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [keluarLoading, setKeluarLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser =
      localStorage.getItem("indomart_user") || localStorage.getItem("login");

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user?.nama) setUserName(user.nama);
        else if (user?.name) setUserName(user.name);
        else if (typeof user === "string") setUserName(user);
      } catch {
        if (storedUser !== "true") setUserName(storedUser);
      }
    }

    setDate(
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );

    // memicu animasi progress bar setelah render pertama
    const t = setTimeout(() => setSiap(true), 150);
    return () => clearTimeout(t);
  }, []);

  // Tutup menu profil saat klik di luar atau tekan Escape
  useEffect(() => {
    if (!menuBuka) return;
    const klikLuar = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuBuka(false);
    };
    const tekanKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuBuka(false);
    document.addEventListener("mousedown", klikLuar);
    document.addEventListener("keydown", tekanKey);
    return () => {
      document.removeEventListener("mousedown", klikLuar);
      document.removeEventListener("keydown", tekanKey);
    };
  }, [menuBuka]);

  // Tutup dialog konfirmasi dengan Escape (kecuali saat sedang proses)
  useEffect(() => {
    if (!konfirmasi) return;
    const tekanKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !keluarLoading) setKonfirmasi(false);
    };
    document.addEventListener("keydown", tekanKey);
    return () => document.removeEventListener("keydown", tekanKey);
  }, [konfirmasi, keluarLoading]);

  /* ---------- LOGOUT ---------- */

  async function logout() {
    setKeluarLoading(true);
    try {
      // Hapus sesi di server (cookie) jika endpoint tersedia; kegagalan tidak menghentikan logout
      await fetch("/api/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout server gagal:", e);
    }
    KUNCI_LOGIN.forEach((k) => localStorage.removeItem(k));
    router.replace(HALAMAN_LOGIN);
  }

  return (
    <div className="flex min-h-screen bg-white text-slate-800">
      <style>{`
        @keyframes naikMuncul { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @keyframes masukKiri { from { opacity: 0; transform: translateX(-18px); } to { opacity: 1; transform: none; } }
        @keyframes melayang { 0%, 100% { transform: translateY(0) rotate(-6deg); } 50% { transform: translateY(-10px) rotate(-3deg); } }
        @keyframes denyut { 0%, 100% { transform: scale(1); opacity: .2; } 50% { transform: scale(1.12); opacity: .32; } }
        @keyframes lambai { 0%, 60%, 100% { transform: rotate(0); } 10%, 30% { transform: rotate(16deg); } 20%, 40% { transform: rotate(-10deg); } 50% { transform: rotate(8deg); } }
        @keyframes kilau { from { transform: translateX(-120%); } to { transform: translateX(320%); } }
        @keyframes titikHidup { 0% { box-shadow: 0 0 0 0 rgba(250,204,21,.7); } 100% { box-shadow: 0 0 0 10px rgba(250,204,21,0); } }
        @keyframes munculModal { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }
        @keyframes munculMenu { from { opacity: 0; transform: translateY(-6px) scale(.98); } to { opacity: 1; transform: none; } }

        .a-naik { animation: naikMuncul .6s cubic-bezier(.22,1,.36,1) both; }
        .a-kiri { animation: masukKiri .55s cubic-bezier(.22,1,.36,1) both; }
        .a-melayang { animation: melayang 5s ease-in-out infinite; }
        .a-denyut { animation: denyut 6s ease-in-out infinite; }
        .a-lambai { display: inline-block; transform-origin: 70% 70%; animation: lambai 2.4s ease-in-out 1s 2; }
        .a-titik { animation: titikHidup 1.6s ease-out infinite; }
        .a-modal { animation: munculModal .22s ease-out; }
        .a-menu { animation: munculMenu .16s ease-out; transform-origin: top right; }
        .kilau::after {
          content: ""; position: absolute; inset: 0; width: 35%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent);
          animation: kilau 2.4s ease-in-out 1.2s infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .a-naik, .a-kiri, .a-melayang, .a-denyut, .a-lambai, .a-titik, .a-modal, .a-menu, .kilau::after { animation: none !important; }
        }
      `}</style>

      <SidebarWarehouse />

      <main className="min-w-0 flex-1">
        {/* HEADER */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
          <Garis className="!h-1" />
          <div className="flex h-16 items-center justify-between gap-4 px-5 sm:px-8">
            <div className="flex items-center gap-2.5 text-sm text-slate-500">
              <CalendarDays size={17} className="text-blue-700" />
              <span className="hidden sm:inline">{date || " "}</span>
              <span className="font-semibold text-blue-900 sm:hidden">Warehouse</span>
            </div>

            {/* MENU PROFIL */}
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuBuka((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuBuka}
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white ring-2 ring-yellow-400 ring-offset-2">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden text-left leading-tight sm:block">
                  <p className="text-sm font-bold text-blue-900">{userName}</p>
                  <p className="text-xs text-slate-400">Warehouse</p>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${menuBuka ? "rotate-180" : ""}`} />
              </button>

              {menuBuka && (
                <div role="menu" className="a-menu absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <Garis className="!h-1" />
                  <div className="flex items-center gap-3 border-b border-slate-100 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white ring-2 ring-yellow-400 ring-offset-2">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-blue-900">{userName}</p>
                      <p className="text-xs text-slate-400">Staf warehouse</p>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setMenuBuka(false); setKonfirmasi(true); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus:bg-red-50 focus:outline-none"
                    >
                      <LogOut size={17} /> Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1320px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          {/* HERO */}
          <section className="a-naik relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 px-7 py-9 text-white shadow-xl shadow-blue-100">
            <div className="a-denyut pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-yellow-400" />
            <div className="a-denyut pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-red-500" style={tunda(1500)} />
            <Boxes className="a-melayang pointer-events-none absolute bottom-6 right-8 h-24 w-24 text-white/15 sm:right-16 sm:h-32 sm:w-32" />

            <div className="relative max-w-[650px]">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100 backdrop-blur">
                <span className="a-titik h-2 w-2 rounded-full bg-yellow-400" />
                Dashboard Warehouse
              </span>

              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                Halo, {userName}! <span className="a-lambai">👋</span>
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-100">
                Pantau aktivitas warehouse, penerimaan barang, quality check, hingga proses putaway Indomart dalam satu tempat.
              </p>
            </div>

            <div className="absolute inset-x-0 bottom-0 overflow-hidden">
              <Garis className="relative kilau overflow-hidden" />
            </div>
          </section>

          {/* STATISTIK */}
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  style={tunda(120 + i * 90)}
                  className={`a-naik group ${kartu} p-5 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_14px_34px_rgba(30,64,175,0.12)]`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-md transition duration-300 group-hover:scale-110 group-hover:-rotate-6 ${s.tone}`}>
                      <Icon size={22} />
                    </div>

                    {s.trend && (
                      <span className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                        <TrendingUp size={12} /> Naik
                      </span>
                    )}
                    {s.warning && (
                      <span className="rounded-lg bg-yellow-100 p-1.5 text-yellow-700">
                        <AlertTriangle size={14} />
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-slate-500">{s.title}</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight text-blue-900">
                      <CountUp to={s.value} />
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </section>

          {/* AKTIVITAS DAN STATUS */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
            {/* AKTIVITAS */}
            <div className={`a-naik ${kartu} overflow-hidden`} style={tunda(300)}>
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
                <div>
                  <h3 className="text-lg font-bold text-blue-900">Aktivitas terbaru</h3>
                  <p className="mt-0.5 text-xs text-slate-400">Aktivitas warehouse hari ini</p>
                </div>
                <button type="button" className="flex items-center gap-1 text-xs font-semibold text-blue-700 transition hover:gap-2 hover:text-blue-900">
                  Lihat semua <ChevronRight size={14} />
                </button>
              </div>

              <div className="relative">
                {/* garis timeline */}
                <div className="pointer-events-none absolute bottom-8 left-[39px] top-8 w-px bg-gradient-to-b from-blue-200 via-yellow-200 to-red-200" />

                {activities.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <div
                      key={a.title}
                      style={tunda(450 + i * 110)}
                      className="a-kiri group relative flex items-center gap-4 border-t border-slate-100 px-5 py-4 transition first:border-t-0 hover:bg-blue-50/40"
                    >
                      <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-white transition duration-300 group-hover:scale-110 ${a.tone}`}>
                        <Icon size={17} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">{a.title}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{a.desc}</p>
                      </div>

                      <div className="hidden items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500 sm:flex">
                        <Clock3 size={12} />
                        {a.time}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STATUS */}
            <div className={`a-naik ${kartu} overflow-hidden`} style={tunda(400)}>
              <div className="border-b border-slate-100 px-5 py-5">
                <h3 className="text-lg font-bold text-blue-900">Status warehouse</h3>
                <p className="mt-0.5 text-xs text-slate-400">Ringkasan proses hari ini</p>
              </div>

              <div className="space-y-6 p-5">
                {statusList.map((s, i) => {
                  const Icon = s.icon;
                  const persen = Math.round((s.done / s.total) * 100);
                  return (
                    <div key={s.title}>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                            <Icon size={15} />
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{s.title}</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-500">
                          {s.done} / {s.total}
                        </span>
                      </div>

                      <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`kilau relative h-full overflow-hidden rounded-full bg-gradient-to-r ${s.bar}`}
                          style={{
                            width: siap ? `${persen}%` : "0%",
                            transition: `width 1.1s cubic-bezier(.22,1,.36,1) ${i * 130}ms`,
                          }}
                        />
                      </div>

                      <p className="mt-1.5 text-right text-[11px] font-medium text-slate-400">
                        <span className="font-bold text-blue-900"><CountUp to={persen} durasi={1200} />%</span> selesai
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* AKSES CEPAT */}
          <section>
            <div className="a-naik mb-4" style={tunda(500)}>
              <h3 className="text-lg font-bold text-blue-900">Akses cepat</h3>
              <p className="mt-0.5 text-xs text-slate-400">Akses fitur warehouse yang sering digunakan</p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {quickMenu.map((m, i) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.title}
                    type="button"
                    onClick={() => router.push(m.href)}
                    style={tunda(560 + i * 70)}
                    className={`a-naik group relative overflow-hidden ${kartu} p-4 text-left transition duration-300 hover:-translate-y-1.5 hover:border-blue-300 hover:shadow-[0_14px_34px_rgba(30,64,175,0.14)] focus:outline-none focus:ring-4 focus:ring-blue-100`}
                  >
                    <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-blue-600 via-red-600 to-yellow-400 transition duration-300 group-hover:scale-x-100" />

                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-blue-700 group-hover:text-white">
                        <Icon size={20} />
                      </div>
                      <ArrowUpRight size={16} className="text-slate-300 transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-blue-700" />
                    </div>

                    <p className="text-sm font-semibold leading-5 text-slate-700 transition group-hover:text-blue-800">
                      {m.title}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {/* DIALOG KONFIRMASI LOGOUT (di luar header agar tidak terkurung backdrop-blur) */}
      {konfirmasi && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-950/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(e) => e.target === e.currentTarget && !keluarLoading && setKonfirmasi(false)}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="judul-logout" className="a-modal w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
            <Garis />
            <div className="p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <LogOut size={26} />
              </div>
              <h2 id="judul-logout" className="mt-4 text-xl font-bold text-blue-900">Keluar dari akun?</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                Anda akan keluar dari dashboard warehouse dan perlu login lagi untuk melanjutkan.
              </p>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setKonfirmasi(false)}
                  disabled={keluarLoading}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={logout}
                  disabled={keluarLoading}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-100 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut size={15} /> {keluarLoading ? "Keluar..." : "Ya, keluar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}