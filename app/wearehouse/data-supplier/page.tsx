'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Truck,
  Phone,
  Mail,
  Pencil,
  Trash2,
  X,
  Plus,
  Loader2,
  CheckCircle2,
  ToggleLeft,
  Building2,
} from 'lucide-react';
import SidebarWarehouse from '../../components/SidebarWarehouse'; // sesuaikan path sesuai lokasi asli

type StatusSupplier = 'Aktif' | 'Nonaktif';

type Supplier = {
  id: number;
  nama: string;
  kontak: string | null;
  email: string | null;
  status: StatusSupplier;
};

const statusPill: Record<StatusSupplier, string> = {
  Aktif: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
  Nonaktif: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
};

const STATUS_LIST: StatusSupplier[] = ['Aktif', 'Nonaktif'];

export default function DataSupplierPage() {
  const [data, setData] = useState<Supplier[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [errorMuat, setErrorMuat] = useState('');

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'Semua' | StatusSupplier>('Semua');

  // ==== MODAL TAMBAH/EDIT ====
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'tambah' | 'edit'>('tambah');
  const [editId, setEditId] = useState<number | null>(null);

  const [nama, setNama] = useState('');
  const [kontak, setKontak] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<StatusSupplier>('Aktif');

  const [mengirim, setMengirim] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // ==== HAPUS MODAL ====
  const [showHapusModal, setShowHapusModal] = useState(false);
  const [hapusId, setHapusId] = useState<number | null>(null);
  const [menghapus, setMenghapus] = useState(false);
  const [showHapusSukses, setShowHapusSukses] = useState(false);

  async function ambilSupplier() {
    setMemuat(true);
    setErrorMuat('');
    try {
      const res = await fetch('/api/warehouse/supplier');
      const json = await res.json();
      if (!res.ok) {
        setErrorMuat(json.message || 'Gagal mengambil data supplier.');
        return;
      }
      setData(json);
    } catch (err) {
      console.error(err);
      setErrorMuat('Terjadi kesalahan koneksi saat mengambil data.');
    } finally {
      setMemuat(false);
    }
  }

  useEffect(() => {
    ambilSupplier();
  }, []);

  const filtered = useMemo(() => {
    return data.filter((d) => {
      const matchSearch =
        !search ||
        d.nama.toLowerCase().includes(search.toLowerCase()) ||
        (d.kontak ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (d.email ?? '').toLowerCase().includes(search.toLowerCase());

      const matchTab = tab === 'Semua' || d.status === tab;

      return matchSearch && matchTab;
    });
  }, [data, search, tab]);

  const countAktif = data.filter((d) => d.status === 'Aktif').length;
  const countNonaktif = data.filter((d) => d.status === 'Nonaktif').length;

  // ===== TAMBAH / EDIT =====
  function resetForm() {
    setNama('');
    setKontak('');
    setEmail('');
    setStatus('Aktif');
    setErrorForm('');
  }

  function bukaTambah() {
    setModalMode('tambah');
    setEditId(null);
    resetForm();
    setShowModal(true);
  }

  function bukaEdit(item: Supplier) {
    setModalMode('edit');
    setEditId(item.id);
    setNama(item.nama);
    setKontak(item.kontak ?? '');
    setEmail(item.email ?? '');
    setStatus(item.status);
    setErrorForm('');
    setShowModal(true);
  }

  function tutupModal() {
    setShowModal(false);
    setEditId(null);
  }

  async function handleSimpan() {
    setErrorForm('');

    if (!nama.trim() || !kontak.trim() || !email.trim()) {
      setErrorForm('Lengkapi semua data supplier dulu ya.');
      return;
    }

    setMengirim(true);
    try {
      const isEdit = modalMode === 'edit' && editId != null;
      const res = await fetch(
        isEdit ? `/api/warehouse/supplier/${editId}` : '/api/warehouse/supplier',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nama: nama.trim(), kontak: kontak.trim(), email: email.trim(), status }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        setErrorForm(json.message || 'Gagal menyimpan data supplier.');
        return;
      }

      await ambilSupplier();
      tutupModal();
    } catch (err) {
      console.error(err);
      setErrorForm('Terjadi kesalahan koneksi saat menyimpan data.');
    } finally {
      setMengirim(false);
    }
  }

  // ===== TOGGLE STATUS (klik langsung di tabel) =====
  async function toggleStatus(item: Supplier) {
    const statusBaru: StatusSupplier = item.status === 'Aktif' ? 'Nonaktif' : 'Aktif';

    setTogglingId(item.id);
    setData((prev) =>
      prev.map((d) => (d.id === item.id ? { ...d, status: statusBaru } : d))
    );

    try {
      const res = await fetch(`/api/warehouse/supplier/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: item.nama,
          kontak: item.kontak,
          email: item.email,
          status: statusBaru,
        }),
      });

      if (!res.ok) {
        setData((prev) =>
          prev.map((d) => (d.id === item.id ? { ...d, status: item.status } : d))
        );
        setErrorMuat('Gagal mengubah status supplier.');
      }
    } catch (err) {
      console.error(err);
      setData((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, status: item.status } : d))
      );
      setErrorMuat('Terjadi kesalahan koneksi saat mengubah status.');
    } finally {
      setTogglingId(null);
    }
  }

  // ===== HAPUS =====
  function bukaHapus(id: number) {
    setHapusId(id);
    setShowHapusModal(true);
  }

  function tutupHapus() {
    setShowHapusModal(false);
    setHapusId(null);
  }

  async function handleKonfirmasiHapus() {
    if (hapusId == null) return;
    setMenghapus(true);
    try {
      const res = await fetch(`/api/warehouse/supplier/${hapusId}`, {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMuat(json.message || 'Gagal menghapus data supplier.');
        tutupHapus();
        return;
      }

      setData((prev) => prev.filter((d) => d.id !== hapusId));
      tutupHapus();
      setShowHapusSukses(true);
      setTimeout(() => setShowHapusSukses(false), 2500);
    } catch (err) {
      console.error(err);
      setErrorMuat('Terjadi kesalahan koneksi saat menghapus data.');
      tutupHapus();
    } finally {
      setMenghapus(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarWarehouse />

      <main className="flex-1 p-6 lg:p-8">
        {/* HEADER */}
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-50 to-slate-50 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-200">
              <Truck className="text-white" size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Warehouse
              </p>
              <h1 className="text-xl font-bold text-slate-800">Data Supplier</h1>
              <p className="text-sm text-slate-500">
                Kelola daftar supplier beserta kontak dan statusnya.
              </p>
            </div>
          </div>
        </div>

        {errorMuat && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-600">
            {errorMuat}
          </div>
        )}

        {/* SEARCH + FILTER + TOMBOL TAMBAH */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition focus-within:border-blue-300 focus-within:bg-white md:w-72">
              <Search size={16} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, kontak, atau email..."
                style={{ color: '#334155' }}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap gap-1 rounded-xl bg-slate-50 p-1">
              {(['Semua', ...STATUS_LIST] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                    tab === t
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                      : 'text-slate-500 hover:bg-white hover:text-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={bukaTambah}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Plus size={14} />
            Tambah Supplier
          </button>
        </div>

        {/* STAT CARDS */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-blue-500" />
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <Building2 className="text-blue-500" size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-500">Total Supplier</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{data.length}</p>
            <p className="mt-1 text-xs text-slate-400">Seluruh data supplier terdaftar</p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <ToggleLeft className="text-emerald-500" size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Aktif</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{countAktif}</p>
            <p className="mt-1 text-xs text-slate-400">Supplier yang masih bekerja sama</p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-slate-400" />
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                <ToggleLeft className="text-slate-400" size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Nonaktif</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{countNonaktif}</p>
            <p className="mt-1 text-xs text-slate-400">Supplier yang tidak aktif</p>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="p-4 font-semibold">No</th>
                  <th className="p-4 font-semibold">Nama Supplier</th>
                  <th className="p-4 font-semibold">Kontak</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {memuat && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400">
                      <Loader2 size={18} className="mx-auto mb-2 animate-spin" />
                      Memuat data supplier...
                    </td>
                  </tr>
                )}

                {!memuat && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400">
                      Tidak ada data supplier untuk ditampilkan
                    </td>
                  </tr>
                )}

                {!memuat &&
                  filtered.map((item, idx) => (
                    <tr key={item.id} className="border-b border-slate-50 transition hover:bg-slate-50/70">
                      <td className="p-4 text-slate-500">{idx + 1}</td>
                      <td className="p-4 font-medium text-slate-700">{item.nama}</td>
                      <td className="p-4 text-slate-600">
                        {item.kontak ? (
                          <a
                            href={`https://wa.me/${item.kontak.replace(/\D/g, '').replace(/^0/, '62')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Chat via WhatsApp"
                            className="inline-flex items-center gap-1 text-slate-600 transition hover:text-green-600 hover:underline"
                          >
                            <Phone size={13} className="text-slate-400" />
                            {item.kontak}
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Phone size={13} className="text-slate-400" />
                            -
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Mail size={13} className="text-slate-400" />
                          {item.email || '-'}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => toggleStatus(item)}
                          disabled={togglingId === item.id}
                          title="Klik untuk ubah status"
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition hover:opacity-70 disabled:opacity-50 ${statusPill[item.status]}`}
                        >
                          {togglingId === item.id ? (
                            <Loader2 size={12} className="inline animate-spin" />
                          ) : (
                            item.status
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => bukaEdit(item)}
                            title="Edit"
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => bukaHapus(item.id)}
                            title="Hapus"
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {!memuat && filtered.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 p-4 text-xs text-slate-400">
              <span>Menampilkan {filtered.length} dari {data.length} data</span>
            </div>
          )}
        </div>

        {/* MODAL TAMBAH/EDIT SUPPLIER */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
              {/* HEADER GRADIENT */}
              <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5">
                <div className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/10" />
                <div className="pointer-events-none absolute right-20 top-8 h-24 w-24 rounded-full bg-white/10" />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                      <Truck className="text-white" size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {modalMode === 'tambah' ? 'Tambah Supplier' : 'Edit Supplier'}
                      </h2>
                      <p className="text-xs text-blue-100">
                        {modalMode === 'tambah'
                          ? 'Daftarkan supplier baru ke sistem'
                          : 'Perbarui informasi supplier ini'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={tutupModal}
                    className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* BODY */}
              <div className="grid grid-cols-1 gap-5 p-6">
                {/* Nama Supplier */}
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <Truck size={13} className="text-blue-500" />
                    Nama Supplier
                  </label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: PT Kayaba"
                    style={{ color: '#334155' }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Kontak */}
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <Phone size={13} className="text-blue-500" />
                    Kontak
                  </label>
                  <input
                    type="text"
                    value={kontak}
                    onChange={(e) => setKontak(e.target.value)}
                    placeholder="Contoh: 0857-1647-4467"
                    style={{ color: '#334155' }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <Mail size={13} className="text-blue-500" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Contoh: kayaba@gmail.com"
                    style={{ color: '#334155' }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {errorForm && (
                  <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-600">
                    {errorForm}
                  </p>
                )}
              </div>

              {/* FOOTER */}
              <div className="flex justify-end gap-2.5 border-t border-slate-100 px-6 py-4">
                <button
                  onClick={tutupModal}
                  disabled={mengirim}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  onClick={handleSimpan}
                  disabled={mengirim}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {mengirim ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  {modalMode === 'tambah' ? 'Simpan Supplier' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL KONFIRMASI HAPUS */}
        {showHapusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
              {/* HEADER MERAH */}
              <div className="relative overflow-hidden bg-gradient-to-r from-red-600 to-rose-500 px-6 py-5">
                <div className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/10" />
                <div className="pointer-events-none absolute right-20 top-8 h-24 w-24 rounded-full bg-white/10" />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                      <Trash2 className="text-white" size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Hapus Data Supplier</h2>
                      <p className="text-xs text-red-100">Tindakan ini tidak bisa dibatalkan</p>
                    </div>
                  </div>
                  <button
                    onClick={tutupHapus}
                    className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* BODY */}
              <div className="p-6">
                <p className="text-sm leading-relaxed text-slate-500">
                  Apakah kamu yakin ingin menghapus supplier ini? Data yang dihapus tidak dapat
                  dikembalikan.
                </p>
              </div>

              {/* FOOTER */}
              <div className="flex justify-end gap-2.5 border-t border-slate-100 px-6 py-4">
                <button
                  onClick={tutupHapus}
                  disabled={menghapus}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  onClick={handleKonfirmasiHapus}
                  disabled={menghapus}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 disabled:opacity-60"
                >
                  {menghapus ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TOAST SUKSES HAPUS */}
        {showHapusSukses && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600 shadow-lg">
            <CheckCircle2 size={16} />
            Data supplier berhasil dihapus
            <button
              onClick={() => setShowHapusSukses(false)}
              className="ml-1 text-emerald-500 hover:text-emerald-700"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}