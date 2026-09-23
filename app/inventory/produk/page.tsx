"use client";

import { useEffect, useMemo, useState } from "react";
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
  Bell,
  ChevronDown,
  Filter,
  Utensils,
  Coffee,
  Home,
  HeartPulse,
  Sparkles,
  MoreHorizontal,
  ArrowUpRight,
  ShoppingCart,
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
  const [filterKategori, setFilterKategori] = useState("");
  const [page, setPage] = useState(1);

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
      kategori_id: item.kategori_id ? String(item.kategori_id) : "",
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
      const response = await fetch("/api/inventory/produk", {
        method: editId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editId,
          kode_produk: form.kode_produk,
          nama: form.nama,
          kategori_id: form.kategori_id ? Number(form.kategori_id) : null,
          harga: Number(form.harga) || 0,
          stok: Number(form.stok) || 0,
        }),
      });

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
    const yakin = confirm("Yakin ingin menghapus produk ini?");

    if (!yakin) return;

    try {
      const response = await fetch("/api/inventory/produk", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

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

  const tambahKategori = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!namaKategori.trim()) {
      alert("Nama kategori wajib diisi");
      return;
    }

    try {
      const response = await fetch("/api/inventory/kategori", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama: namaKategori,
        }),
      });

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
    const yakin = confirm("Yakin ingin menghapus kategori ini?");

    if (!yakin) return;

    try {
      const response = await fetch("/api/inventory/kategori", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

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

  const produkFilter = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return produk.filter((item) => {
      const cocokSearch =
        item.nama.toLowerCase().includes(keyword) ||
        item.kode_produk.toLowerCase().includes(keyword) ||
        (item.kategori || "").toLowerCase().includes(keyword);

      const cocokKategori =
        !filterKategori || item.kategori === filterKategori;

      return cocokSearch && cocokKategori;
    });
  }, [produk, search, filterKategori]);

  const perPage = 8;
  const totalPage = Math.max(1, Math.ceil(produkFilter.length / perPage));

  const produkTampil = produkFilter.slice(
    (page - 1) * perPage,
    page * perPage
  );

  useEffect(() => {
    setPage(1);
  }, [search, filterKategori]);

  const totalStok = produk.reduce((total, item) => total + Number(item.stok || 0), 0);

  const kategoriIcons = [
    { icon: Utensils, bg: "bg-blue-100", text: "text-blue-600" },
    { icon: Coffee, bg: "bg-emerald-100", text: "text-emerald-600" },
    { icon: Home, bg: "bg-violet-100", text: "text-violet-600" },
    { icon: HeartPulse, bg: "bg-red-100", text: "text-red-500" },
    { icon: Sparkles, bg: "bg-amber-100", text: "text-amber-500" },
    { icon: MoreHorizontal, bg: "bg-slate-100", text: "text-slate-500" },
  ];

  const getKategoriIcon = (index: number) =>
    kategoriIcons[index % kategoriIcons.length];

  const getKategoriJumlah = (nama: string) =>
    produk.filter((item) => item.kategori === nama).length;

  const getStatus = (stok: number) => {
    if (stok <= 0) {
      return {
        label: "Habis",
        className: "bg-red-100 text-red-600",
        dot: "bg-red-500",
      };
    }

    if (stok <= 20) {
      return {
        label: "Menipis",
        className: "bg-amber-100 text-amber-600",
        dot: "bg-amber-500",
      };
    }

    return {
      label: "Tersedia",
      className: "bg-emerald-100 text-emerald-600",
      dot: "bg-emerald-500",
    };
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f8fc] text-slate-800">
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[235px] lg:block">
        <SidebarInventory />
      </aside>

      <main className="min-h-screen w-full lg:ml-[235px] lg:w-[calc(100%-235px)]">
        {/* TOPBAR */}
        <header className="sticky top-0 z-30 h-[72px] border-b border-slate-100 bg-white/95 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between gap-5 px-5 lg:px-7">
            <div className="relative w-full max-w-[490px]">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk, kategori..."
                className="h-11 w-full rounded-full border border-slate-200 bg-white pl-11 pr-20 text-xs text-slate-700 outline-none shadow-[0_3px_15px_rgba(30,64,175,0.04)] transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-400">
                Ctrl + K
              </span>
            </div>

            <div className="flex items-center gap-5">
              <button
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                title="Notifikasi"
              >
                <Bell size={20} />
                <span className="absolute right-[8px] top-[7px] h-2 w-2 rounded-full border-2 border-white bg-red-500" />
              </button>

              <div className="hidden h-9 w-px bg-slate-100 sm:block" />

              <button
                onClick={() => router.push("/dashboard/inventory")}
                className="flex items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white">
                    <span className="text-xs font-bold">A</span>
                  </div>
                </div>

                <div className="hidden text-left sm:block">
                  <p className="text-xs font-bold text-[#102b66]">Admin</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">Inventory</p>
                </div>

                <ChevronDown size={15} className="text-slate-500" />
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1320px] animate-[fadeIn_.45s_ease-out_forwards] px-4 py-5 sm:px-6 lg:px-7">
          {/* BREADCRUMB + TITLE */}
          <div className="mb-5">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-slate-400">
              <span>Inventory</span>
              <span>›</span>
              <span className="text-[#526b9b]">Produk &amp; Kategori</span>
            </div>

            <h1 className="text-[28px] font-extrabold tracking-[-0.8px] text-[#102b66]">
              Produk &amp; Kategori
            </h1>
            <p className="mt-1 text-sm text-[#6b7fa6]">
              Kelola data produk dan kategori produk dengan mudah.
            </p>
          </div>

          {/* STAT + BANNER */}
          <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_1.18fr]">
            <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_5px_20px_rgba(36,72,130,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(36,72,130,0.11)]">
              <div className="absolute -bottom-10 -right-6 h-28 w-28 rounded-full bg-blue-50/80" />
              <div className="absolute -bottom-5 right-10 h-16 w-16 rounded-full bg-blue-50/60" />

              <div className="relative flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-50">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200">
                    <Package size={22} />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-[#223867]">Total Produk</p>
                  <p className="mt-1 text-[28px] font-extrabold leading-none text-[#102b66]">
                    {produk.length}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                    <ArrowUpRight size={13} className="text-emerald-500" />
                    <span className="font-bold text-emerald-500">12%</span>
                    dari bulan lalu
                  </p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_5px_20px_rgba(36,72,130,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(36,72,130,0.11)]">
              <div className="absolute -bottom-10 -right-6 h-28 w-28 rounded-full bg-amber-50/90" />
              <div className="absolute -bottom-5 right-10 h-16 w-16 rounded-full bg-amber-50/60" />

              <div className="relative flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-amber-50">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg shadow-amber-100">
                    <Tags size={22} />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-[#223867]">Total Kategori</p>
                  <p className="mt-1 text-[28px] font-extrabold leading-none text-[#102b66]">
                    {kategori.length}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                    <ArrowUpRight size={13} className="text-emerald-500" />
                    <span className="font-bold text-emerald-500">2%</span>
                    dari bulan lalu
                  </p>
                </div>
              </div>
            </div>

            <div className="group relative min-h-[133px] overflow-hidden rounded-2xl bg-gradient-to-r from-[#edf5ff] via-[#e7f1ff] to-[#dceaff] px-5 py-4 shadow-[0_5px_20px_rgba(36,72,130,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(36,72,130,0.10)]">
              <div className="relative z-10 max-w-[62%]">
                <h2 className="text-[16px] font-extrabold leading-[1.35] tracking-[-0.2px] text-[#102b66]">
                  Produk Berkualitas
                  <br />
                  untuk Setiap Kebutuhan
                </h2>

                <p className="mt-2 text-[10.5px] leading-[1.65] text-[#45618f]">
                  Kelola produk dengan baik,
                  <br />
                  untuk pelayanan yang lebih baik.
                </p>

                <div className="mt-2 h-1 w-[70px] -rotate-[4deg] rounded-full bg-amber-500 transition-all duration-300 group-hover:w-[82px]" />
              </div>

              <div className="absolute bottom-2 right-4 h-[112px] w-[132px] transition-transform duration-500 group-hover:scale-105">
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                  <ShoppingCart
                    size={76}
                    strokeWidth={1.75}
                    className="text-blue-600 drop-shadow-[0_8px_10px_rgba(37,99,235,0.16)]"
                  />
                  <span className="absolute bottom-[1px] left-[15px] h-2.5 w-2.5 rounded-full bg-slate-500" />
                  <span className="absolute bottom-[1px] right-[4px] h-2.5 w-2.5 rounded-full bg-slate-500" />
                </div>
              </div>
            </div>
          </div>

          {/* KATEGORI */}
          <section className="mb-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_5px_20px_rgba(36,72,130,0.06)] sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[16px] font-extrabold text-[#102b66]">
                  Kategori
                </h2>
                <p className="mt-1 text-[11px] text-[#7183a5]">
                  Kelola kategori produk untuk memudahkan pengelompokan.
                </p>
              </div>

              <button
                onClick={() => setShowKategori(true)}
                className="flex h-9 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-[11px] font-bold text-white shadow-md shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                <Plus size={15} />
                Tambah Kategori
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {kategori.length === 0 ? (
                <div className="col-span-full py-5 text-center text-xs text-slate-400">
                  Belum ada kategori.
                </div>
              ) : (
                kategori.map((item, index) => {
                  const itemIcon = getKategoriIcon(index);
                  const Icon = itemIcon.icon;
                  const aktif = filterKategori === item.nama;

                  return (
                    <div
                      key={item.id}
                      onClick={() =>
                        setFilterKategori(aktif ? "" : item.nama)
                      }
                      className={`group flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition ${
                        aktif
                          ? "border-blue-200 bg-blue-50 shadow-sm"
                          : "border-slate-100 bg-white hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-sm"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${itemIcon.bg} ${itemIcon.text}`}
                      >
                        <Icon size={17} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold text-[#536b96]">
                          {item.nama}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {getKategoriJumlah(item.nama)} produk
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          hapusKategori(item.id);
                        }}
                        className="ml-auto hidden shrink-0 rounded-md p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-500 group-hover:block"
                        title="Hapus kategori"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* DAFTAR PRODUK */}
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_5px_20px_rgba(36,72,130,0.06)]">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-[16px] font-extrabold text-[#102b66]">
                  Daftar Produk
                </h2>
                <p className="mt-1 text-[11px] text-[#7183a5]">
                  Berikut adalah daftar seluruh produk yang tersedia.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Cari produk, kode, atau kategori..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[11px] outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 sm:w-[265px]"
                  />
                </div>

                <div className="relative">
                  <Filter
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <select
                    value={filterKategori}
                    onChange={(e) => setFilterKategori(e.target.value)}
                    className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-[11px] font-semibold text-slate-600 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 sm:w-[170px]"
                  >
                    <option value="">Semua Kategori</option>
                    {kategori.map((item) => (
                      <option key={item.id} value={item.nama}>
                        {item.nama}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>

                <button
                  onClick={bukaTambah}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-[11px] font-bold text-white shadow-md shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  <Plus size={15} />
                  Tambah Produk
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[930px] text-left">
                <thead className="bg-[#f7f9fd]">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-[#6d7fa3]">
                      No
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-[#6d7fa3]">
                      Kode Produk
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-[#6d7fa3]">
                      Nama Produk
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-[#6d7fa3]">
                      Kategori
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-[#6d7fa3]">
                      Harga
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-[#6d7fa3]">
                      Stok
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-[#6d7fa3]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-[#6d7fa3]">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-14 text-center text-xs text-slate-400"
                      >
                        Memuat data...
                      </td>
                    </tr>
                  ) : produkTampil.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-14 text-center text-xs text-slate-400"
                      >
                        Belum ada data produk.
                      </td>
                    </tr>
                  ) : (
                    produkTampil.map((item, index) => {
                      const status = getStatus(Number(item.stok));

                      return (
                        <tr
                          key={item.id}
                          className="transition hover:bg-[#f8fbff]"
                        >
                          <td className="px-4 py-3 text-[11px] font-medium text-[#536b96]">
                            {(page - 1) * perPage + index + 1}
                          </td>

                          <td className="px-4 py-3 text-[11px] font-semibold text-[#506a9b]">
                            {item.kode_produk}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <Package size={15} />
                              </div>
                              <span className="text-[11px] font-bold text-[#405a88]">
                                {item.nama}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="text-[11px] font-medium text-[#65799f]">
                              {item.kategori || "-"}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-[11px] font-bold text-[#233b6e]">
                            Rp {Number(item.harga).toLocaleString("id-ID")}
                          </td>

                          <td className="px-4 py-3 text-[11px] font-semibold text-[#536b96]">
                            {item.stok}
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.className}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                              />
                              {status.label}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => bukaEdit(item)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-600 hover:text-white"
                                title="Edit"
                              >
                                <Pencil size={13} />
                              </button>

                              <button
                                onClick={() => hapusProduk(item.id)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white"
                                title="Hapus"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-[#6d7fa3]">
                Menampilkan{" "}
                <span className="font-semibold text-[#4f6691]">
                  {produkFilter.length === 0
                    ? 0
                    : (page - 1) * perPage + 1}
                  -
                  {Math.min(page * perPage, produkFilter.length)}
                </span>{" "}
                dari{" "}
                <span className="font-semibold text-[#4f6691]">
                  {produkFilter.length}
                </span>{" "}
                data
              </p>

              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ‹
                </button>

                {Array.from({ length: totalPage }, (_, i) => i + 1)
                  .slice(0, 5)
                  .map((itemPage) => (
                    <button
                      key={itemPage}
                      onClick={() => setPage(itemPage)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-semibold transition ${
                        page === itemPage
                          ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                          : "border border-slate-100 bg-white text-[#6d7fa3] hover:bg-blue-50 hover:text-blue-600"
                      }`}
                    >
                      {itemPage}
                    </button>
                  ))}

                <button
                  disabled={page === totalPage}
                  onClick={() =>
                    setPage((p) => Math.min(totalPage, p + 1))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          </section>

          <div className="h-5" />
        </div>
      </main>

      {/* MODAL PRODUK */}
      {showProduk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102b66]/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-[#102b66]">
                  {editId ? "Edit Produk" : "Tambah Produk"}
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
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={simpanProduk} className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Kode Produk
                </label>
                <input
                  type="text"
                  value={form.kode_produk}
                  onChange={(e) =>
                    setForm({ ...form, kode_produk: e.target.value })
                  }
                  placeholder="Contoh: PRD001"
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
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
                    setForm({ ...form, nama: e.target.value })
                  }
                  placeholder="Nama produk"
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Kategori
                </label>
                <select
                  value={form.kategori_id}
                  onChange={(e) =>
                    setForm({ ...form, kategori_id: e.target.value })
                  }
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="">Pilih kategori</option>
                  {kategori.map((item) => (
                    <option key={item.id} value={item.id}>
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
                      setForm({ ...form, harga: e.target.value })
                    }
                    placeholder="0"
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
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
                      setForm({ ...form, stok: e.target.value })
                    }
                    placeholder="0"
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
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
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-100 transition hover:bg-blue-700"
                >
                  {editId ? "Simpan Perubahan" : "Tambah Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KATEGORI */}
      {showKategori && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102b66]/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-[#102b66]">
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
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={tambahKategori} className="p-5">
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Nama Kategori
              </label>

              <input
                type="text"
                value={namaKategori}
                onChange={(e) => setNamaKategori(e.target.value)}
                placeholder="Contoh: Makanan"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowKategori(false);
                    setNamaKategori("");
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-100 transition hover:bg-blue-700"
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