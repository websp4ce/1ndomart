"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import {
  ShoppingCart, Package, Warehouse, BarChart3, ArrowUpRight, Users, Tag,
  RotateCcw, Boxes, ClipboardCheck, AlertTriangle, PackageCheck, RefreshCw, XCircle,
  Receipt, Coins, Hourglass, Building2,
} from "lucide-react";

import SidebarAdmin from "@/app/components/SidebarAdmin";

const font = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

/* Warna brand */
const BIRU = "#0a4da2";
const NAVY = "#062a5c";
const KUNING = "#ffc72c";
const MERAH = "#e3262e";
const HIJAU = "#0f9d6b";

const STOK_MINIMUM = 20;

type Rec = Record<string, unknown>;
type Produk = { id?: number; kode_produk?: string; nama?: string; kategori?: string; kategori_id?: number; stok?: number };
type StokProduk = { id?: number; produk_id?: number; kode_produk?: string; nama?: string; stok?: number };
type PurchaseOrder = { id?: number; nomor_po?: string; status?: string; tanggal?: string };
type Penerimaan = { id?: number; nomor_penerimaan?: string; status?: string; tanggal?: string };
type WarehouseData = {
  po?: PurchaseOrder[]; penerimaan?: Penerimaan[];
  purchase_order?: PurchaseOrder[]; penerimaan_barang?: Penerimaan[];
  data?: { po?: PurchaseOrder[]; penerimaan?: Penerimaan[] };
};
type Baris = { key: string; nomor: string; tanggal?: string; status?: string };

/* null = gagal dimuat, [] = berhasil tapi kosong */
type Raw = {
  produk: Produk[] | null;
  stok: StokProduk[] | null;
  kategori: Rec[] | null;
  po: PurchaseOrder[] | null;
  penerimaan: Penerimaan[] | null;
  transaksi: Rec[] | null;
  expired: Rec[] | null;
  rusak: Rec[] | null;
  retur: Rec[] | null;
  stokMin: Rec[] | null;
  gudang: Rec[] | null;
};

const rawAwal: Raw = {
  produk: null, stok: null, kategori: null, po: null, penerimaan: null,
  transaksi: null, expired: null, rusak: null, retur: null, stokMin: null, gudang: null,
};

const modul = [
  { nama: "Kasir", deskripsi: "Transaksi penjualan dan pembayaran", href: "/transaksi", icon: ShoppingCart, warna: BIRU },
  { nama: "Inventory", deskripsi: "Produk, kategori, dan stok barang", href: "/inventory/produk", icon: Package, warna: HIJAU },
  { nama: "Warehouse", deskripsi: "Pengadaan dan operasional gudang", href: "/dashboard/warehouse", icon: Warehouse, warna: "#d98e04" },
  { nama: "Laporan", deskripsi: "Aktivitas dan laporan sistem", href: "/warehouse/laporan", icon: BarChart3, warna: MERAH },
];

const grupMenu = [
  { judul: "Kasir", items: [
    { nama: "Transaksi", href: "/transaksi", icon: ShoppingCart },
    { nama: "Promo", href: "/manajemen/promo", icon: Tag },
    { nama: "Member", href: "/manajemen/member", icon: Users },
    { nama: "Retur", href: "/manajemen/retur", icon: RotateCcw },
  ]},
  { judul: "Inventory", items: [
    { nama: "Produk", href: "/inventory/produk", icon: Package },
    { nama: "Stok", href: "/inventory/stok", icon: Boxes },
    { nama: "Stok Minimum", href: "/inventory/stok-minimum", icon: ClipboardCheck },
    { nama: "Barang Expired", href: "/inventory/barang-expired", icon: AlertTriangle },
    { nama: "Barang Rusak", href: "/inventory/barang-rusak", icon: XCircle },
    { nama: "Barang Retur", href: "/inventory/barang-retur", icon: RotateCcw },
  ]},
  { judul: "Warehouse", items: [
    { nama: "Pengadaan & Penerimaan", href: "/warehouse/pengadaan-penerimaan", icon: PackageCheck },
    { nama: "Pengelolaan Gudang", href: "/warehouse/pengelolaan", icon: Warehouse },
    { nama: "Laporan Warehouse", href: "/warehouse/laporan", icon: BarChart3 },
  ]},
];

/* ============ HELPER DATA ============ */

/** Ambil array dari berbagai bentuk response: [], {data: []}, {data: {data: []}}, {transactions: []}, dst. */
function extractArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const obj = value as Rec;
    for (const k of ["data", "items", "rows", "result", "results"]) {
      const v = obj[k];
      if (Array.isArray(v)) return v as T[];
      if (v && typeof v === "object") {
        const inner = extractArray<T>(v);
        if (inner.length) return inner;
      }
    }
    for (const v of Object.values(obj)) {
      if (Array.isArray(v)) return v as T[];
    }
  }
  return [];
}

function getWarehouseArray<T>(result: WarehouseData | null, keys: string[]): T[] {
  if (!result) return [];
  for (const key of keys) {
    const v = result[key as keyof WarehouseData];
    if (Array.isArray(v)) return v as T[];
  }
  if (result.data) {
    for (const key of keys) {
      const v = result.data[key as keyof typeof result.data];
      if (Array.isArray(v)) return v as T[];
    }
  }
  return [];
}

async function ambil(url: string): Promise<{ ok: boolean; json: unknown }> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { ok: false, json: null };
    return { ok: true, json: await res.json().catch(() => null) };
  } catch {
    return { ok: false, json: null };
  }
}

function pickNum(o: Rec, keys: string[]) {
  for (const k of keys) {
    const v = o[k];
    if (v !== undefined && v !== null && v !== "" && !isNaN(Number(v))) return Number(v);
  }
  return 0;
}

function pickStr(o: Rec, keys: string[]) {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v) return v;
  }
  return "";
}

const rupiah = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;

function rupiahRingkas(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(".", ",")} M`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")} jt`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} rb`;
  return String(Math.round(n));
}

function kunciHari(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTanggal(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function terbaru<T extends { id?: number; tanggal?: string }>(list: T[], n = 5): T[] {
  return [...list]
    .sort((a, b) => {
      const ta = a.tanggal ? new Date(a.tanggal).getTime() : NaN;
      const tb = b.tanggal ? new Date(b.tanggal).getTime() : NaN;
      if (!isNaN(ta) && !isNaN(tb) && ta !== tb) return tb - ta;
      return (b.id ?? 0) - (a.id ?? 0);
    })
    .slice(0, n);
}

function statusStyle(status?: string) {
  const s = String(status || "").toLowerCase();
  if (/selesai|diterima|lunas|complete/.test(s)) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (/batal|tolak|gagal|cancel/.test(s)) return "bg-rose-50 text-rose-700 ring-rose-200";
  if (/proses|kirim|parsial|sebagian/.test(s)) return "bg-sky-50 text-sky-700 ring-sky-200";
  return "bg-amber-50 text-amber-700 ring-amber-200";
}

function sapaan(jam: number) {
  if (jam < 11) return "Selamat pagi";
  if (jam < 15) return "Selamat siang";
  if (jam < 18) return "Selamat sore";
  return "Selamat malam";
}

/* ============ KOMPONEN ============ */

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) { setValue(0); return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setValue(target); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return value;
}

function CountUp({ value, loading, prefix = "" }: { value: number; loading: boolean; prefix?: string }) {
  const v = useCountUp(value, !loading);
  if (loading) return <span className="inline-block h-9 w-24 animate-pulse rounded-lg bg-white/15 align-middle" />;
  return <>{prefix}{v.toLocaleString("id-ID")}</>;
}

function Panel({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <div
      className={`rise rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_-4px_rgba(6,42,92,0.08)] ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function Judul({ judul, ket, aksi }: { judul: string; ket?: string; aksi?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-extrabold text-slate-900">{judul}</h2>
        {ket && <p className="mt-1 text-[11px] text-slate-400">{ket}</p>}
      </div>
      {aksi}
    </div>
  );
}

function Empty({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-7 text-center">
      <p className="text-xs text-slate-500">{text}</p>
      <Link href={href} className="mt-2 inline-block text-xs font-bold underline underline-offset-4" style={{ color: BIRU }}>{cta}</Link>
    </div>
  );
}

function DaftarBaris({ rows, kosong, href }: { rows: Baris[]; kosong: string; href: string }) {
  if (rows.length === 0) return <Empty text={kosong} href={href} cta="Buka halaman" />;
  return (
    <ul className="divide-y divide-slate-100">
      {rows.map((r) => (
        <li key={r.key} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-slate-800">{r.nomor}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">{formatTanggal(r.tanggal)}</p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${statusStyle(r.status)}`}>
            {r.status || "Belum ada status"}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ============ HALAMAN ============ */

export default function AdminDashboard() {
  const [raw, setRaw] = useState<Raw>(rawAwal);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [diperbarui, setDiperbarui] = useState("");
  const [sekarang, setSekarang] = useState<Date | null>(null);
  const [tab, setTab] = useState<"po" | "penerimaan">("po");

  useEffect(() => {
    setSekarang(new Date());
    const t = setInterval(() => setSekarang(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    const [p, s, k, w, t, ex, ru, re, sm, g] = await Promise.all([
      ambil("/api/inventory/produk"),
      ambil("/api/inventory/produk/stok"),
      ambil("/api/categories"),
      ambil("/api/warehouse/pengadaan-penerimaan"),
      ambil("/api/transactions"),
      ambil("/api/barang-expired"),
      ambil("/api/barang-rusak"),
      ambil("/api/inventory/barang-retur"),
      ambil("/api/inventory/stok-minimum"),
      ambil("/api/gudang"),
    ]);

    const wh = w.ok ? (w.json as WarehouseData | null) : null;

    const next: Raw = {
      produk: p.ok ? extractArray<Produk>(p.json) : null,
      stok: s.ok ? extractArray<StokProduk>(s.json) : null,
      kategori: k.ok ? extractArray<Rec>(k.json) : null,
      po: w.ok ? getWarehouseArray<PurchaseOrder>(wh, ["po", "purchase_order"]) : null,
      penerimaan: w.ok ? getWarehouseArray<Penerimaan>(wh, ["penerimaan", "penerimaan_barang"]) : null,
      transaksi: t.ok ? extractArray<Rec>(t.json) : null,
      expired: ex.ok ? extractArray<Rec>(ex.json) : null,
      rusak: ru.ok ? extractArray<Rec>(ru.json) : null,
      retur: re.ok ? extractArray<Rec>(re.json) : null,
      stokMin: sm.ok ? extractArray<Rec>(sm.json) : null,
      gudang: g.ok ? extractArray<Rec>(g.json) : null,
    };
    setRaw(next);

    const gagal: string[] = [];
    if (!p.ok) gagal.push("produk");
    if (!s.ok) gagal.push("stok");
    if (!w.ok) gagal.push("warehouse");
    if (!t.ok) gagal.push("transaksi");
    if (!ex.ok) gagal.push("barang expired");
    if (!ru.ok) gagal.push("barang rusak");
    if (!re.ok) gagal.push("barang retur");
    if (!sm.ok) gagal.push("stok minimum");
    if (gagal.length) setError(`Data ${gagal.join(", ")} tidak dapat dimuat.`);

    setDiperbarui(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
    setLoading(false);
  };

  useEffect(() => { loadDashboard(); }, []);

  useEffect(() => {
    if (loading) { setReady(false); return; }
    const t = setTimeout(() => setReady(true), 120);
    return () => clearTimeout(t);
  }, [loading]);

  /* ---- produk & stok ---- */
  const produk = raw.produk ?? [];
  const stokProduk = raw.stok ?? [];
  const purchaseOrder = raw.po ?? [];
  const penerimaan = raw.penerimaan ?? [];

  const produkById = useMemo(() => {
    const m = new Map<number, Produk>();
    produk.forEach((x) => { if (x.id != null) m.set(x.id, x); });
    return m;
  }, [produk]);

  const namaKategori = useMemo(() => {
    const m = new Map<number, string>();
    (raw.kategori ?? []).forEach((c) => {
      const id = Number(c.id);
      const nama = pickStr(c, ["nama", "nama_kategori", "name", "kategori"]);
      if (!isNaN(id) && nama) m.set(id, nama);
    });
    return m;
  }, [raw.kategori]);

  const sumberStok: StokProduk[] = stokProduk.length > 0 ? stokProduk : produk;
  const jml = (i: StokProduk) => Number(i.stok || 0);

  const totalProduk = produk.length;
  const totalStok = sumberStok.reduce((t, i) => t + jml(i), 0);
  const stokHabis = sumberStok.filter((i) => jml(i) <= 0).length;
  const stokMenipis = sumberStok.filter((i) => jml(i) > 0 && jml(i) <= STOK_MINIMUM).length;
  const stokAman = sumberStok.filter((i) => jml(i) > STOK_MINIMUM).length;
  const totalItem = sumberStok.length;

  const perhatian = useMemo(
    () => sumberStok
      .filter((i) => jml(i) <= STOK_MINIMUM)
      .sort((a, b) => jml(a) - jml(b))
      .slice(0, 6)
      .map((i) => {
        const ref = i.produk_id != null ? produkById.get(i.produk_id) : undefined;
        return { key: `${i.produk_id ?? i.id}-${i.kode_produk ?? ""}`, nama: i.nama || ref?.nama || "Produk tanpa nama", kode: i.kode_produk || ref?.kode_produk || "-", stok: jml(i) };
      }),
    [sumberStok, produkById],
  );

  const kategori = useMemo(() => {
    const m = new Map<string, number>();
    produk.forEach((p) => {
      const k = p.kategori?.trim() || (p.kategori_id != null ? namaKategori.get(Number(p.kategori_id)) : undefined) || "Tanpa kategori";
      m.set(k, (m.get(k) || 0) + 1);
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [produk, namaKategori]);
  const maxKategori = kategori[0]?.[1] || 1;

  /* ---- transaksi ---- */
  const transaksi = useMemo(() => {
    return (raw.transaksi ?? [])
      .filter((t) => !/batal|void|cancel/i.test(pickStr(t, ["status"])))
      .map((t) => {
        const tgl = new Date(pickStr(t, ["tanggal", "created_at", "tanggal_transaksi", "waktu", "date"]));
        const total = pickNum(t, ["total", "total_harga", "grand_total", "total_bayar", "total_belanja"]);
        return { tgl, total };
      })
      .filter((t) => !isNaN(t.tgl.getTime()));
  }, [raw.transaksi]);

  const hariIni = sekarang ? kunciHari(sekarang) : "";
  const trxHariIni = transaksi.filter((t) => kunciHari(t.tgl) === hariIni);
  const pendapatanHariIni = trxHariIni.reduce((s, t) => s + t.total, 0);

  const tujuhHari = useMemo(() => {
    if (!sekarang) return [];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sekarang);
      d.setDate(d.getDate() - (6 - i));
      const key = kunciHari(d);
      const rows = transaksi.filter((t) => kunciHari(t.tgl) === key);
      return {
        key,
        label: d.toLocaleDateString("id-ID", { weekday: "short" }),
        tanggal: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        total: rows.reduce((s, t) => s + t.total, 0),
        jumlah: rows.length,
        hariIni: i === 6,
      };
    });
  }, [transaksi, sekarang]);
  const maxHari = Math.max(...tujuhHari.map((h) => h.total), 1);
  const totalMinggu = tujuhHari.reduce((s, h) => s + h.total, 0);
  const trxMinggu = tujuhHari.reduce((s, h) => s + h.jumlah, 0);

  /* ---- warehouse ---- */
  const totalPO = purchaseOrder.length;
  const totalPenerimaan = penerimaan.length;
  const selesai = (s?: string) => String(s || "").toLowerCase().includes("selesai");
  const poSelesai = purchaseOrder.filter((i) => selesai(i.status)).length;
  const penerimaanSelesai = penerimaan.filter((i) => selesai(i.status)).length;
  const pctPO = totalPO > 0 ? Math.round((poSelesai / totalPO) * 100) : 0;
  const pctPenerimaan = totalPenerimaan > 0 ? Math.round((penerimaanSelesai / totalPenerimaan) * 100) : 0;

  const poRows: Baris[] = terbaru(purchaseOrder).map((i, n) => ({ key: `po-${i.id ?? n}`, nomor: i.nomor_po || `PO #${i.id ?? n + 1}`, tanggal: i.tanggal, status: i.status }));
  const penerimaanRows: Baris[] = terbaru(penerimaan).map((i, n) => ({ key: `pn-${i.id ?? n}`, nomor: i.nomor_penerimaan || `Penerimaan #${i.id ?? n + 1}`, tanggal: i.tanggal, status: i.status }));

  /* ---- ringkasan teks ---- */
  const perluTindakan = stokHabis + stokMenipis;
  const ringkasan = loading
    ? "Memuat data terbaru…"
    : totalItem === 0
      ? "Belum ada data stok yang tercatat."
      : perluTindakan === 0
        ? "Seluruh stok berada di level aman."
        : `${stokHabis} produk habis dan ${stokMenipis} produk menipis perlu direstok.`;

  /* ---- chips perlu perhatian ---- */
  const chips = [
    { label: "Stok minimum", data: raw.stokMin, href: "/inventory/stok-minimum", icon: ClipboardCheck, warna: "#d98e04" },
    { label: "Barang expired", data: raw.expired, href: "/inventory/barang-expired", icon: Hourglass, warna: MERAH },
    { label: "Barang rusak", data: raw.rusak, href: "/inventory/barang-rusak", icon: XCircle, warna: MERAH },
    { label: "Barang retur", data: raw.retur, href: "/inventory/barang-retur", icon: RotateCcw, warna: BIRU },
    { label: "Gudang", data: raw.gudang, href: "/warehouse/pengelolaan", icon: Building2, warna: HIJAU },
  ];

  /* ---- donut ---- */
  const R = 54;
  const C = 2 * Math.PI * R;
  const segmen = [
    { label: "Aman", n: stokAman, color: HIJAU },
    { label: "Menipis", n: stokMenipis, color: KUNING },
    { label: "Habis", n: stokHabis, color: MERAH },
  ];
  let offset = 0;
  const arcs = segmen.map((s) => {
    const len = totalItem > 0 ? (s.n / totalItem) * C : 0;
    const arc = { ...s, len, offset };
    offset += len;
    return arc;
  });

  const heroStat = [
    { label: "Pendapatan hari ini", nilai: pendapatanHariIni, prefix: "Rp ", ket: raw.transaksi === null && !loading ? "Data transaksi belum termuat" : "", icon: Coins },
    { label: "Transaksi hari ini", nilai: trxHariIni.length, prefix: "", ket: "", icon: Receipt },
    { label: "Total produk", nilai: totalProduk, prefix: "", ket: "", icon: Package },
    { label: "Total stok", nilai: totalStok, prefix: "", ket: "unit tersedia", icon: Boxes },
  ];

  const jam = sekarang ? sekarang.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).replace(/\./g, ":") : "";
  const tanggal = sekarang ? sekarang.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) : "";

  return (
    <div className={`flex min-h-screen bg-[#f2f5fa] text-slate-800 ${font.className}`}>
      <style>{`
        @keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes drift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-28px,16px) scale(1.07); } }
        @keyframes stripe { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes pulseDot { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
        .rise { opacity: 0; animation: rise .7s cubic-bezier(.22,1,.36,1) forwards; }
        .drift { animation: drift 14s ease-in-out infinite; }
        .stripe { transform-origin: left; animation: stripe 1.3s cubic-bezier(.22,1,.36,1) .3s both; }
        .live { animation: pulseDot 1.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .rise { animation: none; opacity: 1; }
          .drift, .live, .stripe { animation: none; }
        }
      `}</style>

      <SidebarAdmin />

      <main className="min-w-0 flex-1">
        {/* HEADER */}
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
          <div className="flex h-[68px] items-center justify-between px-5 md:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black text-white" style={{ background: BIRU }}>IM</div>
              <div>
                <p className="text-[15px] font-extrabold leading-none" style={{ color: NAVY }}>
                  Indo<span style={{ color: MERAH }}>mart</span>
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">Dashboard Admin</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {jam && (
                <div className="hidden text-right md:block">
                  <p className="text-sm font-extrabold tabular-nums" style={{ color: NAVY }}>{jam}</p>
                  <p className="text-[11px] text-slate-400">{tanggal}</p>
                </div>
              )}
              <div className="hidden h-8 w-px bg-slate-200 md:block" />
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-extrabold" style={{ background: KUNING, color: NAVY }}>AD</div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-slate-700">Administrator</p>
                  <p className="text-[10px] text-slate-400">Admin</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex h-[3px]">
            <div className="stripe flex-[3]" style={{ background: BIRU }} />
            <div className="stripe flex-1" style={{ background: KUNING, animationDelay: ".45s" }} />
            <div className="stripe flex-1" style={{ background: MERAH, animationDelay: ".6s" }} />
          </div>
        </header>

        <div className="mx-auto max-w-[1400px] space-y-6 p-5 md:p-8">
          {error && (
            <div role="alert" className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              <AlertTriangle size={16} />
              <span>{error}</span>
              <button type="button" onClick={loadDashboard} className="ml-auto font-bold underline underline-offset-4">Muat ulang</button>
            </div>
          )}

          {/* HERO */}
          <section className="rise relative overflow-hidden rounded-[32px] px-6 py-9 text-white md:px-10 md:py-11" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${BIRU} 100%)` }}>
            <div className="drift pointer-events-none absolute -right-20 -top-28 h-[420px] w-[420px] rounded-full" style={{ background: `radial-gradient(circle, ${KUNING}40, transparent 65%)` }} />
            <div className="pointer-events-none absolute -bottom-44 left-1/3 h-[380px] w-[380px] rounded-full" style={{ background: `radial-gradient(circle, ${MERAH}30, transparent 65%)` }} />

            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl">
                <p className="flex items-center gap-2 text-xs font-semibold text-blue-100/90">
                  <span className="live h-2 w-2 rounded-full" style={{ background: KUNING }} />
                  Data langsung dari sistem
                </p>
                <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight md:text-[42px]">
                  {sekarang ? sapaan(sekarang.getHours()) : "Selamat datang"}, Admin
                </h2>
                <p className="mt-3 text-sm leading-6 text-blue-100/85">{ringkasan}</p>
              </div>
              <button
                type="button"
                onClick={loadDashboard}
                disabled={loading}
                className="flex h-10 w-fit items-center gap-2 rounded-full px-5 text-xs font-bold transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60"
                style={{ background: KUNING, color: NAVY }}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                {diperbarui && !loading ? `Diperbarui ${diperbarui}` : "Muat ulang"}
              </button>
            </div>

            <dl className="relative z-10 mt-9 grid grid-cols-2 gap-y-6 border-t border-white/15 pt-7 md:grid-cols-4">
              {heroStat.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className={`pr-4 ${i > 0 ? "md:border-l md:border-white/15 md:pl-6" : ""}`}>
                    <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-100/80">
                      <Icon size={13} /> {s.label}
                    </dt>
                    <dd className="mt-1 text-2xl font-extrabold tabular-nums tracking-tight md:text-[32px]">
                      <CountUp value={s.nilai} loading={loading} prefix={s.prefix} />
                    </dd>
                    {s.ket && !loading && <p className="mt-0.5 text-[11px] text-blue-100/70">{s.ket}</p>}
                  </div>
                );
              })}
            </dl>
          </section>

          {/* CHIPS PERLU PERHATIAN */}
          <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {chips.map((c, i) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.label}
                  href={c.href}
                  className="rise group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 transition-colors hover:border-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0a4da2]"
                  style={{ animationDelay: `${100 + i * 70}ms` }}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${c.warna}14`, color: c.warna }}>
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold text-slate-500">{c.label}</span>
                    <span className="block text-xl font-extrabold tabular-nums text-slate-900">
                      {loading ? <span className="inline-block h-5 w-8 animate-pulse rounded bg-slate-100 align-middle" /> : c.data === null ? "–" : c.data.length.toLocaleString("id-ID")}
                    </span>
                  </span>
                  <ArrowUpRight size={15} className="text-slate-300 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </section>

          {/* PENJUALAN + STOK */}
          <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <Panel delay={200}>
              <Judul
                judul="Penjualan 7 hari terakhir"
                ket={raw.transaksi === null && !loading ? "Data transaksi belum termuat." : `${trxMinggu.toLocaleString("id-ID")} transaksi, total ${rupiah(totalMinggu)}`}
                aksi={
                  <Link href="/transaksi" className="flex items-center gap-1 text-[11px] font-bold hover:underline" style={{ color: BIRU }}>
                    Buka kasir <ArrowUpRight size={13} />
                  </Link>
                }
              />
              {raw.transaksi === null && !loading ? (
                <div className="mt-6"><Empty text="Endpoint /api/transactions tidak merespons." href="/transaksi" cta="Buka halaman transaksi" /></div>
              ) : totalMinggu === 0 && !loading ? (
                <div className="mt-6"><Empty text="Belum ada transaksi dalam 7 hari terakhir." href="/transaksi" cta="Mulai transaksi" /></div>
              ) : (
                <div className="mt-6 flex h-56 items-end gap-3">
                  {tujuhHari.map((h, i) => (
                    <div key={h.key} className="group flex h-full flex-1 flex-col items-center justify-end gap-2" title={`${h.tanggal}: ${rupiah(h.total)} (${h.jumlah} transaksi)`}>
                      <span className="text-[10px] font-bold tabular-nums text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
                        {rupiahRingkas(h.total)}
                      </span>
                      <div className="flex w-full flex-1 items-end">
                        <div
                          className="w-full rounded-t-xl"
                          style={{
                            background: h.hariIni ? `linear-gradient(180deg, ${KUNING}, #f0a800)` : `linear-gradient(180deg, #3b82d6, ${BIRU})`,
                            height: ready ? `${Math.max((h.total / maxHari) * 100, h.total > 0 ? 4 : 1)}%` : "0%",
                            opacity: h.total > 0 ? 1 : 0.2,
                            transition: `height 1s cubic-bezier(.22,1,.36,1) ${i * 80}ms`,
                          }}
                        />
                      </div>
                      <span className={`text-[11px] font-semibold ${h.hariIni ? "text-slate-900" : "text-slate-400"}`}>{h.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel delay={300}>
              <Judul judul="Kondisi stok" ket={`Menipis: 1–${STOK_MINIMUM} unit. Habis: 0 unit.`} />
              <div className="mt-6 flex items-center gap-6">
                <div className="relative h-36 w-36 shrink-0">
                  <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
                    <circle cx="70" cy="70" r={R} fill="none" stroke="#eef1f6" strokeWidth="14" />
                    {arcs.map((a) => (
                      <circle
                        key={a.label} cx="70" cy="70" r={R} fill="none" stroke={a.color} strokeWidth="14"
                        strokeDasharray={`${ready ? Math.max(a.len - 2, 0) : 0} ${C}`}
                        strokeDashoffset={-a.offset}
                        style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.22,1,.36,1)" }}
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold tabular-nums" style={{ color: NAVY }}>{totalItem.toLocaleString("id-ID")}</span>
                    <span className="text-[10px] font-medium text-slate-400">item stok</span>
                  </div>
                </div>
                <ul className="flex-1 space-y-3">
                  {segmen.map((s) => (
                    <li key={s.label} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 font-semibold text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                        {s.label}
                      </span>
                      <span className="font-extrabold tabular-nums text-slate-800">
                        {s.n.toLocaleString("id-ID")}
                        <span className="ml-1 font-medium text-slate-400">{totalItem > 0 ? `${Math.round((s.n / totalItem) * 100)}%` : "0%"}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>
          </section>

          {/* KATEGORI + RESTOK */}
          <section className="grid gap-6 xl:grid-cols-2">
            <Panel delay={350}>
              <Judul judul="Produk per kategori" ket="Enam kategori dengan produk terbanyak." />
              {kategori.length === 0 ? (
                <div className="mt-6"><Empty text="Belum ada produk terdaftar." href="/inventory/produk" cta="Tambah produk" /></div>
              ) : (
                <ul className="mt-6 space-y-4">
                  {kategori.map(([nama, jumlah], i) => (
                    <li key={nama}>
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="truncate font-semibold text-slate-600">{nama}</span>
                        <span className="font-extrabold tabular-nums text-slate-800">{jumlah.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${BIRU}, #3b82d6)`,
                            width: ready ? `${(jumlah / maxKategori) * 100}%` : "0%",
                            transition: `width 1s cubic-bezier(.22,1,.36,1) ${i * 90}ms`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel delay={450}>
              <Judul
                judul="Perlu direstok"
                ket="Stok paling sedikit lebih dulu."
                aksi={
                  <Link href="/inventory/stok-minimum" className="flex items-center gap-1 text-[11px] font-bold hover:underline" style={{ color: BIRU }}>
                    Stok minimum <ArrowUpRight size={13} />
                  </Link>
                }
              />
              {perhatian.length === 0 ? (
                <div className="mt-6"><Empty text={loading ? "Memuat data…" : "Tidak ada produk yang perlu direstok."} href="/inventory/stok" cta="Lihat stok" /></div>
              ) : (
                <ul className="mt-4 divide-y divide-slate-100">
                  {perhatian.map((p) => (
                    <li key={p.key} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-800">{p.nama}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">{p.kode}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold tabular-nums ring-1 ring-inset ${p.stok <= 0 ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-amber-50 text-amber-700 ring-amber-200"}`}>
                        {p.stok <= 0 ? "Habis" : `${p.stok} unit`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </section>

          {/* WAREHOUSE */}
          <Panel delay={500}>
            <Judul
              judul="Aktivitas warehouse"
              ket="Lima catatan terbaru."
              aksi={
                <Link href="/warehouse/pengadaan-penerimaan" className="flex items-center gap-1 text-[11px] font-bold hover:underline" style={{ color: BIRU }}>
                  Lihat semua <ArrowUpRight size={13} />
                </Link>
              }
            />
            <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
              <div className="space-y-5">
                {[
                  { label: "Purchase order", total: totalPO, sel: poSelesai, pct: pctPO, warna: BIRU },
                  { label: "Penerimaan barang", total: totalPenerimaan, sel: penerimaanSelesai, pct: pctPenerimaan, warna: HIJAU },
                ].map((r, i) => (
                  <div key={r.label} className="rounded-2xl bg-[#f2f5fa] p-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[11px] font-semibold text-slate-500">{r.label}</p>
                        <p className="mt-1 text-2xl font-extrabold tabular-nums" style={{ color: NAVY }}>{r.total.toLocaleString("id-ID")}</p>
                      </div>
                      <p className="text-xs font-bold tabular-nums" style={{ color: r.warna }}>{r.pct}% selesai</p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full" style={{ background: r.warna, width: ready ? `${r.pct}%` : "0%", transition: `width 1s cubic-bezier(.22,1,.36,1) ${i * 150}ms` }} />
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">{r.sel} dari {r.total} sudah selesai</p>
                  </div>
                ))}
              </div>

              <div>
                <div role="tablist" className="mb-3 inline-flex rounded-full bg-[#f2f5fa] p-1">
                  {([
                    ["po", "Purchase order", totalPO],
                    ["penerimaan", "Penerimaan", totalPenerimaan],
                  ] as const).map(([id, label, n]) => (
                    <button
                      key={id}
                      role="tab"
                      type="button"
                      aria-selected={tab === id}
                      onClick={() => setTab(id)}
                      className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0a4da2] ${tab === id ? "bg-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                      style={tab === id ? { color: BIRU } : undefined}
                    >
                      {label} <span className="ml-1 tabular-nums opacity-70">{n}</span>
                    </button>
                  ))}
                </div>
                <div key={tab} className="rise" style={{ animationDuration: ".4s" }}>
                  {tab === "po"
                    ? <DaftarBaris rows={poRows} kosong="Belum ada purchase order." href="/warehouse/pengadaan-penerimaan" />
                    : <DaftarBaris rows={penerimaanRows} kosong="Belum ada penerimaan barang." href="/warehouse/pengadaan-penerimaan" />}
                </div>
              </div>
            </div>
          </Panel>

          {/* MODUL + AKSES CEPAT */}
          <section className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
            <Panel delay={550}>
              <Judul judul="Modul sistem" />
              <ul className="mt-3 divide-y divide-slate-100">
                {modul.map((m) => {
                  const Icon = m.icon;
                  return (
                    <li key={m.nama}>
                      <Link href={m.href} className="group flex items-center gap-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0a4da2]">
                        <span
                          className="flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105"
                          style={{ background: `${m.warna}14`, color: m.warna }}
                        >
                          <Icon size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-slate-800">{m.nama}</span>
                          <span className="block text-[11px] text-slate-400">{m.deskripsi}</span>
                        </span>
                        <ArrowUpRight size={17} className="text-slate-300 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Panel>

            <Panel delay={650}>
              <Judul judul="Akses cepat" />
              <div className="mt-4 space-y-5">
                {grupMenu.map((g) => (
                  <div key={g.judul}>
                    <p className="mb-2 text-[11px] font-bold text-slate-400">{g.judul}</p>
                    <div className="flex flex-wrap gap-2">
                      {g.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-[#0a4da2] hover:bg-[#0a4da2] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0a4da2]"
                          >
                            <Icon size={14} />
                            {item.nama}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        </div>
      </main>
    </div>
  );
}