"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SidebarInventory from "@/app/components/SidebarInventory";
import {
  Package,
  Tags,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  ArrowLeft,
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

export default function ProdukPage() {
  const router = useRouter();

  const [produk, setProduk] = useState<Produk[]>([]);
  const [kategori, setKategori] = useState<Kategori[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showProduk, setShowProduk] = useState(false);
  const [showKategori, setShowKategori] = useState(false);

  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState({
    kode_produk: "",
    nama: "",
    kategori_id: "",
    harga: "",
    stok: "",
  });

  const [namaKategori, setNamaKategori] = useState("");

  useEffect(() => {
    const login = localStorage.getItem("login");

    if (login !== "inventory" && login !== "admin") {
      router.push("/login");
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/inventory/produk");
      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Gagal mengambil data");
        return;
      }

      setProduk(data.produk || []);
      setKategori(data.kategori || []);
    } catch (error) {
      console.error(error);
      alert("Tidak dapat terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      kode_produk: "",
      nama: "",
      kategori_id: "",
      harga: "",
      stok: "",
    });

    setEditId(null);
  };

  const bukaTambah = () => {
    resetForm();
    setShowProduk(true);
  };

  const bukaEdit = (item: Produk) => {
    setEditId(item.id);

    setForm({
      kode_produk: item.kode_produk,
      nama: item.nama,
      kategori_id: item.kategori_id
        ? String(item.kategori_id)
        : "",
      harga: String(item.harga),
      stok: String(item.stok),
    });

    setShowProduk(true);
  };

  const simpanProduk = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.kode_produk || !form.nama) {
      alert("Kode produk dan nama produk wajib diisi");
      return;
    }

    try {
      const response = await fetch(
        "/api/inventory/produk",
        {
          method: editId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editId,
            kode_produk: form.kode_produk,
            nama: form.nama,
            kategori_id: form.kategori_id
              ? Number(form.kategori_id)
              : null,
            harga: Number(form.harga) || 0,
            stok: Number(form.stok) || 0,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Gagal menyimpan produk");
        return;
      }

      alert(data.message);

      setShowProduk(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan produk");
    }
  };

  const hapusProduk = async (id: number) => {
    const yakin = confirm(
      "Yakin ingin menghapus produk ini?"
    );

    if (!yakin) return;

    try {
      const response = await fetch(
        "/api/inventory/produk",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Gagal menghapus produk");
        return;
      }

      alert(data.message);
      loadData();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menghapus produk");
    }
  };

  const tambahKategori = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!namaKategori.trim()) {
      alert("Nama kategori wajib diisi");
      return;
    }

    try {
      const response = await fetch(
        "/api/inventory/kategori",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nama: namaKategori,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Gagal menambahkan kategori");
        return;
      }

      alert(data.message);

      setNamaKategori("");
      setShowKategori(false);
      loadData();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan");
    }
  };

  const hapusKategori = async (id: number) => {
    const yakin = confirm(
      "Yakin ingin menghapus kategori ini?"
    );

    if (!yakin) return;

    try {
      const response = await fetch(
        "/api/inventory/kategori",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Gagal menghapus kategori");
        return;
      }

      alert(data.message);
      loadData();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan");
    }
  };

  const produkFilter = produk.filter((item) => {
    const keyword = search.toLowerCase();

    return (
      item.nama.toLowerCase().includes(keyword) ||
      item.kode_produk.toLowerCase().includes(keyword) ||
      (item.kategori || "")
        .toLowerCase()
        .includes(keyword)
    );
  });

  return (
    <div className="flex min-h-screen bg-slate-50">

      <SidebarInventory />

      <main className="min-w-0 flex-1">

        {/* HEADER */}
        <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 backdrop-blur">
          <div className="flex h-[82px] items-center justify-between px-6 lg:px-8">

            <div>
              <p className="text-xs font-medium text-slate-400">
                Inventory Management
              </p>

              <h1 className="mt-1 text-xl font-bold text-slate-800">
                Produk & Kategori
              </h1>
            </div>

            <button
              onClick={() => router.push("/dashboard/inventory")}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Dashboard
            </button>

          </div>
        </header>

        <div className="mx-auto max-w-[1400px] px-6 py-7 lg:px-8">

          {/* STAT */}
          <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Package size={21} />
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Total Produk
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-800">
                    {produk.length}
                  </p>
                </div>

              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Tags size={21} />
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Total Kategori
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-800">
                    {kategori.length}
                  </p>
                </div>

              </div>
            </div>

          </div>

          {/* KATEGORI */}
          <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="mb-5 flex items-center justify-between gap-3">

              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Kategori Produk
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Kelompokkan produk berdasarkan kategori
                </p>
              </div>

              <button
                onClick={() => setShowKategori(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
              >
                <Plus size={16} />
                Tambah Kategori
              </button>

            </div>

            <div className="flex flex-wrap gap-2">

              {kategori.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Belum ada kategori.
                </p>
              ) : (
                kategori.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <Tags
                      size={14}
                      className="text-blue-500"
                    />

                    <span className="text-xs font-semibold text-slate-600">
                      {item.nama}
                    </span>

                    <button
                      onClick={() =>
                        hapusKategori(item.id)
                      }
                      className="ml-1 text-slate-300 transition hover:text-red-500"
                      title="Hapus kategori"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}

            </div>

          </section>

          {/* PRODUK */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Data Produk
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Tambah, edit, dan hapus produk
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">

                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    placeholder="Cari produk..."
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none transition focus:border-blue-400 focus:bg-white sm:w-56"
                  />
                </div>

                <button
                  onClick={bukaTambah}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white transition hover:bg-blue-700"
                >
                  <Plus size={16} />
                  Tambah Produk
                </button>

              </div>

            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">

              <table className="w-full min-w-[800px] text-left">

                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Kode
                    </th>

                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Produk
                    </th>

                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Kategori
                    </th>

                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Harga
                    </th>

                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Stok
                    </th>

                    <th className="px-5 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-10 text-center text-xs text-slate-400"
                      >
                        Memuat data...
                      </td>
                    </tr>
                  ) : produkFilter.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-10 text-center text-xs text-slate-400"
                      >
                        Belum ada data produk.
                      </td>
                    </tr>
                  ) : (
                    produkFilter.map((item) => (
                      <tr
                        key={item.id}
                        className="transition hover:bg-slate-50"
                      >

                        <td className="px-5 py-4 text-xs font-semibold text-blue-600">
                          {item.kode_produk}
                        </td>

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                              <Package size={17} />
                            </div>

                            <span className="text-xs font-bold text-slate-700">
                              {item.nama}
                            </span>

                          </div>

                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-500">
                            {item.kategori || "-"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                          Rp{" "}
                          {Number(item.harga).toLocaleString(
                            "id-ID"
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`text-xs font-bold ${
                              item.stok > 0
                                ? "text-emerald-600"
                                : "text-red-500"
                            }`}
                          >
                            {item.stok}
                          </span>
                        </td>

                        <td className="px-5 py-4">

                          <div className="flex justify-center gap-2">

                            <button
                              onClick={() =>
                                bukaEdit(item)
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-600 hover:text-white"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>

                            <button
                              onClick={() =>
                                hapusProduk(item.id)
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white"
                              title="Hapus"
                            >
                              <Trash2 size={14} />
                            </button>

                          </div>

                        </td>

                      </tr>
                    ))
                  )}

                </tbody>

              </table>

            </div>

          </section>

        </div>
      </main>

      {/* MODAL PRODUK */}
      {showProduk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

              <div>
                <h2 className="text-base font-bold text-slate-800">
                  {editId
                    ? "Edit Produk"
                    : "Tambah Produk"}
                </h2>

                <p className="mt-1 text-[11px] text-slate-400">
                  Isi data produk dengan lengkap
                </p>
              </div>

              <button
                onClick={() => {
                  setShowProduk(false);
                  resetForm();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>

            </div>

            <form
              onSubmit={simpanProduk}
              className="space-y-4 p-5"
            >

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Kode Produk
                </label>

                <input
                  type="text"
                  value={form.kode_produk}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      kode_produk: e.target.value,
                    })
                  }
                  placeholder="Contoh: PRD001"
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Nama Produk
                </label>

                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nama: e.target.value,
                    })
                  }
                  placeholder="Nama produk"
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Kategori
                </label>

                <select
                  value={form.kategori_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      kategori_id: e.target.value,
                    })
                  }
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-400"
                >
                  <option value="">
                    Pilih kategori
                  </option>

                  {kategori.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Harga
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.harga}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        harga: e.target.value,
                      })
                    }
                    placeholder="0"
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Stok
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.stok}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        stok: e.target.value,
                      })
                    }
                    placeholder="0"
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
                  />
                </div>

              </div>

              <div className="flex justify-end gap-2 pt-2">

                <button
                  type="button"
                  onClick={() => {
                    setShowProduk(false);
                    resetForm();
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
                >
                  {editId
                    ? "Simpan Perubahan"
                    : "Tambah Produk"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL KATEGORI */}
      {showKategori && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Tambah Kategori
                </h2>

                <p className="mt-1 text-[11px] text-slate-400">
                  Tambahkan kategori produk baru
                </p>
              </div>

              <button
                onClick={() => {
                  setShowKategori(false);
                  setNamaKategori("");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>

            </div>

            <form
              onSubmit={tambahKategori}
              className="p-5"
            >

              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Nama Kategori
              </label>

              <input
                type="text"
                value={namaKategori}
                onChange={(e) =>
                  setNamaKategori(e.target.value)
                }
                placeholder="Contoh: Makanan"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
              />

              <div className="mt-5 flex justify-end gap-2">

                <button
                  type="button"
                  onClick={() => {
                    setShowKategori(false);
                    setNamaKategori("");
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Simpan
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}