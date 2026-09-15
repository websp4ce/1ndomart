"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  Plus,
  Trash2,
  Search,
  X,
  Package,
} from "lucide-react";
import SidebarInventory from "@/app/components/SidebarInventory";

type Produk = {
  id: number;
  kode_produk: string;
  nama: string;
  kategori: string | null;
  harga: number;
  stok: number;
};

type Riwayat = {
  id: number;
  produk_id: number;
  kode_produk: string;
  produk: string;
  jumlah: number;
  tanggal: string;
  keterangan: string | null;
};

export default function StokPage() {
  const router = useRouter();

  const [produk, setProduk] = useState<Produk[]>([]);
  const [masuk, setMasuk] = useState<Riwayat[]>([]);
  const [keluar, setKeluar] = useState<Riwayat[]>([]);

  const [tab, setTab] = useState<"stok" | "masuk" | "keluar">("stok");
  const [search, setSearch] = useState("");

  const [modal, setModal] = useState(false);
  const [tipe, setTipe] = useState<"masuk" | "keluar">("masuk");

  const [produkId, setProdukId] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [tanggal, setTanggal] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [keterangan, setKeterangan] = useState("");

  const loadData = async () => {
    try {
      const res = await fetch("/api/inventory/stok");
      const data = await res.json();

      setProduk(data.produk || []);
      setMasuk(data.masuk || []);
      setKeluar(data.keluar || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem("indomart_user");

    if (!user) {
      router.push("/login");
      return;
    }

    try {
      const data = JSON.parse(user);

      if (data.role !== "inventory" && data.role !== "admin") {
        router.push("/login");
        return;
      }
    } catch {
      router.push("/login");
      return;
    }

    loadData();
  }, [router]);

  const openModal = (jenis: "masuk" | "keluar") => {
    setTipe(jenis);
    setProdukId("");
    setJumlah("");
    setTanggal(new Date().toISOString().split("T")[0]);
    setKeterangan("");
    setModal(true);
  };

  const simpanStok = async () => {
    if (!produkId || !jumlah || !tanggal) {
      alert("Produk, jumlah, dan tanggal wajib diisi.");
      return;
    }

    const res = await fetch("/api/inventory/stok", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        produk_id: produkId,
        jumlah,
        tanggal,
        keterangan,
        tipe,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Gagal menyimpan stok");
      return;
    }

    alert(data.message);

    setModal(false);
    loadData();
  };

  const hapusRiwayat = async (
    id: number,
    jenis: "masuk" | "keluar"
  ) => {
    const yakin = confirm(
      "Hapus data ini? Stok produk juga akan disesuaikan."
    );

    if (!yakin) return;

    const res = await fetch("/api/inventory/stok", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        tipe: jenis,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Gagal menghapus data");
      return;
    }

    alert(data.message);
    loadData();
  };

  const totalStok = produk.reduce(
    (total, item) => total + Number(item.stok),
    0
  );

  const totalMasuk = masuk.reduce(
    (total, item) => total + Number(item.jumlah),
    0
  );

  const totalKeluar = keluar.reduce(
    (total, item) => total + Number(item.jumlah),
    0
  );

  const produkFilter = produk.filter((item) =>
    `${item.kode_produk} ${item.nama} ${item.kategori || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const riwayatFilter = (data: Riwayat[]) =>
    data.filter((item) =>
      `${item.kode_produk} ${item.produk} ${item.keterangan || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarInventory />

      <main className="min-w-0 flex-1 p-4 md:p-7">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Inventory
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-800">
              Stok Barang
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Kelola stok barang masuk dan barang keluar.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => openModal("masuk")}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <ArrowDownToLine size={17} />
              Stok Masuk
            </button>

            <button
              onClick={() => openModal("keluar")}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
            >
              <ArrowUpFromLine size={17} />
              Stok Keluar
            </button>
          </div>
        </div>

        {/* STATISTIK */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Package size={20} />
            </div>

            <p className="text-sm text-slate-500">
              Total Produk
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-800">
              {produk.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <Boxes size={20} />
            </div>

            <p className="text-sm text-slate-500">
              Total Stok
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-800">
              {totalStok}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <ArrowDownToLine size={20} />
            </div>

            <p className="text-sm text-slate-500">
              Total Stok Masuk
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-800">
              {totalMasuk}
            </p>
          </div>
        </div>

        {/* TAB */}
        <div className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
          <button
            onClick={() => setTab("stok")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              tab === "stok"
                ? "bg-blue-600 text-white"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Stok Barang
          </button>

          <button
            onClick={() => setTab("masuk")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              tab === "masuk"
                ? "bg-blue-600 text-white"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Stok Masuk
          </button>

          <button
            onClick={() => setTab("keluar")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              tab === "keluar"
                ? "bg-blue-600 text-white"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Stok Keluar
          </button>
        </div>

        {/* SEARCH */}
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
          <Search size={19} className="text-slate-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="w-full bg-transparent text-sm text-slate-700 outline-none"
          />
        </div>

        {/* STOK BARANG */}
        {tab === "stok" && (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-xs font-bold uppercase text-slate-400">
                      Kode
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase text-slate-400">
                      Produk
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase text-slate-400">
                      Kategori
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase text-slate-400">
                      Harga
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase text-slate-400">
                      Stok
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {produkFilter.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 text-sm font-semibold text-blue-600">
                        {item.kode_produk}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                        {item.nama}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {item.kategori || "-"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        Rp{" "}
                        {Number(item.harga).toLocaleString("id-ID")}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-lg px-3 py-1 text-xs font-bold ${
                            Number(item.stok) <= 5
                              ? "bg-red-50 text-red-600"
                              : "bg-green-50 text-green-600"
                          }`}
                        >
                          {item.stok}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {produkFilter.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-10 text-center text-sm text-slate-400"
                      >
                        Data produk tidak ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STOK MASUK */}
        {tab === "masuk" && (
          <RiwayatTable
            data={riwayatFilter(masuk)}
            jenis="masuk"
            onDelete={hapusRiwayat}
          />
        )}

        {/* STOK KELUAR */}
        {tab === "keluar" && (
          <RiwayatTable
            data={riwayatFilter(keluar)}
            jenis="keluar"
            onDelete={hapusRiwayat}
          />
        )}

        {/* MODAL */}
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {tipe === "masuk"
                      ? "Tambah Stok Masuk"
                      : "Tambah Stok Keluar"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Masukkan data stok barang.
                  </p>
                </div>

                <button
                  onClick={() => setModal(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                    Produk
                  </label>

                  <select
                    value={produkId}
                    onChange={(e) => setProdukId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">
                      Pilih produk
                    </option>

                    {produk.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.kode_produk} - {item.nama} (Stok:{" "}
                        {item.stok})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                    Jumlah
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={jumlah}
                    onChange={(e) => setJumlah(e.target.value)}
                    placeholder="Contoh: 10"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                    Tanggal
                  </label>

                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                    Keterangan
                  </label>

                  <input
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder={
                      tipe === "masuk"
                        ? "Contoh: Barang dari gudang"
                        : "Contoh: Barang rusak"
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setModal(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Batal
                </button>

                <button
                  onClick={simpanStok}
                  className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white ${
                    tipe === "masuk"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function RiwayatTable({
  data,
  jenis,
  onDelete,
}: {
  data: Riwayat[];
  jenis: "masuk" | "keluar";
  onDelete: (
    id: number,
    jenis: "masuk" | "keluar"
  ) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="font-bold text-slate-800">
            Riwayat Stok{" "}
            {jenis === "masuk" ? "Masuk" : "Keluar"}
          </h2>

          <p className="text-xs text-slate-400">
            {data.length} data
          </p>
        </div>

        <button
          onClick={() =>
            document
              .getElementById("btn-tambah-stok")
              ?.click()
          }
          className="hidden"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px] text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-4 text-xs font-bold uppercase text-slate-400">
                Kode
              </th>

              <th className="px-5 py-4 text-xs font-bold uppercase text-slate-400">
                Produk
              </th>

              <th className="px-5 py-4 text-xs font-bold uppercase text-slate-400">
                Jumlah
              </th>

              <th className="px-5 py-4 text-xs font-bold uppercase text-slate-400">
                Tanggal
              </th>

              <th className="px-5 py-4 text-xs font-bold uppercase text-slate-400">
                Keterangan
              </th>

              <th className="px-5 py-4 text-xs font-bold uppercase text-slate-400">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {data.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-slate-50"
              >
                <td className="px-5 py-4 text-sm font-semibold text-blue-600">
                  {item.kode_produk}
                </td>

                <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                  {item.produk}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`rounded-lg px-3 py-1 text-xs font-bold ${
                      jenis === "masuk"
                        ? "bg-green-50 text-green-600"
                        : "bg-orange-50 text-orange-600"
                    }`}
                  >
                    {jenis === "masuk" ? "+" : "-"}
                    {item.jumlah}
                  </span>
                </td>

                <td className="px-5 py-4 text-sm text-slate-500">
                  {item.tanggal}
                </td>

                <td className="px-5 py-4 text-sm text-slate-500">
                  {item.keterangan || "-"}
                </td>

                <td className="px-5 py-4">
                  <button
                    onClick={() =>
                      onDelete(item.id, jenis)
                    }
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                    title="Hapus"
                  >
                    <Trash2 size={17} />
                  </button>
                </td>
              </tr>
            ))}

            {data.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm text-slate-400"
                >
                  Belum ada riwayat stok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}