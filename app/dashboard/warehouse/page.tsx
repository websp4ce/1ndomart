"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ElementType } from "react";
import SidebarWarehouse from "@/app/components/SidebarWarehouse";

import {
  Bell,
  ChevronDown,
  ArrowDownToLine,
  AlertTriangle,
  Clock3,
  TrendingUp,
  Boxes,
  ShoppingCart,
  Truck,
  ClipboardCheck,
  PackageCheck,
  ClipboardList,
} from "lucide-react";

const activities = [
  {
    title: "Penerimaan Barang",
    desc: "PO-2026-0089 berhasil diterima",
    time: "10 menit lalu",
    icon: ArrowDownToLine,
  },
  {
    title: "Quality Check",
    desc: "QC-2026-0042 menunggu pemeriksaan",
    time: "25 menit lalu",
    icon: ClipboardCheck,
  },
  {
    title: "Putaway",
    desc: "15 item berhasil ditempatkan",
    time: "1 jam lalu",
    icon: PackageCheck,
  },
  {
    title: "Stock Opname",
    desc: "Opname area A-02 selesai",
    time: "2 jam lalu",
    icon: ClipboardList,
  },
];

export default function WarehouseDashboard() {
  const [userName, setUserName] = useState("Warehouse");
  const [date, setDate] = useState("");

  const router = useRouter();

  useEffect(() => {
    const storedUser =
      localStorage.getItem("indomart_user") ||
      localStorage.getItem("login");

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);

        if (user?.nama) {
          setUserName(user.nama);
        } else if (user?.name) {
          setUserName(user.name);
        } else if (typeof user === "string") {
          setUserName(user);
        }
      } catch {
        if (storedUser && storedUser !== "true") {
          setUserName(storedUser);
        }
      }
    }

    const now = new Date();

    setDate(
      now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f7f9fc] text-slate-800">
      <SidebarWarehouse />

      <main className="min-w-0 flex-1">
        {/* TOPBAR */}
        <header className="sticky top-0 z-30 flex h-[82px] items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur-md sm:px-8">
          <div>
            <p className="text-[11px] font-medium text-slate-400">
              {date}
            </p>

            <h2 className="text-lg font-bold text-slate-900">
              Dashboard Warehouse
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white transition hover:border-blue-200 hover:bg-blue-50"
            >
              <Bell className="h-[18px] w-[18px] text-slate-500" />

              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                {userName.charAt(0).toUpperCase()}
              </div>

              <div className="hidden md:block">
                <p className="text-xs font-semibold text-slate-800">
                  {userName}
                </p>

                <p className="text-[10px] text-slate-400">
                  Warehouse
                </p>
              </div>

              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="p-5 sm:p-8">
          {/* WELCOME */}
          <section className="relative mb-7 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 p-6 text-white shadow-lg shadow-blue-100 sm:p-7">
            <div className="relative z-10 max-w-[650px]">
              <p className="mb-1 text-sm font-medium text-blue-100">
                Selamat datang kembali 👋
              </p>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Halo, {userName}!
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
                Pantau aktivitas warehouse, penerimaan barang,
                quality check, hingga proses putaway dalam satu
                dashboard.
              </p>
            </div>

            <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10" />

            <div className="absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-white/5" />

            <Boxes className="absolute bottom-6 right-8 h-24 w-24 text-white/10 sm:right-16 sm:h-28 sm:w-28" />
          </section>

          {/* STATISTICS */}
          <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="PO Aktif"
              value="18"
              description="+3 dari minggu lalu"
              icon={ShoppingCart}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              trend
            />

            <StatCard
              title="Penerimaan Hari Ini"
              value="24"
              description="Barang diterima"
              icon={ArrowDownToLine}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />

            <StatCard
              title="Menunggu Quality Check"
              value="7"
              description="Perlu pemeriksaan"
              icon={ClipboardCheck}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              warning
            />

            <StatCard
              title="Putaway Pending"
              value="12"
              description="Belum ditempatkan"
              icon={PackageCheck}
              iconBg="bg-red-50"
              iconColor="text-red-500"
              warning
            />
          </section>

          {/* AKTIVITAS DAN STATUS */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
            {/* AKTIVITAS */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900">
                    Aktivitas Terbaru
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Aktivitas warehouse hari ini
                  </p>
                </div>

                <button
                  type="button"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Lihat Semua
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {activities.map((activity) => {
                  const Icon = activity.icon;

                  return (
                    <div
                      key={activity.title}
                      className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                        <Icon className="h-[18px] w-[18px] text-blue-600" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">
                          {activity.title}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {activity.desc}
                        </p>
                      </div>

                      <div className="hidden items-center gap-1.5 text-[10px] text-slate-400 sm:flex">
                        <Clock3 className="h-3 w-3" />
                        {activity.time}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STATUS */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-5">
                <h3 className="text-[15px] font-bold text-slate-900">
                  Status Warehouse
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Ringkasan proses hari ini
                </p>
              </div>

              <div className="space-y-5 p-5">
                <StatusItem
                  title="Penerimaan Barang"
                  value="24 / 30"
                  percent={80}
                  icon={Truck}
                />

                <StatusItem
                  title="Quality Check"
                  value="17 / 24"
                  percent={71}
                  icon={ClipboardCheck}
                />

                <StatusItem
                  title="Putaway"
                  value="38 / 50"
                  percent={76}
                  icon={PackageCheck}
                />

                <StatusItem
                  title="Stock Opname"
                  value="8 / 10"
                  percent={80}
                  icon={ClipboardList}
                />
              </div>
            </div>
          </section>

          {/* AKSES CEPAT */}
          <section className="mt-6">
            <div className="mb-4">
              <h3 className="text-[15px] font-bold text-slate-900">
                Akses Cepat
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Akses fitur warehouse yang sering digunakan
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              <QuickMenu
                title="Purchase Order (PO)"
                href="/warehouse/purchase-order"
                icon={ShoppingCart}
                router={router}
              />

              <QuickMenu
                title="Penerimaan Barang"
                href="/warehouse/penerimaan"
                icon={Truck}
                router={router}
              />

              <QuickMenu
                title="Quality Check"
                href="/warehouse/quality-check"
                icon={ClipboardCheck}
                router={router}
              />

              <QuickMenu
                title="Putaway"
                href="/warehouse/putaway"
                icon={PackageCheck}
                router={router}
              />

              <QuickMenu
                title="Stock Opname"
                href="/warehouse/stock-opname"
                icon={ClipboardList}
                router={router}
              />

              <QuickMenu
                title="Laporan Warehouse"
                href="/warehouse/laporan"
                icon={TrendingUp}
                router={router}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* =========================
   STAT CARD
========================= */

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  warning,
}: {
  title: string;
  value: string;
  description: string;
  icon: ElementType;
  iconBg: string;
  iconColor: string;
  trend?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>

        {trend && (
          <div className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600">
            <TrendingUp className="h-3 w-3" />
            Naik
          </div>
        )}

        {warning && (
          <div className="rounded-lg bg-amber-50 p-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-slate-400">
          {title}
        </p>

        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </p>

        <p className="mt-1 text-[10px] text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

/* =========================
   STATUS ITEM
========================= */

function StatusItem({
  title,
  value,
  percent,
  icon: Icon,
}: {
  title: string;
  value: string;
  percent: number;
  icon: ElementType;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-400" />

          <span className="text-xs font-semibold text-slate-700">
            {title}
          </span>
        </div>

        <span className="text-[10px] font-semibold text-slate-400">
          {value}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-1 text-right text-[9px] font-medium text-slate-400">
        {percent}% selesai
      </div>
    </div>
  );
}

/* =========================
   QUICK MENU
========================= */

function QuickMenu({
  title,
  href,
  icon: Icon,
  router,
}: {
  title: string;
  href: string;
  icon: ElementType;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 transition group-hover:bg-blue-600">
        <Icon className="h-[18px] w-[18px] text-blue-600 transition group-hover:text-white" />
      </div>

      <p className="text-xs font-semibold leading-5 text-slate-700 group-hover:text-blue-600">
        {title}
      </p>
    </button>
  );
}