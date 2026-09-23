'use client';

import { useState } from 'react';
import SidebarInventory from '../../components/SidebarInventory';
import {
FileText,
FileSpreadsheet,
Calendar,
Download,
ChevronRight,
Package,
PackageX,
Undo2,
ArrowLeftRight,
ShieldCheck,
Clock,
Zap,
X,
Loader2,
Check,
Info,
} from 'lucide-react';

type ReportCard = {
title: string;
value: string;
description: string;
icon: typeof Package;
gradient: string;
glow: string;
href: string;
available: boolean;
};

const reportCards: ReportCard[] = [
{
title: 'Laporan Stok Barang',
value: 'Stok Barang',
description:
'Menampilkan pergerakan stok barang masuk dan keluar secara lengkap.',
icon: Package,
gradient: 'from-blue-500 to-blue-600',
glow: 'shadow-blue-200/60',
href: '/inventory/stok',
available: true,
},
{
title: 'Barang Rusak',
value: 'Barang Rusak',
description:
'Menampilkan data barang yang rusak atau tidak layak digunakan.',
icon: PackageX,
gradient: 'from-orange-500 to-orange-600',
glow: 'shadow-orange-200/60',
href: '/inventory/laporan/barang-rusak',
available: true,
},
{
title: 'Retur Barang',
value: 'Retur Barang',
description:
'Menampilkan data barang yang dikembalikan oleh pelanggan atau supplier.',
icon: Undo2,
gradient: 'from-purple-500 to-purple-600',
glow: 'shadow-purple-200/60',
href: '/inventory/laporan/retur-barang',
available: true,
},
{
title: 'Transfer Stok',
value: 'Transfer Stok',
description:
'Menampilkan data perpindahan stok antar gudang atau toko.',
icon: ArrowLeftRight,
gradient: 'from-teal-500 to-teal-600',
glow: 'shadow-teal-200/60',
href: '/inventory/laporan/transfer-stok',
available: true,
},
];

const benefitItems = [
{
icon: ShieldCheck,
label: 'Stok Lebih Akurat',
description: 'Data stok lebih mudah dipantau dan diperbarui.',
color: 'text-emerald-600 bg-emerald-50',
},
{
icon: Clock,
label: 'Data Terpantau',
description: 'Pergerakan barang masuk dan keluar lebih jelas.',
color: 'text-blue-600 bg-blue-50',
},
{
icon: Zap,
label: 'Efisiensi Operasional',
description: 'Pengelolaan stok menjadi lebih cepat dan teratur.',
color: 'text-purple-600 bg-purple-50',
},
];

function formatDate(date: Date) {
return date.toLocaleDateString('id-ID', {
day: '2-digit',
month: '2-digit',
year: 'numeric',
});
}

type BarangRusakRow = {
id: number;
tanggal: string;
nama: string;
kategori: string;
qty: number;
keterangan: string;
status: string;
};

type BarangReturRow = {
id: number;
tanggal: string;
jenis: 'ke_supplier' | 'dari_pelanggan';
supplier: string | null;
produk: string;
qty: number;
alasan: string;
status: string;
};

type TransferStokRow = {
id: number;
no_transfer: string;
tanggal: string;
barcode: string;
produk: string;
jumlah: number;
status: string;
dari_gudang: string;
ke_gudang: string;
};

const jenisLabelMap: Record<BarangReturRow['jenis'], string> = {
ke_supplier: 'Ke Supplier',
dari_pelanggan: 'Dari Pelanggan',
};

export default function LaporanInventoryPage() {
const today = new Date();
const startDefault = new Date(today.getFullYear(), today.getMonth(), 1);

const [startDate, setStartDate] = useState(startDefault);
const [endDate, setEndDate] = useState(today);

const [exportOpen, setExportOpen] = useState(false);

const [reportType, setReportType] = useState('Semua Laporan');
const [fileFormat, setFileFormat] = useState<'pdf' | 'excel'>('pdf');

const [tempStartDate, setTempStartDate] = useState(
startDefault.toISOString().split('T')[0]
);

const [tempEndDate, setTempEndDate] = useState(
today.toISOString().split('T')[0]
);

const [isExporting, setIsExporting] = useState(false);
const [exportError, setExportError] = useState('');

const openExportModal = () => {
setTempStartDate(startDate.toISOString().split('T')[0]);
setTempEndDate(endDate.toISOString().split('T')[0]);
setExportError('');
setExportOpen(true);
};

const closeExportModal = () => {
if (isExporting) return;
setExportOpen(false);
};

async function ambilDataBarangRusak(
start: string,
end: string
): Promise<BarangRusakRow[]> {
const res = await fetch(
'/api/barang-rusak?search=&status=Semua&tanggal='
);

if (!res.ok) {
  throw new Error('Gagal mengambil data Barang Rusak');
}

const json: BarangRusakRow[] = await res.json();

return json.filter((item) => {
  const t = item.tanggal?.slice(0, 10);
  return t >= start && t <= end;
});

}

async function ambilDataReturBarang(
start: string,
end: string
): Promise<BarangReturRow[]> {
const res = await fetch('/api/inventory/barang-retur');

if (!res.ok) {
  throw new Error('Gagal mengambil data Retur Barang');
}

const json: BarangReturRow[] = await res.json();

return json.filter((item) => {
  const t = item.tanggal?.slice(0, 10);
  return t >= start && t <= end;
});

}

async function ambilDataTransferStok(
start: string,
end: string
): Promise<TransferStokRow[]> {
const res = await fetch('/api/transfer-stok');

if (!res.ok) {
  throw new Error('Gagal mengambil data Transfer Stok');
}

const json: TransferStokRow[] = await res.json();

return json.filter((item) => {
  const t = item.tanggal?.slice(0, 10);
  return t >= start && t <= end;
});

}

async function exportExcel(
sections: {
name: string;
rows: Record<string, unknown>[];
}[]
) {
const XLSX = await import('xlsx');

const wb = XLSX.utils.book_new();

sections.forEach((section) => {
  const ws = XLSX.utils.json_to_sheet(section.rows);

  XLSX.utils.book_append_sheet(
    wb,
    ws,
    section.name.slice(0, 31)
  );
});

XLSX.writeFile(
  wb,
  `laporan-inventory-${tempStartDate}_${tempEndDate}.xlsx`
);

}

async function exportPdf(
sections: {
title: string;
head: string[];
body: (string | number)[][];
}[]
) {
const { default: jsPDF } = await import('jspdf');
const autoTable = (await import('jspdf-autotable')).default;

const doc = new jsPDF();

doc.setFontSize(14);
doc.text('Laporan Inventory', 14, 16);

doc.setFontSize(10);
doc.setTextColor(100);
doc.text(
  `Periode: ${tempStartDate} s/d ${tempEndDate}`,
  14,
  22
);

let cursorY = 28;

sections.forEach((section) => {
  doc.setFontSize(11);
  doc.setTextColor(30);

  doc.text(section.title, 14, cursorY);

  autoTable(doc, {
    startY: cursorY + 3,
    head: [section.head],
    body: section.body,
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: [37, 99, 235],
    },
    margin: {
      left: 14,
      right: 14,
    },
  });

  // @ts-expect-error - lastAutoTable ditambahkan oleh plugin jspdf-autotable
  cursorY = doc.lastAutoTable.finalY + 12;
});

doc.save(
  `laporan-inventory-${tempStartDate}_${tempEndDate}.pdf`
);

}

const handleExport = async () => {
setExportError('');

const selectedReports = reportCards.filter((card) =>
  reportType === 'Semua Laporan'
    ? true
    : card.value === reportType
);

const bisaDiexport = selectedReports.filter(
  (card) => card.available
);

if (bisaDiexport.length === 0) {
  setExportError(
    'Data untuk laporan ini belum tersedia.'
  );
  return;
}

setIsExporting(true);

try {
  const excelSections: {
    name: string;
    rows: Record<string, unknown>[];
  }[] = [];

  const pdfSections: {
    title: string;
    head: string[];
    body: (string | number)[][];
  }[] = [];

  for (const report of bisaDiexport) {
    if (report.value === 'Barang Rusak') {
      const data = await ambilDataBarangRusak(
        tempStartDate,
        tempEndDate
      );

      excelSections.push({
        name: 'Barang Rusak',
        rows: data.map((d) => ({
          Tanggal: d.tanggal?.slice(0, 10),
          Produk: d.nama,
          Kategori: d.kategori,
          Qty: d.qty,
          Keterangan: d.keterangan,
          Status: d.status,
        })),
      });

      pdfSections.push({
        title: 'Barang Rusak',
        head: [
          'Tanggal',
          'Produk',
          'Kategori',
          'Qty',
          'Keterangan',
          'Status',
        ],
        body: data.map((d) => [
          d.tanggal?.slice(0, 10),
          d.nama,
          d.kategori,
          d.qty,
          d.keterangan,
          d.status,
        ]),
      });
    }

    if (report.value === 'Retur Barang') {
      const data = await ambilDataReturBarang(
        tempStartDate,
        tempEndDate
      );

      excelSections.push({
        name: 'Retur Barang',
        rows: data.map((d) => ({
          Tanggal: d.tanggal?.slice(0, 10),
          Jenis: jenisLabelMap[d.jenis],
          Supplier: d.supplier ?? '-',
          Produk: d.produk,
          Qty: d.qty,
          Alasan: d.alasan,
          Status: d.status,
        })),
      });

      pdfSections.push({
        title: 'Retur Barang',
        head: [
          'Tanggal',
          'Jenis',
          'Supplier',
          'Produk',
          'Qty',
          'Alasan',
          'Status',
        ],
        body: data.map((d) => [
          d.tanggal?.slice(0, 10),
          jenisLabelMap[d.jenis],
          d.supplier ?? '-',
          d.produk,
          d.qty,
          d.alasan,
          d.status,
        ]),
      });
    }

    if (report.value === 'Transfer Stok') {
      const data = await ambilDataTransferStok(
        tempStartDate,
        tempEndDate
      );

      excelSections.push({
        name: 'Transfer Stok',
        rows: data.map((d) => ({
          Tanggal: d.tanggal?.slice(0, 10),
          'No. Transfer': d.no_transfer,
          Produk: d.produk,
          'Dari Gudang': d.dari_gudang,
          'Ke Gudang': d.ke_gudang,
          Jumlah: d.jumlah,
          Status: d.status,
        })),
      });

      pdfSections.push({
        title: 'Transfer Stok',
        head: [
          'Tanggal',
          'No. Transfer',
          'Produk',
          'Dari',
          'Ke',
          'Jumlah',
          'Status',
        ],
        body: data.map((d) => [
          d.tanggal?.slice(0, 10),
          d.no_transfer,
          d.produk,
          d.dari_gudang,
          d.ke_gudang,
          d.jumlah,
          d.status,
        ]),
      });
    }

    // Stok Barang tidak diexport dari halaman laporan.
    // Data stok masuk dan keluar berada di /inventory/stok.
  }

  if (
    excelSections.length === 0 &&
    pdfSections.length === 0
  ) {
    setExportError(
      'Tidak ada data pada periode ini untuk laporan yang dipilih.'
    );
    setIsExporting(false);
    return;
  }

  if (fileFormat === 'excel') {
    await exportExcel(excelSections);
  } else {
    await exportPdf(pdfSections);
  }

  setStartDate(
    new Date(`${tempStartDate}T00:00:00`)
  );

  setEndDate(
    new Date(`${tempEndDate}T00:00:00`)
  );

  setExportOpen(false);
} catch (err) {
  console.error(err);

  setExportError(
    err instanceof Error
      ? err.message
      : 'Gagal membuat file export.'
  );
} finally {
  setIsExporting(false);
}

};

return ( <div className="flex min-h-screen w-full bg-white"> <SidebarInventory />

  <main className="min-w-0 flex-1 overflow-x-hidden">
    <div className="min-h-screen bg-white px-4 py-6 md:px-8 md:py-8">

      {/* HEADER */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-md shadow-blue-200/60">
            <FileText
              size={21}
              className="text-white"
              strokeWidth={2}
            />
          </div>

          <div>
            <h1 className="text-[19px] font-bold tracking-tight text-slate-900 md:text-[21px]">
              Laporan Inventory
            </h1>

            <p className="mt-0.5 text-[13px] text-slate-500">
              Pantau laporan dan pergerakan data inventory.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
          >
            <Calendar
              size={16}
              className="text-slate-400"
            />

            <span>
              {formatDate(startDate)} - {formatDate(endDate)}
            </span>
          </button>

          <button
            type="button"
            onClick={openExportModal}
            className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-[13px] font-semibold text-white shadow-md shadow-blue-200/70 transition hover:bg-blue-700 active:scale-[0.98]"
          >
            <Download size={16} />
            Export Laporan
          </button>
        </div>
      </div>

      {/* REPORT CARDS */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reportCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className={`group flex flex-col rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-lg ${card.glow}`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm transition group-hover:scale-105 ${card.gradient}`}
              >
                <Icon
                  size={21}
                  strokeWidth={1.9}
                />
              </div>

              <h3 className="mt-4 text-[15px] font-bold text-slate-900">
                {card.title}
              </h3>

              <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-slate-500">
                {card.description}
              </p>

              <a
                href={card.href}
                className={`mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:brightness-105 ${card.gradient}`}
              >
                <FileText size={15} />

                Lihat Laporan

                <ChevronRight
                  size={15}
                  className="transition group-hover:translate-x-0.5"
                />
              </a>
            </div>
          );
        })}
      </div>

      {/* INFO */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-blue-100/70 bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 p-6 md:p-8">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-md shadow-blue-200/60">
              <Download
                size={18}
                className="text-white"
              />
            </div>

            <div>
              <h2 className="text-[15.5px] font-bold leading-snug text-slate-900">
                Inventory Lebih Terkelola, Bisnis Makin Lancar
              </h2>

              <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                Gunakan laporan inventory untuk memantau stok,
                barang rusak, retur, dan perpindahan stok.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {benefitItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="flex flex-col items-start gap-2 rounded-xl bg-white/60 p-3.5 ring-1 ring-white/80"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${item.color}`}
                  >
                    <Icon
                      size={17}
                      strokeWidth={2}
                    />
                  </div>

                  <p className="text-[13px] font-bold text-slate-900">
                    {item.label}
                  </p>

                  <p className="text-[12px] leading-relaxed text-slate-500">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  </main>

  {/* MODAL EXPORT */}
  {exportOpen && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
      onClick={closeExportModal}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-2xl shadow-slate-900/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-5">
          <div className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/10" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <Download
                  size={18}
                  className="text-white"
                />
              </div>

              <div>
                <h2 className="text-base font-bold text-white">
                  Export Laporan
                </h2>

                <p className="text-xs text-blue-100">
                  Unduh data inventory sebagai file
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeExportModal}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-100 transition hover:bg-white/15 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">

          {/* PILIH LAPORAN */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
              Pilih Laporan
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  setReportType('Semua Laporan')
                }
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${
                  reportType === 'Semua Laporan'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    reportType === 'Semua Laporan'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <FileText size={15} />
                </div>

                Semua Laporan
              </button>

              {reportCards
                .filter(
                  (card) => card.value !== 'Stok Barang'
                )
                .map((card) => {
                  const Icon = card.icon;
                  const active =
                    reportType === card.value;

                  return (
                    <button
                      key={card.value}
                      type="button"
                      onClick={() =>
                        setReportType(card.value)
                      }
                      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${
                        active
                          ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white ${card.gradient} ${
                          active ? '' : 'opacity-70'
                        }`}
                      >
                        <Icon size={15} />
                      </div>

                      <span className="flex-1">
                        {card.value}
                      </span>
                    </button>
                  );
                })}
            </div>

            {/* INFO STOK BARANG */}
            <a
              href="/inventory/stok"
              className="mt-3 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-3 transition hover:border-blue-400 hover:bg-blue-50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Package size={16} />
              </div>

              <div className="flex-1">
                <p className="text-xs font-bold text-blue-800">
                  Laporan Stok Barang
                </p>

                <p className="mt-0.5 text-[11px] text-blue-600">
                  Kelola dan lihat stok masuk & keluar di halaman Stok Barang.
                </p>
              </div>

              <ChevronRight
                size={16}
                className="text-blue-500"
              />
            </a>
          </div>

          {/* PERIODE */}
          <div className="mt-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
              Periode
            </p>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <div className="flex-1">
                <label className="mb-1 block text-[11px] font-medium text-slate-400">
                  Dari
                </label>

                <div className="relative">
                  <Calendar
                    size={14}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-500"
                  />

                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) =>
                      setTempStartDate(e.target.value)
                    }
                    style={{ color: '#334155' }}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="mt-4 h-px w-3 shrink-0 bg-slate-300" />

              <div className="flex-1">
                <label className="mb-1 block text-[11px] font-medium text-slate-400">
                  Sampai
                </label>

                <div className="relative">
                  <Calendar
                    size={14}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-500"
                  />

                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) =>
                      setTempEndDate(e.target.value)
                    }
                    style={{ color: '#334155' }}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* FORMAT FILE */}
          <div className="mt-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
              Format File
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setFileFormat('pdf')
                }
                className={`relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition ${
                  fileFormat === 'pdf'
                    ? 'border-red-400 bg-red-50/60'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {fileFormat === 'pdf' && (
                  <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white">
                    <Check size={12} />
                  </div>
                )}

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <FileText size={18} />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    PDF
                  </p>

                  <p className="text-[11px] text-slate-400">
                    Siap dicetak / dibagikan
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFileFormat('excel')
                }
                className={`relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition ${
                  fileFormat === 'excel'
                    ? 'border-emerald-400 bg-emerald-50/60'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {fileFormat === 'excel' && (
                  <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check size={12} />
                  </div>
                )}

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <FileSpreadsheet size={18} />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Excel
                  </p>

                  <p className="text-[11px] text-slate-400">
                    Mudah diolah lebih lanjut
                  </p>
                </div>
              </button>
            </div>
          </div>

          {exportError && (
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-700">
              <Info
                size={14}
                className="mt-0.5 shrink-0"
              />

              <span>{exportError}</span>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <button
            type="button"
            onClick={closeExportModal}
            disabled={isExporting}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60"
          >
            {isExporting ? (
              <>
                <Loader2
                  size={16}
                  className="animate-spin"
                />
                Membuat file...
              </>
            ) : (
              <>
                <Download size={16} />
                Export Laporan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )}
</div>

);
}
