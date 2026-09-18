'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Eye,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import SidebarInventory from '../../components/SidebarInventory'; // sesuaikan path

type BarangRusak = {
  id: number;
  tanggal: string;
  barcode: string;
  nama: string;
  gambar: string | null;
  kategori: string;
  qty: number;
  keterangan: string;
  status: 'Menunggu' | 'Diproses' | 'Selesai' | 'Dibuang';
};

type ProdukOption = {
  id: string; // barcode
  nama: string;
};

const statusPill: Record<BarangRusak['status'], string> = {
  Menunggu: 'bg-amber-50 text-amber-600',
  Diproses: 'bg-red-50 text-red-500',
  Selesai: 'bg-emerald-50 text-emerald-600',
  Dibuang: 'bg-purple-50 text-purple-600',
};

function formatTanggal(tgl: string) {
  return new Date(tgl).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const PER_PAGE = 5;

export default function BarangRusakPage() {
  const [data, setData] = useState<BarangRusak[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tanggalFilter, setTanggalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [page, setPage] = useState(1);

  const [produkOptions, setProdukOptions] = useState<ProdukOption[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    barcode: '',
    tanggal: '',
    qty: 1,
    keterangan: '',
    status: 'Menunggu' as BarangRusak['status'],
  });

  // ==== EDIT MODAL ====
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editTanggal, setEditTanggal] = useState('');
  const [editQty, setEditQty] = useState(1);
  const [editKeterangan, setEditKeterangan] = useState('');
  const [editStatus, setEditStatus] = useState<BarangRusak['status']>('Menunggu');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        tanggal: tanggalFilter,
      });
      const res = await fetch(`/api/barang-rusak?${params.toString()}`);
      const json = await res.json();
      setData(json);
      setPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, tanggalFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchData, 300);
    return () => clearTimeout(timeout);
  }, [fetchData]);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((json) => setProdukOptions(json.map((p: { id: string; nama: string }) => ({ id: p.id, nama: p.nama }))))
      .catch(console.error);
  }, []);

  const countTotal = data.length;
  const countMenunggu = data.filter((d) => d.status === 'Menunggu').length;
  const countSelesai = data.filter((d) => d.status === 'Selesai').length;
  const countDibuang = data.filter((d) => d.status === 'Dibuang').length;

  const totalPages = Math.max(1, Math.ceil(data.length / PER_PAGE));
  const paginated = data.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  async function handleTambahData() {
    if (!form.barcode || !form.tanggal || !form.keterangan) {
      alert('Produk, tanggal, dan keterangan wajib diisi');
      return;
    }
    try {
      const res = await fetch('/api/barang-rusak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message ?? 'Gagal menambahkan data');

      setShowModal(false);
      setForm({ barcode: '', tanggal: '', qty: 1, keterangan: '', status: 'Menunggu' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Gagal menambahkan data');
    }
  }

  async function handleHapus(id: number) {
    if (!confirm('Yakin mau menghapus data ini?')) return;
    try {
      const res = await fetch(`/api/barang-rusak/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus data');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus data');
    }
  }

  // ===== EDIT BARANG RUSAK =====
  function bukaEdit(item: BarangRusak) {
    setEditId(item.id);
    setEditTanggal(item.tanggal.slice(0, 10)); // pastikan format YYYY-MM-DD buat input date
    setEditQty(item.qty);
    setEditKeterangan(item.keterangan);
    setEditStatus(item.status);
    setEditError('');
    setShowEditModal(true);
  }

  function tutupEdit() {
    setShowEditModal(false);
    setEditId(null);
  }

  async function handleSimpanEdit() {
    setEditError('');

    if (!editTanggal || !editKeterangan || editQty <= 0) {
      setEditError('Tanggal, qty, dan keterangan wajib diisi dengan benar.');
      return;
    }
    if (editId == null) return;

    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/barang-rusak/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal: editTanggal,
          qty: editQty,
          keterangan: editKeterangan,
          status: editStatus,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setEditError(json.message || 'Gagal menyimpan perubahan.');
        return;
      }

      tutupEdit();
      fetchData();
    } catch (err) {
      console.error(err);
      setEditError('Terjadi kesalahan koneksi saat menyimpan perubahan.');
    } finally {
      setEditSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarInventory />

      <main className="flex-1 p-6 lg:p-8">
        {/* HERO HEADER */}
        <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-50 via-blue-50/70 to-slate-50 p-6">
          <div className="relative z-10 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
              <AlertTriangle className="text-white" size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-500">Stok &amp; Inventori</p>
              <h1 className="text-2xl font-bold text-slate-800">Barang Rusak</h1>
              <p className="mt-1 text-sm text-slate-500">
                Berikut adalah daftar barang yang rusak atau tidak layak jual.
              </p>
            </div>
          </div>

        </div>

        {/* SEARCH + FILTER + TAMBAH */}
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk, nama, atau keterangan..."
              style={{ color: '#334155' }}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <input
            type="date"
            value={tanggalFilter}
            onChange={(e) => setTanggalFilter(e.target.value)}
            style={{ color: '#334155' }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 shadow-sm outline-none"
          >
            {['Semua', 'Menunggu', 'Diproses', 'Selesai', 'Dibuang'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 hover:bg-blue-700"
          >
            <Plus size={16} />
            Input Barang Rusak
          </button>
        </div>

        {/* STAT CARDS */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
              <Package className="text-slate-500" size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Barang Rusak</p>
              <p className="text-lg font-bold text-slate-800">{countTotal} <span className="text-xs font-normal text-slate-400">item</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="text-red-500" size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Menunggu Penanganan</p>
              <p className="text-lg font-bold text-slate-800">{countMenunggu} <span className="text-xs font-normal text-slate-400">item</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="text-emerald-500" size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Sudah Diproses</p>
              <p className="text-lg font-bold text-slate-800">{countSelesai} <span className="text-xs font-normal text-slate-400">item</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50">
              <Trash2 className="text-purple-500" size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Dibuang</p>
              <p className="text-lg font-bold text-slate-800">{countDibuang} <span className="text-xs font-normal text-slate-400">item</span></p>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="p-4 font-semibold">No</th>
                  <th className="p-4 font-semibold">Tanggal</th>
                  <th className="p-4 font-semibold">Produk</th>
                  <th className="p-4 font-semibold">Qty</th>
                  <th className="p-4 font-semibold">Keterangan</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={7} className="p-10 text-center text-slate-400">Memuat data...</td></tr>
                )}
                {!loading && paginated.length === 0 && (
                  <tr><td colSpan={7} className="p-10 text-center text-slate-400">Tidak ada data</td></tr>
                )}
                {!loading && paginated.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-50 transition hover:bg-slate-50/70">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">{(page - 1) * PER_PAGE + idx + 1}</span>
                        <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-100">
                          {item.gambar && (
                            <Image src={item.gambar} alt={item.nama} fill className="object-cover" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500">{formatTanggal(item.tanggal)}</td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-700">{item.nama}</p>
                      <p className="text-xs text-slate-400">{item.kategori}</p>
                    </td>
                    <td className="p-4 font-medium text-slate-600">{item.qty}</td>
                    <td className="p-4 text-slate-500">{item.keterangan}</td>
                    <td className="p-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPill[item.status]}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => bukaEdit(item)}
                          className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleHapus(item.id)}
                          className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {!loading && data.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <p className="text-xs text-slate-400">
                Menampilkan {(page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, data.length)} dari {data.length} data
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-400 disabled:opacity-40 hover:bg-slate-50"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-8 w-8 rounded-lg text-xs font-semibold ${
                      p === page ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-400 disabled:opacity-40 hover:bg-slate-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL TAMBAH DATA */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <div className="w-[420px] rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Tambah Barang Rusak</h2>
                  <p className="text-xs text-slate-400">Catat produk yang rusak atau tidak layak jual.</p>
                </div>
                <button onClick={() => setShowModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Produk</label>
                  <select
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-blue-400"
                  >
                    <option value="">Pilih produk...</option>
                    {produkOptions.map((p) => (
                      <option key={p.id} value={p.id}>{p.nama}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Tanggal</label>
                    <input
                      type="date"
                      value={form.tanggal}
                      onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                      style={{ color: '#334155' }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={form.qty}
                      onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
                      style={{ color: '#334155' }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Keterangan</label>
                  <input
                    type="text"
                    value={form.keterangan}
                    onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                    placeholder="Contoh: Kemasan rusak, bocor, basah..."
                    style={{ color: '#334155' }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as BarangRusak['status'] })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-blue-400"
                  >
                    {['Menunggu', 'Diproses', 'Selesai', 'Dibuang'].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  onClick={handleTambahData}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EDIT BARANG RUSAK */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <div className="w-[420px] rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <Pencil className="text-blue-600" size={16} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Edit Barang Rusak</h2>
                    <p className="text-xs text-slate-400">Perbarui data barang rusak ini.</p>
                  </div>
                </div>
                <button onClick={tutupEdit} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Tanggal</label>
                    <input
                      type="date"
                      value={editTanggal}
                      onChange={(e) => setEditTanggal(e.target.value)}
                      style={{ color: '#334155' }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={editQty}
                      onChange={(e) => setEditQty(Number(e.target.value))}
                      style={{ color: '#334155' }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Keterangan</label>
                  <input
                    type="text"
                    value={editKeterangan}
                    onChange={(e) => setEditKeterangan(e.target.value)}
                    placeholder="Contoh: Kemasan rusak, bocor, basah..."
                    style={{ color: '#334155' }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as BarangRusak['status'])}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-blue-400"
                  >
                    {['Menunggu', 'Diproses', 'Selesai', 'Dibuang'].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {editError && (
                  <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-600">
                    {editError}
                  </p>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  onClick={tutupEdit}
                  disabled={editSubmitting}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-200 disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  onClick={handleSimpanEdit}
                  disabled={editSubmitting}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 hover:bg-blue-700 disabled:opacity-60"
                >
                  {editSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}