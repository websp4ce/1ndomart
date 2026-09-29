"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import SidebarInventory from "@/app/components/SidebarInventory";
import {
  Package, Boxes, ArrowDownToLine, ArrowUpFromLine, Search, X, Trash2,
  CalendarDays, FileText, CheckCircle2, AlertCircle, ChevronDown,
} from "lucide-react";

type Produk = { id: number; kode_produk: string; nama: string; kategori: string | null; harga: number; stok: number };
type Riwayat = { id: number; produk_id: number; kode_produk: string; produk: string; jumlah: number; tanggal: string; keterangan: string | null };
type Tab = "stok" | "masuk" | "keluar";
type Jenis = "masuk" | "keluar";

const API_STOK = "/api/inventory/stok";
const hariIni = () => new Date().toISOString().split("T")[0];

// Kelas Tailwind yang dipakai berulang (sama dengan halaman produk)
const kartu = "rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)]";
const input = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50";
const cari = "rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100";
const btnBatal = "rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50";
const th = "px-5 py-3.5 font-semibold";

async function api(method: "GET" | "POST" | "DELETE", body?: object) {
  const res = await fetch(API_STOK, {
    method,
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data: any = {};
  try { data = await res.json(); } catch { throw new Error("Response server tidak valid."); }
  if (!res.ok) throw new Error(data.message || data.error || "Terjadi kesalahan pada server.");
  return data;
}

const getStatus = (s: number) =>
  s <= 0 ? { label: "Habis", cls: "bg-red-50 text-red-600", dot: "bg-red-500" }
  : s <= 5 ? { label: "Menipis", cls: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-500" }
  : { label: "Tersedia", cls: "bg-blue-50 text-blue-700", dot: "bg-blue-600" };

const fmtTanggal = (t: string) => {
  const d = new Date(t);
  return isNaN(d.getTime()) ? t : d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

const Garis = ({ className = "" }: { className?: string }) => (
  <div className={`flex h-1.5 ${className}`}>
    <span className="flex-1 bg-blue-600" /><span className="flex-1 bg-red-600" /><span className="flex-1 bg-yellow-400" />
  </div>
);

const Overlay = ({ children }: { children: ReactNode }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-950/40 p-4 backdrop-blur-[2px]">{children}</div>
);

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <label className="mb-1.5 block text-sm font-semibold text-slate-600">{label}</label>
    {children}
  </div>
);

export default function StokPage() {
  const router = useRouter();

  const [produk, setProduk] = useState<Produk[]>([]);
  const [masuk, setMasuk] = useState<Riwayat[]>([]);
  const [keluar, setKeluar] = useState<Riwayat[]>([]);

  const [memuat, setMemuat] = useState(true);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("stok");
  const [search, setSearch] = useState("");
  const [tanggalHeader, setTanggalHeader] = useState("");

  const [modal, setModal] = useState(false);
  const [tipe, setTipe] = useState<Jenis>("masuk");
  const [produkId, setProdukId] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [tanggal, setTanggal] = useState(hariIni());
  const [keterangan, setKeterangan] = useState("");

  const [konfirmasi, setKonfirmasi] = useState<{ id: number; jenis: Jenis; nama: string } | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; pesan: string } | null>(null);

  const info = (ok: boolean, pesan: string) => setToast({ ok, pesan });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------- LOAD DATA ---------- */

  const loadData = async () => {
    try {
      const data = await api("GET");
      setProduk(data.produk || []);
      setMasuk(data.masuk || []);
      setKeluar(data.keluar || []);
    } catch (e: any) {
      info(false, e.message || "Tidak dapat terhubung ke server.");
    } finally {
      setMemuat(false);
    }
  };

  /* ---------- LOGIN ---------- */

  useEffect(() => {
    const login = localStorage.getItem("login");
    const user = localStorage.getItem("indomart_user");

    let bolehMasuk = login === "inventory" || login === "admin";

    if (user) {
      try {
        const data = JSON.parse(user);
        if (data.role === "inventory" || data.role === "admin") bolehMasuk = true;
      } catch {
        // abaikan
      }
    }

    if (!bolehMasuk) return void router.push("/login");

    setTanggalHeader(new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  /* ---------- MODAL ---------- */

  const resetForm = () => {
    setProdukId("");
    setJumlah("");
    setTanggal(hariIni());
    setKeterangan("");
  };

  const openModal = (jenis: Jenis) => {
    setTipe(jenis);
    resetForm();
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    resetForm();
  };

  /* ---------- SIMPAN ---------- */

  const simpanStok = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!produkId || !jumlah || !tanggal) return info(false, "Produk, jumlah, dan tanggal wajib diisi.");

    const jumlahNumber = Number(jumlah);
    if (!Number.isFinite(jumlahNumber) || jumlahNumber <= 0) return info(false, "Jumlah stok harus lebih dari 0.");

    const dipilih = produk.find((p) => String(p.id) === produkId);
    if (tipe === "keluar" && dipilih && jumlahNumber > Number(dipilih.stok)) {
      return info(false, "Stok keluar tidak boleh lebih besar dari stok tersedia.");
    }

    try {
      setLoading(true);
      const data = await api("POST", {
        produk_id: Number(produkId),
        jumlah: jumlahNumber,
        tanggal,
        keterangan,
        tipe,
      });
      info(true, data.message || "Stok berhasil disimpan.");
      closeModal();
      await loadData();
    } catch (err: any) {
      info(false, err.message || "Terjadi kesalahan saat menyimpan stok.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- HAPUS ---------- */

  const hapusRiwayat = async () => {
    if (!konfirmasi) return;
    try {
      setLoading(true);
      const data = await api("DELETE", { id: konfirmasi.id, tipe: konfirmasi.jenis });
      info(true, data.message || "Data berhasil dihapus.");
      setKonfirmasi(null);
      await loadData();
    } catch (err: any) {
      info(false, err.message || "Terjadi kesalahan saat menghapus data.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- STATISTIK ---------- */

  const jumlahTotal = (data: Riwayat[]) => data.reduce((t, i) => t + Number(i.jumlah || 0), 0);
  const totalStok = useMemo(() => produk.reduce((t, i) => t + Number(i.stok || 0), 0), [produk]);
  const totalMasuk = useMemo(() => jumlahTotal(masuk), [masuk]);
  const totalKeluar = useMemo(() => jumlahTotal(keluar), [keluar]);

  const ringkasan = [
    { label: "Total produk", nilai: produk.length, icon: Package },
    { label: "Total stok", nilai: totalStok, icon: Boxes },
    { label: "Total stok masuk", nilai: totalMasuk, icon: ArrowDownToLine },
    { label: "Total stok keluar", nilai: totalKeluar, icon: ArrowUpFromLine },
  ];

  /* ---------- FILTER ---------- */

  const kw = search.toLowerCase().trim();

  const produkFilter = useMemo(
    () => produk.filter((i) => `${i.kode_produk} ${i.nama} ${i.kategori || ""}`.toLowerCase().includes(kw)),
    [produk, kw]
  );

  const riwayatFilter = (data: Riwayat[]) =>
    data.filter((i) => `${i.kode_produk} ${i.produk} ${i.keterangan || ""}`.toLowerCase().includes(kw));

  const dataRiwayat = tab === "masuk" ? riwayatFilter(masuk) : tab === "keluar" ? riwayatFilter(keluar) : [];
  const jumlahTampil = tab === "stok" ? produkFilter.length : dataRiwayat.length;
  const jumlahSemua = tab === "stok" ? produk.length : tab === "masuk" ? masuk.length : keluar.length;

  const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: "stok", label: "Stok barang", icon: Package },
    { id: "masuk", label: "Stok masuk", icon: ArrowDownToLine },
    { id: "keluar", label: "Stok keluar", icon: ArrowUpFromLine },
  ];

  const masukAktif = tipe === "masuk";

  return (
    <div className="flex min-h-screen overflow-x-clip bg-white text-slate-800">
      <style>{`
        @keyframes munculModal { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }
        @keyframes masukToast { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }
        .anim-modal { animation: munculModal .22s ease-out; }
        .anim-toast { animation: masukToast .25s ease-out; }
        @media (prefers-reduced-motion: reduce) { .anim-modal, .anim-toast { animation: none; } }
      `}</style>

      {/* SIDEBAR (ikut bergulir bersama halaman) */}
      <aside className="hidden w-[235px] shrink-0 self-stretch border-r border-slate-200 bg-white lg:block [&>*]:!static [&>*]:!border-r-0 [&_.fixed]:!static [&_.sticky]:!static">
        <SidebarInventory />
      </aside>

      <main className="min-w-0 flex-1">
        {/* HEADER */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
          <Garis className="!h-1" />
          <div className="flex h-16 items-center justify-between gap-4 px-5 lg:px-8">
            <div className="flex items-center gap-2.5 text-sm text-slate-500">
              <CalendarDays size={17} className="text-blue-700" />
              <span className="hidden sm:inline">{tanggalHeader || " "}</span>
              <span className="font-semibold text-blue-900 sm:hidden">Inventory</span>
            </div>
            <button onClick={() => router.push("/dashboard/inventory")} title="Ke dashboard inventory" className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white ring-2 ring-yellow-400 ring-offset-2">A</div>
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-sm font-bold text-blue-900">Admin</p>
                <p className="text-xs text-slate-400">Inventory</p>
              </div>
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1320px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          {/* HERO */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 px-7 py-8 text-white shadow-xl shadow-blue-100">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-yellow-400/20" />
            <div className="pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-red-500/20" />
            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-xs text-blue-200">Inventory › Stok Barang</p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Stok Barang</h1>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-blue-100">Kelola stok barang masuk dan barang keluar Indomart dengan mudah.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => openModal("masuk")} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3.5 text-sm font-bold text-blue-900 shadow-lg shadow-blue-950/20 transition hover:bg-yellow-300 focus:outline-none focus:ring-4 focus:ring-yellow-200/60">
                    <ArrowDownToLine size={18} strokeWidth={2.5} /> Stok masuk
                  </button>
                  <button onClick={() => openModal("keluar")} className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/20 transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300/50">
                    <ArrowUpFromLine size={18} strokeWidth={2.5} /> Stok keluar
                  </button>
                </div>
              </div>
              <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {ringkasan.map(({ label, nilai, icon: Icon }) => (
                  <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-blue-100">{label}</p>
                      <Icon size={17} className="text-yellow-300" />
                    </div>
                    <p className="mt-2 text-3xl font-bold tracking-tight">{memuat ? "..." : nilai.toLocaleString("id-ID")}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* MANAJEMEN STOK */}
          <section className={`${kartu} overflow-hidden`}>
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-blue-900">Manajemen stok</h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Menampilkan {jumlahTampil} dari {jumlahSemua} data
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* TAB */}
                <div className="flex rounded-xl bg-blue-50/70 p-1">
                  {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-none ${
                        tab === id ? "bg-blue-700 text-white shadow-md shadow-blue-100" : "text-slate-500 hover:text-blue-700"
                      }`}
                    >
                      <Icon size={15} /> {label}
                    </button>
                  ))}
                </div>

                {/* SEARCH */}
                <div className="relative">
                  <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={tab === "stok" ? "Cari produk, kode, kategori..." : "Cari riwayat stok..."}
                    className={`${cari} w-full sm:w-72`}
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {/* TAB STOK BARANG */}
              {tab === "stok" && (
                <table className="w-full min-w-[820px] text-left">
                  <thead>
                    <tr className="border-b-2 border-yellow-300 bg-blue-50/70 text-sm text-blue-900">
                      {["No", "Kode produk", "Nama produk", "Kategori", "Harga", "Stok", "Status"].map((h) => <th key={h} className={th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {memuat && [0, 1, 2, 3].map((i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td colSpan={7} className="px-5 py-4"><div className="h-10 animate-pulse rounded-lg bg-slate-100" /></td>
                      </tr>
                    ))}
                    {!memuat && produkFilter.map((p, i) => {
                      const s = getStatus(Number(p.stok || 0));
                      return (
                        <tr key={p.id} className="border-t border-slate-100 transition hover:bg-blue-50/40">
                          <td className="px-5 py-4 text-sm text-slate-400">{i + 1}</td>
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
                          <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-blue-900">Rp {Number(p.harga || 0).toLocaleString("id-ID")}</td>
                          <td className="px-5 py-4"><span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-800">{p.stok}</span></td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${s.cls}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />{s.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* TAB RIWAYAT MASUK / KELUAR */}
              {tab !== "stok" && (
                <table className="w-full min-w-[820px] text-left">
                  <thead>
                    <tr className="border-b-2 border-yellow-300 bg-blue-50/70 text-sm text-blue-900">
                      {["No", "Kode produk", "Produk", "Jumlah", "Tanggal", "Keterangan"].map((h) => <th key={h} className={th}>{h}</th>)}
                      <th className={`${th} text-center`}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memuat && [0, 1, 2, 3].map((i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td colSpan={7} className="px-5 py-4"><div className="h-10 animate-pulse rounded-lg bg-slate-100" /></td>
                      </tr>
                    ))}
                    {!memuat && dataRiwayat.map((r, i) => {
                      const isMasuk = tab === "masuk";
                      return (
                        <tr key={r.id} className="border-t border-slate-100 transition hover:bg-blue-50/40">
                          <td className="px-5 py-4 text-sm text-slate-400">{i + 1}</td>
                          <td className="whitespace-nowrap px-5 py-4 font-mono text-sm font-semibold text-blue-800">{r.kode_produk}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isMasuk ? "bg-blue-700 text-white" : "bg-red-600 text-white"}`}><Package size={17} /></div>
                              <span className="text-sm font-semibold text-slate-800">{r.produk}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`rounded-full px-3 py-1 text-sm font-bold ${isMasuk ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-600"}`}>
                              {isMasuk ? "+" : "-"}{r.jumlah}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                            <span className="inline-flex items-center gap-2"><CalendarDays size={14} className="text-slate-400" />{fmtTanggal(r.tanggal)}</span>
                          </td>
                          <td className="max-w-[240px] px-5 py-4">
                            <span className="block truncate text-sm text-slate-600">{r.keterangan || "-"}</span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-center">
                              <button
                                onClick={() => setKonfirmasi({ id: r.id, jenis: tab as Jenis, nama: `${r.produk} (${isMasuk ? "+" : "-"}${r.jumlah})` })}
                                title="Hapus"
                                className="rounded-lg p-2 text-red-600 transition hover:bg-red-100"
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* KOSONG */}
              {!memuat && jumlahTampil === 0 && (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                    {tab === "keluar" ? <ArrowUpFromLine size={30} className="text-blue-300" /> : tab === "masuk" ? <ArrowDownToLine size={30} className="text-blue-300" /> : <Package size={30} className="text-blue-300" />}
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    {search
                      ? "Data tidak ditemukan"
                      : tab === "stok"
                      ? "Belum ada data produk"
                      : `Belum ada riwayat stok ${tab}`}
                  </p>
                  {!search && tab !== "stok" && (
                    <p className="mt-1 text-xs text-slate-400">Klik "Stok {tab}" di bagian atas untuk menambahkan data pertama.</p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* TOAST */}
      {toast && (
        <div className="anim-toast fixed right-5 top-5 z-[200] flex max-w-sm items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-2xl">
          {toast.ok ? <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-blue-700" /> : <AlertCircle size={22} className="mt-0.5 shrink-0 text-red-600" />}
          <div>
            <p className="text-sm font-bold text-slate-800">{toast.ok ? "Berhasil" : "Gagal"}</p>
            <p className="mt-0.5 text-sm text-slate-500">{toast.pesan}</p>
          </div>
          <div className={`absolute inset-x-0 bottom-0 h-1 rounded-b-xl ${toast.ok ? "bg-yellow-400" : "bg-red-600"}`} />
        </div>
      )}

      {/* MODAL STOK MASUK / KELUAR */}
      {modal && (
        <Overlay>
          <form onSubmit={simpanStok} className="anim-modal w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <Garis />
            <div className="p-6">
              <div className="mb-5 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${masukAktif ? "bg-blue-700 text-white" : "bg-red-600 text-white"}`}>
                    {masukAktif ? <ArrowDownToLine size={20} /> : <ArrowUpFromLine size={20} />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-blue-900">{masukAktif ? "Tambah stok masuk" : "Tambah stok keluar"}</h2>
                    <p className="mt-0.5 text-sm text-slate-400">Masukkan data stok barang</p>
                  </div>
                </div>
                <button type="button" onClick={closeModal} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                <Field label="Produk">
                  <div className="relative">
                    <select value={produkId} onChange={(e) => setProdukId(e.target.value)} disabled={loading} className={`${input} appearance-none pr-10`}>
                      <option value="">Pilih produk</option>
                      {produk.map((p) => (
                        <option key={p.id} value={p.id}>{p.kode_produk} - {p.nama} (Stok: {p.stok})</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Jumlah">
                    <input type="number" min={1} value={jumlah} onChange={(e) => setJumlah(e.target.value)} placeholder="Contoh: 10" disabled={loading} className={input} />
                  </Field>
                  <Field label="Tanggal">
                    <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} disabled={loading} className={input} />
                  </Field>
                </div>

                <Field label="Keterangan">
                  <input
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder={masukAktif ? "Contoh: Barang dari gudang" : "Contoh: Barang rusak"}
                    disabled={loading}
                    className={input}
                  />
                </Field>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={closeModal} disabled={loading} className={btnBatal}>Batal</button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-md transition disabled:opacity-60 ${
                    masukAktif ? "bg-blue-700 shadow-blue-100 hover:bg-blue-800" : "bg-red-600 shadow-red-100 hover:bg-red-700"
                  }`}
                >
                  {loading ? "Menyimpan..." : "Simpan stok"}
                </button>
              </div>
            </div>
          </form>
        </Overlay>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {konfirmasi && (
        <Overlay>
          <div className="anim-modal w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50"><Trash2 size={26} className="text-red-600" /></div>
            <h3 className="text-lg font-bold text-blue-900">Hapus data ini?</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              <b className="text-slate-700">{konfirmasi.nama}</b> akan dihapus dan stok produk juga akan disesuaikan.
            </p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setKonfirmasi(null)} disabled={loading} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">Batal</button>
              <button onClick={hapusRiwayat} disabled={loading} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-100 transition hover:bg-red-700 disabled:opacity-60">{loading ? "Menghapus..." : "Ya, hapus"}</button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}