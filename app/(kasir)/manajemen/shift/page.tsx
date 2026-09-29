'use client';

import { useEffect, useState, type ReactNode } from 'react';
import SidebarKasir from '@/app/components/SidebarKasir';
import {
  Plus, Pencil, Trash2, X, Clock3, CheckCircle, Eye, Wallet,
  CheckCircle2, AlertCircle,
} from 'lucide-react';

type Status = 'Aktif' | 'Selesai';

type Shift = {
  id: number;
  kasir: string;
  shift: string;
  mulai: string;
  selesai: string;
  transaksi: number;
  uang_awal: number;
  total_penjualan: number;
  status: Status;
};

const formKosong = {
  kasir: '',
  shift: 'Pagi',
  mulai: '',
  selesai: '',
  transaksi: 0,
  uangAwal: 0,
  totalPenjualan: 0,
  status: 'Aktif' as Status,
};

// Aksi yang butuh konfirmasi (tutup shift / hapus)
type Konfirmasi = {
  judul: string;
  isi: ReactNode;
  tombol: string;
  merah: boolean;
  aksi: () => Promise<void>;
};

// ======================================================
// HELPER
// ======================================================

async function api(method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: object) {
  const res = await fetch(
    method === 'GET' ? '/api/manajemen?menu=shift' : '/api/manajemen',
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

const rupiah = (angka: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(angka) || 0);

const waktu = (v?: string) =>
  v
    ? new Date(v).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

// Ubah waktu dari database ke format input datetime-local (memakai jam lokal)
const keInput = (v?: string) => {
  if (!v) return '';
  const d = new Date(v);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

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
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-md ${warna}`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="truncate text-2xl font-bold text-blue-900">{nilai}</p>
    </div>
  </div>
);

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <label className="mb-1.5 block text-sm font-semibold text-slate-600">{label}</label>
    {children}
  </div>
);

const Badge = ({ status }: { status: Status }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
      status === 'Selesai' ? 'bg-blue-50 text-blue-700' : 'bg-yellow-100 text-yellow-800'
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${status === 'Selesai' ? 'bg-blue-600' : 'bg-yellow-500'}`} />
    {status}
  </span>
);

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50';

// ======================================================
// HALAMAN SHIFT
// ======================================================

export default function ShiftPage() {
  const [data, setData] = useState<Shift[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [loading, setLoading] = useState(false);

  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(formKosong);
  const [detail, setDetail] = useState<Shift | null>(null);
  const [konfirmasi, setKonfirmasi] = useState<Konfirmasi | null>(null);
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
  const bukaForm = (item?: Shift) => {
    setEditId(item?.id ?? null);
    setForm(
      item
        ? {
            kasir: item.kasir,
            shift: item.shift,
            mulai: keInput(item.mulai),
            selesai: keInput(item.selesai),
            transaksi: item.transaksi,
            uangAwal: item.uang_awal,
            totalPenjualan: item.total_penjualan,
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

  const angka = ['transaksi', 'uangAwal', 'totalPenjualan'];
  const ubah = (k: keyof typeof formKosong) => (e: { target: { value: string } }) =>
    setForm({ ...form, [k]: angka.includes(k) ? Number(e.target.value) : e.target.value });

  // SIMPAN / UPDATE
  const simpan = async () => {
    if (!form.kasir.trim() || !form.mulai) return info(false, 'Nama kasir dan waktu mulai wajib diisi.');

    try {
      setLoading(true);
      await api(editId !== null ? 'PUT' : 'POST', { menu: 'shift', id: editId, ...form });
      info(true, editId !== null ? 'Shift berhasil diperbarui.' : 'Shift berhasil dibuka.');
      tutupForm();
      await ambilData();
    } catch (e: any) {
      info(false, e.message || 'Gagal menyimpan shift.');
    } finally {
      setLoading(false);
    }
  };

  // KONFIRMASI: TUTUP SHIFT
  const mintaTutup = (s: Shift) =>
    setKonfirmasi({
      judul: 'Tutup shift?',
      isi: (
        <>
          Shift <b className="text-slate-700">{s.shift}</b> milik <b className="text-slate-700">{s.kasir}</b> akan
          ditandai selesai.
        </>
      ),
      tombol: 'Ya, tutup shift',
      merah: false,
      aksi: async () => {
        await api('PUT', {
          menu: 'shift',
          id: s.id,
          kasir: s.kasir,
          shift: s.shift,
          mulai: s.mulai,
          selesai: new Date().toISOString(),
          transaksi: s.transaksi,
          uangAwal: s.uang_awal,
          totalPenjualan: s.total_penjualan,
          status: 'Selesai',
        });
        info(true, 'Shift berhasil ditutup.');
      },
    });

  // KONFIRMASI: HAPUS
  const mintaHapus = (s: Shift) =>
    setKonfirmasi({
      judul: 'Hapus data shift?',
      isi: (
        <>
          Shift <b className="text-slate-700">{s.shift}</b> milik <b className="text-slate-700">{s.kasir}</b> akan
          dihapus. Tindakan ini tidak bisa dibatalkan.
        </>
      ),
      tombol: 'Ya, hapus',
      merah: true,
      aksi: async () => {
        await api('DELETE', { menu: 'shift', id: s.id });
        info(true, 'Data shift berhasil dihapus.');
      },
    });

  const jalankan = async () => {
    if (!konfirmasi) return;
    try {
      setLoading(true);
      await konfirmasi.aksi();
      setKonfirmasi(null);
      await ambilData();
    } catch (e: any) {
      info(false, e.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  const aktif = data.filter((s) => s.status === 'Aktif').length;
  const totalPenjualan = data.reduce((t, s) => t + Number(s.total_penjualan || 0), 0);

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
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Tutup Kasir / Shift</h1>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-blue-100">
                  Kelola shift kasir dan tutup kasir Indomart dalam satu tempat.
                </p>
              </div>

              <button
                onClick={() => bukaForm()}
                className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3.5 text-sm font-bold text-blue-900 shadow-lg shadow-blue-950/20 transition hover:bg-yellow-300 focus:outline-none focus:ring-4 focus:ring-yellow-200/60"
              >
                <Plus size={18} strokeWidth={2.5} />
                Buka shift
              </button>
            </div>

            <Garis className="absolute inset-x-0 bottom-0" />
          </section>

          {/* STATISTIK */}
          <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            <Stat warna="bg-red-600 shadow-red-100" icon={<Clock3 size={22} className="text-white" />} label="Total shift" nilai={data.length} />
            <Stat warna="bg-yellow-400 shadow-yellow-100" icon={<Clock3 size={22} className="text-blue-900" />} label="Shift aktif" nilai={aktif} />
            <Stat warna="bg-blue-700 shadow-blue-100" icon={<Wallet size={22} className="text-white" />} label="Total penjualan" nilai={rupiah(totalPenjualan)} />
          </section>

          {/* TABEL */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-blue-900">Riwayat shift kasir</h2>
              <p className="mt-0.5 text-xs text-slate-400">Shift aktif dan shift yang sudah ditutup</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-yellow-300 bg-blue-50/70 text-sm text-blue-900">
                    {['Kasir', 'Shift', 'Mulai', 'Selesai', 'Transaksi', 'Penjualan', 'Status'].map((h) => (
                      <th key={h} className="px-5 py-3.5 font-semibold">{h}</th>
                    ))}
                    <th className="px-5 py-3.5 text-center font-semibold">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {memuat &&
                    [0, 1, 2].map((i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td colSpan={8} className="px-5 py-4">
                          <div className="flex animate-pulse items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-100" />
                            <div className="h-3 w-40 rounded bg-slate-100" />
                            <div className="ml-auto h-3 w-24 rounded bg-slate-100" />
                          </div>
                        </td>
                      </tr>
                    ))}

                  {!memuat &&
                    data.map((s) => (
                      <tr key={s.id} className="border-t border-slate-100 transition hover:bg-blue-50/40">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-700 text-white">
                              <Clock3 size={17} />
                            </div>
                            <span className="whitespace-nowrap text-sm font-semibold text-slate-800">{s.kasir}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">{s.shift}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">{waktu(s.mulai)}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">{waktu(s.selesai)}</td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-800">
                            {s.transaksi}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-blue-900">
                          {rupiah(s.total_penjualan)}
                        </td>

                        <td className="px-5 py-4"><Badge status={s.status} /></td>

                        <td className="px-5 py-4">
                          <div className="flex justify-center gap-1">
                            <button onClick={() => setDetail(s)} title="Detail" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100">
                              <Eye size={17} />
                            </button>
                            {s.status === 'Aktif' && (
                              <button onClick={() => mintaTutup(s)} title="Tutup shift" className="rounded-lg p-2 text-blue-700 transition hover:bg-blue-100">
                                <CheckCircle size={17} />
                              </button>
                            )}
                            <button onClick={() => bukaForm(s)} title="Edit shift" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100">
                              <Pencil size={17} />
                            </button>
                            <button onClick={() => mintaHapus(s)} title="Hapus shift" className="rounded-lg p-2 text-red-600 transition hover:bg-red-100">
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {!memuat && data.length === 0 && (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                    <Clock3 size={30} className="text-blue-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">Belum ada data shift</p>
                  <p className="mt-1 text-xs text-slate-400">Klik "Buka shift" untuk memulai shift pertama.</p>
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
                <h2 className="text-xl font-bold text-blue-900">{editId !== null ? 'Edit shift' : 'Buka shift baru'}</h2>
                <p className="mt-1 text-sm text-slate-400">Masukkan informasi shift kasir</p>
              </div>
              <button onClick={tutupForm} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Nama kasir">
                <input type="text" value={form.kasir} onChange={ubah('kasir')} placeholder="Contoh: Kasir 01" disabled={loading} className={inputClass} />
              </Field>

              <Field label="Shift">
                <select value={form.shift} onChange={ubah('shift')} disabled={loading} className={inputClass}>
                  <option value="Pagi">Pagi</option>
                  <option value="Siang">Siang</option>
                  <option value="Malam">Malam</option>
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Waktu mulai">
                  <input type="datetime-local" value={form.mulai} onChange={ubah('mulai')} disabled={loading} className={inputClass} />
                </Field>
                <Field label="Uang awal">
                  <input type="number" min={0} value={form.uangAwal} onChange={ubah('uangAwal')} disabled={loading} className={inputClass} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Jumlah transaksi">
                  <input type="number" min={0} value={form.transaksi} onChange={ubah('transaksi')} disabled={loading} className={inputClass} />
                </Field>
                <Field label="Total penjualan">
                  <input type="number" min={0} value={form.totalPenjualan} onChange={ubah('totalPenjualan')} disabled={loading} className={inputClass} />
                </Field>
              </div>

              {editId !== null && (
                <Field label="Status">
                  <select value={form.status} onChange={ubah('status')} disabled={loading} className={inputClass}>
                    <option value="Aktif">Aktif</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </Field>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={tutupForm} disabled={loading} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50">
                Batal
              </button>
              <button onClick={simpan} disabled={loading} className="rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-100 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? 'Menyimpan...' : editId !== null ? 'Simpan perubahan' : 'Buka shift'}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* MODAL DETAIL */}
      {detail && (
        <Overlay>
          <Garis />
          <div className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-blue-900">Detail shift</h2>
                <p className="mt-1 text-sm text-slate-400">Informasi lengkap shift kasir</p>
              </div>
              <button onClick={() => setDetail(null)} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <dl className="divide-y divide-slate-100 text-sm">
              {[
                ['Kasir', detail.kasir],
                ['Shift', detail.shift],
                ['Mulai', waktu(detail.mulai)],
                ['Selesai', waktu(detail.selesai)],
                ['Jumlah transaksi', detail.transaksi],
                ['Uang awal', rupiah(detail.uang_awal)],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between py-3">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="font-semibold text-slate-800">{v}</dd>
                </div>
              ))}
              <div className="flex justify-between py-3">
                <dt className="text-slate-500">Total penjualan</dt>
                <dd className="font-bold text-blue-700">{rupiah(detail.total_penjualan)}</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-slate-500">Status</dt>
                <dd><Badge status={detail.status} /></dd>
              </div>
            </dl>

            <button onClick={() => setDetail(null)} className="mt-4 w-full rounded-xl bg-blue-700 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-100 transition hover:bg-blue-800">
              Tutup
            </button>
          </div>
        </Overlay>
      )}

      {/* MODAL KONFIRMASI (TUTUP SHIFT / HAPUS) */}
      {konfirmasi && (
        <Overlay maxW="max-w-sm">
          <div className="p-6 text-center">
            <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${konfirmasi.merah ? 'bg-red-50' : 'bg-blue-50'}`}>
              {konfirmasi.merah ? (
                <Trash2 size={26} className="text-red-600" />
              ) : (
                <CheckCircle size={26} className="text-blue-700" />
              )}
            </div>
            <h3 className="text-lg font-bold text-blue-900">{konfirmasi.judul}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{konfirmasi.isi}</p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setKonfirmasi(null)} disabled={loading} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
                Batal
              </button>
              <button
                onClick={jalankan}
                disabled={loading}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition disabled:opacity-60 ${
                  konfirmasi.merah ? 'bg-red-600 shadow-red-100 hover:bg-red-700' : 'bg-blue-700 shadow-blue-100 hover:bg-blue-800'
                }`}
              >
                {loading ? 'Memproses...' : konfirmasi.tombol}
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}