'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  Search,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  X,
  Package,
  FileText,
  Layers,
} from 'lucide-react';
import SidebarWarehouse from '../../components/SidebarWarehouse'; // sesuaikan path import dengan lokasi file aslimu

interface Rak {
  id: number;
  kodeRak: string;
  keterangan: string;
  kapasitas: number;
  jumlahProduk: number;
}

interface ProdukDiRak {
  barcode: string;
  nama: string;
  stok: number;
}

interface ProdukOption {
  id: string; // barcode
  nama: string;
}

export default function LokasiRakPage() {
  const [search, setSearch] = useState('');
  const [data, setData] = useState<Rak[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ==== MODAL TAMBAH/EDIT RAK ====
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'tambah' | 'edit'>('tambah');
  const [editId, setEditId] = useState<number | null>(null);
  const [kodeRak, setKodeRak] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [kapasitas, setKapasitas] = useState('');
  const [mengirim, setMengirim] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  // ==== MODAL HAPUS RAK ====
  const [rakHapus, setRakHapus] = useState<Rak | null>(null);
  const [menghapus, setMenghapus] = useState(false);
  const [errorHapus, setErrorHapus] = useState('');

  // ==== MODAL KELOLA PRODUK DI RAK ====
  const [showProduk, setShowProduk] = useState(false);
  const [rakAktif, setRakAktif] = useState<Rak | null>(null);
  const [produkDiRak, setProdukDiRak] = useState<ProdukDiRak[]>([]);
  const [loadingProduk, setLoadingProduk] = useState(false);
  const [errorProduk, setErrorProduk] = useState('');
  const [menambahProduk, setMenambahProduk] = useState(false);

  // ==== MODAL LEPAS PRODUK DARI RAK ====
  const [produkLepas, setProdukLepas] = useState<ProdukDiRak | null>(null);
  const [melepas, setMelepas] = useState(false);
  const [errorLepas, setErrorLepas] = useState('');

  // pencarian produk by nama (autocomplete), ganti input barcode manual
  const [cariProduk, setCariProduk] = useState('');
  const [opsiProduk, setOpsiProduk] = useState<ProdukOption[]>([]);
  const [mencariProduk, setMencariProduk] = useState(false);
  const [produkTerpilih, setProdukTerpilih] = useState<ProdukOption | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/warehouse/lokasi-rak?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil data');
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal memuat data lokasi rak dari server.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  function resetForm() {
    setKodeRak('');
    setKeterangan('');
    setKapasitas('');
    setErrorForm('');
  }

  function bukaTambah() {
    setModalMode('tambah');
    setEditId(null);
    resetForm();
    setShowModal(true);
  }

  function bukaEdit(r: Rak) {
    setModalMode('edit');
    setEditId(r.id);
    setKodeRak(r.kodeRak);
    setKeterangan(r.keterangan);
    setKapasitas(String(r.kapasitas));
    setErrorForm('');
    setShowModal(true);
  }

  function tutupModal() {
    setShowModal(false);
    setEditId(null);
  }

  async function handleSimpan() {
    setErrorForm('');
    if (!kodeRak.trim()) {
      setErrorForm('Kode rak wajib diisi.');
      return;
    }

    setMengirim(true);
    try {
      const isEdit = modalMode === 'edit' && editId != null;
      const res = await fetch(
        isEdit ? `/api/warehouse/lokasi-rak/${editId}` : '/api/warehouse/lokasi-rak',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kodeRak: kodeRak.trim(),
            keterangan: keterangan.trim(),
            kapasitas: Number(kapasitas) || 0,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        setErrorForm(json.error || 'Gagal menyimpan data rak.');
        return;
      }
      await fetchData();
      tutupModal();
    } catch (err) {
      console.error(err);
      setErrorForm('Terjadi kesalahan koneksi saat menyimpan data.');
    } finally {
      setMengirim(false);
    }
  }

  // ==== Hapus rak ====
  function bukaHapus(r: Rak) {
    setRakHapus(r);
    setErrorHapus('');
  }

  function tutupHapus() {
    setRakHapus(null);
    setErrorHapus('');
  }

  async function handleKonfirmasiHapus() {
    if (!rakHapus) return;
    setMenghapus(true);
    setErrorHapus('');
    try {
      const res = await fetch(`/api/warehouse/lokasi-rak/${rakHapus.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErrorHapus(json.error || 'Gagal menghapus data rak.');
        return;
      }
      tutupHapus();
      fetchData();
    } catch (err) {
      console.error(err);
      setErrorHapus('Terjadi kesalahan koneksi saat menghapus data.');
    } finally {
      setMenghapus(false);
    }
  }

  // ==== Kelola produk di rak ====
  async function bukaProduk(r: Rak) {
    setRakAktif(r);
    setShowProduk(true);
    setCariProduk('');
    setOpsiProduk([]);
    setProdukTerpilih(null);
    setErrorProduk('');
    await fetchProdukDiRak(r.id);
  }

  async function fetchProdukDiRak(rakId: number) {
    setLoadingProduk(true);
    setErrorProduk('');
    try {
      const res = await fetch(`/api/warehouse/lokasi-rak/${rakId}/produk`);
      const json = await res.json();
      if (!res.ok) {
        setErrorProduk(json.error || 'Gagal mengambil produk di rak ini.');
        return;
      }
      setProdukDiRak(json.data);
    } catch (err) {
      console.error(err);
      setErrorProduk('Terjadi kesalahan koneksi.');
    } finally {
      setLoadingProduk(false);
    }
  }

  function tutupProduk() {
    setShowProduk(false);
    setRakAktif(null);
    setProdukDiRak([]);
    setProdukLepas(null);
  }

  // cari produk by nama (debounce), sama pola dengan halaman Picking
  useEffect(() => {
    if (!showProduk) return;
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
  }, [cariProduk, showProduk]);

  function pilihProduk(p: ProdukOption) {
    setProdukTerpilih(p);
    setCariProduk(p.nama);
    setOpsiProduk([]);
  }

  async function handleTambahProduk() {
    if (!rakAktif) return;

    if (!produkTerpilih) {
      setErrorProduk('Pilih produk dari daftar pencarian dulu.');
      return;
    }

    setMenambahProduk(true);
    setErrorProduk('');
    try {
      const res = await fetch(`/api/warehouse/lokasi-rak/${rakAktif.id}/produk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: produkTerpilih.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorProduk(json.error || 'Gagal menempatkan produk.');
        return;
      }
      setCariProduk('');
      setProdukTerpilih(null);
      setOpsiProduk([]);
      await fetchProdukDiRak(rakAktif.id);
      fetchData(); // refresh jumlahProduk di list utama
    } catch (err) {
      console.error(err);
      setErrorProduk('Terjadi kesalahan koneksi.');
    } finally {
      setMenambahProduk(false);
    }
  }

  // ==== Lepas produk dari rak ====
  function bukaLepas(p: ProdukDiRak) {
    setProdukLepas(p);
    setErrorLepas('');
  }

  function tutupLepas() {
    setProdukLepas(null);
    setErrorLepas('');
  }

  async function handleKonfirmasiLepas() {
    if (!rakAktif || !produkLepas) return;
    setMelepas(true);
    setErrorLepas('');
    try {
      const res = await fetch(
        `/api/warehouse/lokasi-rak/${rakAktif.id}/produk?barcode=${encodeURIComponent(produkLepas.barcode)}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErrorLepas(json.error || 'Gagal melepas produk.');
        return;
      }
      tutupLepas();
      await fetchProdukDiRak(rakAktif.id);
      fetchData();
    } catch (err) {
      console.error(err);
      setErrorLepas('Terjadi kesalahan koneksi.');
    } finally {
      setMelepas(false);
    }
  }

  const stats = useMemo(
    () => ({
      totalRak: data.length,
      totalProduk: data.reduce((sum, r) => sum + r.jumlahProduk, 0),
    }),
    [data]
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarWarehouse />

      <main className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-blue-50 via-blue-50 to-white p-6">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-md shadow-blue-200">
            <MapPin size={26} className="text-white" />
          </span>
          <div>
            <p className="text-[11px] font-bold tracking-wider text-blue-600">WAREHOUSE</p>
            <h1 className="text-2xl font-bold text-slate-800">Lokasi Rak</h1>
            <p className="mt-1 text-sm text-slate-500">
              Kelola lokasi rak gudang dan penempatan produk di dalamnya.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-600">
            {errorMsg}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode rak..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="button"
            onClick={bukaTambah}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-100 transition-colors hover:bg-blue-700"
          >
            <Plus size={16} />
            Tambah Rak
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="h-1 w-full bg-blue-500" />
            <div className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  <MapPin size={16} className="text-blue-500" />
                </span>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Total Rak</p>
              </div>
              <p className="text-3xl font-bold text-slate-800">{stats.totalRak}</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="h-1 w-full bg-emerald-500" />
            <div className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                  <Package size={16} className="text-emerald-500" />
                </span>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Produk Tertempatkan</p>
              </div>
              <p className="text-3xl font-bold text-slate-800">{stats.totalProduk}</p>
            </div>
          </div>
        </div>

        {/* Tabel */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-semibold">No</th>
                  <th className="px-5 py-3 font-semibold">Kode Rak</th>
                  <th className="px-5 py-3 font-semibold">Keterangan</th>
                  <th className="px-5 py-3 font-semibold">Kapasitas</th>
                  <th className="px-5 py-3 font-semibold">Terisi</th>
                  <th className="px-5 py-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                      Memuat data...
                    </td>
                  </tr>
                )}

                {!loading && data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                      Belum ada data lokasi rak
                    </td>
                  </tr>
                )}

                {!loading &&
                  data.map((r, idx) => {
                    const penuh = r.kapasitas > 0 && r.jumlahProduk >= r.kapasitas;
                    return (
                      <tr
                        key={r.id}
                        onClick={() => bukaProduk(r)}
                        className="cursor-pointer border-b border-slate-50 text-slate-700 last:border-0 hover:bg-slate-50/60"
                      >
                        <td className="px-5 py-3">{idx + 1}</td>
                        <td className="px-5 py-3 font-medium text-slate-800">{r.kodeRak}</td>
                        <td className="px-5 py-3 text-slate-500">{r.keterangan || '-'}</td>
                        <td className="px-5 py-3">{r.kapasitas > 0 ? r.kapasitas : 'Tanpa batas'}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              penuh ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {r.jumlahProduk}
                          </span>
                        </td>
                        <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              title="Edit"
                              onClick={() => bukaEdit(r)}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              title="Hapus"
                              onClick={() => bukaHapus(r)}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL TAMBAH/EDIT RAK */}
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
                      <MapPin className="text-white" size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {modalMode === 'tambah' ? 'Tambah Rak' : 'Edit Rak'}
                      </h2>
                      <p className="text-xs text-blue-100">
                        {modalMode === 'tambah'
                          ? 'Daftarkan lokasi rak baru ke gudang'
                          : 'Perbarui informasi rak ini'}
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
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <MapPin size={13} className="text-blue-500" />
                    Kode Rak
                  </label>
                  <input
                    type="text"
                    value={kodeRak}
                    onChange={(e) => setKodeRak(e.target.value)}
                    placeholder="Contoh: A1-02"
                    style={{ color: '#334155' }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <FileText size={13} className="text-blue-500" />
                    Keterangan
                  </label>
                  <input
                    type="text"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Contoh: Zona makanan instan"
                    style={{ color: '#334155' }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <Layers size={13} className="text-blue-500" />
                    Kapasitas (0 = tanpa batas)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={kapasitas}
                    onChange={(e) => setKapasitas(e.target.value)}
                    placeholder="Contoh: 20"
                    style={{ color: '#334155' }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {errorForm && (
                  <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-600">{errorForm}</p>
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
                  {modalMode === 'tambah' ? 'Simpan Rak' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL KONFIRMASI HAPUS RAK */}
        {rakHapus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="relative overflow-hidden bg-gradient-to-r from-red-600 to-rose-500 px-6 py-5">
                <div className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/10" />
                <div className="pointer-events-none absolute right-20 top-8 h-24 w-24 rounded-full bg-white/10" />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                      <Trash2 className="text-white" size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Hapus Rak</h2>
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

              <div className="space-y-4 p-6">
                <p className="text-sm leading-relaxed text-slate-500">
                  Apakah kamu yakin ingin menghapus rak{' '}
                  <span className="font-bold text-slate-800">{rakHapus.kodeRak}</span>? Produk yang ada di rak
                  ini jadi tidak punya lokasi.
                </p>
                {errorHapus && (
                  <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-600">{errorHapus}</p>
                )}
              </div>

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

        {/* MODAL KELOLA PRODUK DI RAK */}
        {showProduk && rakAktif && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
              {/* HEADER GRADIENT */}
              <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5">
                <div className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/10" />
                <div className="pointer-events-none absolute right-20 top-8 h-24 w-24 rounded-full bg-white/10" />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                      <Package className="text-white" size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Produk di Rak {rakAktif.kodeRak}</h2>
                      <p className="text-xs text-blue-100">{rakAktif.keterangan || 'Tanpa keterangan'}</p>
                    </div>
                  </div>
                  <button
                    onClick={tutupProduk}
                    className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* BODY */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Cari produk by nama (autocomplete) */}
                <div className="mb-4 flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={cariProduk}
                      onChange={(e) => {
                        setCariProduk(e.target.value);
                        setProdukTerpilih(null);
                      }}
                      placeholder="Cari nama produk..."
                      style={{ color: '#334155' }}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                    {mencariProduk && (
                      <Loader2
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
                      />
                    )}

                    {opsiProduk.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                        {opsiProduk.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => pilihProduk(p)}
                            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-blue-50"
                          >
                            <span>{p.nama}</span>
                            <span className="text-xs text-slate-400">{p.id}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleTambahProduk}
                    disabled={menambahProduk || !produkTerpilih}
                    className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60 disabled:shadow-none"
                  >
                    {menambahProduk ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                    Taruh
                  </button>
                </div>

                {produkTerpilih && (
                  <p className="mb-3 text-xs font-medium text-emerald-600">
                    Terpilih: {produkTerpilih.nama} ({produkTerpilih.id})
                  </p>
                )}

                {errorProduk && (
                  <p className="mb-3 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-600">{errorProduk}</p>
                )}

                {loadingProduk && (
                  <div className="p-6 text-center text-sm text-slate-400">
                    <Loader2 size={18} className="mx-auto mb-2 animate-spin" />
                    Memuat produk...
                  </div>
                )}

                {!loadingProduk && produkDiRak.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                    Belum ada produk di rak ini.
                  </div>
                )}

                {!loadingProduk && produkDiRak.length > 0 && (
                  <div className="overflow-hidden rounded-2xl border border-slate-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-400">
                          <th className="p-3 font-semibold">Produk</th>
                          <th className="p-3 font-semibold">Barcode</th>
                          <th className="p-3 font-semibold">Stok</th>
                          <th className="p-3 font-semibold"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {produkDiRak.map((p) => (
                          <tr key={p.barcode} className="border-b border-slate-50 last:border-0">
                            <td className="p-3 font-medium text-slate-700">{p.nama}</td>
                            <td className="p-3 text-slate-500">{p.barcode}</td>
                            <td className="p-3 text-slate-700">{p.stok}</td>
                            <td className="p-3">
                              <button
                                onClick={() => bukaLepas(p)}
                                title="Lepas dari rak"
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* FOOTER */}
              <div className="flex shrink-0 justify-end border-t border-slate-100 px-6 py-4">
                <button
                  onClick={tutupProduk}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL KONFIRMASI LEPAS PRODUK */}
        {produkLepas && rakAktif && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="relative overflow-hidden bg-gradient-to-r from-red-600 to-rose-500 px-6 py-5">
                <div className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/10" />
                <div className="pointer-events-none absolute right-20 top-8 h-24 w-24 rounded-full bg-white/10" />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                      <Trash2 className="text-white" size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Lepas Produk</h2>
                      <p className="text-xs text-red-100">Produk akan dilepas dari rak ini</p>
                    </div>
                  </div>
                  <button
                    onClick={tutupLepas}
                    className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <p className="text-sm leading-relaxed text-slate-500">
                  Lepas <span className="font-bold text-slate-800">{produkLepas.nama}</span> dari rak{' '}
                  <span className="font-bold text-slate-800">{rakAktif.kodeRak}</span>?
                </p>
                {errorLepas && (
                  <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-600">{errorLepas}</p>
                )}
              </div>

              <div className="flex justify-end gap-2.5 border-t border-slate-100 px-6 py-4">
                <button
                  onClick={tutupLepas}
                  disabled={melepas}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  onClick={handleKonfirmasiLepas}
                  disabled={melepas}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 disabled:opacity-60"
                >
                  {melepas ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  Lepas
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}