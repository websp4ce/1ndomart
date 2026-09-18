"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SidebarInventory from "@/app/components/SidebarInventory";
import {
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
  X,
  Package,
  Bell,
  ChevronDown,
  Trash2,
  CalendarDays,
  FileText,
  TrendingUp,
} from "lucide-react";

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

type Tab = "stok" | "masuk" | "keluar";

export default function StokPage() {
  const router = useRouter();

  const [produk, setProduk] = useState<Produk[]>([]);
  const [masuk, setMasuk] = useState<Riwayat[]>([]);
  const [keluar, setKeluar] = useState<Riwayat[]>([]);

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("stok");
  const [search, setSearch] = useState("");

  const [modal, setModal] = useState(false);
  const [tipe, setTipe] = useState<"masuk" | "keluar">("masuk");

  const [produkId, setProdukId] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [tanggal, setTanggal] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [keterangan, setKeterangan] = useState("");

  /* =========================
     LOAD DATA
  ========================= */

  const loadData = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/inventory/stok", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Gagal mengambil data stok");
        return;
      }

      setProduk(data.produk || []);
      setMasuk(data.masuk || []);
      setKeluar(data.keluar || []);
    } catch (error) {
      console.error(error);
      alert("Tidak dapat terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     LOGIN
  ========================= */

  useEffect(() => {
    const login = localStorage.getItem("login");
    const user = localStorage.getItem("indomart_user");

    let bolehMasuk = false;

    if (login === "inventory" || login === "admin") {
      bolehMasuk = true;
    }

    if (user) {
      try {
        const data = JSON.parse(user);

        if (data.role === "inventory" || data.role === "admin") {
          bolehMasuk = true;
        }
      } catch {
        // abaikan
      }
    }

    if (!bolehMasuk) {
      router.push("/login");
      return;
    }

    loadData();
  }, [router]);

  /* =========================
     MODAL
  ========================= */

  const openModal = (jenis: "masuk" | "keluar") => {
    setTipe(jenis);
    setProdukId("");
    setJumlah("");
    setTanggal(new Date().toISOString().split("T")[0]);
    setKeterangan("");
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setProdukId("");
    setJumlah("");
    setTanggal(new Date().toISOString().split("T")[0]);
    setKeterangan("");
  };

  /* =========================
     SIMPAN STOK
  ========================= */

  const simpanStok = async () => {
    if (!produkId || !jumlah || !tanggal) {
      alert("Produk, jumlah, dan tanggal wajib diisi.");
      return;
    }

    const jumlahNumber = Number(jumlah);

    if (jumlahNumber <= 0) {
      alert("Jumlah stok harus lebih dari 0.");
      return;
    }

    const produkDipilih = produk.find(
      (item) => String(item.id) === produkId
    );

    if (
      tipe === "keluar" &&
      produkDipilih &&
      jumlahNumber > Number(produkDipilih.stok)
    ) {
      alert("Stok keluar tidak boleh lebih besar dari stok tersedia.");
      return;
    }

    try {
      const res = await fetch("/api/inventory/stok", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          produk_id: Number(produkId),
          jumlah: jumlahNumber,
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

      alert(data.message || "Stok berhasil disimpan");

      closeModal();
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan stok");
    }
  };

  /* =========================
     HAPUS RIWAYAT
  ========================= */

  const hapusRiwayat = async (
    id: number,
    jenis: "masuk" | "keluar"
  ) => {
    const yakin = confirm(
      "Hapus data ini?\n\nStok produk juga akan disesuaikan."
    );

    if (!yakin) return;

    try {
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

      alert(data.message || "Data berhasil dihapus");

      await loadData();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menghapus data");
    }
  };

  /* =========================
     STATISTIK
  ========================= */

  const totalStok = useMemo(
    () =>
      produk.reduce(
        (total, item) => total + Number(item.stok || 0),
        0
      ),
    [produk]
  );

  const totalMasuk = useMemo(
    () =>
      masuk.reduce(
        (total, item) => total + Number(item.jumlah || 0),
        0
      ),
    [masuk]
  );

  const totalKeluar = useMemo(
    () =>
      keluar.reduce(
        (total, item) => total + Number(item.jumlah || 0),
        0
      ),
    [keluar]
  );

  /* =========================
     FILTER
  ========================= */

  const produkFilter = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return produk.filter((item) =>
      `${item.kode_produk} ${item.nama} ${item.kategori || ""}`
        .toLowerCase()
        .includes(keyword)
    );
  }, [produk, search]);

  const riwayatFilter = (data: Riwayat[]) => {
    const keyword = search.toLowerCase().trim();

    return data.filter((item) =>
      `${item.kode_produk} ${item.produk} ${
        item.keterangan || ""
      }`
        .toLowerCase()
        .includes(keyword)
    );
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f8fc] text-slate-800">
      {/* ANIMATION */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-5px);
          }
        }
      `}</style>

      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[235px] lg:block">
        <SidebarInventory />
      </aside>

      {/* MAIN */}
      <main className="min-h-screen w-full lg:ml-[235px] lg:w-[calc(100%-235px)]">
        {/* =========================
            TOPBAR
        ========================= */}

        <header className="sticky top-0 z-30 h-[72px] border-b border-slate-100 bg-white/95 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between gap-5 px-5 lg:px-7">
            {/* SEARCH */}
            <div className="relative w-full max-w-[490px]">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk, kode, kategori..."
                className="h-11 w-full rounded-full border border-slate-200 bg-white pl-11 pr-20 text-xs text-slate-700 outline-none shadow-[0_3px_15px_rgba(30,64,175,0.04)] transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
              />

              <span className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-400 sm:block">
                Ctrl + K
              </span>
            </div>

            {/* RIGHT */}
            <div className="flex shrink-0 items-center gap-4">
              <button
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                title="Notifikasi"
              >
                <Bell size={20} />

                <span className="absolute right-[8px] top-[7px] h-2 w-2 rounded-full border-2 border-white bg-red-500" />
              </button>

              <div className="hidden h-9 w-px bg-slate-100 sm:block" />

              <button
                onClick={() =>
                  router.push("/dashboard/inventory")
                }
                className="flex items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white">
                    <span className="text-xs font-bold">
                      A
                    </span>
                  </div>
                </div>

                <div className="hidden text-left sm:block">
                  <p className="text-xs font-bold text-[#102b66]">
                    Admin
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Inventory
                  </p>
                </div>

                <ChevronDown
                  size={15}
                  className="text-slate-500"
                />
              </button>
            </div>
          </div>
        </header>

        {/* =========================
            CONTENT
        ========================= */}

        <div className="mx-auto max-w-[1320px] animate-[fadeIn_.45s_ease-out_forwards] px-4 py-5 sm:px-6 lg:px-7">
          {/* TITLE */}
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-[28px] font-extrabold tracking-[-0.8px] text-[#102b66]">
                Stok Barang
              </h1>

              <p className="mt-1 text-sm text-[#6b7fa6]">
                Kelola stok barang masuk dan barang keluar
                dengan mudah.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openModal("masuk")}
                className="group flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-[11px] font-bold text-white shadow-md shadow-blue-100 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"
              >
                <ArrowDownToLine
                  size={15}
                  className="transition group-hover:-translate-y-0.5"
                />

                Stok Masuk
              </button>

              <button
                onClick={() => openModal("keluar")}
                className="group flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-4 text-[11px] font-bold text-white shadow-md shadow-orange-100 transition duration-300 hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-lg"
              >
                <ArrowUpFromLine
                  size={15}
                  className="transition group-hover:translate-y-0.5"
                />

                Stok Keluar
              </button>
            </div>
          </div>

          {/* =========================
              STATISTIC
          ========================= */}

          <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* TOTAL PRODUK */}

            <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_5px_20px_rgba(36,72,130,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(36,72,130,0.11)]">
              <div className="absolute -bottom-10 -right-6 h-28 w-28 rounded-full bg-blue-50/80 transition-transform duration-500 group-hover:scale-125" />

              <div className="relative flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-50">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200 transition duration-500 group-hover:scale-110">
                    <Package size={21} />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-[#223867]">
                    Total Produk
                  </p>

                  <p className="mt-1 text-[28px] font-extrabold leading-none text-[#102b66]">
                    {loading ? "..." : produk.length}
                  </p>

                  <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                    <TrendingUp
                      size={13}
                      className="text-emerald-500"
                    />

                    <span className="font-bold text-emerald-500">
                      Produk
                    </span>

                    terdaftar
                  </p>
                </div>
              </div>
            </div>

            {/* TOTAL STOK */}

            <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_5px_20px_rgba(36,72,130,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(36,72,130,0.11)]">
              <div className="absolute -bottom-10 -right-6 h-28 w-28 rounded-full bg-emerald-50/80 transition-transform duration-500 group-hover:scale-125" />

              <div className="relative flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-100 transition duration-500 group-hover:scale-110">
                    <Boxes size={21} />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-[#223867]">
                    Total Stok
                  </p>

                  <p className="mt-1 text-[28px] font-extrabold leading-none text-[#102b66]">
                    {loading ? "..." : totalStok}
                  </p>

                  <p className="mt-2 text-[11px] text-slate-400">
                    Semua stok tersedia
                  </p>
                </div>
              </div>
            </div>

            {/* STOK MASUK */}

            <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_5px_20px_rgba(36,72,130,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(36,72,130,0.11)]">
              <div className="absolute -bottom-10 -right-6 h-28 w-28 rounded-full bg-amber-50/90 transition-transform duration-500 group-hover:scale-125" />

              <div className="relative flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-amber-50">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg shadow-amber-100 transition duration-500 group-hover:scale-110">
                    <ArrowDownToLine size={21} />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-[#223867]">
                    Total Stok Masuk
                  </p>

                  <p className="mt-1 text-[28px] font-extrabold leading-none text-[#102b66]">
                    {loading ? "..." : totalMasuk}
                  </p>

                  <p className="mt-2 text-[11px] text-slate-400">
                    Barang masuk
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* =========================
              TAB + SEARCH
          ========================= */}

          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_5px_20px_rgba(36,72,130,0.06)]">
            {/* HEADER */}

            <div className="border-b border-slate-100 p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-[16px] font-extrabold text-[#102b66]">
                    Manajemen Stok
                  </h2>

                  <p className="mt-1 text-[11px] text-[#7183a5]">
                    Pantau stok dan riwayat pergerakan barang.
                  </p>
                </div>

                {/* TAB */}

                <div className="flex w-full rounded-xl bg-[#f5f8fc] p-1 lg:w-auto">
                  <button
                    onClick={() => setTab("stok")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-[11px] font-bold transition-all duration-300 lg:flex-none ${
                      tab === "stok"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-400 hover:text-blue-600"
                    }`}
                  >
                    <Package size={14} />
                    Stok Barang
                  </button>

                  <button
                    onClick={() => setTab("masuk")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-[11px] font-bold transition-all duration-300 lg:flex-none ${
                      tab === "masuk"
                        ? "bg-white text-emerald-600 shadow-sm"
                        : "text-slate-400 hover:text-emerald-600"
                    }`}
                  >
                    <ArrowDownToLine size={14} />
                    Stok Masuk
                  </button>

                  <button
                    onClick={() => setTab("keluar")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-[11px] font-bold transition-all duration-300 lg:flex-none ${
                      tab === "keluar"
                        ? "bg-white text-orange-500 shadow-sm"
                        : "text-slate-400 hover:text-orange-500"
                    }`}
                  >
                    <ArrowUpFromLine size={14} />
                    Stok Keluar
                  </button>
                </div>
              </div>

              {/* SEARCH */}

              <div className="relative mt-4 max-w-[400px]">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    tab === "stok"
                      ? "Cari produk, kode, kategori..."
                      : "Cari riwayat stok..."
                  }
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-[11px] outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>

            {/* =========================
                TAB STOK
            ========================= */}

            {tab === "stok" && (
              <div className="animate-[fadeIn_.3s_ease-out]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[780px] text-left">
                    <thead className="bg-[#f7f9fd]">
                      <tr>
                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-[#6d7fa3]">
                          No
                        </th>

                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-[#6d7fa3]">
                          Kode Produk
                        </th>

                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-[#6d7fa3]">
                          Nama Produk
                        </th>

                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-[#6d7fa3]">
                          Kategori
                        </th>

                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-[#6d7fa3]">
                          Harga
                        </th>

                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-[#6d7fa3]">
                          Stok
                        </th>

                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-[#6d7fa3]">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-5 py-14 text-center text-xs text-slate-400"
                          >
                            Memuat data stok...
                          </td>
                        </tr>
                      ) : produkFilter.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-5 py-14 text-center text-xs text-slate-400"
                          >
                            Data produk tidak ditemukan.
                          </td>
                        </tr>
                      ) : (
                        produkFilter.map((item, index) => {
                          const stok = Number(item.stok || 0);

                          const status =
                            stok <= 0
                              ? {
                                  text: "Habis",
                                  className:
                                    "bg-red-100 text-red-600",
                                  dot: "bg-red-500",
                                }
                              : stok <= 5
                              ? {
                                  text: "Menipis",
                                  className:
                                    "bg-amber-100 text-amber-600",
                                  dot: "bg-amber-500",
                                }
                              : {
                                  text: "Tersedia",
                                  className:
                                    "bg-emerald-100 text-emerald-600",
                                  dot: "bg-emerald-500",
                                };

                          return (
                            <tr
                              key={item.id}
                              className="group transition hover:bg-[#f8fbff]"
                            >
                              <td className="px-5 py-3 text-[11px] font-medium text-[#536b96]">
                                {index + 1}
                              </td>

                              <td className="px-5 py-3">
                                <span className="text-[11px] font-bold text-blue-600">
                                  {item.kode_produk}
                                </span>
                              </td>

                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:scale-105">
                                    <Package size={15} />
                                  </div>

                                  <span className="text-[11px] font-bold text-[#405a88]">
                                    {item.nama}
                                  </span>
                                </div>
                              </td>

                              <td className="px-5 py-3 text-[11px] text-[#65799f]">
                                {item.kategori || "-"}
                              </td>

                              <td className="px-5 py-3 text-[11px] font-bold text-[#233b6e]">
                                Rp{" "}
                                {Number(
                                  item.harga || 0
                                ).toLocaleString("id-ID")}
                              </td>

                              <td className="px-5 py-3">
                                <span
                                  className={`inline-flex min-w-[42px] justify-center rounded-lg px-2.5 py-1 text-[10px] font-bold ${
                                    stok <= 5
                                      ? "bg-red-50 text-red-600"
                                      : "bg-emerald-50 text-emerald-600"
                                  }`}
                                >
                                  {stok}
                                </span>
                              </td>

                              <td className="px-5 py-3">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.className}`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                                  />

                                  {status.text}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =========================
                TAB RIWAYAT
            ========================= */}

            {tab === "masuk" && (
              <div className="animate-[fadeIn_.3s_ease-out]">
                <RiwayatTable
                  data={riwayatFilter(masuk)}
                  jenis="masuk"
                  onDelete={hapusRiwayat}
                />
              </div>
            )}

            {tab === "keluar" && (
              <div className="animate-[fadeIn_.3s_ease-out]">
                <RiwayatTable
                  data={riwayatFilter(keluar)}
                  jenis="keluar"
                  onDelete={hapusRiwayat}
                />
              </div>
            )}
          </section>

          {/* FOOTER SPACE */}
          <div className="h-6" />
        </div>
      </main>

      {/* =========================
          MODAL
      ========================= */}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102b66]/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg animate-[scaleIn_.25s_ease-out] overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      tipe === "masuk"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-orange-50 text-orange-500"
                    }`}
                  >
                    {tipe === "masuk" ? (
                      <ArrowDownToLine size={17} />
                    ) : (
                      <ArrowUpFromLine size={17} />
                    )}
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-[#102b66]">
                      {tipe === "masuk"
                        ? "Tambah Stok Masuk"
                        : "Tambah Stok Keluar"}
                    </h2>

                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Masukkan data stok barang
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={closeModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* FORM */}

            <div className="space-y-4 p-5">
              {/* PRODUK */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Produk
                </label>

                <div className="relative">
                  <Package
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    value={produkId}
                    onChange={(e) =>
                      setProdukId(e.target.value)
                    }
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-xs outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="">Pilih produk</option>

                    {produk.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.kode_produk} - {item.nama}{" "}
                        (Stok: {item.stok})
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              {/* JUMLAH */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Jumlah
                </label>

                <div className="relative">
                  <Boxes
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="number"
                    min="1"
                    value={jumlah}
                    onChange={(e) =>
                      setJumlah(e.target.value)
                    }
                    placeholder="Contoh: 10"
                    className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                </div>
              </div>

              {/* TANGGAL */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Tanggal
                </label>

                <div className="relative">
                  <CalendarDays
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) =>
                      setTanggal(e.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                </div>
              </div>

              {/* KETERANGAN */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Keterangan
                </label>

                <div className="relative">
                  <FileText
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={keterangan}
                    onChange={(e) =>
                      setKeterangan(e.target.value)
                    }
                    placeholder={
                      tipe === "masuk"
                        ? "Contoh: Barang dari gudang"
                        : "Contoh: Barang rusak"
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                </div>
              </div>

              {/* BUTTON */}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  onClick={simpanStok}
                  className={`rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5 ${
                    tipe === "masuk"
                      ? "bg-blue-600 shadow-blue-100 hover:bg-blue-700"
                      : "bg-orange-500 shadow-orange-100 hover:bg-orange-600"
                  }`}
                >
                  Simpan Stok
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =====================================================
   RIWAYAT TABLE
===================================================== */

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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left">
        <thead className="bg-[#f7f9fd]">
          <tr>
            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-[#6d7fa3]">
              No
            </th>

            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-[#6d7fa3]">
              Kode Produk
            </th>

            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-[#6d7fa3]">
              Produk
            </th>

            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-[#6d7fa3]">
              Jumlah
            </th>

            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-[#6d7fa3]">
              Tanggal
            </th>

            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-[#6d7fa3]">
              Keterangan
            </th>

            <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-[#6d7fa3]">
              Aksi
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-5 py-14 text-center text-xs text-slate-400"
              >
                Belum ada riwayat stok{" "}
                {jenis === "masuk" ? "masuk" : "keluar"}.
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={item.id}
                className="group transition hover:bg-[#f8fbff]"
              >
                {/* NO */}

                <td className="px-5 py-3 text-[11px] font-medium text-[#536b96]">
                  {index + 1}
                </td>

                {/* KODE */}

                <td className="px-5 py-3">
                  <span className="text-[11px] font-bold text-blue-600">
                    {item.kode_produk}
                  </span>
                </td>

                {/* PRODUK */}

                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        jenis === "masuk"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-orange-50 text-orange-500"
                      } transition group-hover:scale-105`}
                    >
                      <Package size={15} />
                    </div>

                    <span className="text-[11px] font-bold text-[#405a88]">
                      {item.produk}
                    </span>
                  </div>
                </td>

                {/* JUMLAH */}

                <td className="px-5 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      jenis === "masuk"
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {jenis === "masuk" ? "+" : "-"}
                    {item.jumlah}
                  </span>
                </td>

                {/* TANGGAL */}

                <td className="px-5 py-3">
                  <div className="flex items-center gap-2 text-[11px] text-[#65799f]">
                    <CalendarDays
                      size={13}
                      className="text-slate-400"
                    />

                    {item.tanggal}
                  </div>
                </td>

                {/* KETERANGAN */}

                <td className="max-w-[230px] px-5 py-3">
                  <div className="flex items-center gap-2">
                    <FileText
                      size={13}
                      className="shrink-0 text-slate-300"
                    />

                    <span className="truncate text-[11px] text-[#65799f]">
                      {item.keterangan || "-"}
                    </span>
                  </div>
                </td>

                {/* AKSI */}

                <td className="px-5 py-3">
                  <div className="flex justify-center">
                    <button
                      onClick={() =>
                        onDelete(item.id, jenis)
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white"
                      title="Hapus"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}