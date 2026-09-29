"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import SidebarWarehouse from "@/app/components/SidebarWarehouse";
import {
  Search, ClipboardCheck, PackageCheck, ClipboardList, MapPin, X, Plus,
  CheckCircle2, AlertCircle, AlertTriangle, Boxes, CircleCheck, Clock3, XCircle, Truck,
} from "lucide-react";

type Penerimaan = { id: number; nomor_penerimaan: string; tanggal: string; status: string; nomor_po: string; nama_supplier: string };
type QC = { id: number; tanggal: string; status: string; catatan: string; nomor_penerimaan: string; nomor_po: string };
type Putaway = { id: number; tanggal: string; status: string; catatan: string; qc_id: number };
type Produk = { id: number; kode_produk: string; nama: string; stok: number; kategori: string };
type Opname = { id: number; nomor_opname: string; tanggal: string; status: string; jumlah_item: number };

type Tab = "qc" | "putaway" | "opname";
const API = "/api/warehouse/pengelolaan";
const LOKASI = ["A-01", "A-02", "B-01", "B-02", "C-01"];
const hariIni = () => new Date().toISOString().split("T")[0];
const fmtTanggal = (t: string) => {
  const d = new Date(t);
  return isNaN(d.getTime()) ? t : d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

// Kelas Tailwind yang dipakai berulang (sama dengan halaman Pengadaan)
const kartu = "rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)]";
const input = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50";
const cari = "rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100";
const th = "px-5 py-3.5 font-semibold";
const tombolAksi = "flex items-center gap-1.5 rounded-lg bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100";

const Garis = ({ className = "" }: { className?: string }) => (
  <div className={`flex h-1.5 ${className}`}>
    <span className="flex-1 bg-blue-600" /><span className="flex-1 bg-red-600" /><span className="flex-1 bg-yellow-400" />
  </div>
);

function statusStyle(status: string) {
  if (["Selesai", "Lulus"].includes(status)) return { cls: "bg-blue-50 text-blue-700", dot: "bg-blue-600" };
  if (["Menunggu QC", "Menunggu"].includes(status)) return { cls: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-500" };
  if (["Proses", "Diproses", "Ditolak"].includes(status)) return { cls: "bg-red-50 text-red-600", dot: "bg-red-500" };
  return { cls: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };
}

const StatusBadge = ({ status, ikon }: { status: string; ikon?: boolean }) => {
  const s = statusStyle(status);
  const Ikon = ["Selesai", "Lulus"].includes(status) ? CircleCheck : status === "Ditolak" ? XCircle : Clock3;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${s.cls}`}>
      {ikon ? <Ikon size={12} /> : <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />}
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

const Modal = ({ judul, sub, onClose, lebar = "max-w-md", children }: { judul: string; sub: string; onClose: () => void; lebar?: string; children: ReactNode }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-950/40 p-4 backdrop-blur-[2px]">
    <div className={`anim-modal max-h-[92vh] w-full ${lebar} overflow-y-auto rounded-2xl bg-white shadow-2xl`}>
      <Garis />
      <div className="p-6">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-red-600">Warehouse operations</p>
            <h2 className="mt-1 text-xl font-bold text-blue-900">{judul}</h2>
            <p className="mt-1 text-sm text-slate-400">{sub}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  </div>
);

export default function PengelolaanPage() {
  const [tab, setTab] = useState<Tab>("qc");

  const [penerimaan, setPenerimaan] = useState<Penerimaan[]>([]);
  const [qc, setQC] = useState<QC[]>([]);
  const [putaway, setPutaway] = useState<Putaway[]>([]);
  const [produk, setProduk] = useState<Produk[]>([]);
  const [opname, setOpname] = useState<Opname[]>([]);

  const [memuat, setMemuat] = useState(true);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [selectedPenerimaan, setSelectedPenerimaan] = useState<Penerimaan | null>(null);
  const [selectedQC, setSelectedQC] = useState<QC | null>(null);
  const [showOpname, setShowOpname] = useState(false);

  const [tanggal, setTanggal] = useState(hariIni());
  const [lokasi, setLokasi] = useState(LOKASI[0]);
  const [jumlahPutaway, setJumlahPutaway] = useState<Record<number, number>>({});
  const [stokFisik, setStokFisik] = useState<Record<number, number>>({});

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
        setPenerimaan(data.penerimaan || []);
        setQC(data.qc || []);
        setPutaway(data.putaway || []);
        setProduk(data.produk || []);
        setOpname(data.opname || []);
      } else {
        info(false, data.message || "Gagal mengambil data.");
      }
    } catch (e) {
      console.error(e);
      info(false, "Tidak dapat terhubung ke server.");
    } finally {
      setMemuat(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* ---------- KIRIM DATA ---------- */

  async function kirim(body: object, sukses: () => void, gagal: string) {
    try {
      setLoading(true);
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) return info(false, data.message || gagal);
      info(true, data.message || "Berhasil disimpan.");
      sukses();
      await loadData();
    } catch (e) {
      console.error(e);
      info(false, gagal);
    } finally {
      setLoading(false);
    }
  }

  const simpanQC = (status: "Lulus" | "Ditolak") => {
    if (!selectedPenerimaan) return;
    kirim(
      {
        tipe: "qc",
        penerimaan_id: selectedPenerimaan.id,
        tanggal,
        status,
        catatan: status === "Lulus" ? "Barang sesuai dan kondisi baik." : "Barang tidak memenuhi pemeriksaan.",
      },
      () => setSelectedPenerimaan(null),
      "Gagal menyimpan Quality Check."
    );
  };

  const simpanPutaway = () => {
    if (!selectedQC) return;
    const items = produk
      .filter((p) => (jumlahPutaway[p.id] || 0) > 0)
      .map((p) => ({ produk_id: p.id, jumlah: jumlahPutaway[p.id], lokasi }));
    if (!items.length) return info(false, "Isi jumlah minimal satu produk.");
    kirim({ tipe: "putaway", qc_id: selectedQC.id, tanggal, items }, tutupPutaway, "Gagal menyimpan Putaway.");
  };

  const simpanOpname = () => {
    const nomor = `SO-${new Date().getFullYear()}-${String(opname.length + 1).padStart(4, "0")}`;
    const items = produk.map((p) => ({
      produk_id: p.id,
      stok_sistem: p.stok,
      stok_fisik: stokFisik[p.id] ?? p.stok,
      keterangan: "Hasil pengecekan fisik",
    }));
    kirim({ tipe: "opname", nomor_opname: nomor, tanggal, items, catatan: "Stock opname warehouse." }, tutupOpname, "Gagal menyimpan Stock Opname.");
  };

  const tutupPutaway = () => { setSelectedQC(null); setJumlahPutaway({}); setLokasi(LOKASI[0]); };
  const tutupOpname = () => { setShowOpname(false); setStokFisik({}); };

  /* ---------- FILTER & RINGKASAN ---------- */

  const kw = search.toLowerCase().trim();

  const antrianQC = useMemo(
    () => penerimaan.filter((x) => x.status !== "Selesai" && `${x.nomor_penerimaan} ${x.nomor_po} ${x.nama_supplier}`.toLowerCase().includes(kw)),
    [penerimaan, kw]
  );
  const antrianPutaway = useMemo(
    () => qc.filter((x) => x.status === "Lulus" && `${x.nomor_penerimaan} ${x.nomor_po} QC-${x.id}`.toLowerCase().includes(kw)),
    [qc, kw]
  );
  const filteredOpname = useMemo(() => opname.filter((x) => x.nomor_opname.toLowerCase().includes(kw)), [opname, kw]);

  const putawaySelesai = putaway.filter((x) => x.status === "Selesai").length;
  const opnameBerjalan = opname.filter((x) => x.status === "Proses").length;
  const selisihOpname = produk.filter((p) => stokFisik[p.id] !== undefined && stokFisik[p.id] !== p.stok).length;

  const ringkasan = [
    { label: "Total quality check", nilai: qc.length, note: "Pemeriksaan tercatat", icon: ClipboardCheck },
    { label: "QC menunggu", nilai: penerimaan.filter((x) => x.status !== "Selesai").length, note: "Barang belum diperiksa", icon: AlertTriangle },
    { label: "Putaway selesai", nilai: putawaySelesai, note: "Barang sudah ditempatkan", icon: PackageCheck },
    { label: "Opname berjalan", nilai: opnameBerjalan, note: "Sedang dihitung", icon: ClipboardList },
  ];

  const tabs = [
    { id: "qc", label: "Quality check", icon: ClipboardCheck },
    { id: "putaway", label: "Putaway", icon: PackageCheck },
    { id: "opname", label: "Stock opname", icon: ClipboardList },
  ] as const;

  const judul = {
    qc: { h: "Antrian Quality Check", p: "Periksa barang yang baru diterima", n: antrianQC.length, t: penerimaan.filter((x) => x.status !== "Selesai").length },
    putaway: { h: "Antrian Putaway", p: "Tempatkan barang yang sudah lulus QC", n: antrianPutaway.length, t: qc.filter((x) => x.status === "Lulus").length },
    opname: { h: "Riwayat Stock Opname", p: "Perbandingan stok sistem dan stok fisik", n: filteredOpname.length, t: opname.length },
  }[tab];

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
            <Boxes className="anim-melayang pointer-events-none absolute bottom-6 right-8 hidden h-28 w-28 text-white/15 sm:block" />

            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-xs text-blue-200">Warehouse › Pengelolaan Gudang</p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Pengelolaan Gudang</h1>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-blue-100">
                    Kelola Quality Check, Putaway, dan Stock Opname gudang Indomart dalam satu halaman yang rapi dan terpantau.
                  </p>
                </div>
                <button
                  onClick={() => { setTab("opname"); setShowOpname(true); }}
                  className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3.5 text-sm font-bold text-blue-900 shadow-lg shadow-blue-950/20 transition hover:bg-yellow-300 focus:outline-none focus:ring-4 focus:ring-yellow-200/60"
                >
                  <Plus size={18} strokeWidth={2.5} /> Mulai opname
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
                <h2 className="text-lg font-bold text-blue-900">{judul.h}</h2>
                <p className="mt-0.5 text-xs text-slate-400">{judul.p} · Menampilkan {judul.n} dari {judul.t} data</p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
                <div className="flex w-full rounded-xl bg-blue-50/70 p-1 md:w-auto">
                  {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => { setTab(id); setSearch(""); }}
                      className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition md:flex-none ${
                        tab === id ? "bg-blue-700 text-white shadow-md shadow-blue-100" : "text-slate-500 hover:text-blue-700"
                      }`}
                    >
                      <Icon size={15} /> {label}
                    </button>
                  ))}
                </div>

                <div className="relative md:min-w-[220px] md:flex-1">
                  <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nomor, PO, supplier..."
                    className={`${cari} w-full`}
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {/* QC */}
              {tab === "qc" && (
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b-2 border-yellow-300 bg-blue-50/70 text-sm text-blue-900">
                      {["No. Penerimaan", "PO", "Supplier", "Tanggal", "Status"].map((h) => <th key={h} className={th}>{h}</th>)}
                      <th className={`${th} text-center`}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memuat && <Skeleton col={6} />}
                    {!memuat && antrianQC.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100 transition hover:bg-blue-50/40">
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-sm font-semibold text-blue-800">{item.nomor_penerimaan}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-700">{item.nomor_po}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-white"><Truck size={17} /></div>
                            <span className="text-sm font-semibold text-slate-800">{item.nama_supplier}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{fmtTanggal(item.tanggal)}</td>
                        <td className="px-5 py-4"><StatusBadge status="Menunggu QC" ikon /></td>
                        <td className="px-5 py-4">
                          <div className="flex justify-center">
                            <button onClick={() => setSelectedPenerimaan(item)} className={tombolAksi}>
                              <ClipboardCheck size={14} /> Periksa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!memuat && !antrianQC.length && (
                      <Kosong col={6} ikon={<ClipboardCheck size={30} />} teks={search ? "Data tidak ditemukan" : "Tidak ada barang yang menunggu QC"} />
                    )}
                  </tbody>
                </table>
              )}

              {/* PUTAWAY */}
              {tab === "putaway" && (
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="border-b-2 border-yellow-300 bg-blue-50/70 text-sm text-blue-900">
                      {["QC", "Penerimaan", "Tanggal QC", "Status"].map((h) => <th key={h} className={th}>{h}</th>)}
                      <th className={`${th} text-center`}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memuat && <Skeleton col={5} />}
                    {!memuat && antrianPutaway.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100 transition hover:bg-blue-50/40">
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-sm font-semibold text-blue-800">QC-{item.id}</td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-800">{item.nomor_penerimaan}</p>
                          <p className="text-xs text-slate-400">{item.nomor_po}</p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{fmtTanggal(item.tanggal)}</td>
                        <td className="px-5 py-4"><StatusBadge status="Lulus" ikon /></td>
                        <td className="px-5 py-4">
                          <div className="flex justify-center">
                            <button onClick={() => setSelectedQC(item)} className={tombolAksi}>
                              <MapPin size={14} /> Putaway
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!memuat && !antrianPutaway.length && (
                      <Kosong col={5} ikon={<PackageCheck size={30} />} teks={search ? "Data tidak ditemukan" : "Belum ada barang yang siap di-putaway"} />
                    )}
                  </tbody>
                </table>
              )}

              {/* OPNAME */}
              {tab === "opname" && (
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="border-b-2 border-yellow-300 bg-blue-50/70 text-sm text-blue-900">
                      {["No. Opname", "Tanggal", "Item", "Status"].map((h) => <th key={h} className={th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {memuat && <Skeleton col={4} />}
                    {!memuat && filteredOpname.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100 transition hover:bg-blue-50/40">
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-sm font-semibold text-blue-800">{item.nomor_opname}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{fmtTanggal(item.tanggal)}</td>
                        <td className="px-5 py-4"><span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-800">{item.jumlah_item} produk</span></td>
                        <td className="px-5 py-4"><StatusBadge status={item.status} ikon /></td>
                      </tr>
                    ))}
                    {!memuat && !filteredOpname.length && (
                      <Kosong col={4} ikon={<ClipboardList size={30} />} teks={search ? "Opname tidak ditemukan" : "Belum ada Stock Opname"} />
                    )}
                  </tbody>
                </table>
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

      {/* MODAL QC */}
      {selectedPenerimaan && (
        <Modal judul="Quality Check" sub={selectedPenerimaan.nomor_penerimaan} onClose={() => setSelectedPenerimaan(null)}>
          <div className="mb-4 rounded-2xl border border-slate-100 bg-blue-50/60 p-4">
            <p className="text-xs text-slate-400">Supplier</p>
            <p className="mt-1 text-sm font-bold text-blue-900">{selectedPenerimaan.nama_supplier}</p>
            <p className="mt-1 text-xs text-slate-500">PO: {selectedPenerimaan.nomor_po}</p>
          </div>
          <Field label="Tanggal pemeriksaan">
            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} disabled={loading} className={input} />
          </Field>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button onClick={() => simpanQC("Ditolak")} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-red-100 transition hover:bg-red-700 disabled:opacity-60">
              <AlertTriangle size={16} /> Tolak
            </button>
            <button onClick={() => simpanQC("Lulus")} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-100 transition hover:bg-blue-800 disabled:opacity-60">
              <CheckCircle2 size={16} /> {loading ? "Memproses..." : "Lulus QC"}
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL PUTAWAY */}
      {selectedQC && (
        <Modal judul="Putaway barang" sub={`QC-${selectedQC.id} · ${selectedQC.nomor_penerimaan}`} onClose={tutupPutaway} lebar="max-w-2xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Lokasi gudang">
              <select value={lokasi} onChange={(e) => setLokasi(e.target.value)} disabled={loading} className={input}>
                {LOKASI.map((l) => <option key={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="Tanggal">
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} disabled={loading} className={input} />
            </Field>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="border-b border-yellow-300 bg-blue-50/70 px-4 py-3">
              <p className="text-sm font-bold text-blue-900">Jumlah yang ditempatkan</p>
              <p className="mt-0.5 text-xs text-slate-400">Isi jumlah untuk produk yang masuk ke lokasi {lokasi}</p>
            </div>
            <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
              {produk.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{p.nama}</p>
                    <p className="font-mono text-xs text-slate-400">{p.kode_produk}</p>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={jumlahPutaway[p.id] ?? ""}
                    onChange={(e) => setJumlahPutaway({ ...jumlahPutaway, [p.id]: Math.max(0, Number(e.target.value) || 0) })}
                    placeholder="0"
                    disabled={loading}
                    className={`${input} !w-24 !py-2 text-center`}
                  />
                </div>
              ))}
              {!produk.length && <p className="px-4 py-8 text-center text-sm text-slate-400">Belum ada produk.</p>}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={tutupPutaway} disabled={loading} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50">Batal</button>
            <button onClick={simpanPutaway} disabled={loading} className="rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-100 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Menyimpan..." : "Selesaikan putaway"}
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL OPNAME */}
      {showOpname && (
        <Modal judul="Mulai stock opname" sub="Masukkan hasil hitung fisik tiap produk" onClose={tutupOpname} lebar="max-w-3xl">
          <div className="max-w-xs">
            <Field label="Tanggal opname">
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} disabled={loading} className={input} />
            </Field>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-yellow-300 bg-blue-50/70 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-blue-900">{produk.length} produk akan diperiksa</p>
                <p className="mt-0.5 text-xs text-slate-400">Kosongkan kolom fisik jika stok sama dengan sistem</p>
              </div>
              {selisihOpname > 0 && (
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">{selisihOpname} selisih</span>
              )}
            </div>

            <div className="hidden grid-cols-[1fr_90px_110px_80px] gap-3 border-b border-slate-100 px-4 py-2 text-xs font-semibold text-slate-400 md:grid">
              <span>Produk</span><span className="text-center">Sistem</span><span className="text-center">Fisik</span><span className="text-center">Selisih</span>
            </div>

            <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
              {produk.map((p) => {
                const fisik = stokFisik[p.id];
                const selisih = fisik === undefined ? 0 : fisik - p.stok;
                return (
                  <div key={p.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-2.5 md:grid-cols-[1fr_90px_110px_80px]">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{p.nama}</p>
                      <p className="font-mono text-xs text-slate-400">{p.kode_produk}</p>
                    </div>
                    <span className="hidden text-center text-sm font-semibold text-slate-600 md:block">{p.stok}</span>
                    <input
                      type="number"
                      min={0}
                      value={fisik ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        const next = { ...stokFisik };
                        if (v === "") delete next[p.id];
                        else next[p.id] = Math.max(0, Number(v) || 0);
                        setStokFisik(next);
                      }}
                      placeholder={String(p.stok)}
                      disabled={loading}
                      className={`${input} !py-2 text-center`}
                    />
                    <span className={`hidden text-center text-sm font-bold md:block ${selisih === 0 ? "text-slate-300" : selisih > 0 ? "text-blue-700" : "text-red-600"}`}>
                      {selisih > 0 ? `+${selisih}` : selisih}
                    </span>
                  </div>
                );
              })}
              {!produk.length && <p className="px-4 py-8 text-center text-sm text-slate-400">Belum ada produk.</p>}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={tutupOpname} disabled={loading} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50">Batal</button>
            <button onClick={simpanOpname} disabled={loading || !produk.length} className="rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-100 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Menyimpan..." : "Simpan stock opname"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}