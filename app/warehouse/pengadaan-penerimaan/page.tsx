"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import SidebarWarehouse from "@/app/components/SidebarWarehouse";
import {
  Search, ShoppingCart, Truck, ClipboardCheck, PackageCheck, Plus, X,
  ChevronRight, CircleCheck, Clock3, Filter as FilterIcon,
  CheckCircle2, AlertCircle, Building2, Trash2,
} from "lucide-react";

type Produk = { id: number; kode_produk: string; nama: string; harga: number; stok: number; kategori: string };
type Supplier = { id: number; kode_supplier: string; nama_supplier: string };
type PO = { id: number; nomor_po: string; tanggal: string; status: string; total: number; nama_supplier: string; jumlah_item: number };
type Penerimaan = { id: number; nomor_penerimaan: string; nomor_po: string; tanggal: string; status: string; nama_supplier: string; keterangan: string };
type ItemPO = { produk_id: number; jumlah: number; harga: number };

const API = "/api/warehouse/pengadaan-penerimaan";
const hariIni = () => new Date().toISOString().split("T")[0];
const itemKosong = (): ItemPO => ({ produk_id: 0, jumlah: 1, harga: 0 });
const rupiah = (n: number) => `Rp ${Number(n || 0).toLocaleString("id-ID")}`;

const fmtTanggal = (t: string) => {
  const d = new Date(t);
  return isNaN(d.getTime()) ? t : d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

// Kelas Tailwind yang dipakai berulang (sama dengan halaman lain)
const kartu = "rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)]";
const input = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50";
const cari = "rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100";
const th = "px-5 py-3.5 font-semibold";

const Garis = ({ className = "" }: { className?: string }) => (
  <div className={`flex h-1.5 ${className}`}>
    <span className="flex-1 bg-blue-600" /><span className="flex-1 bg-red-600" /><span className="flex-1 bg-yellow-400" />
  </div>
);

function statusStyle(status: string) {
  if (status === "Selesai") return { cls: "bg-blue-50 text-blue-700", dot: "bg-blue-600" };
  if (["Menunggu QC", "Dipesan", "Menunggu Penerimaan"].includes(status)) return { cls: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-500" };
  if (["Diproses", "Sebagian Diterima"].includes(status)) return { cls: "bg-red-50 text-red-600", dot: "bg-red-500" };
  return { cls: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };
}

const StatusBadge = ({ status, ikon }: { status: string; ikon?: boolean }) => {
  const s = statusStyle(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${s.cls}`}>
      {ikon ? (status === "Selesai" ? <CircleCheck size={12} /> : <Clock3 size={12} />) : <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />}
      {status}
    </span>
  );
};

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <label className="mb-1.5 block text-sm font-semibold text-slate-600">{label}</label>
    {children}
  </div>
);

const Kosong = ({ col, ikon, teks }: { col: number; ikon: ReactNode; teks: string }) => (
  <tr>
    <td colSpan={col} className="py-16 text-center">
      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-300">{ikon}</div>
      <p className="text-sm font-medium text-slate-500">{teks}</p>
    </td>
  </tr>
);

const Skeleton = ({ col }: { col: number }) => (
  <>
    {[0, 1, 2].map((i) => (
      <tr key={i} className="border-t border-slate-100">
        <td colSpan={col} className="px-5 py-4"><div className="h-10 animate-pulse rounded-lg bg-slate-100" /></td>
      </tr>
    ))}
  </>
);

export default function PengadaanPenerimaanPage() {
  const [tab, setTab] = useState<"po" | "penerimaan">("po");

  const [produk, setProduk] = useState<Produk[]>([]);
  const [supplier, setSupplier] = useState<Supplier[]>([]);
  const [po, setPO] = useState<PO[]>([]);
  const [penerimaan, setPenerimaan] = useState<Penerimaan[]>([]);

  const [memuat, setMemuat] = useState(true);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua Status");

  const [showModal, setShowModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PO | null>(null);

  const [nomor, setNomor] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [tanggal, setTanggal] = useState(hariIni());
  const [items, setItems] = useState<ItemPO[]>([itemKosong()]);

  const [toast, setToast] = useState<{ ok: boolean; pesan: string } | null>(null);
  const info = (ok: boolean, pesan: string) => setToast({ ok, pesan });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------- LOAD DATA ---------- */

  async function loadData() {
    try {
      const res = await fetch(API, { cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        setProduk(data.produk || []);
        setSupplier(data.supplier || []);
        setPO(data.po || []);
        setPenerimaan(data.penerimaan || []);
      } else {
        info(false, data.message || "Gagal mengambil data.");
      }
    } catch (e) {
      console.error("Gagal mengambil data:", e);
      info(false, "Tidak dapat terhubung ke server.");
    } finally {
      setMemuat(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* ---------- ITEM PO ---------- */

  const tambahItem = () => setItems([...items, itemKosong()]);

  const hapusItem = (i: number) => {
    if (items.length > 1) setItems(items.filter((_, x) => x !== i));
  };

  const ubahProduk = (i: number, id: number) => {
    const p = produk.find((x) => x.id === id);
    const data = [...items];
    data[i] = { ...data[i], produk_id: id, harga: p?.harga || 0 };
    setItems(data);
  };

  const ubahItem = (i: number, k: "jumlah" | "harga", v: number) => {
    const data = [...items];
    data[i] = { ...data[i], [k]: v };
    setItems(data);
  };

  const totalPO = items.reduce((t, x) => t + (x.produk_id > 0 ? x.jumlah * x.harga : 0), 0);

  const resetForm = () => {
    setNomor("");
    setSupplierId("");
    setTanggal(hariIni());
    setItems([itemKosong()]);
  };

  const tutupModal = () => {
    setShowModal(false);
    resetForm();
  };

  /* ---------- SIMPAN PO ---------- */

  async function simpanPO(e: React.FormEvent) {
    e.preventDefault();

    if (!nomor.trim() || !supplierId || !tanggal) return info(false, "Lengkapi data PO.");

    const validItems = items.filter((x) => x.produk_id > 0 && x.jumlah > 0);
    if (!validItems.length) return info(false, "Tambahkan minimal satu produk.");

    try {
      setLoading(true);
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipe: "po",
          nomor_po: nomor.trim(),
          supplier_id: supplierId,
          tanggal,
          items: validItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) return info(false, data.message || "Gagal menyimpan Purchase Order.");

      info(true, data.message || "Purchase Order berhasil disimpan.");
      tutupModal();
      await loadData();
    } catch (err) {
      console.error(err);
      info(false, "Gagal menyimpan Purchase Order.");
    } finally {
      setLoading(false);
    }
  }

  /* ---------- BUAT PENERIMAAN ---------- */

  async function buatPenerimaan() {
    if (!selectedPO) return;

    const nomorPenerimaan = `PB-${new Date().getFullYear()}-${String(penerimaan.length + 1).padStart(3, "0")}`;

    try {
      setLoading(true);
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipe: "penerimaan",
          nomor_penerimaan: nomorPenerimaan,
          po_id: selectedPO.id,
          tanggal: hariIni(),
          keterangan: "Penerimaan dari PO",
        }),
      });

      const data = await res.json();
      if (!res.ok) return info(false, data.message || "Gagal membuat penerimaan.");

      info(true, data.message || "Penerimaan berhasil dibuat.");
      setSelectedPO(null);
      await loadData();
    } catch (err) {
      console.error(err);
      info(false, "Gagal membuat penerimaan.");
    } finally {
      setLoading(false);
    }
  }

  /* ---------- FILTER ---------- */

  const kw = search.toLowerCase().trim();

  const filteredPO = useMemo(
    () =>
      po.filter(
        (x) =>
          `${x.nomor_po} ${x.nama_supplier}`.toLowerCase().includes(kw) &&
          (statusFilter === "Semua Status" || x.status === statusFilter)
      ),
    [po, kw, statusFilter]
  );

  const filteredPenerimaan = useMemo(
    () =>
      penerimaan.filter(
        (x) =>
          `${x.nomor_penerimaan} ${x.nomor_po} ${x.nama_supplier}`.toLowerCase().includes(kw) &&
          (statusFilter === "Semua Status" || x.status === statusFilter)
      ),
    [penerimaan, kw, statusFilter]
  );

  const menungguPenerimaan = po.filter((x) => x.status === "Dipesan" || x.status === "Sebagian Diterima").length;
  const dalamQC = penerimaan.filter((x) => x.status === "Menunggu QC" || x.status === "Diproses").length;

  const ringkasan = [
    { label: "Total PO", nilai: po.length, note: "Aktif & selesai", icon: ClipboardCheck },
    { label: "Menunggu penerimaan", nilai: menungguPenerimaan, note: "PO belum diterima", icon: PackageCheck },
    { label: "Total penerimaan", nilai: penerimaan.length, note: "Barang telah diterima", icon: Truck },
    { label: "Dalam proses QC", nilai: dalamQC, note: "Menunggu quality check", icon: ClipboardCheck },
  ];

  const gantiTab = (t: "po" | "penerimaan") => {
    setTab(t);
    setSearch("");
    setStatusFilter("Semua Status");
    if (t === "po") setSelectedPO(null);
  };

  const opsiStatus = tab === "po" ? ["Draft", "Dipesan", "Sebagian Diterima", "Selesai"] : ["Menunggu QC", "Diproses", "Selesai"];
  const jumlahTampil = tab === "po" ? filteredPO.length : filteredPenerimaan.length;
  const jumlahSemua = tab === "po" ? po.length : penerimaan.length;

  return (
    <div className="flex min-h-screen bg-white text-slate-800">
      <style>{`
        @keyframes munculModal { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }
        @keyframes masukToast { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }
        @keyframes naikMuncul { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes melayang { 0%, 100% { transform: translateY(0) rotate(-6deg); } 50% { transform: translateY(-8px) rotate(-3deg); } }
        .anim-modal { animation: munculModal .22s ease-out; }
        .anim-toast { animation: masukToast .25s ease-out; }
        .anim-naik { animation: naikMuncul .5s cubic-bezier(.22,1,.36,1) both; }
        .anim-melayang { animation: melayang 5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .anim-modal, .anim-toast, .anim-naik, .anim-melayang { animation: none; } }
      `}</style>

      <SidebarWarehouse />

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1320px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          {/* HERO */}
          <section className="anim-naik relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 px-7 py-8 text-white shadow-xl shadow-blue-100">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-yellow-400/20" />
            <div className="pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-red-500/20" />
            <ShoppingCart className="anim-melayang pointer-events-none absolute bottom-6 right-8 hidden h-28 w-28 text-white/15 sm:block" />

            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-xs text-blue-200">Warehouse › Pengadaan & Penerimaan</p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Pengadaan & Penerimaan</h1>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-blue-100">
                    Kelola pengadaan barang dari supplier dan penerimaan barang masuk ke gudang Indomart dengan mudah dan terpantau.
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3.5 text-sm font-bold text-blue-900 shadow-lg shadow-blue-950/20 transition hover:bg-yellow-300 focus:outline-none focus:ring-4 focus:ring-yellow-200/60"
                >
                  <Plus size={18} strokeWidth={2.5} /> Buat PO baru
                </button>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {ringkasan.map(({ label, nilai, note, icon: Icon }) => (
                  <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-blue-100">{label}</p>
                      <Icon size={17} className="text-yellow-300" />
                    </div>
                    <p className="mt-2 text-3xl font-bold tracking-tight">{memuat ? "..." : nilai.toLocaleString("id-ID")}</p>
                    <p className="mt-0.5 text-[11px] text-blue-200">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* DAFTAR */}
          <section className={`${kartu} anim-naik overflow-hidden`} style={{ animationDelay: "120ms" }}>
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-blue-900">
                  {tab === "po" ? "Data Purchase Order" : "Data Penerimaan Barang"}
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  {tab === "po" ? "Daftar pesanan barang ke supplier" : "Daftar barang yang telah diterima"} · Menampilkan {jumlahTampil} dari {jumlahSemua} data
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
                {/* TAB */}
                <div className="flex w-full rounded-xl bg-blue-50/70 p-1 md:w-auto">
                  {([
                    { id: "po", label: "Purchase order", icon: ShoppingCart },
                    { id: "penerimaan", label: "Penerimaan barang", icon: Truck },
                  ] as const).map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => gantiTab(id)}
                      className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition md:flex-none ${
                        tab === id ? "bg-blue-700 text-white shadow-md shadow-blue-100" : "text-slate-500 hover:text-blue-700"
                      }`}
                    >
                      <Icon size={15} /> {label}
                    </button>
                  ))}
                </div>

                {/* SEARCH + FILTER */}
                <div className="relative md:min-w-[220px] md:flex-1">
                  <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={tab === "po" ? "Cari nomor PO, supplier..." : "Cari penerimaan, PO..."}
                    className={`${cari} w-full`}
                  />
                </div>
                <div className="relative md:w-52">
                  <FilterIcon size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${cari} w-full text-slate-600`}>
                    <option>Semua Status</option>
                    {opsiStatus.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {/* PURCHASE ORDER */}
              {tab === "po" && (
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b-2 border-yellow-300 bg-blue-50/70 text-sm text-blue-900">
                      {["No. PO", "Tanggal", "Supplier", "Item", "Status"].map((h) => <th key={h} className={th}>{h}</th>)}
                      <th className={`${th} text-center`}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memuat && <Skeleton col={6} />}
                    {!memuat && filteredPO.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100 transition hover:bg-blue-50/40">
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-sm font-semibold text-blue-800">{item.nomor_po}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{fmtTanggal(item.tanggal)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-700 text-white"><Building2 size={17} /></div>
                            <span className="text-sm font-semibold text-slate-800">{item.nama_supplier}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4"><span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-800">{item.jumlah_item}</span></td>
                        <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                        <td className="px-5 py-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => { gantiTab("penerimaan"); setSelectedPO(item); }}
                              title="Buat penerimaan dari PO ini"
                              className="flex items-center gap-1 rounded-lg p-2 text-blue-700 transition hover:bg-blue-100"
                            >
                              <ChevronRight size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!memuat && !filteredPO.length && (
                      <Kosong col={6} ikon={<ShoppingCart size={30} />} teks={search || statusFilter !== "Semua Status" ? "PO tidak ditemukan" : "Belum ada Purchase Order"} />
                    )}
                  </tbody>
                </table>
              )}

              {/* PENERIMAAN */}
              {tab === "penerimaan" && (
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="border-b-2 border-yellow-300 bg-blue-50/70 text-sm text-blue-900">
                      {["No. Penerimaan", "PO", "Supplier", "Status"].map((h) => <th key={h} className={th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {memuat && <Skeleton col={4} />}
                    {!memuat && filteredPenerimaan.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100 transition hover:bg-blue-50/40">
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-sm font-semibold text-blue-800">{item.nomor_penerimaan}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-700">{item.nomor_po}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-white"><Truck size={17} /></div>
                            <span className="text-sm font-semibold text-slate-800">{item.nama_supplier}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4"><StatusBadge status={item.status} ikon /></td>
                      </tr>
                    ))}
                    {!memuat && !filteredPenerimaan.length && (
                      <Kosong col={4} ikon={<Truck size={30} />} teks={search || statusFilter !== "Semua Status" ? "Penerimaan tidak ditemukan" : "Belum ada penerimaan barang"} />
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* DETAIL PO */}
          {selectedPO && tab === "penerimaan" && (
            <section className={`${kartu} anim-naik overflow-hidden border-yellow-300`}>
              <Garis />
              <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-yellow-50 to-white p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-blue-900 shadow-md shadow-yellow-100"><Truck size={22} /></div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-mono text-base font-bold text-blue-900">{selectedPO.nomor_po}</h3>
                      <StatusBadge status="Menunggu Penerimaan" />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{fmtTanggal(selectedPO.tanggal)} • {selectedPO.nama_supplier}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={buatPenerimaan}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-100 transition hover:bg-blue-800 disabled:opacity-60"
                  >
                    <PackageCheck size={16} /> {loading ? "Memproses..." : "Konfirmasi penerimaan"}
                  </button>
                  <button onClick={() => setSelectedPO(null)} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
                {[
                  { label: "Total item", nilai: selectedPO.jumlah_item, icon: ShoppingCart, tone: "bg-blue-700 text-white" },
                  { label: "Diterima", nilai: 0, icon: PackageCheck, tone: "bg-red-600 text-white" },
                  { label: "Dalam QC", nilai: 0, icon: ClipboardCheck, tone: "bg-yellow-400 text-blue-900" },
                  { label: "Sisa", nilai: selectedPO.jumlah_item, icon: Truck, tone: "bg-blue-700 text-white" },
                ].map(({ label, nilai, icon: Icon, tone }) => (
                  <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon size={17} /></div>
                    <div>
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="text-xl font-bold text-blue-900">{nilai}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
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

      {/* MODAL BUAT PO */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-950/40 p-4 backdrop-blur-[2px]">
          <form onSubmit={simpanPO} className="anim-modal max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <Garis />
            <div className="p-6">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-red-600">Warehouse procurement</p>
                  <h2 className="mt-1 text-xl font-bold text-blue-900">Buat Purchase Order</h2>
                  <p className="mt-1 text-sm text-slate-400">Buat pesanan barang kepada supplier</p>
                </div>
                <button type="button" onClick={tutupModal} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><X size={20} /></button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Nomor PO">
                  <input value={nomor} onChange={(e) => setNomor(e.target.value)} placeholder="PO-2026-0001" disabled={loading} className={input} />
                </Field>
                <Field label="Supplier">
                  <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} disabled={loading} className={input}>
                    <option value="">Pilih supplier</option>
                    {supplier.map((x) => <option key={x.id} value={x.id}>{x.nama_supplier}</option>)}
                  </select>
                </Field>
                <Field label="Tanggal">
                  <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} disabled={loading} className={input} />
                </Field>
              </div>

              {/* PRODUK DIPESAN */}
              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-yellow-300 bg-blue-50/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-blue-900">Produk yang dipesan</p>
                    <p className="mt-0.5 text-xs text-slate-400">Pilih produk dari Inventory</p>
                  </div>
                  <button type="button" onClick={tambahItem} className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-red-100 transition hover:bg-red-700">
                    <Plus size={14} /> Tambah produk
                  </button>
                </div>

                <div className="space-y-3 p-4">
                  <div className="hidden grid-cols-[1fr_120px_160px_40px] gap-3 px-3 text-xs font-semibold text-slate-400 md:grid">
                    <span>Produk</span><span>Jumlah</span><span>Harga satuan</span><span />
                  </div>

                  {items.map((item, i) => (
                    <div key={i} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-white p-3 transition hover:border-blue-200 md:grid-cols-[1fr_120px_160px_40px] md:items-center">
                      <select
                        value={item.produk_id}
                        onChange={(e) => ubahProduk(i, Number(e.target.value))}
                        disabled={loading}
                        className={`${input} !py-2.5`}
                      >
                        <option value={0}>Pilih produk inventory</option>
                        {produk.map((p) => <option key={p.id} value={p.id}>{p.kode_produk} - {p.nama}</option>)}
                      </select>

                      <input
                        type="number"
                        min={1}
                        value={item.jumlah}
                        onChange={(e) => ubahItem(i, "jumlah", Number(e.target.value))}
                        disabled={loading}
                        placeholder="Jumlah"
                        className={`${input} !py-2.5`}
                      />

                      <input
                        type="number"
                        min={0}
                        value={item.harga}
                        onChange={(e) => ubahItem(i, "harga", Number(e.target.value))}
                        disabled={loading}
                        placeholder="Harga"
                        className={`${input} !py-2.5`}
                      />

                      <button
                        type="button"
                        onClick={() => hapusItem(i)}
                        disabled={items.length === 1}
                        title="Hapus produk"
                        className="flex h-10 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-3">
                  <span className="text-sm text-slate-500">Estimasi total</span>
                  <span className="text-lg font-bold text-blue-900">{rupiah(totalPO)}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={tutupModal} disabled={loading} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50">
                  Batal
                </button>
                <button type="submit" disabled={loading} className="rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-100 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? "Menyimpan..." : "Simpan purchase order"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}