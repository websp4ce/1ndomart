"use client";

import { Bell, RefreshCw } from "lucide-react";

type HeaderWarehouseProps = {
  title: string;
  subtitle?: string;
  showNotification?: boolean;
  onRefresh?: () => void;
  loading?: boolean;
};

export default function HeaderWarehouse({
  title,
  subtitle = "Warehouse Management",
  showNotification = false,
  onRefresh,
  loading = false,
}: HeaderWarehouseProps) {
  return (
    <header className="flex min-h-[76px] items-center justify-between border-b border-slate-100 bg-white px-5 py-4 md:px-8">
      {/* KIRI */}
      <div>
        <p className="text-xs font-semibold text-blue-500 md:text-sm">
          {subtitle}
        </p>

        <h1 className="mt-1 text-xl font-bold text-slate-800 md:text-2xl">
          {title}
        </h1>
      </div>

      {/* KANAN */}
      <div className="flex items-center gap-3">
        {/* NOTIFICATION */}
        {showNotification && (
          <button
            type="button"
            className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            <Bell size={21} />

            <span className="absolute right-2.5 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
          </button>
        )}

        {/* REFRESH */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={18}
              className={loading ? "animate-spin" : ""}
            />

            <span className="hidden sm:inline">
              Refresh
            </span>
          </button>
        )}

        {/* PEMBATAS */}
        <div className="hidden h-10 w-px bg-slate-200 sm:block" />

        {/* STAFF */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
            WH
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-bold text-slate-700">
              Staff Warehouse
            </p>

            <p className="text-xs text-slate-400">
              Warehouse
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}