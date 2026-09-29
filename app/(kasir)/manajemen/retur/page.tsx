'use client';

import { useEffect, useState, type ReactNode } from 'react';
import SidebarKasir from '@/app/components/SidebarKasir';
import {
  Plus, Pencil, Trash2, Search, X, RotateCcw, CheckCircle,
  CheckCircle2, AlertCircle,
} from 'lucide-react';

type Status = 'Diproses' | 'Selesai';

type Retur = {
  id: number;
  transaksi: string;
  produk: string;
  jumlah: number;
  alasan: string;
  tanggal: string;
  status: Status;
};

const formKosong = {
  transaksi: '',
  produk: '',
  jumlah: 1,
  alasan: '',
  tanggal: '',
  status: 'Diproses' as Status,
};

// ======================================================
// HELPER API
// ======================================================

async function api(method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: object) {
  const res = await fetch(
    method === 'GET' ? '/api/manajemen?menu=retur' : '/api/manajemen',
    {
      method,
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }
  );

  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error('Response server tidak valid.');
  }

  if (!res.ok) throw new Error(data.error || data.detail || 'Terjadi kesalahan pada server.');
  return data;
}

// ======================================================
// KOMPONEN KECIL
// ======================================================

const Garis = ({ className = '' }: { className?: string }) => (
  <div className={`flex h-1.5 ${className}`}>
    <span className="flex-1 bg-blue-600" />
    <span className="flex-1 bg-red-600" />
    <span className="flex-1 bg-yellow-400" />
  </div>
);

const Overlay = ({ children, maxW = 'max-w-md' }: { children: ReactNode; maxW?: string }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-950/40 p-4 backdrop-blur-[2px]">
    <div className={`anim-modal w-full ${maxW} overflow-hidden rounded-2xl bg-white shadow-2xl`}>
      {children}
    </div>
  </div>
);

const Stat = ({ icon, warna, label, nilai }: { icon: ReactNode; warna: string; label: string; nilai: ReactNode }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-md ${warna}`}>{icon}</div>
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-blue-900">{nilai}</p>
    </div>
  </div>
);

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <label className="mb-1.5 block text-sm font-semibold text-slate-600">{label}</label>
    {children}
  </div>
);

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50';

// ======================================================
// HALAMAN RETUR
// ======================================================

export default function ReturPage() {
  const [data, setData] = useState<Retur[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(formKosong);
  const [hapusItem, setHapusItem] = useState<Retur | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; pesan: string } | null>(null);

  const info = (ok: boolean, pesan: string) => setToast({ ok, pesan });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // AMBIL DATA
  const ambilData = async () => {
    try {
      const hasil = await api('GET');
      setData(Array.isArray(hasil) ? hasil : []);
    } catch (e: any) {
      info(false, e.message || 'Gagal terhubung ke server.');
    } finally {
      setMemuat(false);
    }
  };

  useEffect(() => {
    ambilData();
  }, []);

  // FORM
  const bukaForm = (item?: Retur) => {
    setEditId(item?.id ?? null);
    setForm(
      item
        ? {
            transaksi: item.transaksi,
            produk: item.produk,
            jumlah: item.jumlah,
            alasan: item.alasan,
            tanggal: item.tanggal?.slice(0, 10) || '',
            status: item.status,
          }
        : formKosong
    );
    setModal(true);
  };

  const tutupForm = () => {
    setModal(false);
    setEditId(null);
    setForm(formKosong);
  };

  const ubah = (k: keyof typeof formKosong) => (e: { target: { value: string } }) =>
    setForm({ ...form, [k]: k === 'jumlah' ? Number(e.target.value) : e.target.value });

  // SIMPAN / UPDATE
  const simpan = async () => {
    if (!form.transaksi.trim() || !form.produk.trim() || !form.tanggal)
      return info(false, 'Transaksi, produk, dan tanggal wajib diisi.');
    if (form.jumlah < 1) return info(false, 'Jumlah minimal 1.');

    try {
      setLoading(true);
      await api(editId !== null ? 'PUT' : 'POST', { menu: 'retur', id: editId, ...form });
      info(true, editId !== null ? 'Retur berhasil diperbarui.' : 'Retur berhasil ditambahkan.');
      tutupForm();
      await ambilData();
    } catch (e: any) {
      info(false, e.message || 'Gagal menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  // TANDAI SELESAI
  const selesaikan = async (item: Retur) => {
    try {
      await api('PUT', {
        menu: 'retur',
        ...item,
        tanggal: item.tanggal?.slice(0, 10),
        status: 'Selesai',
      });
      info(true, 'Retur ditandai selesai.');
      await ambilData();
    } catch (e: any) {
      info(false, e.message || 'Gagal mengubah status.');
    }
  };

  // HAPUS
  const hapus = async () => {
    if (!hapusItem) return;
    try {
      setLoading(true);
      await api('DELETE', { menu: 'retur', id: hapusItem.id });
      info(true, 'Data retur berhasil dihapus.');
      setHapusItem(null);
      await ambilData();
    } catch (e: any) {
      info(false, e.message || 'Gagal menghapus data.');
    } finally {
      setLoading(false);
    }
  };

  const keyword = search.toLowerCase();
  const filtered = data.filter(
    (r) => r.transaksi.toLowerCase().includes(keyword) || r.produk.toLowerCase().includes(keyword)
  );
  const diproses = data.filter((r) => r.status === 'Diproses').length;
  const selesai = data.filter((r) => r.status === 'Selesai').length;

  return (
    <div className="flex min-h-screen bg-white">
      <style>{`
        @keyframes munculModal { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }
        @keyframes masukToast { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }
        .anim-modal { animation: munculModal .22s ease-out; }
        .anim-toast { animation: masukToast .25s ease-out; }
        @media (prefers-reduced-motion: reduce) { .anim-modal, .anim-toast { animation: none; } }
      `}</style>

      <SidebarKasir />

      <main className="min-w-0 flex-1 px-5 py-8 md:px-10">
        <div className="mx-auto max-w-6xl">
          {/* HERO */}
          <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 px-8 py-9 text-white shadow-xl shadow-blue-100">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-yellow-400/20" />
            <div className="pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-red-500/20" />

            <div className="relative flex flex-wrap items-center justify-between gap-5">
              <div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Retur Penjualan</h1>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-blue-100">
                  Kelola pengembalian barang dari pelanggan Indomart dalam satu tempat.
                </p>
              </div>

              <button
                onClick={() => bukaForm()}
                className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3.5 text-sm font-bold text-blue-900 shadow-lg shadow-blue-950/20 transition hover:bg-yellow-300 focus:outline-none focus:ring-4 focus:ring-yellow-200/60"
              >
                <Plus size={18} strokeWidth={2.5} />
                Tambah retur
              </button>
            </div>

            <Garis className="absolute inset-x-0 bottom-0" />
          </section>

          {/* STATISTIK */}
          <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            <Stat warna="bg-red-600 shadow-red-100" icon={<RotateCcw size={22} className="text-white" />} label="Total retur" nilai={data.length} />
            <Stat warna="bg-yellow-400 shadow-yellow-100" icon={<RotateCcw size={22} className="text-blue-900" />} label="Sedang diproses" nilai={diproses} />
            <Stat warna="bg-blue-700 shadow-blue-100" icon={<CheckCircle size={22} className="text-white" />} label="Selesai" nilai={selesai} />
          </section>

          {/* TABEL */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-blue-900">Data retur</h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Menampilkan {filtered.length} dari {data.length} retur
                </p>
              </div>

              <div className="relative w-full md:w-80">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari transaksi atau produk..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-yellow-300 bg-blue-50/70 text-sm text-blue-900">
                    {['Transaksi', 'Produk', 'Jumlah', 'Alasan', 'Tanggal', 'Status'].map((h) => (
                      <th key={h} className="px-5 py-3.5 font-semibold">{h}</th>
                    ))}
                    <th className="px-5 py-3.5 text-center font-semibold">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {memuat &&
                    [0, 1, 2].map((i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td colSpan={7} className="px-5 py-4">
                          <div className="flex animate-pulse items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-100" />
                            <div className="h-3 w-40 rounded bg-slate-100" />
                            <div className="ml-auto h-3 w-24 rounded bg-slate-100" />
                          </div>
                        </td>
                      </tr>
                    ))}

                  {!memuat &&
                    filtered.map((r) => (
                      <tr key={r.id} className="border-t border-slate-100 transition hover:bg-blue-50/40">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-700 text-white">
                              <RotateCcw size={17} />
                            </div>
                            <span className="text-sm font-semibold text-slate-800">{r.transaksi}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">{r.produk}</td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-800">
                            {r.jumlah}
                          </span>
                        </td>

                        <td className="max-w-[200px] truncate px-5 py-4 text-sm text-slate-500" title={r.alasan}>
                          {r.alasan || '-'}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                          {r.tanggal
                            ? new Date(r.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '-'}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                              r.status === 'Selesai' ? 'bg-blue-50 text-blue-700' : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${r.status === 'Selesai' ? 'bg-blue-600' : 'bg-yellow-500'}`} />
                            {r.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-center gap-1">
                            {r.status === 'Diproses' && (
                              <button onClick={() => selesaikan(r)} title="Tandai selesai" className="rounded-lg p-2 text-blue-700 transition hover:bg-blue-100">
                                <CheckCircle size={17} />
                              </button>
                            )}
                            <button onClick={() => bukaForm(r)} title="Edit retur" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100">
                              <Pencil size={17} />
                            </button>
                            <button onClick={() => setHapusItem(r)} title="Hapus retur" className="rounded-lg p-2 text-red-600 transition hover:bg-red-100">
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {!memuat && filtered.length === 0 && (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                    <RotateCcw size={30} className="text-blue-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    {search ? 'Retur tidak ditemukan' : 'Belum ada data retur'}
                  </p>
                  {!search && (
                    <p className="mt-1 text-xs text-slate-400">Klik "Tambah retur" untuk mencatat pengembalian pertama.</p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* TOAST */}
      {toast && (
        <div className="anim-toast fixed right-5 top-5 z-[200] flex max-w-sm items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-2xl">
          {toast.ok ? (
            <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-blue-700" />
          ) : (
            <AlertCircle size={22} className="mt-0.5 shrink-0 text-red-600" />
          )}
          <div>
            <p className="text-sm font-bold text-slate-800">{toast.ok ? 'Berhasil' : 'Gagal'}</p>
            <p className="mt-0.5 text-sm text-slate-500">{toast.pesan}</p>
          </div>
          <div className={`absolute inset-x-0 bottom-0 h-1 rounded-b-xl ${toast.ok ? 'bg-yellow-400' : 'bg-red-600'}`} />
        </div>
      )}

      {/* MODAL TAMBAH / EDIT */}
      {modal && (
        <Overlay maxW="max-w-lg">
          <Garis />
          <div className="p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-blue-900">{editId !== null ? 'Edit retur' : 'Tambah retur'}</h2>
                <p className="mt-1 text-sm text-slate-400">Masukkan data pengembalian barang</p>
              </div>
              <button onClick={tutupForm} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <Field label="No. transaksi">
                <input type="text" value={form.transaksi} onChange={ubah('transaksi')} placeholder="Contoh: TRX-20260910-001" disabled={loading} className={inputClass} />
              </Field>

              <Field label="Produk">
                <input type="text" value={form.produk} onChange={ubah('produk')} placeholder="Nama produk" disabled={loading} className={inputClass} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Jumlah">
                  <input type="number" min={1} value={form.jumlah} onChange={ubah('jumlah')} disabled={loading} className={inputClass} />
                </Field>
                <Field label="Tanggal">
                  <input type="date" value={form.tanggal} onChange={ubah('tanggal')} disabled={loading} className={inputClass} />
                </Field>
              </div>

              <Field label="Alasan retur">
                <textarea rows={3} value={form.alasan} onChange={ubah('alasan')} placeholder="Contoh: Produk rusak / salah produk" disabled={loading} className={`${inputClass} resize-none`} />
              </Field>

              <Field label="Status">
                <select value={form.status} onChange={ubah('status')} disabled={loading} className={inputClass}>
                  <option value="Diproses">Diproses</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={tutupForm} disabled={loading} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50">
                Batal
              </button>
              <button onClick={simpan} disabled={loading} className="rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-100 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? 'Menyimpan...' : editId !== null ? 'Simpan perubahan' : 'Simpan retur'}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {hapusItem && (
        <Overlay maxW="max-w-sm">
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <Trash2 size={26} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-blue-900">Hapus data retur?</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Retur <span className="font-semibold text-slate-700">{hapusItem.transaksi}</span> akan dihapus.
              Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setHapusItem(null)} disabled={loading} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
                Batal
              </button>
              <button onClick={hapus} disabled={loading} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-100 transition hover:bg-red-700 disabled:opacity-60">
                {loading ? 'Menghapus...' : 'Ya, hapus'}
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}