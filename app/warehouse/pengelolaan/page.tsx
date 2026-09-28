"use client";

import { useEffect, useState } from "react";
import SidebarWarehouse from "@/app/components/SidebarWarehouse";

import {
  Bell,
  CheckCircle2,
  ClipboardCheck,
  PackageCheck,
  ClipboardList,
  Search,
  Plus,
  X,
  MapPin,
  AlertTriangle,
  Boxes,
} from "lucide-react";

type Penerimaan = {
  id: number;
  nomor_penerimaan: string;
  tanggal: string;
  status: string;
  nomor_po: string;
  nama_supplier: string;
};

type QC = {
  id: number;
  tanggal: string;
  status: string;
  catatan: string;
  nomor_penerimaan: string;
  nomor_po: string;
};

type Putaway = {
  id: number;
  tanggal: string;
  status: string;
  catatan: string;
  qc_id: number;
};

type Produk = {
  id: number;
  kode_produk: string;
  nama: string;
  stok: number;
  kategori: string;
};

type Opname = {
  id: number;
  nomor_opname: string;
  tanggal: string;
  status: string;
  jumlah_item: number;
};

export default function PengelolaanPage() {
  const [tab, setTab] = useState<"qc" | "putaway" | "opname">("qc");

  const [penerimaan, setPenerimaan] = useState<Penerimaan[]>([]);
  const [qc, setQC] = useState<QC[]>([]);
  const [putaway, setPutaway] = useState<Putaway[]>([]);
  const [produk, setProduk] = useState<Produk[]>([]);
  const [opname, setOpname] = useState<Opname[]>([]);

  const [search, setSearch] = useState("");

  const [showQC, setShowQC] = useState(false);
  const [showPutaway, setShowPutaway] = useState(false);
  const [showOpname, setShowOpname] = useState(false);

  const [selectedPenerimaan, setSelectedPenerimaan] =
    useState<Penerimaan | null>(null);

  const [selectedQC, setSelectedQC] = useState<QC | null>(null);

  const [tanggal, setTanggal] = useState(
    new Date().toISOString().split("T")[0]
  );

  async function loadData() {
    const res = await fetch("/api/warehouse/pengelolaan");

    const data = await res.json();

    if (data.success) {
      setPenerimaan(data.penerimaan || []);
      setQC(data.qc || []);
      setPutaway(data.putaway || []);
      setProduk(data.produk || []);
      setOpname(data.opname || []);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function simpanQC(status: string) {
    if (!selectedPenerimaan) return;

    const res = await fetch("/api/warehouse/pengelolaan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tipe: "qc",
        penerimaan_id: selectedPenerimaan.id,
        tanggal,
        status,
        catatan:
          status === "Lulus"
            ? "Barang sesuai dan kondisi baik."
            : "Barang tidak memenuhi pemeriksaan.",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    alert(data.message);

    setShowQC(false);
    setSelectedPenerimaan(null);

    loadData();
  }

  async function simpanPutaway() {
    if (!selectedQC) return;

    const items = produk
      .map((item) => ({
        produk_id: item.id,
        jumlah: 0,
        lokasi: "A-01",
      }))
      .filter((item) => item.jumlah > 0);

    /*
     * Untuk tahap awal, Putaway mengambil
     * jumlah dari detail QC pada backend.
     */

    const res = await fetch("/api/warehouse/pengelolaan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tipe: "putaway",
        qc_id: selectedQC.id,
        tanggal,
        items,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    alert(data.message);

    setShowPutaway(false);
    setSelectedQC(null);

    loadData();
  }

  async function simpanOpname() {
    const nomor =
      "SO-" +
      new Date().getFullYear() +
      "-" +
      String(opname.length + 1).padStart(4, "0");

    const items = produk.map((item) => ({
      produk_id: item.id,
      stok_sistem: item.stok,
      stok_fisik: item.stok,
      keterangan: "Hasil pengecekan fisik",
    }));

    const res = await fetch("/api/warehouse/pengelolaan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tipe: "opname",
        nomor_opname: nomor,
        tanggal,
        items,
        catatan: "Stock opname warehouse.",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    alert(data.message);

    setShowOpname(false);

    loadData();
  }

  const filteredQC = qc.filter(
    (item) =>
      item.nomor_penerimaan
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      item.nomor_po.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPutaway = putaway.filter((item) =>
    String(item.qc_id).includes(search)
  );

  const filteredOpname = opname.filter((item) =>
    item.nomor_opname.toLowerCase().includes(search.toLowerCase())
  );

  const qcMenunggu = penerimaan.filter(
    (item) => item.status !== "Selesai"
  ).length;

  const qcSelesai = qc.filter((item) => item.status === "Lulus").length;

  const putawaySelesai = putaway.filter(
    (item) => item.status === "Selesai"
  ).length;

  const opnameBerjalan = opname.filter(
    (item) => item.status === "Proses"
  ).length;

  return (
    <div className="flex min-h-screen bg-[#f7f9fc] text-slate-800">
      <SidebarWarehouse />

      <main className="min-w-0 flex-1">
        {/* HEADER */}
        <header className="flex h-[82px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
          <div>
            <p className="text-[11px] font-medium text-slate-400">
              Warehouse Management
            </p>

            <h1 className="text-xl font-bold text-slate-900">
              Pengelolaan Gudang
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600">
              <Bell size={18} />

              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <div className="hidden items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                WH
              </div>

              <div>
                <p className="text-xs font-bold text-slate-700">
                  Staff Warehouse
                </p>

                <p className="text-[9px] text-slate-400">
                  Warehouse
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-5 sm:p-8">
          {/* HERO */}
          <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-6 py-7 text-white shadow-lg shadow-blue-100 sm:px-8">
            <div className="relative z-10 max-w-2xl">
              <p className="mb-2 text-xs font-medium text-blue-100">
                Warehouse Operations
              </p>

              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Pengelolaan Gudang
              </h2>

              <p className="mt-2 max-w-xl text-xs leading-5 text-blue-50 sm:text-sm">
                Kelola proses Quality Check, Putaway, dan Stock Opname
                dalam satu halaman warehouse.
              </p>
            </div>

            <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-20 right-20 h-48 w-48 rounded-full bg-white/10" />

            <div className="absolute right-8 top-1/2 hidden -translate-y-1/2 md:block">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-sm">
                <Boxes size={46} strokeWidth={1.5} />
              </div>
            </div>
          </section>

          {/* SUMMARY */}
          <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ClipboardCheck size={20} />
                </div>

                <span className="text-[10px] font-semibold text-slate-400">
                  QUALITY CHECK
                </span>
              </div>

              <p className="text-2xl font-bold text-slate-900">
                {qc.length}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Total Quality Check
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <AlertTriangle size={20} />
                </div>

                <span className="text-[10px] font-semibold text-slate-400">
                  MENUNGGU
                </span>
              </div>

              <p className="text-2xl font-bold text-slate-900">
                {qcMenunggu}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                QC Menunggu
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <PackageCheck size={20} />
                </div>

                <span className="text-[10px] font-semibold text-slate-400">
                  PUTAWAY
                </span>
              </div>

              <p className="text-2xl font-bold text-slate-900">
                {putawaySelesai}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Putaway Selesai
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <ClipboardList size={20} />
                </div>

                <span className="text-[10px] font-semibold text-slate-400">
                  OPNAME
                </span>
              </div>

              <p className="text-2xl font-bold text-slate-900">
                {opnameBerjalan}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Opname Berjalan
              </p>
            </div>
          </div>

          {/* TAB */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
              <button
                onClick={() => setTab("qc")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  tab === "qc"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <ClipboardCheck size={16} />
                Quality Check
              </button>

              <button
                onClick={() => setTab("putaway")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  tab === "putaway"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <PackageCheck size={16} />
                Putaway
              </button>

              <button
                onClick={() => setTab("opname")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  tab === "opname"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <ClipboardList size={16} />
                Stock Opname
              </button>
            </div>

            {tab === "opname" && (
              <button
                onClick={() => setShowOpname(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-100 transition hover:bg-blue-700"
              >
                <Plus size={15} />
                Mulai Opname
              </button>
            )}
          </div>

          {/* SEARCH */}
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Search size={17} className="text-slate-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari data..."
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          {/* QC */}
          {tab === "qc" && (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Quality Check
                  </h2>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Pemeriksaan barang yang telah diterima
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ClipboardCheck size={18} />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Penerimaan</th>
                      <th className="px-5 py-3.5">PO</th>
                      <th className="px-5 py-3.5">Tanggal</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                    {penerimaan.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 transition hover:bg-blue-50/40"
                      >
                        <td className="px-5 py-4 text-xs font-bold text-orange-600">
                          {item.nomor_penerimaan}
                        </td>

                        <td className="px-5 py-4 text-xs font-medium text-slate-700">
                          {item.nomor_po}
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-500">
                          {item.tanggal}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-600">
                            Menunggu QC
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <button
                            onClick={() => {
                              setSelectedPenerimaan(item);
                              setShowQC(true);
                            }}
                            className="rounded-lg bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-600 transition hover:bg-blue-100"
                          >
                            Periksa
                          </button>
                        </td>
                      </tr>
                    ))}

                    {!penerimaan.length && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center text-xs text-slate-400"
                        >
                          Belum ada data Quality Check.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PUTAWAY */}
          {tab === "putaway" && (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Putaway
                  </h2>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Penempatan barang yang sudah lolos QC
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <PackageCheck size={18} />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">QC ID</th>
                      <th className="px-5 py-3.5">Tanggal</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                    {qc
                      .filter((item) => item.status === "Lulus")
                      .map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 transition hover:bg-blue-50/40"
                        >
                          <td className="px-5 py-4 text-xs font-bold text-blue-600">
                            QC-{item.id}
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-600">
                            {item.tanggal}
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-600">
                              Lulus QC
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <button
                              onClick={() => {
                                setSelectedQC(item);
                                setShowPutaway(true);
                              }}
                              className="rounded-lg bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-600 transition hover:bg-blue-100"
                            >
                              <span className="flex items-center gap-1">
                                <MapPin size={12} />
                                Putaway
                              </span>
                            </button>
                          </td>
                        </tr>
                      ))}

                    {!qc.filter((item) => item.status === "Lulus").length && (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-12 text-center text-xs text-slate-400"
                        >
                          Belum ada data Putaway.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* OPNAME */}
          {tab === "opname" && (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Stock Opname
                  </h2>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Perbandingan stok sistem dan stok fisik
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <ClipboardList size={18} />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Nomor</th>
                      <th className="px-5 py-3.5">Tanggal</th>
                      <th className="px-5 py-3.5">Item</th>
                      <th className="px-5 py-3.5">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOpname.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 transition hover:bg-blue-50/40"
                      >
                        <td className="px-5 py-4 text-xs font-bold text-blue-600">
                          {item.nomor_opname}
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-600">
                          {item.tanggal}
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-600">
                          {item.jumlah_item} produk
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              item.status === "Selesai"
                                ? "bg-green-50 text-green-600"
                                : item.status === "Proses"
                                  ? "bg-orange-50 text-orange-600"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {!filteredOpname.length && (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-12 text-center text-xs text-slate-400"
                        >
                          Belum ada Stock Opname.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL QC */}
      {showQC && selectedPenerimaan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">
                  Quality Check
                </h2>

                <p className="mt-1 text-[11px] text-slate-400">
                  {selectedPenerimaan.nomor_penerimaan}
                </p>
              </div>

              <button
                onClick={() => setShowQC(false)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mb-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] text-slate-400">
                Supplier
              </p>

              <p className="mt-1 text-sm font-bold text-slate-800">
                {selectedPenerimaan.nama_supplier}
              </p>

              <p className="mt-1 text-[11px] text-slate-500">
                PO: {selectedPenerimaan.nomor_po}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => simpanQC("Lulus")}
                className="rounded-2xl bg-green-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-green-700"
              >
                <CheckCircle2 size={17} className="mx-auto mb-1" />
                Lulus QC
              </button>

              <button
                onClick={() => simpanQC("Ditolak")}
                className="rounded-2xl bg-red-500 px-4 py-3 text-xs font-bold text-white transition hover:bg-red-600"
              >
                <AlertTriangle size={17} className="mx-auto mb-1" />
                Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PUTAWAY */}
      {showPutaway && selectedQC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">
                  Putaway Barang
                </h2>

                <p className="mt-1 text-[11px] text-slate-400">
                  QC-{selectedQC.id}
                </p>
              </div>

              <button
                onClick={() => setShowPutaway(false)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mb-5 rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-bold text-blue-700">
                Barang telah lulus Quality Check.
              </p>

              <p className="mt-1 text-[11px] text-blue-600">
                Tentukan lokasi penyimpanan barang.
              </p>
            </div>

            <label className="mb-2 block text-[11px] font-bold text-slate-700">
              Lokasi Gudang
            </label>

            <select
              className="mb-5 w-full rounded-xl border border-slate-200 px-3 py-3 text-xs outline-none focus:border-blue-400"
              defaultValue="A-01"
            >
              <option>A-01</option>
              <option>A-02</option>
              <option>B-01</option>
              <option>B-02</option>
              <option>C-01</option>
            </select>

            <button
              onClick={simpanPutaway}
              className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white transition hover:bg-blue-700"
            >
              Selesaikan Putaway
            </button>
          </div>
        </div>
      )}

      {/* MODAL OPNAME */}
      {showOpname && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">
                  Mulai Stock Opname
                </h2>

                <p className="mt-1 text-[11px] text-slate-400">
                  Pengecekan stok seluruh produk
                </p>
              </div>

              <button
                onClick={() => setShowOpname(false)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mb-5 rounded-2xl bg-orange-50 p-4">
              <p className="text-xs font-bold text-orange-700">
                {produk.length} produk akan diperiksa.
              </p>

              <p className="mt-1 text-[11px] text-orange-600">
                Sistem akan mencatat stok sistem dan hasil fisik.
              </p>
            </div>

            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="mb-5 w-full rounded-xl border border-slate-200 px-3 py-3 text-xs outline-none focus:border-blue-400"
            />

            <button
              onClick={simpanOpname}
              className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white transition hover:bg-blue-700"
            >
              Simpan Stock Opname
            </button>
          </div>
        </div>
      )}
    </div>
  );
}