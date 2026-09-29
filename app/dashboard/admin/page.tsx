"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import SidebarAdmin from "@/app/components/SidebarAdmin";
import {
  ShoppingCart, Package, Warehouse, BarChart3, ArrowUpRight, ClipboardCheck, XCircle, RotateCcw,
  Boxes, RefreshCw, Coins, Receipt, Hourglass, Building2, CalendarDays, LogOut, AlertTriangle,
} from "lucide-react";

const STOK_MINIMUM = 20;
const HALAMAN_LOGIN = "/login";
const KUNCI_LOGIN = ["login", "currentUser", "indomart_user"];

const API: Record<string, string> = {
  produk: "/api/inventory/produk",
  stok: "/api/inventory/produk/stok",
  wh: "/api/warehouse/pengadaan-penerimaan",
  trx: "/api/transactions",
  min: "/api/inventory/stok-minimum",
  expired: "/api/barang-expired",
  rusak: "/api/barang-rusak",
  retur: "/api/inventory/barang-retur",
  gudang: "/api/gudang",
};

const chips = [
  { label: "Stok minimum", key: "min", href: "/inventory/stok-minimum", icon: ClipboardCheck, tone: "bg-yellow-400 text-blue-900" },
  { label: "Barang expired", key: "expired", href: "/inventory/barang-expired", icon: Hourglass, tone: "bg-red-600 text-white" },
  { label: "Barang rusak", key: "rusak", href: "/inventory/barang-rusak", icon: XCircle, tone: "bg-red-600 text-white" },
  { label: "Barang retur", key: "retur", href: "/inventory/barang-retur", icon: RotateCcw, tone: "bg-blue-700 text-white" },
  { label: "Gudang", key: "gudang", href: "/warehouse/pengelolaan", icon: Building2, tone: "bg-blue-700 text-white" },
];

const modul = [
  { nama: "Kasir", ket: "Transaksi penjualan dan pembayaran", href: "/transaksi", icon: ShoppingCart, tone: "bg-blue-700 text-white" },
  { nama: "Inventory", ket: "Produk, kategori, dan stok barang", href: "/inventory/produk", icon: Package, tone: "bg-red-600 text-white" },
  { nama: "Warehouse", ket: "Pengadaan dan operasional gudang", href: "/dashboard/warehouse", icon: Warehouse, tone: "bg-yellow-400 text-blue-900" },
  { nama: "Laporan", ket: "Aktivitas dan laporan sistem", href: "/warehouse/laporan", icon: BarChart3, tone: "bg-blue-700 text-white" },
];

/* ---------- helper ---------- */

const kartu = "rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)]";
const rupiah = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;
const angka = (n: number) => n.toLocaleString("id-ID");
const hariKey = (d: Date) => d.toLocaleDateString("sv-SE"); // yyyy-mm-dd lokal

// Ambil array dari berbagai bentuk response
const arr = (json: any, ...keys: string[]): any[] => {
  if (Array.isArray(json)) return json;
  for (const k of [...keys, "data", "items", "rows"]) {
    const v = json?.[k] ?? json?.data?.[k];
    if (Array.isArray(v)) return v;
  }
  return [];
};

const pick = (o: any, keys: string[]) => keys.map((k) => o?.[k]).find((v) => v != null && v !== "");

const Garis = ({ className = "" }: { className?: string }) => (
  <div className={`flex h-1.5 ${className}`}>
    <span className="flex-1 bg-blue-600" /><span className="flex-1 bg-red-600" /><span className="flex-1 bg-yellow-400" />
  </div>
);

const Panel = ({ judul, ket, href, delay = 0, children }: { judul: string; ket?: string; href?: string; delay?: number; children: ReactNode }) => (
  <section className={`a-naik ${kartu} overflow-hidden`} style={{ animationDelay: `${delay}ms` }}>
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
      <div>
        <h2 className="text-lg font-bold text-blue-900">{judul}</h2>
        {ket && <p className="mt-0.5 text-xs text-slate-400">{ket}</p>}
      </div>
      {href && (
        <Link href={href} className="flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900">
          Buka <ArrowUpRight size={14} />
        </Link>
      )}
    </div>
    <div className="p-5">{children}</div>
  </section>
);

/* ---------- halaman ---------- */

export default function AdminDashboard() {
  const router = useRouter();
  const [d, setD] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [sekarang, setSekarang] = useState<Date | null>(null);
  const [namaUser, setNamaUser] = useState("Administrator");
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [keluarLoading, setKeluarLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const keys = Object.keys(API);
    const hasil = await Promise.all(
      keys.map((k) =>
        fetch(API[k], { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );
    setD(Object.fromEntries(keys.map((k, i) => [k, hasil[i]])));
    setLoading(false);
  }, []);

  useEffect(() => {
    setSekarang(new Date());
    try {
      const u = JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("indomart_user") || "null");
      if (u?.nama || u?.name) setNamaUser(u.nama || u.name);
    } catch {
      // biarkan default
    }
    load();
  }, [load]);

  useEffect(() => {
    if (!konfirmasi) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !keluarLoading && setKonfirmasi(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [konfirmasi, keluarLoading]);

  async function logout() {
    setKeluarLoading(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // kegagalan server tidak menghentikan logout
    }
    KUNCI_LOGIN.forEach((k) => localStorage.removeItem(k));
    router.replace(HALAMAN_LOGIN);
  }

  /* ---- data turunan ---- */
  const produk = arr(d.produk, "produk");
  const stokList = arr(d.stok, "stok");
  const stok = stokList.length ? stokList : produk;
  const jml = (x: any) => Number(x.stok || 0);
  const habis = stok.filter((x) => jml(x) <= 0).length;
  const menipis = stok.filter((x) => jml(x) > 0 && jml(x) <= STOK_MINIMUM).length;
  const aman = stok.length - habis - menipis;
  const restok = [...stok].filter((x) => jml(x) <= STOK_MINIMUM).sort((a, b) => jml(a) - jml(b)).slice(0, 5);

  const trx = arr(d.trx, "transactions", "transaksi")
    .filter((t) => !/batal|void|cancel/i.test(t.status || ""))
    .map((t) => ({
      tgl: new Date(pick(t, ["tanggal", "created_at", "tanggal_transaksi", "waktu", "date"])),
      total: Number(pick(t, ["total", "total_harga", "grand_total", "total_bayar", "total_belanja"])) || 0,
    }))
    .filter((t) => !isNaN(t.tgl.getTime()));

  const tujuhHari = Array.from({ length: 7 }, (_, i) => {
    const tgl = new Date(sekarang ?? Date.now());
    tgl.setDate(tgl.getDate() - (6 - i));
    const rows = trx.filter((t) => hariKey(t.tgl) === hariKey(tgl));
    return { label: tgl.toLocaleDateString("id-ID", { weekday: "short" }), total: rows.reduce((s, t) => s + t.total, 0), n: rows.length, hariIni: i === 6 };
  });
  const maxHari = Math.max(...tujuhHari.map((h) => h.total), 1);
  const totalMinggu = tujuhHari.reduce((s, h) => s + h.total, 0);
  const hariIni = tujuhHari[6];

  const po = arr(d.wh, "po", "purchase_order");
  const pn = arr(d.wh, "penerimaan", "penerimaan_barang");
  const selesai = (l: any[]) => l.filter((x) => /selesai/i.test(x.status || "")).length;

  const gagal = Object.keys(API).filter((k) => !loading && d[k] === null).length;
  const jam = (sekarang ?? new Date()).getHours();
  const sapaan = jam < 11 ? "Selamat pagi" : jam < 15 ? "Selamat siang" : jam < 18 ? "Selamat sore" : "Selamat malam";
  const inisial = namaUser.trim().slice(0, 2).toUpperCase() || "AD";

  const hero = [
    { label: "Pendapatan hari ini", nilai: rupiah(hariIni.total), icon: Coins },
    { label: "Transaksi hari ini", nilai: angka(hariIni.n), icon: Receipt },
    { label: "Total produk", nilai: angka(produk.length), icon: Package },
    { label: "Total stok", nilai: angka(stok.reduce((s, x) => s + jml(x), 0)), icon: Boxes },
  ];

  const segmen = [
    { label: "Aman", n: aman, bar: "bg-blue-600", dot: "bg-blue-600" },
    { label: "Menipis", n: menipis, bar: "bg-yellow-400", dot: "bg-yellow-400" },
    { label: "Habis", n: habis, bar: "bg-red-600", dot: "bg-red-600" },
  ];

  return (
    <div className="flex min-h-screen bg-white text-slate-800">
      <style>{`
        @keyframes naik { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes muncul { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }
        .a-naik { animation: naik .5s cubic-bezier(.22,1,.36,1) both; }
        .a-modal { animation: muncul .22s ease-out; }
        @media (prefers-reduced-motion: reduce) { .a-naik, .a-modal { animation: none; } }
      `}</style>

      <SidebarAdmin />

      <main className="min-w-0 flex-1">
        {/* HEADER */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
          <Garis className="!h-1" />
          <div className="flex h-16 items-center justify-between gap-4 px-5 sm:px-8">
            <div className="flex items-center gap-2.5 text-sm text-slate-500">
              <CalendarDays size={17} className="text-blue-700" />
              <span className="hidden sm:inline">
                {sekarang?.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) || " "}
              </span>
              <span className="font-semibold text-blue-900 sm:hidden">Dashboard Admin</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white ring-2 ring-yellow-400 ring-offset-2">{inisial}</div>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-bold text-blue-900">{namaUser}</p>
                <p className="text-xs text-slate-400">Admin</p>
              </div>
              <button
                onClick={() => setKonfirmasi(true)}
                title="Keluar"
                aria-label="Keluar"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1320px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          {gagal > 0 && (
            <div role="alert" className="flex items-center gap-3 rounded-2xl border border-yellow-300 bg-yellow-50 px-5 py-3 text-sm text-yellow-800">
              <AlertTriangle size={17} className="shrink-0" />
              {gagal} sumber data tidak dapat dimuat.
              <button onClick={load} className="ml-auto font-semibold underline underline-offset-4">Muat ulang</button>
            </div>
          )}

          {/* HERO */}
          <section className="a-naik relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 px-7 py-8 text-white shadow-xl shadow-blue-100">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-yellow-400/20" />
            <div className="pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-red-500/20" />
            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-xs text-blue-200">Admin › Dashboard</p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{sapaan}, Admin</h1>
                  <p className="mt-2 max-w-lg text-sm text-blue-100">
                    {loading ? "Memuat data terbaru..." : habis + menipis === 0 ? "Seluruh stok berada di level aman." : `${habis} produk habis dan ${menipis} produk menipis perlu direstok.`}
                  </p>
                </div>
                <button
                  onClick={load}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3.5 text-sm font-bold text-blue-900 shadow-lg shadow-blue-950/20 transition hover:bg-yellow-300 focus:outline-none focus:ring-4 focus:ring-yellow-200/60 disabled:opacity-70"
                >
                  <RefreshCw size={17} strokeWidth={2.5} className={loading ? "animate-spin" : ""} />
                  {loading ? "Memuat..." : "Muat ulang"}
                </button>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {hero.map(({ label, nilai, icon: Icon }) => (
                  <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-blue-100">{label}</p>
                      <Icon size={17} className="text-yellow-300" />
                    </div>
                    <p className="mt-2 truncate text-2xl font-bold tracking-tight md:text-3xl">{loading ? "..." : nilai}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PERLU PERHATIAN */}
          <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {chips.map(({ label, key, href, icon: Icon, tone }, i) => (
              <Link
                key={key}
                href={href}
                style={{ animationDelay: `${100 + i * 70}ms` }}
                className={`a-naik group ${kartu} flex items-center gap-3 p-4 transition hover:-translate-y-1 hover:border-blue-200 focus:outline-none focus:ring-4 focus:ring-blue-100`}
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md ${tone}`}><Icon size={19} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs text-slate-500">{label}</span>
                  <span className="block text-2xl font-bold text-blue-900">{loading ? "..." : d[key] === null ? "–" : angka(arr(d[key]).length)}</span>
                </span>
                <ArrowUpRight size={16} className="text-slate-300 transition group-hover:text-blue-700" />
              </Link>
            ))}
          </section>

          {/* PENJUALAN + STOK */}
          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <Panel judul="Penjualan 7 hari terakhir" ket={`${angka(tujuhHari.reduce((s, h) => s + h.n, 0))} transaksi, total ${rupiah(totalMinggu)}`} href="/transaksi" delay={200}>
              {d.trx === null && !loading ? (
                <p className="py-16 text-center text-sm text-slate-400">Data transaksi tidak dapat dimuat.</p>
              ) : (
                <div className="flex h-56 items-end gap-2 sm:gap-4">
                  {tujuhHari.map((h) => (
                    <div key={h.label} title={`${rupiah(h.total)} (${h.n} transaksi)`} className="flex h-full flex-1 flex-col items-center justify-end">
                      <span className="mb-1.5 text-[11px] font-bold text-blue-900">
                        {h.total >= 1e6 ? `${(h.total / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt` : h.total >= 1e3 ? `${Math.round(h.total / 1e3)} rb` : h.total > 0 ? h.total : ""}
                      </span>
                      <div className="flex w-full flex-1 items-end justify-center">
                        <div
                          className={`w-full max-w-[44px] rounded-t-lg transition-all duration-700 ${h.hariIni ? "bg-yellow-400" : "bg-blue-700"} ${h.total ? "" : "opacity-20"}`}
                          style={{ height: loading ? "0%" : `${Math.max((h.total / maxHari) * 100, 3)}%` }}
                        />
                      </div>
                      <span className={`mt-2 text-xs font-semibold ${h.hariIni ? "text-blue-900" : "text-slate-400"}`}>{h.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel judul="Kondisi stok" ket={`Menipis: 1–${STOK_MINIMUM} unit. Habis: 0 unit.`} href="/inventory/stok" delay={280}>
              <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                {segmen.map((s) => (
                  <span key={s.label} className={`${s.bar} transition-all duration-700`} style={{ width: `${stok.length ? (s.n / stok.length) * 100 : 0}%` }} />
                ))}
              </div>
              <div className="mt-3 flex justify-between text-xs">
                {segmen.map((s) => (
                  <span key={s.label} className="flex items-center gap-1.5 font-semibold text-slate-600">
                    <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} /> {s.label} <b className="text-blue-900">{angka(s.n)}</b>
                  </span>
                ))}
              </div>

              <p className="mb-1 mt-6 text-sm font-semibold text-slate-500">Perlu direstok</p>
              {restok.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">{loading ? "Memuat data..." : "Tidak ada produk yang perlu direstok."}</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {restok.map((p, i) => (
                    <li key={`${p.produk_id ?? p.id}-${i}`} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{p.nama || "Produk tanpa nama"}</p>
                        <p className="font-mono text-xs text-slate-400">{p.kode_produk || "-"}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${jml(p) <= 0 ? "bg-red-50 text-red-600" : "bg-yellow-100 text-yellow-800"}`}>
                        {jml(p) <= 0 ? "Habis" : `${jml(p)} unit`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          {/* WAREHOUSE + MODUL */}
          <div className="grid gap-6 xl:grid-cols-2">
            <Panel judul="Aktivitas warehouse" ket="Progres pengadaan dan penerimaan" href="/warehouse/pengadaan-penerimaan" delay={360}>
              <div className="space-y-5">
                {[
                  { label: "Purchase order", list: po, bar: "bg-blue-700" },
                  { label: "Penerimaan barang", list: pn, bar: "bg-red-600" },
                ].map(({ label, list, bar }) => {
                  const sel = selesai(list);
                  const pct = list.length ? Math.round((sel / list.length) * 100) : 0;
                  return (
                    <div key={label} className="rounded-2xl border border-slate-100 bg-blue-50/40 p-4">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-xs text-slate-500">{label}</p>
                          <p className="mt-1 text-2xl font-bold text-blue-900">{angka(list.length)}</p>
                        </div>
                        <p className="text-sm font-semibold text-blue-700">{pct}% selesai</p>
                      </div>
                      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white">
                        <div className={`h-full rounded-full ${bar} transition-all duration-700`} style={{ width: `${loading ? 0 : pct}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-slate-400">{sel} dari {list.length} sudah selesai</p>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel judul="Modul sistem" ket="Pilih modul untuk mengelola data" delay={440}>
              <ul className="space-y-3">
                {modul.map(({ nama, ket, href, icon: Icon, tone }) => (
                  <li key={nama}>
                    <Link href={href} className="group flex items-center gap-4 rounded-2xl border border-slate-100 p-3.5 transition hover:border-blue-200 hover:bg-blue-50/40 focus:outline-none focus:ring-4 focus:ring-blue-100">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={19} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-blue-900">{nama}</span>
                        <span className="block truncate text-xs text-slate-400">{ket}</span>
                      </span>
                      <ArrowUpRight size={17} className="text-slate-300 transition group-hover:text-blue-700" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      </main>

      {/* DIALOG LOGOUT (di luar header agar tidak terkurung backdrop-blur) */}
      {konfirmasi && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-950/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(e) => e.target === e.currentTarget && !keluarLoading && setKonfirmasi(false)}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="judul-logout" className="a-modal w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
            <Garis />
            <div className="p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600"><LogOut size={26} /></div>
              <h2 id="judul-logout" className="mt-4 text-xl font-bold text-blue-900">Keluar dari akun?</h2>
              <p className="mt-1.5 text-sm text-slate-500">Anda perlu login lagi untuk melanjutkan.</p>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setKonfirmasi(false)} disabled={keluarLoading} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50">
                  Batal
                </button>
                <button onClick={logout} disabled={keluarLoading} className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-100 transition hover:bg-red-700 disabled:opacity-60">
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