'use client';

import { useEffect, useState } from 'react';
import SidebarKasir from '@/app/components/SidebarKasir';

import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  Star,
  CalendarPlus,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

// ======================================================
// TYPE
// ======================================================

type Member = {
  id: number;
  nama: string;
  telepon: string;
  poin: number;
  tanggal: string;
};

type Toast = { tipe: 'sukses' | 'error'; pesan: string } | null;

type Urutan = 'terbaru' | 'poin' | 'nama';

// ======================================================
// HELPER: KIRIM REQUEST KE API
// ======================================================

async function kirim(method: 'POST' | 'PUT' | 'DELETE', body: object) {
  const response = await fetch('/api/manajemen', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await response.text();

  let hasil: any;
  try {
    hasil = text ? JSON.parse(text) : {};
  } catch {
    console.error('Response bukan JSON:', text);
    throw new Error(`Response server tidak valid (status ${response.status}).`);
  }

  if (!response.ok) {
    console.error('API ERROR:', hasil);
    throw new Error(hasil.error || hasil.detail || 'Terjadi kesalahan pada server.');
  }

  return hasil;
}

// Warna avatar bergantian: biru, merah, kuning
const warnaAvatar = [
  'bg-blue-700 text-white',
  'bg-red-600 text-white',
  'bg-yellow-400 text-blue-900',
];

// ======================================================
// HALAMAN MEMBER
// ======================================================

export default function MemberPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [search, setSearch] = useState('');
  const [urutan, setUrutan] = useState<Urutan>('terbaru');

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [hapusItem, setHapusItem] = useState<Member | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const [nama, setNama] = useState('');
  const [telepon, setTelepon] = useState('');
  const [poin, setPoin] = useState('0');

  // ======================================================
  // TOAST (hilang otomatis setelah 3 detik)
  // ======================================================

  const tampilToast = (tipe: 'sukses' | 'error', pesan: string) =>
    setToast({ tipe, pesan });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // ======================================================
  // AMBIL DATA MEMBER
  // ======================================================

  const ambilData = async () => {
    try {
      const response = await fetch('/api/manajemen?menu=member', {
        method: 'GET',
        cache: 'no-store',
      });

      const text = await response.text();

      let hasil: any;
      try {
        hasil = text ? JSON.parse(text) : [];
      } catch {
        console.error('Response API bukan JSON:', text);
        tampilToast('error', 'Server mengirim response yang tidak valid.');
        return;
      }

      if (!response.ok) {
        console.error('GET MEMBER ERROR:', hasil);
        tampilToast(
          'error',
          hasil.error || hasil.detail || 'Gagal mengambil data member.'
        );
        return;
      }

      setMembers(Array.isArray(hasil) ? hasil : []);
    } catch (error) {
      console.error('AMBIL DATA MEMBER ERROR:', error);
      tampilToast('error', 'Gagal terhubung ke server.');
    } finally {
      setMemuat(false);
    }
  };

  useEffect(() => {
    ambilData();
  }, []);

  // ======================================================
  // SEARCH + URUTKAN
  // ======================================================

  const filtered = members
    .filter((item) => {
      const namaMember = String(item.nama || '').toLowerCase();
      const nomorTelepon = String(item.telepon || '');
      return (
        namaMember.includes(search.toLowerCase()) ||
        nomorTelepon.includes(search)
      );
    })
    .sort((a, b) => {
      if (urutan === 'poin') return Number(b.poin) - Number(a.poin);
      if (urutan === 'nama')
        return String(a.nama).localeCompare(String(b.nama), 'id');
      return b.id - a.id;
    });

  // ======================================================
  // FORM
  // ======================================================

  const bukaTambah = () => {
    setEditId(null);
    setNama('');
    setTelepon('');
    setPoin('0');
    setShowForm(true);
  };

  const bukaEdit = (item: Member) => {
    setEditId(item.id);
    setNama(item.nama);
    setTelepon(item.telepon);
    setPoin(String(item.poin ?? 0));
    setShowForm(true);
  };

  const reset = () => {
    setShowForm(false);
    setEditId(null);
    setNama('');
    setTelepon('');
    setPoin('0');
    setLoading(false);
  };

  // ======================================================
  // SIMPAN MEMBER
  // ======================================================

  const simpan = async () => {
    if (!nama.trim()) {
      tampilToast('error', 'Nama member harus diisi.');
      return;
    }

    if (!telepon.trim()) {
      tampilToast('error', 'Nomor telepon harus diisi.');
      return;
    }

    const nilaiPoin = Number(poin) || 0;

    if (nilaiPoin < 0) {
      tampilToast('error', 'Poin tidak boleh kurang dari 0.');
      return;
    }

    try {
      setLoading(true);

      await kirim(editId !== null ? 'PUT' : 'POST', {
        menu: 'member',
        id: editId,
        nama: nama.trim(),
        telepon: telepon.trim(),
        poin: nilaiPoin,
        tanggal: new Date().toISOString().split('T')[0],
      });

      tampilToast(
        'sukses',
        editId !== null
          ? 'Member berhasil diperbarui.'
          : 'Member berhasil ditambahkan.'
      );

      await ambilData();
      reset();
    } catch (error: any) {
      console.error('SIMPAN MEMBER ERROR:', error);
      tampilToast(
        'error',
        error?.message ||
          'Gagal terhubung ke server. Pastikan Next.js dan MySQL Laragon sedang berjalan.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // HAPUS MEMBER (setelah konfirmasi)
  // ======================================================

  const konfirmasiHapus = async () => {
    if (!hapusItem) return;

    try {
      setLoading(true);
      await kirim('DELETE', { menu: 'member', id: hapusItem.id });
      tampilToast('sukses', 'Member berhasil dihapus.');
      setHapusItem(null);
      await ambilData();
    } catch (error: any) {
      console.error('HAPUS MEMBER ERROR:', error);
      tampilToast('error', error?.message || 'Gagal menghapus member.');
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // STATISTIK
  // ======================================================

  const totalPoin = members.reduce(
    (total, item) => total + Number(item.poin || 0),
    0
  );

  const sekarang = new Date();

  const baruBulanIni = members.filter((item) => {
    if (!item.tanggal) return false;
    const d = new Date(item.tanggal);
    return (
      d.getMonth() === sekarang.getMonth() &&
      d.getFullYear() === sekarang.getFullYear()
    );
  }).length;

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50';

  // ======================================================
  // TAMPILAN
  // ======================================================

  return (
    <div className="flex min-h-screen bg-white">
      {/* Animasi kecil untuk modal & toast */}
      <style>{`
        @keyframes munculModal {
          from { opacity: 0; transform: translateY(12px) scale(.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes masukToast {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .anim-modal { animation: munculModal .22s ease-out; }
        .anim-toast { animation: masukToast .25s ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .anim-modal, .anim-toast { animation: none; }
        }
      `}</style>

      {/* SIDEBAR */}
      <SidebarKasir />

      {/* CONTENT */}
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10">
        <div className="mx-auto max-w-6xl">
          {/* ================= HERO ================= */}

          <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 px-8 py-9 text-white shadow-xl shadow-blue-100">
            {/* Dekorasi lingkaran */}
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-yellow-400/20" />
            <div className="pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-red-500/20" />

            <div className="relative flex flex-wrap items-center justify-between gap-5">
              <div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Member & Pelanggan
                </h1>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-blue-100">
                  Kelola data member dan poin pelanggan Indomart dalam satu
                  tempat.
                </p>
              </div>

              <button
                onClick={bukaTambah}
                className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3.5 text-sm font-bold text-blue-900 shadow-lg shadow-blue-950/20 transition hover:bg-yellow-300 focus:outline-none focus:ring-4 focus:ring-yellow-200/60"
              >
                <Plus size={18} strokeWidth={2.5} />
                Tambah member
              </button>
            </div>

            {/* Garis tiga warna */}
            <div className="absolute inset-x-0 bottom-0 flex h-1.5">
              <span className="flex-1 bg-blue-500" />
              <span className="flex-1 bg-red-600" />
              <span className="flex-1 bg-yellow-400" />
            </div>
          </section>

          {/* ================= STATISTIK ================= */}

          <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 shadow-md shadow-blue-100">
                <Users size={22} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total member</p>
                <p className="text-2xl font-bold text-blue-900">
                  {members.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 shadow-md shadow-red-100">
                <CalendarPlus size={22} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Bergabung bulan ini</p>
                <p className="text-2xl font-bold text-blue-900">
                  {baruBulanIni}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 shadow-md shadow-yellow-100">
                <Star size={22} className="fill-blue-900 text-blue-900" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total poin</p>
                <p className="text-2xl font-bold text-blue-900">
                  {totalPoin.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </section>

          {/* ================= TABEL ================= */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            {/* Toolbar */}
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-blue-900">
                  Daftar member
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Menampilkan {filtered.length} dari {members.length} pelanggan
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Cari nama atau nomor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <select
                  value={urutan}
                  onChange={(e) => setUrutan(e.target.value as Urutan)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="terbaru">Terbaru</option>
                  <option value="poin">Poin tertinggi</option>
                  <option value="nama">Nama A–Z</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-yellow-300 bg-blue-50/70 text-sm text-blue-900">
                    <th className="px-5 py-3.5 font-semibold">Nama member</th>
                    <th className="px-5 py-3.5 font-semibold">Telepon</th>
                    <th className="px-5 py-3.5 font-semibold">Poin</th>
                    <th className="px-5 py-3.5 font-semibold">Bergabung</th>
                    <th className="px-5 py-3.5 text-center font-semibold">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {/* Skeleton saat memuat */}
                  {memuat &&
                    [0, 1, 2, 3].map((i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-5 py-4" colSpan={5}>
                          <div className="flex animate-pulse items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-100" />
                            <div className="h-3 w-40 rounded bg-slate-100" />
                            <div className="ml-auto h-3 w-24 rounded bg-slate-100" />
                          </div>
                        </td>
                      </tr>
                    ))}

                  {!memuat &&
                    filtered.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-slate-100 transition hover:bg-blue-50/40"
                      >
                        {/* NAMA */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                                warnaAvatar[item.id % 3]
                              }`}
                            >
                              {String(item.nama || '?')
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-slate-800">
                              {item.nama}
                            </span>
                          </div>
                        </td>

                        {/* TELEPON */}
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {item.telepon}
                        </td>

                        {/* POIN */}
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-800">
                            <Star
                              size={13}
                              className="fill-yellow-400 text-yellow-500"
                            />
                            {Number(item.poin || 0).toLocaleString('id-ID')} poin
                          </span>
                        </td>

                        {/* TANGGAL */}
                        <td className="px-5 py-4 text-sm text-slate-500">
                          {item.tanggal
                            ? new Date(item.tanggal).toLocaleDateString(
                                'id-ID',
                                {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                }
                              )
                            : '-'}
                        </td>

                        {/* AKSI */}
                        <td className="px-5 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => bukaEdit(item)}
                              title="Edit member"
                              className="rounded-lg p-2 text-blue-700 transition hover:bg-blue-100"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              onClick={() => setHapusItem(item)}
                              title="Hapus member"
                              className="rounded-lg p-2 text-red-600 transition hover:bg-red-100"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {/* DATA KOSONG */}
              {!memuat && filtered.length === 0 && (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                    <Users size={30} className="text-blue-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    {search
                      ? 'Member tidak ditemukan'
                      : 'Belum ada data member'}
                  </p>
                  {!search && (
                    <p className="mt-1 text-xs text-slate-400">
                      Klik "Tambah member" untuk mendaftarkan pelanggan pertama.
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* ================= TOAST ================= */}

      {toast && (
        <div className="anim-toast fixed right-5 top-5 z-[200] flex max-w-sm items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-2xl">
          {toast.tipe === 'sukses' ? (
            <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-blue-700" />
          ) : (
            <AlertCircle size={22} className="mt-0.5 shrink-0 text-red-600" />
          )}
          <div>
            <p className="text-sm font-bold text-slate-800">
              {toast.tipe === 'sukses' ? 'Berhasil' : 'Gagal'}
            </p>
            <p className="mt-0.5 text-sm text-slate-500">{toast.pesan}</p>
          </div>
          <div
            className={`absolute inset-x-0 bottom-0 h-1 rounded-b-xl ${
              toast.tipe === 'sukses' ? 'bg-yellow-400' : 'bg-red-600'
            }`}
          />
        </div>
      )}

      {/* ================= MODAL TAMBAH / EDIT ================= */}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-950/40 p-4 backdrop-blur-[2px]">
          <div className="anim-modal w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex h-1.5">
              <span className="flex-1 bg-blue-700" />
              <span className="flex-1 bg-red-600" />
              <span className="flex-1 bg-yellow-400" />
            </div>

            <div className="p-6">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-blue-900">
                    {editId !== null ? 'Edit member' : 'Tambah member'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Masukkan informasi member
                  </p>
                </div>

                <button
                  onClick={reset}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                    Nama member
                  </label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Andi Saputra"
                    disabled={loading}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                    Nomor telepon
                  </label>
                  <input
                    type="tel"
                    value={telepon}
                    onChange={(e) =>
                      setTelepon(e.target.value.replace(/[^0-9+]/g, ''))
                    }
                    placeholder="Contoh: 081234567890"
                    disabled={loading}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                    Poin
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={poin}
                    onChange={(e) => setPoin(e.target.value)}
                    placeholder="Contoh: 100"
                    disabled={loading}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={reset}
                  disabled={loading}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  onClick={simpan}
                  disabled={loading}
                  className="rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-100 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? 'Menyimpan...'
                    : editId !== null
                      ? 'Simpan perubahan'
                      : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS ================= */}

      {hapusItem && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-blue-950/40 p-4 backdrop-blur-[2px]">
          <div className="anim-modal w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <Trash2 size={26} className="text-red-600" />
            </div>

            <h3 className="text-lg font-bold text-blue-900">Hapus member?</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              <span className="font-semibold text-slate-700">
                {hapusItem.nama}
              </span>{' '}
              akan dihapus beserta {Number(hapusItem.poin || 0)} poinnya.
              Tindakan ini tidak bisa dibatalkan.
            </p>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setHapusItem(null)}
                disabled={loading}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                onClick={konfirmasiHapus}
                disabled={loading}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-100 transition hover:bg-red-700 disabled:opacity-60"
              >
                {loading ? 'Menghapus...' : 'Ya, hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}