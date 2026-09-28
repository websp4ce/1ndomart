"use client";

import { useEffect, useMemo, useState } from "react";
import SidebarWarehouse from "@/app/components/SidebarWarehouse";
import HeaderWarehouse from "@/app/components/HeaderWarehouse";
import {
  Search,
  ShoppingCart,
  Truck,
  ClipboardCheck,
  PackageCheck,
  Plus,
  X,
  ChevronRight,
  CalendarDays,
  CircleCheck,
  Clock3,
} from "lucide-react";

type Produk = {
  id: number;
  kode_produk: string;
  nama: string;
  harga: number;
  stok: number;
  kategori: string;
};

type Supplier = {
  id: number;
  kode_supplier: string;
  nama_supplier: string;
};

type PO = {
  id: number;
  nomor_po: string;
  tanggal: string;
  status: string;
  total: number;
  nama_supplier: string;
  jumlah_item: number;
};

type Penerimaan = {
  id: number;
  nomor_penerimaan: string;
  nomor_po: string;
  tanggal: string;
  status: string;
  nama_supplier: string;
  keterangan: string;
};

type ItemPO = {
  produk_id: number;
  jumlah: number;
  harga: number;
};

export default function PengadaanPenerimaanPage() {
  const [tab, setTab] = useState<"po" | "penerimaan">("po");

  const [produk, setProduk] = useState<Produk[]>([]);
  const [supplier, setSupplier] = useState<Supplier[]>([]);
  const [po, setPO] = useState<PO[]>([]);
  const [penerimaan, setPenerimaan] = useState<Penerimaan[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua Status");

  const [showModal, setShowModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PO | null>(null);

  const [nomor, setNomor] = useState("");
  const [supplierId, setSupplierId] = useState("");

  const [tanggal, setTanggal] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [items, setItems] = useState<ItemPO[]>([
    {
      produk_id: 0,
      jumlah: 1,
      harga: 0,
    },
  ]);

  async function loadData() {
    try {
      const res = await fetch(
        "/api/warehouse/pengadaan-penerimaan",
        {
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (data.success) {
        setProduk(data.produk || []);
        setSupplier(data.supplier || []);
        setPO(data.po || []);
        setPenerimaan(data.penerimaan || []);
      }
    } catch (e) {
      console.error("Gagal mengambil data:", e);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function tambahItem() {
    setItems([
      ...items,
      {
        produk_id: 0,
        jumlah: 1,
        harga: 0,
      },
    ]);
  }

  function hapusItem(i: number) {
    if (items.length > 1) {
      setItems(items.filter((_, x) => x !== i));
    }
  }

  function ubahProduk(i: number, id: number) {
    const p = produk.find((x) => x.id === id);

    const data = [...items];

    data[i] = {
      ...data[i],
      produk_id: id,
      harga: p?.harga || 0,
    };

    setItems(data);
  }

  async function simpanPO() {
    if (!nomor || !supplierId || !tanggal) {
      return alert("Lengkapi data PO.");
    }

    const validItems = items.filter(
      (x) => x.produk_id > 0 && x.jumlah > 0
    );

    if (!validItems.length) {
      return alert("Tambahkan minimal satu produk.");
    }

    try {
      const res = await fetch(
        "/api/warehouse/pengadaan-penerimaan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tipe: "po",
            nomor_po: nomor,
            supplier_id: supplierId,
            tanggal,
            items: validItems,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return alert(data.message);
      }

      alert(data.message);

      setShowModal(false);
      setNomor("");
      setSupplierId("");

      setItems([
        {
          produk_id: 0,
          jumlah: 1,
          harga: 0,
        },
      ]);

      loadData();
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan Purchase Order.");
    }
  }

  async function buatPenerimaan() {
    if (!selectedPO) return;

    const nomorPenerimaan = `PB-${new Date().getFullYear()}-${String(
      penerimaan.length + 1
    ).padStart(3, "0")}`;

    try {
      const res = await fetch(
        "/api/warehouse/pengadaan-penerimaan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tipe: "penerimaan",
            nomor_penerimaan: nomorPenerimaan,
            po_id: selectedPO.id,
            tanggal: new Date().toISOString().split("T")[0],
            keterangan: "Penerimaan dari PO",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return alert(data.message);
      }

      alert(data.message);

      setSelectedPO(null);

      loadData();
    } catch (e) {
      console.error(e);
      alert("Gagal membuat penerimaan.");
    }
  }

  const filteredPO = useMemo(() => {
    return po.filter((x) => {
      const cocokSearch = `${x.nomor_po} ${x.nama_supplier}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const cocokStatus =
        statusFilter === "Semua Status" ||
        x.status === statusFilter;

      return cocokSearch && cocokStatus;
    });
  }, [po, search, statusFilter]);

  const filteredPenerimaan = useMemo(() => {
    return penerimaan.filter((x) => {
      const cocokSearch = `${x.nomor_penerimaan} ${x.nomor_po} ${x.nama_supplier}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const cocokStatus =
        statusFilter === "Semua Status" ||
        x.status === statusFilter;

      return cocokSearch && cocokStatus;
    });
  }, [penerimaan, search, statusFilter]);

  const menungguPenerimaan = po.filter(
    (x) =>
      x.status === "Dipesan" ||
      x.status === "Sebagian Diterima"
  ).length;

  const dalamQC = penerimaan.filter(
    (x) =>
      x.status === "Menunggu QC" ||
      x.status === "Diproses"
  ).length;

  function statusClass(status: string) {
    if (status === "Selesai") {
      return "bg-emerald-50 text-emerald-600";
    }

    if (
      [
        "Menunggu QC",
        "Dipesan",
        "Menunggu Penerimaan",
      ].includes(status)
    ) {
      return "bg-amber-50 text-amber-600";
    }

    if (
      [
        "Diproses",
        "Sebagian Diterima",
      ].includes(status)
    ) {
      return "bg-blue-50 text-blue-600";
    }

    return "bg-slate-100 text-slate-600";
  }

  return (
    <div className="flex min-h-screen bg-[#f7f9fc] text-slate-800">
      <SidebarWarehouse />

      <main className="min-w-0 flex-1">
        <HeaderWarehouse
          title="Pengadaan & Penerimaan"
          subtitle="Warehouse"
        />

        <div className="p-5 md:p-7">

          {/* HERO */}
          <section className="relative mb-5 overflow-hidden rounded-[22px] bg-gradient-to-r from-[#2161ff] via-[#168cf0] to-[#12b8cf] px-6 py-5 text-white shadow-lg shadow-blue-100 sm:px-7 sm:py-6">
            <div className="relative z-10 max-w-3xl">
              <p className="mb-1 text-[11px] font-medium text-blue-100">
                Warehouse Procurement
              </p>

              <h2 className="text-[25px] font-bold leading-tight tracking-tight sm:text-[30px]">
                Pengadaan & Penerimaan
              </h2>

              <p className="mt-1.5 max-w-2xl text-[11px] leading-5 text-blue-50 sm:text-xs">
                Kelola proses pengadaan barang dari supplier dan
                penerimaan barang masuk ke gudang dengan mudah dan
                terpantau.
              </p>
            </div>

            <div className="absolute -right-8 -top-14 h-36 w-36 rounded-full bg-white/10" />

            <div className="absolute -bottom-20 right-24 h-44 w-44 rounded-full bg-white/10" />

            <div className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 lg:block">
              <div className="flex h-[76px] w-[76px] items-center justify-center rounded-[20px] bg-white/15">
                <ShoppingCart size={38} strokeWidth={1.6} />
              </div>
            </div>
          </section>

          <div className="space-y-5">

            {/* STATISTIK */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={<ClipboardCheck size={19} />}
                label="Total PO"
                value={po.length}
                note="Aktif & selesai"
                color="blue"
              />

              <StatCard
                icon={<PackageCheck size={19} />}
                label="Menunggu Penerimaan"
                value={menungguPenerimaan}
                note="PO belum diterima"
                color="orange"
              />

              <StatCard
                icon={<Truck size={19} />}
                label="Total Penerimaan"
                value={penerimaan.length}
                note="Barang telah diterima"
                color="green"
              />

              <StatCard
                icon={<ClipboardCheck size={19} />}
                label="Dalam Proses QC"
                value={dalamQC}
                note="Menunggu quality check"
                color="purple"
              />
            </div>

            {/* TAB */}
            <div className="rounded-2xl border border-blue-100 bg-white p-1.5 shadow-sm">
              <div className="flex w-fit rounded-xl bg-slate-50 p-1">

                <button
                  onClick={() => {
                    setTab("po");
                    setSelectedPO(null);
                    setSearch("");
                    setStatusFilter("Semua Status");
                  }}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition ${
                    tab === "po"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                      : "text-slate-500 hover:text-blue-600"
                  }`}
                >
                  <ShoppingCart size={15} />
                  Purchase Order
                </button>

                <button
                  onClick={() => {
                    setTab("penerimaan");
                    setSearch("");
                    setStatusFilter("Semua Status");
                  }}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition ${
                    tab === "penerimaan"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                      : "text-slate-500 hover:text-blue-600"
                  }`}
                >
                  <Truck size={15} />
                  Penerimaan Barang
                </button>

              </div>
            </div>

            {/* ========================= */}
            {/* PURCHASE ORDER */}
            {/* ========================= */}
            {tab === "po" && (
              <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">

                <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-center gap-3">
                    <IconBox color="blue">
                      <ShoppingCart size={19} />
                    </IconBox>

                    <div>
                      <h3 className="text-sm font-extrabold">
                        Data Purchase Order
                      </h3>

                      <p className="mt-1 text-[10px] text-slate-400">
                        Daftar pesanan barang ke supplier
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-100 hover:bg-blue-700"
                  >
                    <Plus size={15} />
                    Buat PO Baru
                  </button>

                </div>

                <Filter
                  search={search}
                  setSearch={setSearch}
                  status={statusFilter}
                  setStatus={setStatusFilter}
                  placeholder="Cari nomor PO, supplier..."
                  options={[
                    "Draft",
                    "Dipesan",
                    "Sebagian Diterima",
                    "Selesai",
                  ]}
                />

                <div className="overflow-x-auto px-5 pb-5">
                  <table className="w-full min-w-[700px]">

                    <thead>
                      <tr className="border-y border-slate-100 bg-slate-50 text-left">
                        {[
                          "No. PO",
                          "Tanggal",
                          "Supplier",
                          "Item",
                          "Status",
                          "Aksi",
                        ].map((x) => (
                          <th
                            key={x}
                            className="px-4 py-3 text-[10px] font-bold text-slate-500"
                          >
                            {x}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {filteredPO.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-50 hover:bg-blue-50/40"
                        >
                          <td className="px-4 py-4 text-xs font-extrabold text-blue-600">
                            {item.nomor_po}
                          </td>

                          <td className="px-4 py-4 text-[11px] text-slate-500">
                            {item.tanggal}
                          </td>

                          <td className="px-4 py-4 text-[11px] font-semibold">
                            {item.nama_supplier}
                          </td>

                          <td className="px-4 py-4 text-[11px] text-slate-500">
                            {item.jumlah_item}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${statusClass(
                                item.status
                              )}`}
                            >
                              {item.status}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <button
                              onClick={() => {
                                setSelectedPO(item);
                                setTab("penerimaan");
                                setSearch("");
                                setStatusFilter("Semua Status");
                              }}
                              className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {!filteredPO.length && (
                        <Empty
                          col={6}
                          text="Belum ada Purchase Order."
                        />
                      )}
                    </tbody>

                  </table>
                </div>
              </section>
            )}

            {/* ========================= */}
            {/* PENERIMAAN BARANG */}
            {/* ========================= */}
            {tab === "penerimaan" && (
              <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">

                <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-center gap-3">
                    <IconBox color="green">
                      <PackageCheck size={19} />
                    </IconBox>

                    <div>
                      <h3 className="text-sm font-extrabold">
                        Data Penerimaan Barang
                      </h3>

                      <p className="mt-1 text-[10px] text-slate-400">
                        Daftar barang yang telah diterima
                      </p>
                    </div>
                  </div>

                  <div className="hidden rounded-xl bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-600 sm:block">
                    {penerimaan.length} Penerimaan
                  </div>

                </div>

                <Filter
                  search={search}
                  setSearch={setSearch}
                  status={statusFilter}
                  setStatus={setStatusFilter}
                  placeholder="Cari penerimaan, PO..."
                  options={[
                    "Menunggu QC",
                    "Diproses",
                    "Selesai",
                  ]}
                />

                <div className="overflow-x-auto px-5 pb-5">
                  <table className="w-full min-w-[600px]">

                    <thead>
                      <tr className="border-y border-slate-100 bg-slate-50 text-left">
                        {[
                          "No. Penerimaan",
                          "PO",
                          "Supplier",
                          "Status",
                        ].map((x) => (
                          <th
                            key={x}
                            className="px-4 py-3 text-[10px] font-bold text-slate-500"
                          >
                            {x}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {filteredPenerimaan.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-50 hover:bg-blue-50/40"
                        >
                          <td className="px-4 py-4 text-xs font-extrabold text-blue-600">
                            {item.nomor_penerimaan}
                          </td>

                          <td className="px-4 py-4 text-[11px] font-semibold">
                            {item.nomor_po}
                          </td>

                          <td className="px-4 py-4 text-[11px] text-slate-500">
                            {item.nama_supplier}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold ${statusClass(
                                item.status
                              )}`}
                            >
                              {item.status === "Selesai" ? (
                                <CircleCheck size={11} />
                              ) : (
                                <Clock3 size={11} />
                              )}

                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {!filteredPenerimaan.length && (
                        <Empty
                          col={4}
                          text="Belum ada penerimaan barang."
                        />
                      )}
                    </tbody>

                  </table>
                </div>
              </section>
            )}

            {/* ========================= */}
            {/* DETAIL PO */}
            {/* ========================= */}
            {selectedPO && tab === "penerimaan" && (
              <section className="mt-5 overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">

                <div className="flex flex-col gap-3 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white p-5 md:flex-row md:items-center md:justify-between">

                  <div className="flex items-center gap-4">
                    <IconBox color="orange">
                      <Truck size={21} />
                    </IconBox>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">

                        <h3 className="text-sm font-extrabold">
                          {selectedPO.nomor_po}
                        </h3>

                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[9px] font-bold text-amber-600">
                          Menunggu Penerimaan
                        </span>

                      </div>

                      <p className="mt-1 text-[10px] text-slate-400">
                        {selectedPO.tanggal} •{" "}
                        {selectedPO.nama_supplier}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">

                    <button
                      onClick={buatPenerimaan}
                      className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-[10px] font-bold text-white shadow-md shadow-blue-100 hover:bg-blue-700"
                    >
                      <PackageCheck size={15} />
                      Konfirmasi Penerimaan
                    </button>

                    <button
                      onClick={() => setSelectedPO(null)}
                      className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-400 hover:bg-slate-50"
                    >
                      <X size={16} />
                    </button>

                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">

                  <MiniInfo
                    icon={<ShoppingCart size={15} />}
                    label="Total Item"
                    value={String(selectedPO.jumlah_item)}
                    color="blue"
                  />

                  <MiniInfo
                    icon={<PackageCheck size={15} />}
                    label="Diterima"
                    value="0"
                    color="green"
                  />

                  <MiniInfo
                    icon={<ClipboardCheck size={15} />}
                    label="Dalam QC"
                    value="0"
                    color="purple"
                  />

                  <MiniInfo
                    icon={<Truck size={15} />}
                    label="Sisa"
                    value={String(selectedPO.jumlah_item)}
                    color="red"
                  />

                </div>
              </section>
            )}

          </div>
        </div>
      </main>

      {/* ========================= */}
      {/* MODAL BUAT PO */}
      {/* ========================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">

          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

              <div>
                <p className="text-[10px] font-bold text-blue-600">
                  WAREHOUSE PROCUREMENT
                </p>

                <h2 className="mt-1 text-lg font-extrabold">
                  Buat Purchase Order
                </h2>

                <p className="mt-1 text-[10px] text-slate-400">
                  Buat pesanan barang kepada supplier
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={19} />
              </button>

            </div>

            <div className="space-y-5 p-6">

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                <InputField
                  label="Nomor PO"
                  value={nomor}
                  onChange={setNomor}
                  placeholder="PO-2026-0001"
                />

                <div>
                  <label className="mb-2 block text-[10px] font-bold text-slate-600">
                    Supplier
                  </label>

                  <select
                    value={supplierId}
                    onChange={(e) =>
                      setSupplierId(e.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-500"
                  >
                    <option value="">
                      Pilih Supplier
                    </option>

                    {supplier.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.nama_supplier}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold text-slate-600">
                    Tanggal
                  </label>

                  <div className="relative">

                    <CalendarDays
                      size={15}
                      className="absolute left-3 top-3 text-slate-400"
                    />

                    <input
                      type="date"
                      value={tanggal}
                      onChange={(e) =>
                        setTanggal(e.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-blue-500"
                    />

                  </div>
                </div>

              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-100">

                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">

                  <div>
                    <p className="text-xs font-extrabold text-slate-700">
                      Produk yang Dipesan
                    </p>

                    <p className="mt-1 text-[9px] text-slate-400">
                      Pilih produk dari Inventory
                    </p>
                  </div>

                  <button
                    onClick={tambahItem}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-blue-700"
                  >
                    <Plus size={13} />
                    Tambah Produk
                  </button>

                </div>

                <div className="space-y-3 p-4">

                  {items.map((item, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 p-3 md:grid-cols-[1fr_130px_160px_40px]"
                    >

                      <select
                        value={item.produk_id}
                        onChange={(e) =>
                          ubahProduk(
                            i,
                            Number(e.target.value)
                          )
                        }
                        className="h-10 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-500"
                      >
                        <option value={0}>
                          Pilih Produk Inventory
                        </option>

                        {produk.map((p) => (
                          <option
                            key={p.id}
                            value={p.id}
                          >
                            {p.kode_produk} - {p.nama}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={item.jumlah}
                        onChange={(e) => {
                          const data = [...items];

                          data[i].jumlah = Number(
                            e.target.value
                          );

                          setItems(data);
                        }}
                        className="h-10 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-500"
                        placeholder="Jumlah"
                      />

                      <input
                        type="number"
                        min="0"
                        value={item.harga}
                        onChange={(e) => {
                          const data = [...items];

                          data[i].harga = Number(
                            e.target.value
                          );

                          setItems(data);
                        }}
                        className="h-10 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-500"
                        placeholder="Harga"
                      />

                      <button
                        onClick={() => hapusItem(i)}
                        className="flex h-10 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                      >
                        <X size={16} />
                      </button>

                    </div>
                  ))}

                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">

                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  onClick={simpanPO}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-100 hover:bg-blue-700"
                >
                  Simpan Purchase Order
                </button>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================= */
/* FILTER */
/* ========================= */

function Filter({
  search,
  setSearch,
  status,
  setStatus,
  placeholder,
  options,
}: {
  search: string;
  setSearch: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <div className="flex flex-col gap-3 p-5 sm:flex-row">

      <div className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3">

        <Search
          size={16}
          className="text-slate-400"
        />

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder={placeholder}
          className="w-full text-xs outline-none placeholder:text-slate-400"
        />

      </div>

      <select
        value={status}
        onChange={(e) =>
          setStatus(e.target.value)
        }
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none"
      >
        <option>Semua Status</option>

        {options.map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>

    </div>
  );
}

/* ========================= */
/* ICON BOX */
/* ========================= */

function IconBox({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "blue" | "green" | "orange";
}) {
  const c = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-100 text-orange-500",
  }[color];

  return (
    <div
      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${c}`}
    >
      {children}
    </div>
  );
}

/* ========================= */
/* EMPTY */
/* ========================= */

function Empty({
  col,
  text,
}: {
  col: number;
  text: string;
}) {
  return (
    <tr>
      <td
        colSpan={col}
        className="py-12 text-center text-xs text-slate-400"
      >
        {text}
      </td>
    </tr>
  );
}

/* ========================= */
/* STAT CARD */
/* ========================= */

function StatCard({
  icon,
  label,
  value,
  note,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  note: string;
  color: "blue" | "orange" | "green" | "purple";
}) {
  const s = {
    blue: [
      "bg-blue-50",
      "text-blue-600",
      "text-blue-700",
    ],
    orange: [
      "bg-orange-50",
      "text-orange-500",
      "text-orange-600",
    ],
    green: [
      "bg-emerald-50",
      "text-emerald-600",
      "text-emerald-700",
    ],
    purple: [
      "bg-violet-50",
      "text-violet-600",
      "text-violet-700",
    ],
  }[color];

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${s[0]} ${s[1]}`}
      >
        {icon}
      </div>

      <p className="text-[10px] font-medium text-slate-400">
        {label}
      </p>

      <h3
        className={`mt-1 text-2xl font-extrabold ${s[2]}`}
      >
        {value}
      </h3>

      <p className="mt-1 text-[9px] text-slate-400">
        {note}
      </p>

    </div>
  );
}

/* ========================= */
/* MINI INFO */
/* ========================= */

function MiniInfo({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "blue" | "green" | "purple" | "red";
}) {
  const s = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-violet-50 text-violet-600",
    red: "bg-red-50 text-red-500",
  }[color];

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3">

      <div className="flex items-center gap-2">

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${s}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-[9px] text-slate-400">
            {label}
          </p>

          <p className="text-sm font-extrabold text-slate-700">
            {value}
          </p>
        </div>

      </div>
    </div>
  );
}

/* ========================= */
/* INPUT FIELD */
/* ========================= */

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>

      <label className="mb-2 block text-[10px] font-bold text-slate-600">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-500"
      />

    </div>
  );
}