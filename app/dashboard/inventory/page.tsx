"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SidebarInventory from "@/app/components/SidebarInventory";

import {
  Package,
  Tags,
  Boxes,
  AlertTriangle,
  ArrowUpRight,
  PackageX,
  RefreshCw,
  CalendarClock,
  CalendarDays,
  RotateCcw,
  ArrowLeftRight,
  LogOut,
} from "lucide-react";

type Produk = {
  id: number;
  kode_produk: string;
  nama: string;
  kategori_id: number | null;
  kategori: string | null;
  harga: number;
  stok: number;
};

type Kategori = {
  id: number;
  nama: string;
};

type GenericItem = Record<string, any>;

type ModuleData = {
  items: GenericItem[];
  loading: boolean;
  error: boolean;
};

const awal: ModuleData = { items: [], loading: true, error: false };

// Halaman tujuan setelah logout dan kunci localStorage yang dihapus
const HALAMAN_LOGIN = "/login";
const KUNCI_LOGIN = ["login", "currentUser", "indomart_user"];

// Menu akses cepat
const menuInventory = [
  { label: "Produk & Kategori", path: "/inventory/produk", icon: Package },
  { label: "Stok Barang", path: "/inventory/stok", icon: Boxes },
  { label: "Stok Minimum", path: "/inventory/stok-minimum", icon: AlertTriangle },
  { label: "Barang Expired", path: "/inventory/barang-expired", icon: CalendarClock },
  { label: "Barang Rusak", path: "/inventory/barang-rusak", icon: PackageX },
  { label: "Barang Retur", path: "/inventory/barang-retur", icon: RotateCcw },
  { label: "Transfer Stok", path: "/inventory/transfer-stok", icon: ArrowLeftRight },
];

function getArrayFromResponse(data: any): GenericItem[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];

  const keys = [
    "data", "items", "rows", "produk", "barang", "result",
    "results", "records", "stok", "retur", "transfer",
  ];

  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key];
  }

  return [];
}

const formatNumber = (value: number) => Number(value || 0).toLocaleString("id-ID");

const Garis = ({ className = "" }: { className?: string }) => (
  <div className={`flex h-1.5 ${className}`}>
    <span className="flex-1 bg-blue-600" />
    <span className="flex-1 bg-red-600" />
    <span className="flex-1 bg-yellow-400" />
  </div>
);

export default function DashboardInventoryPage() {
  const router = useRouter();

  const [produk, setProduk] = useState<Produk[]>([]);
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [loadingProduk, setLoadingProduk] = useState(true);
  const [memuat, setMemuat] = useState(true);
  const [tanggal, setTanggal] = useState("");
  const [namaUser, setNamaUser] = useState("Admin");

  const [konfirmasi, setKonfirmasi] = useState(false);
  const [keluarLoading, setKeluarLoading] = useState(false);

  const [stokMinimumData, setStokMinimumData] = useState<ModuleData>(awal);
  const [expiredData, setExpiredData] = useState<ModuleData>(awal);
  const [rusakData, setRusakData] = useState<ModuleData>(awal);
  const [returData, setReturData] = useState<ModuleData>(awal);
  const [transferData, setTransferData] = useState<ModuleData>(awal);

  const loadData = async () => {
    setMemuat(true);
    setLoadingProduk(true);

    const modules = [
      { url: "/api/inventory/stok-minimum", setter: setStokMinimumData },
      { url: "/api/inventory/barang-expired", setter: setExpiredData },
      { url: "/api/barang-rusak?search=&status=Semua&tanggal=", setter: setRusakData },
      { url: "/api/inventory/barang-retur", setter: setReturData },
      { url: "/api/transfer-stok", setter: setTransferData },
    ];

    modules.forEach((m) => m.setter((prev) => ({ ...prev, loading: true })));

    // Data produk & kategori
    try {
      const response = await fetch("/api/inventory/produk", { cache: "no-store" });
      const data = await response.json();

      if (response.ok) {
        setProduk(data.produk || []);
        setKategori(data.kategori || []);
      } else {
        setProduk([]);
        setKategori([]);
      }
    } catch (error) {
      console.error("Gagal mengambil data produk:", error);
      setProduk([]);
      setKategori([]);
    } finally {
      setLoadingProduk(false);
    }

    // Data modul lainnya
    await Promise.all(
      modules.map(async (module) => {
        try {
          const response = await fetch(module.url, { cache: "no-store" });

          if (!response.ok) {
            module.setter({ items: [], loading: false, error: true });
            return;
          }

          const data = await response.json();
          module.setter({
            items: getArrayFromResponse(data),
            loading: false,
            error: false,
          });
        } catch (error) {
          console.error(`Gagal mengambil ${module.url}`, error);
          module.setter({ items: [], loading: false, error: true });
        }
      })
    );

    setMemuat(false);
  };

  useEffect(() => {
    const login = localStorage.getItem("login");

    if (login !== "inventory" && login !== "admin") {
      router.push("/login");
      return;
    }

    // Nama pengguna (jika tersimpan), bila tidak tetap "Admin"
    try {
      const user = JSON.parse(
        localStorage.getItem("currentUser") || localStorage.getItem("indomart_user") || "null"
      );
      if (user?.nama) setNamaUser(user.nama);
      else if (user?.name) setNamaUser(user.name);
    } catch {
      // biarkan default
    }

    setTanggal(
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Tutup dialog logout dengan Escape (kecuali sedang diproses)
  useEffect(() => {
    if (!konfirmasi) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !keluarLoading && setKonfirmasi(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [konfirmasi, keluarLoading]);

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

  const totalStok = produk.reduce((total, item) => total + Number(item.stok || 0), 0);
  const stokAman = produk.filter((item) => Number(item.stok) > 20).length;
  const persenAman = produk.length ? Math.round((stokAman / produk.length) * 100) : 0;

  // Kartu "perlu perhatian"
  const perhatian = [
    {
      label: "Stok minimum",
      hint: "Di bawah batas minimum",
      path: "/inventory/stok-minimum",
      icon: AlertTriangle,
      tile: "bg-yellow-400 text-blue-900 shadow-yellow-100",
      chip: "bg-yellow-100 text-yellow-800",
      warn: true,
      data: stokMinimumData,
    },
    {
      label: "Barang expired",
      hint: "Barang kedaluwarsa",
      path: "/inventory/barang-expired",
      icon: CalendarClock,
      tile: "bg-red-600 text-white shadow-red-100",
      chip: "bg-red-50 text-red-600",
      warn: true,
      data: expiredData,
    },
    {
      label: "Barang rusak",
      hint: "Barang tidak layak jual",
      path: "/inventory/barang-rusak",
      icon: PackageX,
      tile: "bg-red-600 text-white shadow-red-100",
      chip: "bg-red-50 text-red-600",
      warn: true,
      data: rusakData,
    },
    {
      label: "Barang retur",
      hint: "Pengembalian barang",
      path: "/inventory/barang-retur",
      icon: RotateCcw,
      tile: "bg-yellow-400 text-blue-900 shadow-yellow-100",
      chip: "bg-yellow-100 text-yellow-800",
      warn: false,
      data: returData,
    },
    {
      label: "Transfer stok",
      hint: "Perpindahan stok",
      path: "/inventory/transfer-stok",
      icon: ArrowLeftRight,
      tile: "bg-blue-700 text-white shadow-blue-100",
      chip: "bg-blue-50 text-blue-700",
      warn: false,
      data: transferData,
    },
  ];

  const ringkasan = [
    { label: "Total produk", nilai: produk.length, icon: Package },
    { label: "Total kategori", nilai: kategori.length, icon: Tags },
    { label: "Total stok", nilai: totalStok, icon: Boxes },
    { label: "Stok aman", nilai: stokAman, icon: Boxes },
  ];

  return (
    <div className="flex min-h-screen overflow-x-clip bg-white text-slate-800">
      <style>{`
        @keyframes naikMuncul { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes melayang { 0%, 100% { transform: translateY(0) rotate(-6deg); } 50% { transform: translateY(-8px) rotate(-3deg); } }
        @keyframes munculModal { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }
        .a-naik { animation: naikMuncul .5s cubic-bezier(.22,1,.36,1) both; }
        .a-melayang { animation: melayang 5s ease-in-out infinite; }
        .a-modal { animation: munculModal .22s ease-out; }
        @media (prefers-reduced-motion: reduce) { .a-naik, .a-melayang, .a-modal { animation: none; } }
      `}</style>

      {/* SIDEBAR */}
      <aside className="hidden w-[235px] shrink-0 self-stretch border-r border-slate-200 bg-white lg:block [&>*]:!static [&>*]:!border-r-0 [&_.fixed]:!static [&_.sticky]:!static">
        <SidebarInventory />
      </aside>

      <main className="min-w-0 flex-1">
        {/* ================= HEADER ================= */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
          <Garis className="!h-1" />

          <div className="flex h-16 items-center justify-between gap-4 px-5 lg:px-8">
            {/* Kiri: tanggal */}
            <div className="flex items-center gap-2.5 text-sm text-slate-500">
              <CalendarDays size={17} className="text-blue-700" />
              <span className="hidden sm:inline">{tanggal || " "}</span>
              <span className="font-semibold text-blue-900 sm:hidden">Inventory</span>
            </div>

            {/* Kanan: refresh + profil + logout */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={loadData}
                disabled={memuat}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60"
              >
                <RefreshCw size={16} className={memuat ? "animate-spin" : ""} />
                <span className="hidden sm:inline">{memuat ? "Memuat..." : "Segarkan"}</span>
              </button>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white ring-2 ring-yellow-400 ring-offset-2">
                  {namaUser.charAt(0).toUpperCase()}
                </div>
                <div className="hidden leading-tight sm:block">
                  <p className="text-sm font-bold text-blue-900">{namaUser}</p>
                  <p className="text-xs text-slate-400">Inventory</p>
                </div>
                <button
                  type="button"
                  onClick={() => setKonfirmasi(true)}
                  title="Keluar"
                  aria-label="Keluar"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1400px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          {/* ================= HERO + RINGKASAN ================= */}
          <section className="a-naik relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 px-7 py-8 text-white shadow-xl shadow-blue-100">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-yellow-400/20" />
            <div className="pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-red-500/20" />
            <Boxes className="a-melayang pointer-events-none absolute bottom-6 right-8 hidden h-28 w-28 text-white/15 sm:block" />

            <div className="relative">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Dashboard Inventory</h1>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-blue-100">
                Ringkasan seluruh aktivitas dan data inventory Indomart.
              </p>

              {/* Angka ringkasan */}
              <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {ringkasan.map(({ label, nilai, icon: Icon }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-blue-100">{label}</p>
                      <Icon size={17} className="text-yellow-300" />
                    </div>
                    <p className="mt-2 text-3xl font-bold tracking-tight">
                      {loadingProduk ? "..." : formatNumber(nilai)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Kesehatan stok */}
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-xs text-blue-100">
                  <span>Produk dengan stok aman (di atas 20 unit)</span>
                  <span className="font-semibold text-white">{loadingProduk ? "..." : `${persenAman}%`}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-yellow-400 transition-all duration-700"
                    style={{ width: `${loadingProduk ? 0 : persenAman}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ================= PERLU PERHATIAN ================= */}
          <section>
            <div className="a-naik mb-4" style={{ animationDelay: "120ms" }}>
              <h2 className="text-xl font-bold text-blue-900">Perlu perhatian</h2>
              <p className="mt-0.5 text-sm text-slate-400">Pantau barang yang membutuhkan tindakan.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {perhatian.map((k, i) => {
                const Icon = k.icon;
                const jumlah = k.data.items.length;
                const perluCek = k.warn && !k.data.loading && !k.data.error && jumlah > 0;

                return (
                  <button
                    key={k.path}
                    type="button"
                    onClick={() => router.push(k.path)}
                    style={{ animationDelay: `${180 + i * 80}ms` }}
                    className="a-naik group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_12px_30px_rgba(30,64,175,0.10)] focus:outline-none focus:ring-4 focus:ring-blue-100"
                  >
                    <div className="flex items-start justify-between">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-md ${k.tile}`}>
                        <Icon size={20} />
                      </div>
                      <ArrowUpRight size={17} className="text-slate-300 transition group-hover:text-blue-700" />
                    </div>

                    <p className="mt-5 text-sm font-semibold text-slate-600">{k.label}</p>

                    <p className="mt-1 text-3xl font-bold tracking-tight text-blue-900">
                      {k.data.loading ? "..." : k.data.error ? "-" : formatNumber(jumlah)}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <p className="text-xs text-slate-400">{k.hint}</p>
                      {perluCek && (
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${k.chip}`}>
                          Perlu dicek
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ================= MENU INVENTORY ================= */}
          <section>
            <div className="a-naik mb-4" style={{ animationDelay: "520ms" }}>
              <h2 className="text-xl font-bold text-blue-900">Menu inventory</h2>
              <p className="mt-0.5 text-sm text-slate-400">Akses seluruh pengelolaan inventory.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {menuInventory.map(({ label, path, icon: Icon }, i) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => router.push(path)}
                  style={{ animationDelay: `${580 + i * 60}ms` }}
                  className="a-naik group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/50 focus:outline-none focus:ring-4 focus:ring-blue-100"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
                    <Icon size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-700">{label}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                      Buka halaman
                      <ArrowUpRight size={12} />
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* ================= DIALOG LOGOUT (di luar header agar tidak terkurung backdrop-blur) ================= */}
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
                Anda akan keluar dari dashboard inventory dan perlu login lagi untuk melanjutkan.
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