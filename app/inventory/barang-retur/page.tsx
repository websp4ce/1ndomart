'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Undo2,
  Truck,
  Store,
  Box,
  Hash,
  Tag,
  Clock,
  Pencil,
  Trash2,
  X,
  Send,
  ChevronDown,
  ChevronLeft,
  PackageCheck,
  Loader2,
  Ban,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import SidebarInventory from '../../components/SidebarInventory'; // sesuaikan path sesuai lokasi asli

type StatusRetur = 'Menunggu' | 'Diproses' | 'Selesai' | 'Dibuang';
type JenisRetur = 'ke_supplier' | 'dari_pelanggan';

type BarangRetur = {
  id: number;
  tanggal: string;
  jenis: JenisRetur;
  supplier: string | null;
  produk: string;
  productBarcode: string;
  qty: number;
  alasan: string;
  status: StatusRetur;
  catatan?: string | null;
};

type Produk = {
  id: string; // barcode
  nama: string;
  stok: number;
};

const statusPill: Record<StatusRetur, string> = {
  Menunggu: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
  Diproses: 'bg-red-50 text-red-600 ring-1 ring-red-100',
  Selesai: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
  Dibuang: 'bg-purple-50 text-purple-600 ring-1 ring-purple-100',
};

const jenisPill: Record<JenisRetur, string> = {
  ke_supplier: 'bg-orange-50 text-orange-600 ring-1 ring-orange-100',
  dari_pelanggan: 'bg-blue-50 text-blue-600 ring-1 ring-blue-100',
};

const jenisLabel: Record<JenisRetur, string> = {
  ke_supplier: 'Ke Supplier',
  dari_pelanggan: 'Dari Pelanggan',
};

const ALASAN_LIST = ['Barang bocor', 'Barang rusak', 'Expired', 'Tidak sesuai', 'Salah kirim'];
const STATUS_LIST: StatusRetur[] = ['Menunggu', 'Diproses', 'Selesai', 'Dibuang'];

function formatTanggal(tgl: string) {
  return new Date(tgl).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function toDateInputValue(tgl: string) {
  // ambil YYYY-MM-DD dari string tanggal apapun formatnya
  const d = new Date(tgl);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export default function BarangReturPage() {
  const [data, setData] = useState<BarangRetur[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [errorMuat, setErrorMuat] = useState('');

  const [produkList, setProdukList] = useState<Produk[]>([]);

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'Semua' | StatusRetur>('Semua');
  const [showModal, setShowModal] = useState(false);

  // step modal tambah: pilih jenis dulu, baru form
  const [step, setStep] = useState<'pilih_jenis' | 'form'>('pilih_jenis');
  const [jenis, setJenis] = useState<JenisRetur | null>(null);

  // form state (tambah)
  const [supplier, setSupplier] = useState('');
  const [produkBarcode, setProdukBarcode] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [alasan, setAlasan] = useState('');
  const [statusForm, setStatusForm] = useState<StatusRetur | ''>('');
  const [mengirim, setMengirim] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  // ==== EDIT MODAL ====
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editTanggal, setEditTanggal] = useState('');
  const [editJenis, setEditJenis] = useState<JenisRetur>('ke_supplier');
  const [editSupplier, setEditSupplier] = useState('');
  const [editProdukBarcode, setEditProdukBarcode] = useState('');
  const [editJumlah, setEditJumlah] = useState('');
  const [editAlasan, setEditAlasan] = useState('');
  const [editStatus, setEditStatus] = useState<StatusRetur | ''>('');
  const [editCatatan, setEditCatatan] = useState('');
  const [editMengirim, setEditMengirim] = useState(false);
  const [errorEdit, setErrorEdit] = useState('');

  // ==== HAPUS MODAL ====
  const [showHapusModal, setShowHapusModal] = useState(false);
  const [hapusId, setHapusId] = useState<number | null>(null);
  const [menghapus, setMenghapus] = useState(false);
  const [showHapusSukses, setShowHapusSukses] = useState(false);

  async function ambilRetur() {
    setMemuat(true);
    setErrorMuat('');
    try {
      const res = await fetch('/api/inventory/barang-retur');
      const json = await res.json();
      if (!res.ok) {
        setErrorMuat(json.message || 'Gagal mengambil data barang retur.');
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

  async function ambilProduk() {
    try {
      const res = await fetch('/api/products');
      const json = await res.json();
      if (res.ok) {
        setProdukList(json.map((p: any) => ({ id: p.id, nama: p.nama, stok: p.stok })));
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    ambilRetur();
    ambilProduk();
  }, []);

  const filtered = useMemo(() => {
    return data.filter((d) => {
      const matchSearch =
        !search ||
        d.produk.toLowerCase().includes(search.toLowerCase()) ||
        (d.supplier ?? '').toLowerCase().includes(search.toLowerCase()) ||
        d.alasan.toLowerCase().includes(search.toLowerCase());

      const matchTab = tab === 'Semua' || d.status === tab;

      return matchSearch && matchTab;
    });
  }, [data, search, tab]);

  const countMenunggu = data.filter((d) => d.status === 'Menunggu').length;
  const countDiproses = data.filter((d) => d.status === 'Diproses').length;
  const countSelesai = data.filter((d) => d.status === 'Selesai').length;

  const produkTerpilih = produkList.find((p) => p.id === produkBarcode) || null;
  const produkTerpilihEdit = produkList.find((p) => p.id === editProdukBarcode) || null;

  // ===== TAMBAH RETUR =====
  function resetForm() {
    setSupplier('');
    setProdukBarcode('');
    setJumlah('');
    setAlasan('');
    setStatusForm('');
    setErrorForm('');
  }

  function bukaModal() {
    setStep('pilih_jenis');
    setJenis(null);
    resetForm();
    setShowModal(true);
  }

  function pilihJenis(j: JenisRetur) {
    setJenis(j);
    setStep('form');
  }

  async function handleProsesRetur() {
    setErrorForm('');

    if (!jenis) return;
    if (jenis === 'ke_supplier' && !supplier) {
      setErrorForm('Pilih supplier tujuan retur dulu.');
      return;
    }
    if (!produkBarcode || !jumlah || Number(jumlah) <= 0 || !alasan || !statusForm) {
      setErrorForm('Lengkapi semua data retur dulu ya.');
      return;
    }
    if (jenis === 'ke_supplier' && produkTerpilih && Number(jumlah) > produkTerpilih.stok) {
      setErrorForm(`Jumlah melebihi stok yang ada (stok saat ini ${produkTerpilih.stok} pcs).`);
      return;
    }

    setMengirim(true);
    try {
      const res = await fetch('/api/inventory/barang-retur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jenis,
          supplier: jenis === 'ke_supplier' ? supplier : null,
          productBarcode: produkBarcode,
          qty: Number(jumlah),
          alasan,
          status: statusForm,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorForm(json.message || 'Gagal mencatat retur.');
        return;
      }

      await ambilRetur();
      await ambilProduk();
      resetForm();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setErrorForm('Terjadi kesalahan koneksi saat mencatat retur.');
    } finally {
      setMengirim(false);
    }
  }

  // ===== EDIT RETUR =====
  function bukaEdit(item: BarangRetur) {
    setEditId(item.id);
    setEditTanggal(toDateInputValue(item.tanggal));
    setEditJenis(item.jenis);
    setEditSupplier(item.supplier ?? '');
    setEditProdukBarcode(item.productBarcode);
    setEditJumlah(String(item.qty));
    setEditAlasan(item.alasan);
    setEditStatus(item.status);
    setEditCatatan(item.catatan ?? '');
    setErrorEdit('');
    setShowEditModal(true);
  }

  function tutupEdit() {
    setShowEditModal(false);
    setEditId(null);
  }

  async function handleSimpanPerubahan() {
    setErrorEdit('');

    if (editJenis === 'ke_supplier' && !editSupplier) {
      setErrorEdit('Pilih supplier tujuan retur dulu.');
      return;
    }
    if (!editProdukBarcode || !editJumlah || Number(editJumlah) <= 0 || !editAlasan || !editStatus) {
      setErrorEdit('Lengkapi semua data retur dulu ya.');
      return;
    }
    if (editId == null) return;

    setEditMengirim(true);
    try {
      const res = await fetch(`/api/inventory/barang-retur/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal: editTanggal || undefined,
          jenis: editJenis,
          supplier: editJenis === 'ke_supplier' ? editSupplier : null,
          productBarcode: editProdukBarcode,
          qty: Number(editJumlah),
          alasan: editAlasan,
          status: editStatus,
          catatan: editCatatan || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorEdit(json.message || 'Gagal menyimpan perubahan.');
        return;
      }

      await ambilRetur();
      await ambilProduk();
      tutupEdit();
    } catch (err) {
      console.error(err);
      setErrorEdit('Terjadi kesalahan koneksi saat menyimpan perubahan.');
    } finally {
      setEditMengirim(false);
    }
  }

  // ===== HAPUS RETUR =====
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
      const res = await fetch(`/api/inventory/barang-retur/${hapusId}`, {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMuat(json.message || 'Gagal menghapus data retur.');
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
      <SidebarInventory />

      <main className="flex-1 p-6 lg:p-8">
        {/* HEADER */}
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-50 to-slate-50 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-200">
              <Undo2 className="text-white" size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Stok &amp; Inventori
              </p>
              <h1 className="text-xl font-bold text-slate-800">Barang Retur</h1>
              <p className="text-sm text-slate-500">
                Catat retur ke supplier atau retur dari pelanggan/toko.
              </p>
            </div>
          </div>
        </div>

        {errorMuat && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-600">
            {errorMuat}
          </div>
        )}

        {/* SEARCH + FILTER + TOMBOL INPUT */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition focus-within:border-blue-300 focus-within:bg-white md:w-72">
              <Search size={16} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk, supplier, atau alasan..."
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
            onClick={bukaModal}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Send size={14} />
            Catat Retur Baru
          </button>
        </div>

        {/* STAT CARDS */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-blue-500" />
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <Box className="text-blue-500" size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-500">Total Retur</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{data.length}</p>
            <p className="mt-1 text-xs text-slate-400">Seluruh data retur barang</p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-amber-500" />
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                <Clock className="text-amber-500" size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Menunggu</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{countMenunggu}</p>
            <p className="mt-1 text-xs text-slate-400">Belum ditindaklanjuti</p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-red-500" />
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                <Loader2 className="text-red-500" size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-500">Diproses</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{countDiproses}</p>
            <p className="mt-1 text-xs text-slate-400">Sedang berjalan</p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <PackageCheck className="text-emerald-500" size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Selesai</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{countSelesai}</p>
            <p className="mt-1 text-xs text-slate-400">Sudah diproses tuntas</p>
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
                  <th className="p-4 font-semibold">Jenis</th>
                  <th className="p-4 font-semibold">Supplier</th>
                  <th className="p-4 font-semibold">Produk</th>
                  <th className="p-4 font-semibold">Qty</th>
                  <th className="p-4 font-semibold">Alasan</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {memuat && (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-slate-400">
                      <Loader2 size={18} className="mx-auto mb-2 animate-spin" />
                      Memuat data retur...
                    </td>
                  </tr>
                )}

                {!memuat && filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-slate-400">
                      Tidak ada data retur untuk ditampilkan
                    </td>
                  </tr>
                )}

                {!memuat &&
                  filtered.map((item, idx) => (
                    <tr key={item.id} className="border-b border-slate-50 transition hover:bg-slate-50/70">
                      <td className="p-4 text-slate-500">{idx + 1}</td>
                      <td className="p-4 text-slate-600">{formatTanggal(item.tanggal)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${jenisPill[item.jenis]}`}>
                          {item.jenis === 'ke_supplier' ? (
                            <ArrowUpCircle size={12} />
                          ) : (
                            <ArrowDownCircle size={12} />
                          )}
                          {jenisLabel[item.jenis]}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-700">{item.supplier ?? '—'}</td>
                      <td className="p-4 text-slate-600">{item.produk}</td>
                      <td className="p-4 font-bold text-slate-600">{item.qty}</td>
                      <td className="p-4 text-slate-500">{item.alasan}</td>
                      <td className="p-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPill[item.status]}`}>
                          {item.status}
                        </span>
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

        {/* MODAL TAMBAH RETUR */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">

              {/* Header modal */}
              <div className="mb-6 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {step === 'form' && (
                    <button
                      onClick={() => setStep('pilih_jenis')}
                      className="mr-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <Undo2 className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Retur Barang</h2>
                    <p className="text-xs text-slate-400">
                      {step === 'pilih_jenis'
                        ? 'Retur ini ditujukan ke mana?'
                        : jenis === 'ke_supplier'
                        ? 'Kembalikan barang ke supplier'
                        : 'Catat barang yang dikembalikan pelanggan ke toko'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* STEP 1: PILIH JENIS */}
              {step === 'pilih_jenis' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => pilihJenis('ke_supplier')}
                    className="group flex flex-col items-start gap-3 rounded-2xl border-2 border-slate-100 p-5 text-left transition hover:border-orange-300 hover:bg-orange-50/40"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 transition group-hover:bg-orange-100">
                      <Truck size={22} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Ke Supplier</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        Toko mengembalikan barang ke supplier/distributor.
                        <span className="mt-1 block font-semibold text-orange-500">Stok berkurang</span>
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => pilihJenis('dari_pelanggan')}
                    className="group flex flex-col items-start gap-3 rounded-2xl border-2 border-slate-100 p-5 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
                      <Store size={22} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Dari Pelanggan</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        Pelanggan mengembalikan barang ke toko.
                        <span className="mt-1 block font-semibold text-blue-600">Stok bertambah</span>
                      </p>
                    </div>
                  </button>
                </div>
              )}

              {/* STEP 2: FORM */}
              {step === 'form' && jenis && (
                <>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {/* Supplier - cuma muncul kalau ke_supplier */}
                    {jenis === 'ke_supplier' && (
                      <div>
                        <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                          <Truck size={14} className="text-blue-500" />
                          Supplier
                        </label>
                        <input
                          type="text"
                          value={supplier}
                          onChange={(e) => setSupplier(e.target.value)}
                          placeholder="Ketik nama supplier..."
                          style={{ color: '#334155' }}
                          className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    )}

                    {/* Produk */}
                    <div className={jenis === 'dari_pelanggan' ? 'md:col-span-2' : ''}>
                      <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                        <Box size={14} className="text-blue-500" />
                        Produk
                      </label>
                      <div className="relative">
                        <select
                          value={produkBarcode}
                          onChange={(e) => setProdukBarcode(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-slate-200 py-2.5 pl-3.5 pr-9 text-sm text-slate-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">Pilih Produk</option>
                          {produkList.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nama} (stok: {p.stok})
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    {/* Alasan Retur */}
                    <div>
                      <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                        <Tag size={14} className="text-blue-500" />
                        Alasan Retur
                      </label>
                      <div className="relative">
                        <select
                          value={alasan}
                          onChange={(e) => setAlasan(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-slate-200 py-2.5 pl-3.5 pr-9 text-sm text-slate-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">Pilih Alasan</option>
                          {ALASAN_LIST.map((a) => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    {/* Jumlah Retur */}
                    <div>
                      <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                        <Hash size={14} className="text-blue-500" />
                        Jumlah Retur
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          value={jumlah}
                          onChange={(e) => setJumlah(e.target.value)}
                          placeholder="Masukkan jumlah"
                          style={{ color: '#334155' }}
                          className="w-full rounded-xl border border-slate-200 py-2.5 pl-3.5 pr-12 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                          pcs
                        </span>
                      </div>
                      {jenis === 'ke_supplier' && produkTerpilih && (
                        <p className="mt-1.5 text-[11px] text-slate-400">
                          Stok saat ini: {produkTerpilih.stok} pcs
                        </p>
                      )}
                    </div>

                    {/* Preview efek ke stok */}
                    {produkTerpilih && jumlah && Number(jumlah) > 0 && (
                      <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                        <span className="text-xs font-semibold text-slate-500">Stok setelah retur</span>
                        <span className="text-sm font-bold text-slate-700">
                          {produkTerpilih.stok} pcs{' '}
                          <span className="text-slate-400">→</span>{' '}
                          {jenis === 'ke_supplier'
                            ? produkTerpilih.stok - Number(jumlah)
                            : produkTerpilih.stok + Number(jumlah)}{' '}
                          pcs
                        </span>
                      </div>
                    )}

                    {/* Status Retur */}
                    <div className="md:col-span-2">
                      <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                        <Ban size={14} className="text-blue-500" />
                        Status Retur
                      </label>
                      <div className="relative md:w-1/2">
                        <select
                          value={statusForm}
                          onChange={(e) => setStatusForm(e.target.value as StatusRetur)}
                          className="w-full appearance-none rounded-xl border border-slate-200 py-2.5 pl-3.5 pr-9 text-sm text-slate-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">Pilih Status</option>
                          {STATUS_LIST.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {errorForm && (
                    <p className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-600">
                      {errorForm}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <button
                      onClick={resetForm}
                      disabled={mengirim}
                      className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-200 disabled:opacity-60"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleProsesRetur}
                      disabled={mengirim}
                      className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 hover:bg-blue-700 disabled:opacity-60"
                    >
                      {mengirim ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                      Proses Retur
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* MODAL EDIT RETUR */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl">
              {/* Header */}
              <div className="flex shrink-0 items-start justify-between border-b border-slate-100 p-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <Pencil className="text-blue-600" size={16} />
                  </div>
                  <h2 className="text-base font-bold text-slate-800">Edit Barang Retur</h2>
                </div>
                <button
                  onClick={tutupEdit}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body (scrollable) */}
              <div className="grid grid-cols-1 gap-3 overflow-y-auto p-4 md:grid-cols-2">
                {/* Tanggal */}
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <CalendarDays size={14} className="text-blue-500" />
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={editTanggal}
                    onChange={(e) => setEditTanggal(e.target.value)}
                    style={{ color: '#334155' }}
                    className="w-full rounded-xl border border-slate-200 py-2 px-3.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Jenis */}
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Undo2 size={14} className="text-blue-500" />
                    Jenis
                  </label>
                  <div className="relative">
                    <select
                      value={editJenis}
                      onChange={(e) => setEditJenis(e.target.value as JenisRetur)}
                      className="w-full appearance-none rounded-xl border border-slate-200 py-2 pl-3.5 pr-9 text-sm text-slate-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="ke_supplier">Ke Supplier</option>
                      <option value="dari_pelanggan">Dari Pelanggan</option>
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Supplier */}
                {editJenis === 'ke_supplier' && (
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Truck size={14} className="text-blue-500" />
                      Supplier
                    </label>
                    <input
                      type="text"
                      value={editSupplier}
                      onChange={(e) => setEditSupplier(e.target.value)}
                      placeholder="Ketik nama supplier..."
                      style={{ color: '#334155' }}
                      className="w-full rounded-xl border border-slate-200 py-2 px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                )}

                {/* Produk */}
                <div className={editJenis === 'dari_pelanggan' ? 'md:col-span-2' : ''}>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Box size={14} className="text-blue-500" />
                    Produk
                  </label>
                  <div className="relative">
                    <select
                      value={editProdukBarcode}
                      onChange={(e) => setEditProdukBarcode(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-slate-200 py-2 pl-3.5 pr-9 text-sm text-slate-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Pilih Produk</option>
                      {produkList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nama} (stok: {p.stok})
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Jumlah */}
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Hash size={14} className="text-blue-500" />
                    Jumlah
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      value={editJumlah}
                      onChange={(e) => setEditJumlah(e.target.value)}
                      style={{ color: '#334155' }}
                      className="w-full rounded-xl border border-slate-200 py-2 pl-3.5 pr-12 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                      pcs
                    </span>
                  </div>
                  {produkTerpilihEdit && (
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      Stok saat ini: {produkTerpilihEdit.stok} pcs
                    </p>
                  )}
                </div>

                {/* Alasan */}
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Tag size={14} className="text-blue-500" />
                    Alasan
                  </label>
                  <div className="relative">
                    <select
                      value={editAlasan}
                      onChange={(e) => setEditAlasan(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-slate-200 py-2 pl-3.5 pr-9 text-sm text-slate-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Pilih Alasan</option>
                      {ALASAN_LIST.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Ban size={14} className="text-blue-500" />
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as StatusRetur)}
                      className="w-full appearance-none rounded-xl border border-slate-200 py-2 pl-3.5 pr-9 text-sm text-slate-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Pilih Status</option>
                      {STATUS_LIST.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Catatan */}
                <div className="md:col-span-2">
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    Catatan <span className="font-normal text-slate-400">(opsional)</span>
                  </label>
                  <textarea
                    value={editCatatan}
                    onChange={(e) => setEditCatatan(e.target.value.slice(0, 200))}
                    placeholder="Tambahkan catatan jika ada..."
                    rows={2}
                    style={{ color: '#334155' }}
                    className="w-full resize-none rounded-xl border border-slate-200 py-2 px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="mt-1 text-right text-[11px] text-slate-400">{editCatatan.length}/200</p>
                </div>

                {errorEdit && (
                  <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-600 md:col-span-2">
                    {errorEdit}
                  </p>
                )}
              </div>

              {/* Footer (fixed, ga ikut scroll) */}
              <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 p-4">
                <button
                  onClick={tutupEdit}
                  disabled={editMengirim}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-200 disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  onClick={handleSimpanPerubahan}
                  disabled={editMengirim}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-200 hover:bg-blue-700 disabled:opacity-60"
                >
                  {editMengirim && <Loader2 size={15} className="animate-spin" />}
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL KONFIRMASI HAPUS */}
        {showHapusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                    <Trash2 className="text-red-500" size={18} />
                  </div>
                  <h2 className="text-base font-bold text-slate-800">Hapus Data Retur</h2>
                </div>
                <button
                  onClick={tutupHapus}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="mb-6 text-sm text-slate-500">
                Apakah kamu yakin ingin menghapus data retur ini? Data yang dihapus tidak dapat dikembalikan.
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

        {/* TOAST SUKSES HAPUS */}
        {showHapusSukses && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600 shadow-lg">
            <CheckCircle2 size={16} />
            Data retur berhasil dihapus
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