'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  PackageSearch,
  Calendar,
  MapPin,
  Pencil,
  Trash2,
  X,
  Plus,
  Loader2,
  CheckCircle2,
  Package,
  Check,
} from 'lucide-react';
import SidebarWarehouse from '../../components/SidebarWarehouse'; // sesuaikan path sesuai lokasi asli

type StatusPicking = 'Pending' | 'Diproses' | 'Selesai';

type Picking = {
  id: number;
  kode: string;
  tanggal: string;
  tujuan: string;
  status: StatusPicking;
};

type PickingItem = {
  id: number;
  pickingId: number;
  barcodeProduk: string;
  namaProduk: string;
  jumlah: number;
  kodeRak: string | null;
};

type ProdukOption = {
  id: string; // barcode
  nama: string;
};

const statusPill: Record<StatusPicking, string> = {
  Pending: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-100',
  Diproses: 'bg-orange-50 text-orange-600 ring-1 ring-orange-100',
  Selesai: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
};

const STATUS_LIST: StatusPicking[] = ['Pending', 'Diproses', 'Selesai'];

export default function PickingPage() {
  const [data, setData] = useState<Picking[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [errorMuat, setErrorMuat] = useState('');

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'Semua' | StatusPicking>('Semua');

  // ==== MODAL TAMBAH/EDIT ====
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'tambah' | 'edit'>('tambah');
  const [editId, setEditId] = useState<number | null>(null);

  const [kode, setKode] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [status, setStatus] = useState<StatusPicking>('Pending');

  const [mengirim, setMengirim] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  // ==== HAPUS MODAL ====
  const [showHapusModal, setShowHapusModal] = useState(false);
  const [hapusId, setHapusId] = useState<number | null>(null);
  const [menghapus, setMenghapus] = useState(false);
  const [showHapusSukses, setShowHapusSukses] = useState(false);

  // ==== DETAIL MODAL (item picking) ====
  const [showDetail, setShowDetail] = useState(false);
  const [detailPicking, setDetailPicking] = useState<Picking | null>(null);
  const [items, setItems] = useState<PickingItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [errorItems, setErrorItems] = useState('');

  // form tambah item
  const [cariProduk, setCariProduk] = useState('');
  const [opsiProduk, setOpsiProduk] = useState<ProdukOption[]>([]);
  const [mencariProduk, setMencariProduk] = useState(false);
  const [produkTerpilih, setProdukTerpilih] = useState<ProdukOption | null>(null);
  const [jumlahInput, setJumlahInput] = useState('');
  const [menambahItem, setMenambahItem] = useState(false);
  const [errorTambahItem, setErrorTambahItem] = useState('');

  // edit jumlah inline
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [editJumlahValue, setEditJumlahValue] = useState('');
  const [menyimpanJumlah, setMenyimpanJumlah] = useState(false);

  async function ambilPicking() {
    setMemuat(true);
    setErrorMuat('');
    try {
      const res = await fetch('/api/warehouse/picking');
      const json = await res.json();
      if (!res.ok) {
        setErrorMuat(json.message || 'Gagal mengambil data picking.');
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
    ambilPicking();
  }, []);

  const filtered = useMemo(() => {
    return data.filter((d) => {
      const matchSearch = !search || d.kode.toLowerCase().includes(search.toLowerCase()) || d.tujuan.toLowerCase().includes(search.toLowerCase());
      const matchTab = tab === 'Semua' || d.status === tab;
      return matchSearch && matchTab;
    });
  }, [data, search, tab]);

  const countDiproses = data.filter((d) => d.status === 'Diproses').length;
  const countSelesai = data.filter((d) => d.status === 'Selesai').length;
  const countPending = data.filter((d) => d.status === 'Pending').length;

  // ===== TAMBAH / EDIT PICKING =====
  function resetForm() {
    setKode('');
    setTanggal('');
    setTujuan('');
    setStatus('Pending');
    setErrorForm('');
  }

  function bukaTambah() {
    setModalMode('tambah');
    setEditId(null);
    resetForm();
    setShowModal(true);
  }

  function bukaEdit(item: Picking) {
    setModalMode('edit');
    setEditId(item.id);
    setKode(item.kode);
    setTanggal(item.tanggal);
    setTujuan(item.tujuan);
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

    if (!kode.trim() || !tanggal.trim() || !tujuan.trim()) {
      setErrorForm('Lengkapi semua data picking dulu ya.');
      return;
    }

    setMengirim(true);
    try {
      const isEdit = modalMode === 'edit' && editId != null;
      const res = await fetch(
        isEdit ? `/api/warehouse/picking/${editId}` : '/api/warehouse/picking',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kode: kode.trim(), tanggal: tanggal.trim(), tujuan: tujuan.trim(), status }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        setErrorForm(json.message || 'Gagal menyimpan data picking.');
        return;
      }

      await ambilPicking();
      tutupModal();
    } catch (err) {
      console.error(err);
      setErrorForm('Terjadi kesalahan koneksi saat menyimpan data.');
    } finally {
      setMengirim(false);
    }
  }

  // ===== HAPUS PICKING =====
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
      const res = await fetch(`/api/warehouse/picking/${hapusId}`, {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMuat(json.message || 'Gagal menghapus data picking.');
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

  // ===== DETAIL ITEM PICKING =====
  async function fetchItems(pickingId: number) {
    setLoadingItems(true);
    setErrorItems('');
    try {
      const res = await fetch(`/api/warehouse/picking/${pickingId}/items`);
      const json = await res.json();
      if (!res.ok) {
        setErrorItems(json.message || 'Gagal mengambil item picking.');
        return;
      }
      setItems(json);
    } catch (err) {
      console.error(err);
      setErrorItems('Terjadi kesalahan koneksi saat mengambil item.');
    } finally {
      setLoadingItems(false);
    }
  }

  function bukaDetail(p: Picking) {
    setDetailPicking(p);
    setShowDetail(true);
    setCariProduk('');
    setOpsiProduk([]);
    setProdukTerpilih(null);
    setJumlahInput('');
    setErrorTambahItem('');
    setEditItemId(null);
    fetchItems(p.id);
  }

  function tutupDetail() {
    setShowDetail(false);
    setDetailPicking(null);
    setItems([]);
  }

  // cari produk (debounce)
  useEffect(() => {
    if (!showDetail) return;
    if (produkTerpilih && cariProduk === produkTerpilih.nama) return; // sudah pilih, jangan cari ulang
    if (cariProduk.trim().length < 2) {
      setOpsiProduk([]);
      return;
    }

    const t = setTimeout(async () => {
      setMencariProduk(true);
      try {
        const res = await fetch(`/api/products?cari=${encodeURIComponent(cariProduk.trim())}`);
        const json = await res.json();
        if (res.ok) setOpsiProduk(json);
      } catch (err) {
        console.error(err);
      } finally {
        setMencariProduk(false);
      }
    }, 300);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cariProduk, showDetail]);

  function pilihProduk(p: ProdukOption) {
    setProdukTerpilih(p);
    setCariProduk(p.nama);
    setOpsiProduk([]);
  }

  async function handleTambahItem() {
    setErrorTambahItem('');

    if (!produkTerpilih) {
      setErrorTambahItem('Pilih produk dari daftar pencarian dulu.');
      return;
    }
    const jumlah = Number(jumlahInput);
    if (!jumlah || jumlah <= 0) {
      setErrorTambahItem('Isi jumlah yang valid (lebih dari 0).');
      return;
    }
    if (!detailPicking) return;

    setMenambahItem(true);
    try {
      const res = await fetch(`/api/warehouse/picking/${detailPicking.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcodeProduk: produkTerpilih.id,
          namaProduk: produkTerpilih.nama,
          jumlah,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorTambahItem(json.message || 'Gagal menambah item.');
        return;
      }

      setItems((prev) => [...prev, json]);
      setCariProduk('');
      setProdukTerpilih(null);
      setJumlahInput('');
    } catch (err) {
      console.error(err);
      setErrorTambahItem('Terjadi kesalahan koneksi saat menambah item.');
    } finally {
      setMenambahItem(false);
    }
  }

  async function handleHapusItem(itemId: number) {
    if (!window.confirm('Hapus item ini dari picking?')) return;
    if (!detailPicking) return;
    try {
      const res = await fetch(`/api/warehouse/picking/${detailPicking.id}/items/${itemId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(json.message || 'Gagal menghapus item.');
        return;
      }
      setItems((prev) => prev.filter((it) => it.id !== itemId));
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi saat menghapus item.');
    }
  }

  function mulaiEditJumlah(item: PickingItem) {
    setEditItemId(item.id);
    setEditJumlahValue(String(item.jumlah));
  }

  function batalEditJumlah() {
    setEditItemId(null);
    setEditJumlahValue('');
  }

  async function simpanEditJumlah(itemId: number) {
    const jumlah = Number(editJumlahValue);
    if (!jumlah || jumlah <= 0) {
      alert('Jumlah harus lebih dari 0.');
      return;
    }
    if (!detailPicking) return;
    setMenyimpanJumlah(true);
    try {
      const res = await fetch(`/api/warehouse/picking/${detailPicking.id}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jumlah }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(json.message || 'Gagal memperbarui jumlah.');
        return;
      }
      setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, jumlah } : it)));
      batalEditJumlah();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi saat memperbarui jumlah.');
    } finally {
      setMenyimpanJumlah(false);
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
              <PackageSearch className="text-white" size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Warehouse
              </p>
              <h1 className="text-xl font-bold text-slate-800">Picking</h1>
              <p className="text-sm text-slate-500">
                Kelola daftar picking barang dari gudang ke tujuan pengiriman.
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
                placeholder="Cari nomor picking..."
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
            Buat Picking
          </button>
        </div>

        {/* STAT CARDS */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-blue-500" />
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <PackageSearch className="text-blue-500" size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-500">Total Picking</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{data.length}</p>
            <p className="mt-1 text-xs text-slate-400">Seluruh data picking</p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-orange-500" />
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
                <Loader2 className="text-orange-500" size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Diproses</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{countDiproses}</p>
            <p className="mt-1 text-xs text-slate-400">Sedang diambil dari rak</p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <CheckCircle2 className="text-emerald-500" size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Selesai</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{countSelesai}</p>
            <p className="mt-1 text-xs text-slate-400">Siap lanjut ke packing</p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-yellow-400" />
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-50">
                <Calendar className="text-yellow-600" size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-600">Pending</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{countPending}</p>
            <p className="mt-1 text-xs text-slate-400">Belum mulai diproses</p>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="p-4 font-semibold">No</th>
                  <th className="p-4 font-semibold">Kode Picking</th>
                  <th className="p-4 font-semibold">Tanggal</th>
                  <th className="p-4 font-semibold">Tujuan</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {memuat && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400">
                      <Loader2 size={18} className="mx-auto mb-2 animate-spin" />
                      Memuat data picking...
                    </td>
                  </tr>
                )}

                {!memuat && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400">
                      Tidak ada data picking untuk ditampilkan
                    </td>
                  </tr>
                )}

                {!memuat &&
                  filtered.map((item, idx) => (
                    <tr
                      key={item.id}
                      onClick={() => bukaDetail(item)}
                      className="cursor-pointer border-b border-slate-50 transition hover:bg-slate-50/70"
                    >
                      <td className="p-4 text-slate-500">{idx + 1}</td>
                      <td className="p-4 font-medium text-slate-700">{item.kode}</td>
                      <td className="p-4 text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={13} className="text-slate-400" />
                          {item.tanggal}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={13} className="text-slate-400" />
                          {item.tujuan}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPill[item.status]}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => bukaEdit(item)}
                            title="Edit"
                            className="rounded-lg p-2 text-blue-500 transition hover:bg-blue-50"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => bukaHapus(item.id)}
                            title="Hapus"
                            className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
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

        {/* MODAL TAMBAH/EDIT PICKING */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
              {/* Header dengan gradient */}
              <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 px-7 pb-8 pt-6">
                <button
                  onClick={tutupModal}
                  className="absolute right-5 top-5 rounded-full p-1.5 text-blue-100 transition hover:bg-white/15 hover:text-white"
                >
                  <X size={18} />
                </button>
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                    <PackageSearch className="text-white" size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {modalMode === 'tambah' ? 'Buat Picking' : 'Edit Picking'}
                    </h2>
                    <p className="text-xs text-blue-100">
                      {modalMode === 'tambah'
                        ? 'Buat tugas picking baru untuk gudang'
                        : 'Perbarui data picking ini'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form, ditarik naik nutupin sedikit header biar ada efek "card melayang" */}
              <div className="-mt-4 rounded-t-3xl bg-white px-7 pb-7 pt-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">
                      Kode Picking
                    </label>
                    <div className="relative">
                      <PackageSearch size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input
                        type="text"
                        value={kode}
                        onChange={(e) => setKode(e.target.value)}
                        placeholder="Contoh: PK-0025-006"
                        style={{ color: '#1e293b' }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">
                        Tanggal
                      </label>
                      <div className="relative">
                        <Calendar size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input
                          type="text"
                          value={tanggal}
                          onChange={(e) => setTanggal(e.target.value)}
                          placeholder="28 Apr 2025"
                          style={{ color: '#1e293b' }}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">
                        Tujuan
                      </label>
                      <div className="relative">
                        <MapPin size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input
                          type="text"
                          value={tujuan}
                          onChange={(e) => setTujuan(e.target.value)}
                          placeholder="Toko Jakarta"
                          style={{ color: '#1e293b' }}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">
                      Status
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {STATUS_LIST.map((s) => {
                        const aktif = status === s;
                        const warna: Record<StatusPicking, string> = {
                          Pending: aktif
                            ? 'border-yellow-400 bg-yellow-50 text-yellow-700 ring-2 ring-yellow-100'
                            : 'border-slate-200 text-slate-400 hover:border-yellow-200 hover:bg-yellow-50/50',
                          Diproses: aktif
                            ? 'border-orange-400 bg-orange-50 text-orange-600 ring-2 ring-orange-100'
                            : 'border-slate-200 text-slate-400 hover:border-orange-200 hover:bg-orange-50/50',
                          Selesai: aktif
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-600 ring-2 ring-emerald-100'
                            : 'border-slate-200 text-slate-400 hover:border-emerald-200 hover:bg-emerald-50/50',
                        };
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setStatus(s)}
                            className={`rounded-xl border py-2.5 text-sm font-semibold transition ${warna[s]}`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {errorForm && (
                  <p className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-600">
                    {errorForm}
                  </p>
                )}

                <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-5">
                  <button
                    onClick={tutupModal}
                    disabled={mengirim}
                    className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-200 disabled:opacity-60"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSimpan}
                    disabled={mengirim}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {mengirim ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                    {modalMode === 'tambah' ? 'Simpan Picking' : 'Simpan Perubahan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL KONFIRMASI HAPUS PICKING */}
        {showHapusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                    <Trash2 className="text-red-500" size={18} />
                  </div>
                  <h2 className="text-base font-bold text-slate-800">Hapus Data Picking</h2>
                </div>
                <button
                  onClick={tutupHapus}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="mb-6 text-sm text-slate-500">
                Apakah kamu yakin ingin menghapus data picking ini? Data yang dihapus tidak dapat dikembalikan.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={tutupHapus}
                  disabled={menghapus}
                  className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-200 disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  onClick={handleKonfirmasiHapus}
                  disabled={menghapus}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-red-200 hover:bg-red-700 disabled:opacity-60"
                >
                  {menghapus ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DETAIL ITEM PICKING */}
        {showDetail && detailPicking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
              {/* Header modal */}
              <div className="flex items-start justify-between border-b border-slate-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <Package className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Detail Picking</h2>
                    <p className="text-xs text-slate-400">
                      {detailPicking.kode} &middot; {detailPicking.tujuan} &middot; {detailPicking.tanggal}
                    </p>
                  </div>
                </div>
                <button
                  onClick={tutupDetail}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Konten scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Form tambah item */}
                <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-700">Tambah Produk</p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={cariProduk}
                        onChange={(e) => {
                          setCariProduk(e.target.value);
                          setProdukTerpilih(null);
                        }}
                        placeholder="Cari nama atau barcode produk..."
                        style={{ color: '#334155' }}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                      {mencariProduk && (
                        <Loader2
                          size={14}
                          className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
                        />
                      )}

                      {opsiProduk.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                          {opsiProduk.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => pilihProduk(p)}
                              className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm text-slate-700 hover:bg-blue-50"
                            >
                              <span>{p.nama}</span>
                              <span className="text-xs text-slate-400">{p.id}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <input
                      type="number"
                      min={1}
                      value={jumlahInput}
                      onChange={(e) => setJumlahInput(e.target.value)}
                      placeholder="Jumlah"
                      style={{ color: '#334155' }}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-28"
                    />

                    <button
                      onClick={handleTambahItem}
                      disabled={menambahItem}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      {menambahItem ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                      Tambah
                    </button>
                  </div>

                  {produkTerpilih && (
                    <p className="mt-2 text-xs font-medium text-emerald-600">
                      Terpilih: {produkTerpilih.nama} ({produkTerpilih.id})
                    </p>
                  )}
                  {errorTambahItem && (
                    <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                      {errorTambahItem}
                    </p>
                  )}
                </div>

                {/* Daftar item */}
                {loadingItems && (
                  <div className="p-8 text-center text-sm text-slate-400">
                    <Loader2 size={18} className="mx-auto mb-2 animate-spin" />
                    Memuat item...
                  </div>
                )}

                {!loadingItems && errorItems && (
                  <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{errorItems}</p>
                )}

                {!loadingItems && !errorItems && items.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                    Belum ada produk di picking ini.
                  </div>
                )}

                {!loadingItems && !errorItems && items.length > 0 && (
                  <div className="overflow-hidden rounded-xl border border-slate-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-400">
                          <th className="p-3 font-semibold">Produk</th>
                          <th className="p-3 font-semibold">Barcode</th>
                          <th className="p-3 font-semibold">Lokasi Rak</th>
                          <th className="p-3 font-semibold">Jumlah</th>
                          <th className="p-3 font-semibold">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it) => (
                          <tr key={it.id} className="border-b border-slate-50 last:border-0">
                            <td className="p-3 font-medium text-slate-700">{it.namaProduk}</td>
                            <td className="p-3 text-slate-500">{it.barcodeProduk}</td>
                            <td className="p-3">
                              {it.kodeRak ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                                  <MapPin size={11} />
                                  {it.kodeRak}
                                </span>
                              ) : (
                                <span className="text-xs italic text-slate-300">Belum di rak</span>
                              )}
                            </td>
                            <td className="p-3">
                              {editItemId === it.id ? (
                                <input
                                  type="number"
                                  min={1}
                                  value={editJumlahValue}
                                  onChange={(e) => setEditJumlahValue(e.target.value)}
                                  style={{ color: '#334155' }}
                                  className="w-20 rounded-lg border border-blue-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                                  autoFocus
                                />
                              ) : (
                                <span className="text-slate-700">{it.jumlah}</span>
                              )}
                            </td>
                            <td className="p-3">
                              {editItemId === it.id ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => simpanEditJumlah(it.id)}
                                    disabled={menyimpanJumlah}
                                    title="Simpan"
                                    className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-50"
                                  >
                                    <Check size={15} />
                                  </button>
                                  <button
                                    onClick={batalEditJumlah}
                                    title="Batal"
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                                  >
                                    <X size={15} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => mulaiEditJumlah(it)}
                                    title="Ubah jumlah"
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleHapusItem(it.id)}
                                    title="Hapus item"
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t border-slate-100 p-4">
                <button
                  onClick={tutupDetail}
                  className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TOAST SUKSES HAPUS */}
        {showHapusSukses && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600 shadow-lg">
            <CheckCircle2 size={16} />
            Data picking berhasil dihapus
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