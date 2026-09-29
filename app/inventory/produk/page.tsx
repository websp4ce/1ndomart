"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import SidebarInventory from "@/app/components/SidebarInventory";
import {
  Package, Tags, Boxes, AlertTriangle, Plus, Pencil, Trash2, X, Search, Filter,
  ChevronLeft, ChevronRight, CalendarDays, Utensils, Coffee, Home, HeartPulse,
  Sparkles, MoreHorizontal, CheckCircle2, AlertCircle, Menu,
} from "lucide-react";

type Produk = { id: number; kode_produk: string; nama: string; kategori_id: number | null; kategori: string | null; harga: number; stok: number };
type Kategori = { id: number; nama: string };

const formKosong = { kode_produk: "", nama: "", kategori_id: "", harga: "", stok: "" };
const PER_PAGE = 8;

// Satu API untuk produk dan kategori
const API_PRODUK = "/api/inventory/produk";
const API_KATEGORI = "/api/inventory/produk?tipe=kategori";

const ikon = [Utensils, Coffee, Home, HeartPulse, Sparkles, MoreHorizontal];
const warna = ["bg-blue-700 text-white", "bg-red-600 text-white", "bg-yellow-400 text-blue-900"];

// Kelas Tailwind yang dipakai berulang
const kartu = "rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)]";
const input = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50";
const cari = "rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100";
const btnBatal = "rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50";
const btnBiru = "rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-100 transition hover:bg-blue-800 disabled:opacity-60";
const btnPage = "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";

async function api(url: string, method: "GET" | "POST" | "PUT" | "DELETE", body?: object) {
  const res = await fetch(url, { method, cache: "no-store", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  let data: any = {};
  try { data = await res.json(); } catch { throw new Error("Response server tidak valid."); }
  if (!res.ok) throw new Error(data.message || data.error || "Terjadi kesalahan pada server.");
  return data;
}

const getStatus = (s: number) =>
  s <= 0 ? { label: "Habis", cls: "bg-red-50 text-red-600", dot: "bg-red-500" }
  : s <= 20 ? { label: "Menipis", cls: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-500" }
  : { label: "Tersedia", cls: "bg-blue-50 text-blue-700", dot: "bg-blue-600" };

const Garis = ({ className = "" }: { className?: string }) => (
  <div className={`flex h-1.5 ${className}`}>
    <span className="flex-1 bg-blue-600" /><span className="flex-1 bg-red-600" /><span className="flex-1 bg-yellow-400" />
  </div>
);

const Overlay = ({ children }: { children: ReactNode }) => (
  <div className="fixed inset-0 z-[100] flex items-end justify-center bg-blue-950/40 p-3 backdrop-blur-[2px] sm:items-center sm:p-4">{children}</div>
);

// Modal form: dipakai untuk produk dan kategori
const Modal = ({ judul, sub, onClose, onSubmit, loading, tombol, maxW = "max-w-md", children }: {
  judul: string; sub: string; onClose: () => void; onSubmit: (e: React.FormEvent) => void;
  loading: boolean; tombol: string; maxW?: string; children: ReactNode;
}) => (
  <Overlay>
    <form onSubmit={onSubmit} className={`anim-modal max-h-[92vh] w-full ${maxW} overflow-y-auto rounded-2xl bg-white shadow-2xl`}>
      <Garis />
      <div className="p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-blue-900 sm:text-xl">{judul}</h2>
            <p className="mt-1 text-sm text-slate-400">{sub}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><X size={20} /></button>
        </div>
        {children}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={loading} className={btnBatal}>Batal</button>
          <button type="submit" disabled={loading} className={btnBiru}>{loading ? "Menyimpan..." : tombol}</button>
        </div>
      </div>
    </form>
  </Overlay>
);

const Field = ({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) => (
  <div className={className}>
    <label className="mb-1.5 block text-sm font-semibold text-slate-600">{label}</label>
    {children}
  </div>
);

export default function ProdukPage() {
  const router = useRouter();
  const [produk, setProduk] = useState<Produk[]>([]);
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [loading, setLoading] = useState(false);
  const [tanggal, setTanggal] = useState("");
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("");
  const [page, setPage] = useState(1);
  const [showProduk, setShowProduk] = useState(false);
  const [showKategori, setShowKategori] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(formKosong);
  const [namaKategori, setNamaKategori] = useState("");
  const [konfirmasi, setKonfirmasi] = useState<{ judul: string; isi: ReactNode; aksi: () => Promise<void> } | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; pesan: string } | null>(null);
  const [menuBuka, setMenuBuka] = useState(false);

  const info = (ok: boolean, pesan: string) => setToast({ ok, pesan });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const loadData = async () => {
    try {
      const data = await api(API_PRODUK, "GET");
      setProduk(data.produk || []);
      setKategori(data.kategori || []);
    } catch (e: any) {
      info(false, e.message || "Tidak dapat terhubung ke server.");
    } finally {
      setMemuat(false);
    }
  };

  useEffect(() => {
    const login = localStorage.getItem("login");
    if (login !== "inventory" && login !== "admin") return void router.push("/login");
    setTanggal(new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => setPage(1), [search, filterKategori]);

  const produkFilter = useMemo(() => {
    const kw = search.toLowerCase().trim();
    return produk.filter((i) =>
      [i.nama, i.kode_produk, i.kategori || ""].some((v) => v.toLowerCase().includes(kw)) &&
      (!filterKategori || i.kategori === filterKategori)
    );
  }, [produk, search, filterKategori]);

  const totalPage = Math.max(1, Math.ceil(produkFilter.length / PER_PAGE));
  const tampil = produkFilter.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const mulai = Math.max(1, Math.min(page - 2, totalPage - 4));
  const halaman = Array.from({ length: Math.min(5, totalPage) }, (_, i) => mulai + i);

  const ringkasan = [
    { label: "Total produk", nilai: produk.length, icon: Package },
    { label: "Total kategori", nilai: kategori.length, icon: Tags },
    { label: "Total stok", nilai: produk.reduce((t, i) => t + Number(i.stok || 0), 0), icon: Boxes },
    { label: "Perlu restok", nilai: produk.filter((i) => Number(i.stok) <= 20).length, icon: AlertTriangle },
  ];

  // Jalankan aksi async dengan loading + notifikasi
  const proses = async (aksi: () => Promise<string>, selesai: () => void) => {
    try {
      setLoading(true);
      info(true, await aksi());
      selesai();
      await loadData();
    } catch (e: any) {
      info(false, e.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const tutupProduk = () => { setShowProduk(false); setEditId(null); setForm(formKosong); };
  const tutupKategori = () => { setShowKategori(false); setNamaKategori(""); };

  const bukaProduk = (item?: Produk) => {
    setEditId(item?.id ?? null);
    setForm(item ? { kode_produk: item.kode_produk, nama: item.nama, kategori_id: item.kategori_id ? String(item.kategori_id) : "", harga: String(item.harga), stok: String(item.stok) } : formKosong);
    setShowProduk(true);
  };

  const simpanProduk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.kode_produk.trim() || !form.nama.trim()) return info(false, "Kode produk dan nama produk wajib diisi.");
    proses(async () => (await api(API_PRODUK, editId ? "PUT" : "POST", {
      id: editId, kode_produk: form.kode_produk.trim(), nama: form.nama.trim(),
      kategori_id: form.kategori_id ? Number(form.kategori_id) : null,
      harga: Number(form.harga) || 0, stok: Number(form.stok) || 0,
    })).message || "Produk berhasil disimpan.", tutupProduk);
  };

  const tambahKategori = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKategori.trim()) return info(false, "Nama kategori wajib diisi.");
    proses(async () => (await api(API_KATEGORI, "POST", { nama: namaKategori.trim() })).message || "Kategori berhasil ditambahkan.", tutupKategori);
  };

  const mintaHapus = (judul: string, nama: string, url: string, id: number, ekstra?: () => void) =>
    setKonfirmasi({
      judul,
      isi: <><b className="text-slate-700">{nama}</b> akan dihapus. Tindakan ini tidak bisa dibatalkan.</>,
      aksi: async () => {
        const data = await api(url, "DELETE", { id });
        ekstra?.();
        info(true, data.message || "Data berhasil dihapus.");
      },
    });

  const jalankan = async () => {
    if (!konfirmasi) return;
    try {
      setLoading(true);
      await konfirmasi.aksi();
      setKonfirmasi(null);
      await loadData();
    } catch (e: any) {
      info(false, e.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const set = (k: keyof typeof formKosong) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const Aksi = ({ p }: { p: Produk }) => (
    <div className="flex justify-center gap-1">
      <button onClick={() => bukaProduk(p)} title="Edit produk" aria-label="Edit produk" className="rounded-lg p-2 text-blue-700 transition hover:bg-blue-100"><Pencil size={17} /></button>
      <button onClick={() => mintaHapus("Hapus produk?", p.nama, API_PRODUK, p.id)} title="Hapus produk" aria-label="Hapus produk" className="rounded-lg p-2 text-red-600 transition hover:bg-red-100"><Trash2 size={17} /></button>
    </div>
  );

  return (
    <div className="flex min-h-screen overflow-x-clip bg-white text-slate-800">
      <style>{`
        @keyframes munculModal { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }
        @keyframes masukToast { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: none; } }
        .anim-modal { animation: munculModal .22s ease-out; }
        .anim-toast { animation: masukToast .25s ease-out; }
        /* tombol hapus kategori: muncul saat hover di desktop, selalu terlihat di layar sentuh */
        @media (hover: hover) { .hapus-kat { display: none; } .group:hover .hapus-kat, .hapus-kat:focus { display: block; } }
        @media (prefers-reduced-motion: reduce) { .anim-modal, .anim-toast { animation: none; } }
      `}</style>

      {/* SIDEBAR: tetap di lg+, drawer di HP/tablet (tombol ☰ ada di header) */}
      <SidebarInventory open={menuBuka} onClose={() => setMenuBuka(false)} />

      <main className="min-w-0 flex-1">
        {/* HEADER */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
          <Garis className="!h-1" />
          <div className="flex h-14 items-center justify-between gap-3 px-3 sm:h-16 sm:gap-4 sm:px-5 lg:px-8">
            <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500 sm:gap-2.5">
              <button
                onClick={() => setMenuBuka(true)}
                aria-label="Buka menu"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-blue-900 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-100 lg:hidden"
              >
                <Menu size={22} />
              </button>
              <CalendarDays size={17} className="hidden shrink-0 text-blue-700 sm:block" />
              <span className="hidden truncate sm:inline">{tanggal || " "}</span>
              <span className="truncate font-semibold text-blue-900 sm:hidden">Inventory</span>
            </div>
            <button onClick={() => router.push("/dashboard/inventory")} title="Ke dashboard inventory" className="flex shrink-0 items-center gap-3 rounded-xl px-1 py-1.5 transition hover:bg-slate-50 sm:px-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white ring-2 ring-yellow-400 ring-offset-2 sm:h-10 sm:w-10">A</div>
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-sm font-bold text-blue-900">Admin</p>
                <p className="text-xs text-slate-400">Inventory</p>
              </div>
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1320px] space-y-6 px-3 py-5 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8">
          {/* HERO */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 px-4 py-6 text-white shadow-xl shadow-blue-100 sm:rounded-3xl sm:px-7 sm:py-8">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-yellow-400/20" />
            <div className="pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-red-500/20" />
            <div className="relative">
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-5">
                <div className="min-w-0">
                  <p className="text-xs text-blue-200">Inventory › Produk & Kategori</p>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">Produk & Kategori</h1>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-blue-100">Kelola data produk dan kategori produk Indomart dengan mudah.</p>
                </div>
                <button onClick={() => bukaProduk()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-blue-900 shadow-lg shadow-blue-950/20 transition hover:bg-yellow-300 focus:outline-none focus:ring-4 focus:ring-yellow-200/60 sm:w-auto sm:py-3.5">
                  <Plus size={18} strokeWidth={2.5} /> Tambah produk
                </button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-7 sm:gap-3 lg:grid-cols-4">
                {ringkasan.map(({ label, nilai, icon: Icon }) => (
                  <div key={label} className="min-w-0 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-blue-100 sm:text-sm">{label}</p>
                      <Icon size={17} className="shrink-0 text-yellow-300" />
                    </div>
                    <p className="mt-2 truncate text-2xl font-bold tracking-tight sm:text-3xl">{memuat ? "..." : nilai.toLocaleString("id-ID")}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* KATEGORI */}
          <section className={`${kartu} p-4 sm:p-5`}>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-blue-900 sm:text-lg">Kategori</h2>
                <p className="mt-0.5 text-xs text-slate-400">Klik kategori untuk memfilter daftar produk di bawah.</p>
              </div>
              <button onClick={() => setShowKategori(true)} className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-100 transition hover:bg-red-700">
                <Plus size={16} /> Tambah kategori
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-6">
              {!memuat && kategori.length === 0 && (
                <div className="col-span-full py-6 text-center text-sm text-slate-400">Belum ada kategori. Klik "Tambah kategori" untuk membuat yang pertama.</div>
              )}
              {kategori.map((k, i) => {
                const Icon = ikon[i % ikon.length];
                const aktif = filterKategori === k.nama;
                return (
                  <div key={k.id} onClick={() => setFilterKategori(aktif ? "" : k.nama)}
                    className={`group relative flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition ${aktif ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/40"}`}>
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${warna[i % 3]}`}><Icon size={18} /></div>
                    <div className="min-w-0 flex-1 pr-5">
                      <p className="truncate text-sm font-semibold text-slate-700">{k.nama}</p>
                      <p className="text-xs text-slate-400">{produk.filter((p) => p.kategori === k.nama).length} produk</p>
                    </div>
                    <button title="Hapus kategori" aria-label="Hapus kategori"
                      onClick={(e) => { e.stopPropagation(); mintaHapus("Hapus kategori?", k.nama, API_KATEGORI, k.id, () => filterKategori === k.nama && setFilterKategori("")); }}
                      className="hapus-kat absolute right-1.5 top-1.5 rounded-md p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* DAFTAR PRODUK */}
          <section className={`${kartu} overflow-hidden`}>
            <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-bold text-blue-900 sm:text-lg">Daftar produk</h2>
                <p className="mt-0.5 text-xs text-slate-400">Menampilkan {produkFilter.length} dari {produk.length} produk</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Cari produk, kode, atau kategori..." value={search} onChange={(e) => setSearch(e.target.value)} className={`${cari} w-full sm:w-72`} />
                </div>
                <div className="relative">
                  <Filter size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)} className={`${cari} w-full text-slate-600 sm:w-48`}>
                    <option value="">Semua kategori</option>
                    {kategori.map((k) => <option key={k.id} value={k.nama}>{k.nama}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* TABEL (md+) */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b-2 border-yellow-300 bg-blue-50/70 text-sm text-blue-900">
                    {["No", "Kode produk", "Nama produk", "Kategori", "Harga", "Stok", "Status"].map((h) => <th key={h} className="px-5 py-3.5 font-semibold">{h}</th>)}
                    <th className="px-5 py-3.5 text-center font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {memuat && [0, 1, 2, 3].map((i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td colSpan={8} className="px-5 py-4"><div className="h-10 animate-pulse rounded-lg bg-slate-100" /></td>
                    </tr>
                  ))}
                  {!memuat && tampil.map((p, i) => {
                    const s = getStatus(Number(p.stok));
                    return (
                      <tr key={p.id} className="border-t border-slate-100 transition hover:bg-blue-50/40">
                        <td className="px-5 py-4 text-sm text-slate-400">{(page - 1) * PER_PAGE + i + 1}</td>
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-sm font-semibold text-blue-800">{p.kode_produk}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-700 text-white"><Package size={17} /></div>
                            <span className="text-sm font-semibold text-slate-800">{p.nama}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {p.kategori ? <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{p.kategori}</span> : <span className="text-sm text-slate-300">-</span>}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-blue-900">Rp {Number(p.harga).toLocaleString("id-ID")}</td>
                        <td className="px-5 py-4"><span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-800">{p.stok}</span></td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${s.cls}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />{s.label}
                          </span>
                        </td>
                        <td className="px-5 py-4"><Aksi p={p} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* KARTU (HP) */}
            <div className="divide-y divide-slate-100 md:hidden">
              {memuat && [0, 1, 2].map((i) => <div key={i} className="p-4"><div className="h-20 animate-pulse rounded-lg bg-slate-100" /></div>)}
              {!memuat && tampil.map((p) => {
                const s = getStatus(Number(p.stok));
                return (
                  <div key={p.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-700 text-white"><Package size={17} /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{p.nama}</p>
                        <p className="truncate font-mono text-xs font-semibold text-blue-800">{p.kode_produk}</p>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />{s.label}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                      {p.kategori && <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{p.kategori}</span>}
                      <span className="text-sm font-bold text-blue-900">Rp {Number(p.harga).toLocaleString("id-ID")}</span>
                      <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-800">Stok {p.stok}</span>
                      <div className="ml-auto"><Aksi p={p} /></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {!memuat && tampil.length === 0 && (
              <div className="py-16 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50"><Package size={30} className="text-blue-300" /></div>
                <p className="text-sm font-medium text-slate-500">{search || filterKategori ? "Produk tidak ditemukan" : "Belum ada data produk"}</p>
                {!search && !filterKategori && <p className="mt-1 px-4 text-xs text-slate-400">Klik "Tambah produk" untuk menambahkan produk pertama.</p>}
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-sm text-slate-500">
                Menampilkan <b className="text-blue-900">{produkFilter.length ? (page - 1) * PER_PAGE + 1 : 0}–{Math.min(page * PER_PAGE, produkFilter.length)}</b> dari <b className="text-blue-900">{produkFilter.length}</b> data
              </p>
              <div className="flex items-center gap-1.5">
                <button disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Halaman sebelumnya" className={`${btnPage} border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-700`}><ChevronLeft size={17} /></button>
                {halaman.map((n) => (
                  <button key={n} onClick={() => setPage(n)} className={`${btnPage} ${page === n ? "bg-blue-700 text-white shadow-md shadow-blue-100" : "border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-700"}`}>{n}</button>
                ))}
                <button disabled={page === totalPage} onClick={() => setPage(page + 1)} aria-label="Halaman berikutnya" className={`${btnPage} border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-700`}><ChevronRight size={17} /></button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* TOAST */}
      {toast && (
        <div className="anim-toast fixed inset-x-3 top-3 z-[200] flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-2xl sm:inset-x-auto sm:right-5 sm:top-5 sm:max-w-sm">
          {toast.ok ? <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-blue-700" /> : <AlertCircle size={22} className="mt-0.5 shrink-0 text-red-600" />}
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800">{toast.ok ? "Berhasil" : "Gagal"}</p>
            <p className="mt-0.5 text-sm text-slate-500">{toast.pesan}</p>
          </div>
          <div className={`absolute inset-x-0 bottom-0 h-1 rounded-b-xl ${toast.ok ? "bg-yellow-400" : "bg-red-600"}`} />
        </div>
      )}

      {/* MODAL PRODUK */}
      {showProduk && (
        <Modal judul={editId ? "Edit produk" : "Tambah produk"} sub="Isi data produk dengan lengkap" onClose={tutupProduk} onSubmit={simpanProduk} loading={loading} tombol={editId ? "Simpan perubahan" : "Tambah produk"} maxW="max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Kode produk" className="col-span-2"><input value={form.kode_produk} onChange={set("kode_produk")} placeholder="Contoh: PRD001" disabled={loading} className={input} /></Field>
            <Field label="Nama produk" className="col-span-2"><input value={form.nama} onChange={set("nama")} placeholder="Nama produk" disabled={loading} className={input} /></Field>
            <Field label="Kategori" className="col-span-2">
              <select value={form.kategori_id} onChange={set("kategori_id")} disabled={loading} className={input}>
                <option value="">Pilih kategori</option>
                {kategori.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </Field>
            <Field label="Harga"><input type="number" min={0} value={form.harga} onChange={set("harga")} placeholder="0" disabled={loading} className={input} /></Field>
            <Field label="Stok"><input type="number" min={0} value={form.stok} onChange={set("stok")} placeholder="0" disabled={loading} className={input} /></Field>
          </div>
        </Modal>
      )}

      {/* MODAL KATEGORI */}
      {showKategori && (
        <Modal judul="Tambah kategori" sub="Tambahkan kategori produk baru" onClose={tutupKategori} onSubmit={tambahKategori} loading={loading} tombol="Simpan">
          <Field label="Nama kategori"><input value={namaKategori} onChange={(e) => setNamaKategori(e.target.value)} placeholder="Contoh: Makanan" disabled={loading} className={input} /></Field>
        </Modal>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {konfirmasi && (
        <Overlay>
          <div className="anim-modal w-full max-w-sm rounded-2xl bg-white p-5 text-center shadow-2xl sm:p-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50"><Trash2 size={26} className="text-red-600" /></div>
            <h3 className="text-lg font-bold text-blue-900">{konfirmasi.judul}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{konfirmasi.isi}</p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setKonfirmasi(null)} disabled={loading} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">Batal</button>
              <button onClick={jalankan} disabled={loading} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-100 transition hover:bg-red-700 disabled:opacity-60">{loading ? "Menghapus..." : "Ya, hapus"}</button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}