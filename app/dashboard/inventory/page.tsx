"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SidebarInventory from "@/app/components/SidebarInventory";

import {
  Package,
  Tags,
  Boxes,
  AlertTriangle,
  Bell,
  ChevronDown,
  ArrowUpRight,
  PackageX,
  RefreshCw,
  LayoutDashboard,
  CalendarClock,
  RotateCcw,
  ArrowLeftRight,
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

type GenericItem = Record<string, any>;

type ModuleData = {
  items: GenericItem[];
  loading: boolean;
  error: boolean;
};

const menuInventory = [
  {
    label: "Produk & Kategori",
    path: "/inventory/produk",
    icon: Package,
    color: "blue",
  },
  {
    label: "Stok Barang",
    path: "/inventory/stok",
    icon: Boxes,
    color: "emerald",
  },
  {
    label: "Stok Minimum",
    path: "/inventory/stok-minimum",
    icon: AlertTriangle,
    color: "amber",
  },
  {
    label: "Barang Expired",
    path: "/inventory/barang-expired",
    icon: CalendarClock,
    color: "red",
  },
  {
    label: "Barang Rusak",
    path: "/inventory/barang-rusak",
    icon: PackageX,
    color: "orange",
  },
  {
    label: "Barang Retur",
    path: "/inventory/barang-retur",
    icon: RotateCcw,
    color: "violet",
  },
  {
    label: "Transfer Stok",
    path: "/inventory/transfer-stok",
    icon: ArrowLeftRight,
    color: "cyan",
  },
];

function getArrayFromResponse(data: any): GenericItem[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const keys = [
    "data",
    "items",
    "rows",
    "produk",
    "barang",
    "result",
    "results",
    "records",
    "stok",
    "retur",
    "transfer",
  ];

  for (const key of keys) {
    if (Array.isArray(data[key])) {
      return data[key];
    }
  }

  return [];
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString("id-ID");
}

function getColorClasses(color: string) {
  const colors: Record<
    string,
    {
      bg: string;
      text: string;
      border: string;
    }
  > = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-100",
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-100",
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      border: "border-amber-100",
    },
    red: {
      bg: "bg-red-50",
      text: "text-red-600",
      border: "border-red-100",
    },
    orange: {
      bg: "bg-orange-50",
      text: "text-orange-600",
      border: "border-orange-100",
    },
    violet: {
      bg: "bg-violet-50",
      text: "text-violet-600",
      border: "border-violet-100",
    },
    cyan: {
      bg: "bg-cyan-50",
      text: "text-cyan-600",
      border: "border-cyan-100",
    },
  };

  return colors[color] || colors.blue;
}

export default function DashboardInventoryPage() {
  const router = useRouter();

  const [produk, setProduk] = useState<Produk[]>([]);
  const [kategori, setKategori] = useState<Kategori[]>([]);

  const [stokMinimumData, setStokMinimumData] =
    useState<ModuleData>({
      items: [],
      loading: true,
      error: false,
    });

  const [expiredData, setExpiredData] =
    useState<ModuleData>({
      items: [],
      loading: true,
      error: false,
    });

  const [rusakData, setRusakData] =
    useState<ModuleData>({
      items: [],
      loading: true,
      error: false,
    });

  const [returData, setReturData] =
    useState<ModuleData>({
      items: [],
      loading: true,
      error: false,
    });

  const [transferData, setTransferData] =
    useState<ModuleData>({
      items: [],
      loading: true,
      error: false,
    });

  const [loadingProduk, setLoadingProduk] = useState(true);

  const loadData = async () => {
    setLoadingProduk(true);

    try {
      const response = await fetch(
        "/api/inventory/produk",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setProduk(data.produk || []);
        setKategori(data.kategori || []);
      } else {
        setProduk([]);
        setKategori([]);
      }
    } catch (error) {
      console.error(
        "Gagal mengambil data produk:",
        error
      );

      setProduk([]);
      setKategori([]);
    } finally {
      setLoadingProduk(false);
    }

    const modules = [
      {
        url: "/api/inventory/stok-minimum",
        setter: setStokMinimumData,
      },
      {
        url: "/api/inventory/barang-expired",
        setter: setExpiredData,
      },
      {
        url: "/api/barang-rusak?search=&status=Semua&tanggal=",
        setter: setRusakData,
      },
      {
        url: "/api/inventory/barang-retur",
        setter: setReturData,
      },
      {
        url: "/api/transfer-stok",
        setter: setTransferData,
      },
    ];

    await Promise.all(
      modules.map(async (module) => {
        try {
          const response = await fetch(
            module.url,
            {
              cache: "no-store",
            }
          );

          if (!response.ok) {
            module.setter({
              items: [],
              loading: false,
              error: true,
            });

            return;
          }

          const data = await response.json();

          module.setter({
            items: getArrayFromResponse(data),
            loading: false,
            error: false,
          });
        } catch (error) {
          console.error(
            `Gagal mengambil ${module.url}`,
            error
          );

          module.setter({
            items: [],
            loading: false,
            error: true,
          });
        }
      })
    );
  };

  useEffect(() => {
    const login = localStorage.getItem("login");

    if (
      login !== "inventory" &&
      login !== "admin"
    ) {
      router.push("/login");
      return;
    }

    loadData();
  }, [router]);

  const totalStok = produk.reduce(
    (total, item) =>
      total + Number(item.stok || 0),
    0
  );

  const stokAman = produk.filter(
    (item) => Number(item.stok) > 20
  );

  const hasNotification =
    stokMinimumData.items.length > 0 ||
    expiredData.items.length > 0 ||
    produk.some(
      (item) => Number(item.stok) <= 20
    );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f8fc] text-slate-800">
      <style jsx global>{`
        @keyframes dashboardFade {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dashboard-fade {
          animation: dashboardFade 0.45s ease-out;
        }
      `}</style>

      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[235px] lg:block">
        <SidebarInventory />
      </aside>

      <main className="min-h-screen w-full lg:ml-[235px] lg:w-[calc(100%-235px)]">

        {/* TOPBAR */}
        <header className="sticky top-0 z-30 h-[72px] border-b border-slate-100 bg-white/95 backdrop-blur-xl">
          <div className="flex h-full items-center justify-end gap-4 px-5 lg:px-7">

            {/* REFRESH */}
            <button
              type="button"
              onClick={loadData}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
              title="Refresh"
            >
              <RefreshCw
                size={18}
                className={
                  loadingProduk
                    ? "animate-spin"
                    : ""
                }
              />
            </button>

            {/* NOTIFICATION */}
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
            >
              <Bell size={19} />

              {hasNotification && (
                <span className="absolute right-[7px] top-[6px] h-2 w-2 rounded-full border-2 border-white bg-red-500" />
              )}
            </button>

            <div className="hidden h-9 w-px bg-slate-100 sm:block" />

            {/* PROFILE */}
            <div className="flex items-center gap-3">
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
            </div>
          </div>
        </header>

        <div className="dashboard-fade mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-7">

          {/* TITLE */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-100">
              <LayoutDashboard size={20} />
            </div>

            <div>
              <h1 className="text-[27px] font-extrabold tracking-[-0.7px] text-[#102b66]">
                Dashboard Inventory
              </h1>

              <p className="mt-0.5 text-sm text-[#6b7fa6]">
                Ringkasan seluruh aktivitas dan data inventory.
              </p>
            </div>
          </div>

          {/* MENU INVENTORY */}
          <section className="mb-6">
            <div className="mb-4">
              <h2 className="text-[18px] font-extrabold text-[#102b66]">
                Menu Inventory
              </h2>

              <p className="mt-1 text-[11px] text-slate-400">
                Akses seluruh pengelolaan inventory.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {menuInventory.map((menu) => {
                const Icon = menu.icon;
                const color = getColorClasses(
                  menu.color
                );

                return (
                  <button
                    key={menu.path}
                    type="button"
                    onClick={() =>
                      router.push(menu.path)
                    }
                    className="group flex min-h-[78px] items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-[0_5px_20px_rgba(36,72,130,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-[0_12px_30px_rgba(36,72,130,0.10)]"
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color.bg} ${color.text} transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white`}
                    >
                      <Icon size={19} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-bold text-[#405a88]">
                        {menu.label}
                      </span>

                      <span className="mt-1 flex items-center gap-1 text-[9px] text-slate-400">
                        Buka halaman
                        <ArrowUpRight size={10} />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* RINGKASAN INVENTORY */}
          <section className="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-[0_8px_30px_rgba(36,72,130,0.06)]">

            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-[20px] font-extrabold tracking-[-0.3px] text-[#102b66]">
                  Ringkasan Inventory
                </h2>

                <p className="mt-1 text-[11px] text-[#8193b5]">
                  Data inventory yang diambil langsung dari sistem.
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Boxes size={20} />
              </div>
            </div>

            {/* CARDS */}
            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">

              {/* TOTAL PRODUK */}
              <div className="group rounded-2xl border border-blue-100 bg-blue-50/40 p-4 transition hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <Package size={19} />
                  </div>

                  <ArrowUpRight
                    size={15}
                    className="text-blue-400 transition group-hover:text-blue-600"
                  />
                </div>

                <p className="mt-5 text-[11px] font-bold text-[#405a88]">
                  Total Produk
                </p>

                <p className="mt-1 text-[27px] font-extrabold text-[#102b66]">
                  {loadingProduk
                    ? "..."
                    : formatNumber(
                        produk.length
                      )}
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  Produk terdaftar
                </p>
              </div>

              {/* TOTAL KATEGORI */}
              <div className="group rounded-2xl border border-violet-100 bg-violet-50/40 p-4 transition hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                    <Tags size={19} />
                  </div>

                  <ArrowUpRight
                    size={15}
                    className="text-violet-400 transition group-hover:text-violet-600"
                  />
                </div>

                <p className="mt-5 text-[11px] font-bold text-[#405a88]">
                  Total Kategori
                </p>

                <p className="mt-1 text-[27px] font-extrabold text-[#102b66]">
                  {loadingProduk
                    ? "..."
                    : formatNumber(
                        kategori.length
                      )}
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  Kategori produk
                </p>
              </div>

              {/* TOTAL STOK */}
              <div className="group rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 transition hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <Boxes size={19} />
                  </div>

                  <ArrowUpRight
                    size={15}
                    className="text-emerald-400 transition group-hover:text-emerald-600"
                  />
                </div>

                <p className="mt-5 text-[11px] font-bold text-[#405a88]">
                  Total Stok
                </p>

                <p className="mt-1 text-[27px] font-extrabold text-[#102b66]">
                  {loadingProduk
                    ? "..."
                    : formatNumber(
                        totalStok
                      )}
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  Semua unit produk
                </p>
              </div>

              {/* STOK AMAN */}
              <div className="group rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 transition hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <Boxes size={19} />
                  </div>

                  <ArrowUpRight
                    size={15}
                    className="text-emerald-400 transition group-hover:text-emerald-600"
                  />
                </div>

                <p className="mt-5 text-[11px] font-bold text-emerald-700">
                  Stok Aman
                </p>

                <p className="mt-1 text-[27px] font-extrabold text-[#102b66]">
                  {loadingProduk
                    ? "..."
                    : formatNumber(
                        stokAman.length
                      )}
                </p>

                <p className="mt-1 text-[10px] text-emerald-600">
                  Stok di atas 20 unit
                </p>
              </div>

              {/* STOK MINIMUM */}
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/inventory/stok-minimum"
                  )
                }
                className="group rounded-2xl border border-amber-100 bg-amber-50/40 p-4 text-left transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <AlertTriangle size={19} />
                  </div>

                  <ArrowUpRight
                    size={15}
                    className="text-amber-400"
                  />
                </div>

                <p className="mt-5 text-[11px] font-bold text-amber-700">
                  Stok Minimum
                </p>

                <p className="mt-1 text-[27px] font-extrabold text-[#102b66]">
                  {stokMinimumData.error
                    ? "-"
                    : formatNumber(
                        stokMinimumData.items.length
                      )}
                </p>

                <p className="mt-1 text-[10px] text-amber-600">
                  Di bawah batas minimum
                </p>
              </button>

              {/* BARANG EXPIRED */}
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/inventory/barang-expired"
                  )
                }
                className="group rounded-2xl border border-red-100 bg-red-50/40 p-4 text-left transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <CalendarClock size={19} />
                  </div>

                  <ArrowUpRight
                    size={15}
                    className="text-red-400"
                  />
                </div>

                <p className="mt-5 text-[11px] font-bold text-red-700">
                  Barang Expired
                </p>

                <p className="mt-1 text-[27px] font-extrabold text-[#102b66]">
                  {expiredData.error
                    ? "-"
                    : formatNumber(
                        expiredData.items.length
                      )}
                </p>

                <p className="mt-1 text-[10px] text-red-600">
                  Data barang kedaluwarsa
                </p>
              </button>

              {/* BARANG RUSAK */}
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/inventory/barang-rusak"
                  )
                }
                className="group rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-left transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                    <PackageX size={19} />
                  </div>

                  <ArrowUpRight
                    size={15}
                    className="text-orange-400"
                  />
                </div>

                <p className="mt-5 text-[11px] font-bold text-orange-700">
                  Barang Rusak
                </p>

                <p className="mt-1 text-[27px] font-extrabold text-[#102b66]">
                  {rusakData.error
                    ? "-"
                    : formatNumber(
                        rusakData.items.length
                      )}
                </p>

                <p className="mt-1 text-[10px] text-orange-600">
                  Data barang rusak
                </p>
              </button>

              {/* BARANG RETUR */}
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/inventory/barang-retur"
                  )
                }
                className="group rounded-2xl border border-violet-100 bg-violet-50/40 p-4 text-left transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                    <RotateCcw size={19} />
                  </div>

                  <ArrowUpRight
                    size={15}
                    className="text-violet-400"
                  />
                </div>

                <p className="mt-5 text-[11px] font-bold text-violet-700">
                  Barang Retur
                </p>

                <p className="mt-1 text-[27px] font-extrabold text-[#102b66]">
                  {returData.error
                    ? "-"
                    : formatNumber(
                        returData.items.length
                      )}
                </p>

                <p className="mt-1 text-[10px] text-violet-600">
                  Data retur barang
                </p>
              </button>

              {/* TRANSFER STOK */}
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/inventory/transfer-stok"
                  )
                }
                className="group rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4 text-left transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
                    <ArrowLeftRight size={19} />
                  </div>

                  <ArrowUpRight
                    size={15}
                    className="text-cyan-400"
                  />
                </div>

                <p className="mt-5 text-[11px] font-bold text-cyan-700">
                  Transfer Stok
                </p>

                <p className="mt-1 text-[27px] font-extrabold text-[#102b66]">
                  {transferData.error
                    ? "-"
                    : formatNumber(
                        transferData.items.length
                      )}
                </p>

                <p className="mt-1 text-[10px] text-cyan-600">
                  Perpindahan stok
                </p>
              </button>
            </div>
          </section>

          {/* SPACING */}
          <div className="h-6" />
        </div>
      </main>
    </div>
  );
}