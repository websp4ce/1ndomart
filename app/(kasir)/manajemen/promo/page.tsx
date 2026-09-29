'use client';

import { useEffect, useState, type ReactNode } from 'react';
import SidebarKasir from '@/app/components/SidebarKasir';
import {
  Search, Plus, Pencil, Trash2, Tag, Percent, CalendarDays,
  X, CheckCircle2, AlertCircle,
} from 'lucide-react';

type Promo = {
  id: number;
  nama: string;
  diskon: number;
  periode: string;
  status: 'Aktif' | 'Berakhir';
};

// ======================================================
// HELPER API
// ======================================================

async function api(method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: object) {
  const res = await fetch(
    '/api/manajemen?menu=promo',
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

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50';

// ======================================================
// HALAMAN PROMO
// ======================================================

export default function PromoPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [statusLama, setStatusLama] = useState<'Aktif' | 'Berakhir'>('Aktif');
  const [hapusItem, setHapusItem] = useState<Promo | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; pesan: string } | null>(null);

  const [nama, setNama] = useState('');
  const [diskon, setDiskon] = useState('');
  const [periode, setPeriode] = useState('');

  const info = (ok: boolean, pesan: string) => setToast({ ok, pesan });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // AMBIL DATA
  // Mengembalikan true/false supaya pemanggil tahu apakah pengambilan data berhasil
  const ambilData = async (): Promise<boolean> => {
    try {
      const hasil = await api('GET');
      setPromos(Array.isArray(hasil) ? hasil : []);
      return true;
    } catch (e: any) {
      info(false, e.message || 'Gagal terhubung ke server.');
      return false;
    } finally {
      setMemuat(false);
    }
  };

  useEffect(() => {
    ambilData();
  }, []);

  // FORM
  const isiForm = (p?: Promo) => {
    setEditId(p?.id ?? null);
    setStatusLama(p?.status ?? 'Aktif');
    setNama(p?.nama ?? '');
    setDiskon(p ? String(p.diskon) : '');
    setPeriode(p?.periode ?? '');
    setShowForm(true);
  };

  const reset = () => {
    setShowForm(false);
    setEditId(null);
    setStatusLama('Aktif');
    setNama('');
    setDiskon('');
    setPeriode('');
  };

  // SIMPAN / UPDATE
  const simpan = async () => {
    if (!nama.trim() || !diskon || !periode.trim()) return info(false, 'Semua data harus diisi.');
    const nilai = Number(diskon);
    if (!Number.isFinite(nilai) || nilai < 1 || nilai > 100) return info(false, 'Diskon harus antara 1 dan 100.');

    const sedangEdit = editId !== null;

    try {
      setLoading(true);
      await api(sedangEdit ? 'PUT' : 'POST', {
        menu: 'promo',
        ...(sedangEdit && { id: editId }), // id hanya dikirim saat edit
        nama: nama.trim(),
        diskon: nilai,
        periode: periode.trim(),
        status: sedangEdit ? statusLama : 'Aktif', // status lama dipertahankan saat edit
      });
    } catch (e: any) {
      info(false, e.message || 'Gagal menyimpan promo.');
      setLoading(false);
      return;
    }

    // Simpan sudah berhasil di titik ini; tutup form lalu segarkan tabel
    reset();
    setLoading(false);
    const berhasilMuat = await ambilData();
    if (berhasilMuat) {
      info(true, sedangEdit ? 'Promo berhasil diperbarui.' : 'Promo berhasil ditambahkan.');
    }
    // Jika gagal memuat ulang, toast error dari ambilData tetap tampil
  };

  // HAPUS
  const hapus = async () => {
    if (!hapusItem) return;
    try {
      setLoading(true);
      await api('DELETE', { menu: 'promo', id: hapusItem.id });
    } catch (e: any) {
      info(false, e.message || 'Gagal menghapus promo.');
      setLoading(false);
      return;
    }

    setHapusItem(null);
    setLoading(false);
    const berhasilMuat = await ambilData();
    if (berhasilMuat) info(true, 'Promo berhasil dihapus.');
  };

  const filtered = promos.filter((p) => p.nama.toLowerCase().includes(search.toLowerCase()));
  const promoAktif = promos.filter((p) => p.status === 'Aktif').length;
  const diskonTertinggi = promos.reduce((m, p) => Math.max(m, Number(p.diskon)), 0);

  // Field form: label, nilai, setter, placeholder, tipe
  const fields = [
    { label: 'Nama promo', value: nama, set: setNama, ph: 'Contoh: Promo Hemat', type: 'text' },
    { label: 'Diskon (%)', value: diskon, set: setDiskon, ph: 'Contoh: 20', type: 'number' },
    { label: 'Periode promo', value: periode, set: setPeriode, ph: 'Contoh: 10 - 15 Sep 2026', type: 'text' },
  ];

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
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Promo & Diskon</h1>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-blue-100">
                  Kelola promo dan diskon produk Indomart dalam satu tempat.
                </p>
              </div>

              <button
                onClick={() => isiForm()}
                className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3.5 text-sm font-bold text-blue-900 shadow-lg shadow-blue-950/20 transition hover:bg-yellow-300 focus:outline-none focus:ring-4 focus:ring-yellow-200/60"
              >
                <Plus size={18} strokeWidth={2.5} />
                Tambah promo
              </button>
            </div>

            <Garis className="absolute inset-x-0 bottom-0" />
          </section>

          {/* STATISTIK */}
          <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            <Stat warna="bg-blue-700 shadow-blue-100" icon={<Tag size={22} className="text-white" />} label="Total promo" nilai={promos.length} />
            <Stat warna="bg-red-600 shadow-red-100" icon={<Percent size={22} className="text-white" />} label="Promo aktif" nilai={promoAktif} />
            <Stat warna="bg-yellow-400 shadow-yellow-100" icon={<CalendarDays size={22} className="text-blue-900" />} label="Diskon tertinggi" nilai={`${diskonTertinggi}%`} />
          </section>

          {/* TABEL */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-blue-900">Daftar promo</h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Menampilkan {filtered.length} dari {promos.length} promo
                </p>
              </div>

              <div className="relative w-full md:w-80">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari promo..."
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
                    {['Nama promo', 'Diskon', 'Periode', 'Status'].map((h) => (
                      <th key={h} className="px-5 py-3.5 font-semibold">{h}</th>
                    ))}
                    <th className="px-5 py-3.5 text-center font-semibold">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {memuat &&
                    [0, 1, 2].map((i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td colSpan={5} className="px-5 py-4">
                          <div className="flex animate-pulse items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-100" />
                            <div className="h-3 w-40 rounded bg-slate-100" />
                            <div className="ml-auto h-3 w-24 rounded bg-slate-100" />
                          </div>
                        </td>
                      </tr>
                    ))}

                  {!memuat &&
                    filtered.map((p) => (
                      <tr key={p.id} className="border-t border-slate-100 transition hover:bg-blue-50/40">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-white">
                              <Tag size={17} />
                            </div>
                            <span className="text-sm font-semibold text-slate-800">{p.nama}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-800">
                            {p.diskon}%
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">{p.periode}</td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                              p.status === 'Aktif' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${p.status === 'Aktif' ? 'bg-blue-600' : 'bg-red-500'}`} />
                            {p.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => isiForm(p)} title="Edit promo" className="rounded-lg p-2 text-blue-700 transition hover:bg-blue-100">
                              <Pencil size={17} />
                            </button>
                            <button onClick={() => setHapusItem(p)} title="Hapus promo" className="rounded-lg p-2 text-red-600 transition hover:bg-red-100">
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
                    <Tag size={30} className="text-blue-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    {search ? 'Promo tidak ditemukan' : 'Belum ada promo'}
                  </p>
                  {!search && (
                    <p className="mt-1 text-xs text-slate-400">Klik "Tambah promo" untuk membuat promo pertama.</p>
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
      {showForm && (
        <Overlay>
          <Garis />
          <div className="p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-blue-900">{editId !== null ? 'Edit promo' : 'Tambah promo'}</h2>
                <p className="mt-1 text-sm text-slate-400">Masukkan informasi promo</p>
              </div>
              <button onClick={reset} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((f) => (
                <div key={f.label}>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-600">{f.label}</label>
                  <input
                    type={f.type}
                    min={f.type === 'number' ? 1 : undefined}
                    max={f.type === 'number' ? 100 : undefined}
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    placeholder={f.ph}
                    disabled={loading}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={reset} disabled={loading} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50">
                Batal
              </button>
              <button onClick={simpan} disabled={loading} className="rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-100 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? 'Menyimpan...' : editId !== null ? 'Simpan perubahan' : 'Simpan'}
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
            <h3 className="text-lg font-bold text-blue-900">Hapus promo?</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              <span className="font-semibold text-slate-700">{hapusItem.nama}</span> akan dihapus.
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