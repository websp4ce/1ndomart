'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Search,
  Camera,
  CameraOff,
  ScanLine,
  Keyboard,
  Clock,
  PackageSearch,
  Info,
  Plus,
  X,
  Loader2,
  Package,
  Tag,
  Layers,
  LayoutGrid,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import {
  MultiFormatReader,
  HTMLCanvasElementLuminanceSource,
  HybridBinarizer,
  BinaryBitmap,
  DecodeHintType,
  BarcodeFormat,
  NotFoundException,
} from '@zxing/library';
import SidebarKasir from '../components/SidebarKasir';

type Produk = {
  kode: string; // barcode
  nama: string;
  harga: number;
  stok: number;
  gambar: string | null;
  kategori: string;
};

type Kategori = {
  id: number;
  nama: string;
};

// Item di keranjang. Dibuat generik (id/nama/harga/gambar/qty) supaya
// bentuknya SAMA dengan yang dipakai di halaman transaksi — jadi walau
// disimpan/dibaca dari dua file berbeda, datanya tetap nyambung.
type ItemKeranjang = {
  id: string;
  nama: string;
  harga: number;
  gambar: string;
  qty: number;
};

// Kunci localStorage ini HARUS SAMA PERSIS dengan yang dipakai di
// halaman transaksi, supaya keranjangnya jadi satu keranjang yang sama.
const KERANJANG_KEY = 'keranjangAktif';

function bacaKeranjang(): ItemKeranjang[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KERANJANG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function simpanKeranjang(items: ItemKeranjang[]) {
  try {
    localStorage.setItem(KERANJANG_KEY, JSON.stringify(items));
  } catch {
    // kalau localStorage gagal (mis. mode privat browser), biarkan saja
  }
}

function formatRupiah(angka: number) {
  return `Rp ${angka.toLocaleString('id-ID')}`;
}

// Jaga-jaga kalau data gambar dari database formatnya salah
// (misal cuma "kingkong.png" tanpa "/" di depan, atau kosong/null).
// HARUS SAMA dengan yang dipakai di halaman transaksi.
function normalisasiGambar(src: string | null | undefined): string {
  if (!src) return '/placeholder.png';
  if (src.startsWith('/') || src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  return `/${src}`;
}

// Form kosong buat modal Add Product
const formKosong = {
  barcode: '',
  nama: '',
  harga: '',
  stok: '',
  kategori: '',
  gambar: '',
};

// Class input yang dipakai berulang di modal Tambah Produk
const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100';
const labelClass =
  'mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400';

export default function ScanBarcodePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<MultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sedangMemprosesRef = useRef(false);

  const [kodeManual, setKodeManual] = useState('');
  const [hasil, setHasil] = useState<Produk | null>(null);
  const [tidakDitemukan, setTidakDitemukan] = useState(false);
  const [mencari, setMencari] = useState(false);
  const [kameraAktif, setKameraAktif] = useState(false);
  const [kameraError, setKameraError] = useState('');
  const kodeTerakhirRef = useRef<{ kode: string; waktu: number } | null>(null);
  const COOLDOWN_MS = 2000;

  // Daftar produk (buat saran/typeahead pas ngetik manual) & kategori
  // (buat datalist di form Add Product). Diambil dari API, bukan array
  // dummy lagi.
  const [daftarProduk, setDaftarProduk] = useState<Produk[]>([]);
  const [daftarKategori, setDaftarKategori] = useState<Kategori[]>([]);

  // Modal "Add Product"
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [formProduk, setFormProduk] = useState(formKosong);
  const [simpanLoading, setSimpanLoading] = useState(false);
  const [simpanError, setSimpanError] = useState('');
  const [simpanSukses, setSimpanSukses] = useState('');

  const kodeDicari = kodeManual.trim();
  const saranProduk = kodeDicari
    ? daftarProduk.filter((p) => p.kode.startsWith(kodeDicari))
    : [];
  const tampilkanSaran =
    saranProduk.length > 0 && !(hasil && hasil.kode === kodeDicari);

  // Ambil daftar produk (buat saran) & kategori (buat form Add Product)
  // begitu halaman dibuka.
  async function muatDaftarProduk() {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setDaftarProduk(
          data.map((p: any) => ({
            kode: p.id,
            nama: p.nama,
            harga: p.harga,
            stok: p.stok,
            gambar: p.gambar,
            kategori: p.kategori,
          }))
        );
      }
    } catch (err) {
      console.error('Gagal memuat daftar produk:', err);
    }
  }

  async function muatDaftarKategori() {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        setDaftarKategori(await res.json());
      }
    } catch (err) {
      console.error('Gagal memuat kategori:', err);
    }
  }

  useEffect(() => {
    muatDaftarProduk();
    muatDaftarKategori();
  }, []);

  // Tambah produk ke keranjang bersama (yang dipakai juga oleh halaman
  // transaksi) langsung lewat localStorage — kalau kode produknya sudah
  // ada, qty-nya yang nambah, bukan bikin baris baru.
  function tambahKeKeranjang(produk: Produk) {
    const prev = bacaKeranjang();
    const sudahAda = prev.find((item) => item.id === produk.kode);
    const next = sudahAda
      ? prev.map((item) =>
          item.id === produk.kode ? { ...item, qty: item.qty + 1 } : item
        )
      : [
          ...prev,
          {
            id: produk.kode,
            nama: produk.nama,
            harga: produk.harga,
            gambar: normalisasiGambar(produk.gambar),
            qty: 1,
          },
        ];
    simpanKeranjang(next);
  }

  function pilihSaran(produk: Produk) {
    setKodeManual(produk.kode);
    cariProduk(produk.kode);
  }

  // Dulu ini cuma cari di array lokal (sinkron). Sekarang manggil
  // GET /api/products/:barcode ke database (async).
  async function cariProduk(kode: string) {
    const kodeBersih = kode.trim();
    if (!kodeBersih) return;

    const sekarang = Date.now();
    const terakhir = kodeTerakhirRef.current;
    if (terakhir && terakhir.kode === kodeBersih && sekarang - terakhir.waktu < COOLDOWN_MS) {
      return;
    }
    kodeTerakhirRef.current = { kode: kodeBersih, waktu: sekarang };

    setMencari(true);
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(kodeBersih)}`);

      if (res.ok) {
        const produk: Produk = await res.json();
        setHasil(produk);
        setTidakDitemukan(false);
        tambahKeKeranjang(produk);
      } else {
        setHasil(null);
        setTidakDitemukan(true);
      }
    } catch (err) {
      console.error('Gagal mencari produk:', err);
      setHasil(null);
      setTidakDitemukan(true);
    } finally {
      setMencari(false);
    }
  }

  function handleCariManual() {
    cariProduk(kodeManual);
  }

  // ==================== Add Product ====================

  function bukaFormAddProduct(prefillBarcode?: string) {
    setFormProduk({ ...formKosong, barcode: prefillBarcode ?? kodeManual });
    setSimpanError('');
    setSimpanSukses('');
    setShowAddProduct(true);
  }

  function tutupFormAddProduct() {
    setShowAddProduct(false);
  }

  async function handleSimpanProduk() {
    setSimpanError('');
    setSimpanSukses('');

    const { barcode, nama, harga, stok, kategori, gambar } = formProduk;

    if (!barcode.trim() || !nama.trim() || !harga.trim() || !kategori.trim()) {
      setSimpanError('Barcode, nama, harga, dan kategori wajib diisi.');
      return;
    }

    setSimpanLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: barcode.trim(),
          nama: nama.trim(),
          harga: Number(harga),
          stok: stok.trim() ? Number(stok) : 0,
          kategori: kategori.trim(),
          gambar: gambar.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSimpanError(data.message || 'Gagal menyimpan produk.');
        return;
      }

      setSimpanSukses('Produk berhasil ditambahkan!');
      // Refresh daftar produk & kategori supaya kategori baru (mis. "Obat")
      // langsung ikut muncul, termasuk nanti di pill halaman Transaksi.
      await Promise.all([muatDaftarProduk(), muatDaftarKategori()]);

      setTimeout(() => {
        setShowAddProduct(false);
      }, 900);
    } catch (err) {
      console.error(err);
      setSimpanError('Terjadi kesalahan saat menyimpan produk.');
    } finally {
      setSimpanLoading(false);
    }
  }

  // Beberapa "varian" pemrosesan gambar yang dicoba bergantian tiap frame.
  // Tujuannya: walau kondisi cahaya di lapangan jelek (terlalu gelap,
  // terlalu silau/overexposed, kontras rendah), salah satu varian ini
  // biasanya tetap cukup jelas untuk dibaca oleh detector/zxing.
  const variasiFilter = [
    'none',
    'contrast(200%) brightness(140%)', // untuk kondisi gelap/kontras rendah
  ];

  // Barcode yang dipegang tangan jarang lurus sempurna. Kebanyakan barcode
  // reader (zxing maupun BarcodeDetector) mulai gagal baca kalau
  // kemiringannya lumayan (>15 derajat-an). Jadi tiap frame juga dicoba
  // diputar ke beberapa sudut ini dulu sebelum di-decode, supaya barcode
  // yang miring tetap "diluruskan" ke salah satu percobaan.
  const sudutRotasi = [0, 10, -10, 20, -20, 30, -30];

  async function nyalakanKamera() {
    setKameraError('');

    if (!videoRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setKameraAktif(true);

      // Siapkan BarcodeDetector native kalau browser mendukung (lebih cepat
      // & lebih akurat dari zxing untuk kondisi normal). Kalau tidak ada
      // atau errornya bukan sekadar "belum ketemu", tetap lanjut — zxing
      // dipakai berbarengan sebagai pelengkap/fallback, bukan pengganti.
      const BarcodeDetectorApi = (window as any).BarcodeDetector;
      let detector: any = null;
      if (BarcodeDetectorApi) {
        try {
          detector = new BarcodeDetectorApi({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'],
          });
        } catch {
          detector = null;
        }
      }

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      const codeReader = new MultiFormatReader();
      codeReader.setHints(hints);
      codeReaderRef.current = codeReader;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      intervalRef.current = setInterval(async () => {
        const video = videoRef.current;
        if (!video || !video.videoWidth || !ctx) return;

        // Kalau proses frame sebelumnya masih jalan (mis. lagi nyoba semua
        // varian filter), skip tick ini biar tidak numpuk/lag.
        if (sedangMemprosesRef.current) return;
        sedangMemprosesRef.current = true;

        try {
          // Crop ke area sekitar kotak target di tengah (dilebihkan cukup
          // banyak dari bingkai biru di UI) supaya kamera "zoom" secara
          // digital ke barcode-nya, sekaligus tetap menyisakan cukup ruang
          // kosong di pinggir untuk quiet zone barcode dan untuk menampung
          // barcode yang miring setelah diputar.
          const ukuranCrop = 0.8;
          const sw = video.videoWidth * ukuranCrop;
          const sh = video.videoHeight * ukuranCrop;
          const sx = (video.videoWidth - sw) / 2;
          const sy = (video.videoHeight - sh) / 2;

          canvas.width = sw;
          canvas.height = sh;

          for (const sudut of sudutRotasi) {
            for (const filter of variasiFilter) {
              ctx.save();
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.filter = filter;
              ctx.translate(canvas.width / 2, canvas.height / 2);
              ctx.rotate((sudut * Math.PI) / 180);
              ctx.drawImage(video, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
              ctx.restore();

              // 1) Coba BarcodeDetector native dulu kalau ada
              if (detector) {
                try {
                  const hasilDeteksi = await detector.detect(canvas);
                  if (hasilDeteksi.length > 0) {
                    cariProduk(hasilDeteksi[0].rawValue);
                    return;
                  }
                } catch {
                  // varian ini gagal, lanjut coba zxing / varian berikutnya
                }
              }

              // 2) Fallback/pelengkap: zxing baca dari canvas yang sudah
              // di-crop, diputar, & di-filter (bukan dari video mentah lagi)
              try {
                const luminanceSource = new HTMLCanvasElementLuminanceSource(canvas);
                const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
                const hasilZxing = codeReader.decode(binaryBitmap);
                if (hasilZxing) {
                  cariProduk(hasilZxing.getText());
                  return;
                }
              } catch (err) {
                // NotFoundException normal kalau belum ketemu di kombinasi
                // sudut+filter ini, lanjut coba kombinasi selanjutnya.
                // Selain itu, log biar ketahuan kalau ada error lain yang
                // bukan sekadar "belum ketemu".
                if (!(err instanceof NotFoundException)) {
                  console.warn('zxing decode error (bukan NotFoundException):', err);
                }
              }
            }
          }
        } finally {
          sedangMemprosesRef.current = false;
        }
      }, 400);
    } catch {
      setKameraError(
        'Tidak bisa mengakses kamera. Pastikan izin kamera diaktifkan, atau gunakan input manual.'
      );
      setKameraAktif(false);
    }
  }

  function matikanKamera() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    codeReaderRef.current?.reset();
    codeReaderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setKameraAktif(false);
  }

  // Kalau yang diketik sudah persis cocok satu kode produk secara penuh
  // (dari daftar produk yang sudah dimuat), langsung tampilkan hasilnya
  // otomatis tanpa perlu klik "Cari".
  useEffect(() => {
    const kodeBersih = kodeManual.trim();
    if (!kodeBersih) return;
    const cocokPersis = daftarProduk.find((p) => p.kode === kodeBersih);
    if (cocokPersis) {
      cariProduk(kodeBersih);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kodeManual, daftarProduk]);

  // Pastikan kamera & interval scan dimatikan saat pindah halaman
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      codeReaderRef.current?.reset();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarKasir />

      <div className="flex flex-1 flex-col">
        <main className="flex-1 px-8 py-7">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ScanLine size={20} strokeWidth={2.2} />
              </div>
              <div>
                <h1 className="text-[22px] font-extrabold text-slate-900">
                  Scan <span className="text-blue-600">Barcode</span>
                </h1>
                <p className="mt-0.5 text-[13px] text-slate-500">
                  Arahkan barcode ke kamera atau masukkan kode secara manual
                </p>
              </div>
            </div>

            <button
              onClick={() => bukaFormAddProduct()}
              className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow hover:bg-blue-700"
            >
              <Plus size={16} strokeWidth={2.4} />
              Add Product
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            {/* Panel kamera */}
            <div>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-900">
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  className={`h-full w-full object-cover ${
                    kameraAktif ? '' : 'hidden'
                  }`}
                />

                {!kameraAktif && (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-slate-400">
                    <Camera size={40} strokeWidth={1.5} />
                    <p className="text-[13px]">Kamera belum aktif</p>
                  </div>
                )}

                {/* Badge status kamera */}
                <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                  {kameraAktif ? (
                    <>
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      Live
                    </>
                  ) : (
                    <>
                      <Camera size={12} strokeWidth={2.2} />
                      Kamera
                    </>
                  )}
                </div>

                {/* Bingkai target scan */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-[46%] w-[46%]">
                    <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-lg border-l-4 border-t-4 border-blue-400" />
                    <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-lg border-r-4 border-t-4 border-blue-400" />
                    <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-4 border-l-4 border-blue-400" />
                    <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-lg border-b-4 border-r-4 border-blue-400" />
                  </div>
                </div>
              </div>

              {kameraError && (
                <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-center text-[11px] text-red-600">
                  {kameraError}
                </div>
              )}

              {/* Tombol kontrol kamera */}
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                  {kameraAktif ? (
                    <button
                      onClick={matikanKamera}
                      className="flex items-center gap-2 rounded-full bg-slate-800 px-6 py-2.5 text-[13px] font-semibold text-white shadow hover:bg-slate-900"
                    >
                      <CameraOff size={16} strokeWidth={2} />
                      Matikan Kamera
                    </button>
                  ) : (
                    <button
                      onClick={nyalakanKamera}
                      className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-[13px] font-semibold text-white shadow hover:bg-blue-700"
                    >
                      <Camera size={16} strokeWidth={2} />
                      Nyalakan Kamera
                    </button>
                  )}
                </div>

                <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Info size={12} strokeWidth={2} />
                  Pastikan barcode berada di dalam kotak target
                </p>
              </div>
            </div>

            {/* Panel kanan: input manual + hasil + keranjang */}
            <div className="flex flex-col gap-5">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Keyboard size={16} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-900">
                      Input Manual
                    </h3>
                    <p className="text-[11.5px] text-slate-500">
                      Masukkan kode produk secara manual
                    </p>
                  </div>
                </div>

                <div className="relative mt-3 flex gap-2">
                  <input
                    type="text"
                    value={kodeManual}
                    onChange={(e) => setKodeManual(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCariManual()}
                    placeholder="Masukkan kode produk..."
                    className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-[12px] text-slate-800 outline-none focus:border-blue-400"
                  />

                  <button
                    onClick={handleCariManual}
                    disabled={mencari}
                    className="flex h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-[12px] font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {mencari ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Search size={14} strokeWidth={2.2} />
                    )}
                    Cari
                  </button>

                  {tampilkanSaran && (
                    <div className="absolute left-0 right-[92px] top-11 z-10 max-h-56 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-lg">
                      {saranProduk.map((produk) => (
                        <button
                          key={produk.kode}
                          onClick={() => pilihSaran(produk)}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50"
                        >
                          <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-md bg-slate-100">
                            <Image
                              src={normalisasiGambar(produk.gambar)}
                              alt={produk.nama}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[12px] font-semibold text-slate-800">
                              {produk.nama}
                            </div>
                            <div className="text-[10.5px] text-slate-400">
                              {produk.kode}
                            </div>
                          </div>
                          <div className="text-[12px] font-bold text-blue-600">
                            {formatRupiah(produk.harga)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Clock size={16} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-900">
                      Hasil Pencarian
                    </h3>
                    <p className="text-[11.5px] text-slate-500">
                      Scan atau masukkan kode produk untuk melihat hasilnya di sini.
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  {hasil ? (
                    <div className="rounded-xl border border-slate-100 p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          <Image
                            src={normalisasiGambar(hasil.gambar)}
                            alt={hasil.nama}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div>
                          <div className="text-[13px] font-bold text-slate-900">
                            {hasil.nama}
                          </div>
                          <div className="text-[13px] font-bold text-blue-600">
                            {formatRupiah(hasil.harga)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[12px] text-slate-500">
                        <span>Stok : {hasil.stok}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10.5px] font-semibold text-slate-600">
                          {hasil.kategori}
                        </span>
                      </div>
                    </div>
                  ) : tidakDitemukan ? (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 py-8 text-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-400">
                        <PackageSearch size={20} strokeWidth={1.8} />
                      </div>
                      <p className="text-[12.5px] font-semibold text-slate-600">
                        Produk tidak ditemukan
                      </p>
                      <p className="px-6 text-[11.5px] text-slate-400">
                        Kode yang dimasukkan tidak cocok dengan produk manapun.
                      </p>
                      <button
                        onClick={() => bukaFormAddProduct(kodeManual)}
                        className="mt-1 flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-[11.5px] font-semibold text-white hover:bg-blue-700"
                      >
                        <Plus size={13} strokeWidth={2.4} />
                        Tambah produk dengan kode ini
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 py-8 text-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                        <PackageSearch size={20} strokeWidth={1.8} />
                      </div>
                      <p className="text-[12.5px] font-semibold text-slate-600">
                        Belum ada hasil pencarian
                      </p>
                      <p className="px-6 text-[11.5px] text-slate-400">
                        Scan barcode atau masukkan kode produk terlebih dahulu
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ==================== Modal Add Product ==================== */}
      {showAddProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={tutupFormAddProduct}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
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
                    <h2 className="text-lg font-bold text-white">Tambah Produk</h2>
                    <p className="text-xs text-blue-100">Daftarkan produk baru ke sistem</p>
                  </div>
                </div>
                <button
                  onClick={tutupFormAddProduct}
                  className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
                  aria-label="Tutup"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className={labelClass}>
                    <ScanLine size={13} className="text-blue-500" />
                    Barcode
                  </label>
                  <input
                    type="text"
                    value={formProduk.barcode}
                    onChange={(e) => setFormProduk({ ...formProduk, barcode: e.target.value })}
                    placeholder="mis. 8991234567890"
                    style={{ color: '#334155' }}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    <Package size={13} className="text-blue-500" />
                    Nama Produk
                  </label>
                  <input
                    type="text"
                    value={formProduk.nama}
                    onChange={(e) => setFormProduk({ ...formProduk, nama: e.target.value })}
                    placeholder="mis. Paramex"
                    style={{ color: '#334155' }}
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>
                      <Tag size={13} className="text-blue-500" />
                      Harga
                    </label>
                    <input
                      type="number"
                      value={formProduk.harga}
                      onChange={(e) => setFormProduk({ ...formProduk, harga: e.target.value })}
                      placeholder="3000"
                      style={{ color: '#334155' }}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      <Layers size={13} className="text-blue-500" />
                      Stok
                    </label>
                    <input
                      type="number"
                      value={formProduk.stok}
                      onChange={(e) => setFormProduk({ ...formProduk, stok: e.target.value })}
                      placeholder="0"
                      style={{ color: '#334155' }}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    <LayoutGrid size={13} className="text-blue-500" />
                    Kategori
                  </label>
                  <input
                    type="text"
                    list="daftar-kategori"
                    value={formProduk.kategori}
                    onChange={(e) => setFormProduk({ ...formProduk, kategori: e.target.value })}
                    placeholder="Pilih yang sudah ada, atau ketik baru (mis. Obat)"
                    style={{ color: '#334155' }}
                    className={inputClass}
                  />
                  {/* Kategori yang sudah ada muncul sebagai saran, tapi bisa
                      diketik bebas — kalau kategorinya baru, backend yang
                      otomatis nambahin ke tabel categories. */}
                  <datalist id="daftar-kategori">
                    {daftarKategori.map((k) => (
                      <option key={k.id} value={k.nama} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className={labelClass}>
                    <ImageIcon size={13} className="text-blue-500" />
                    Path Gambar
                    <span className="font-medium normal-case tracking-normal text-slate-400">
                      (opsional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formProduk.gambar}
                    onChange={(e) => setFormProduk({ ...formProduk, gambar: e.target.value })}
                    placeholder="/produk/nama-file.png"
                    style={{ color: '#334155' }}
                    className={inputClass}
                  />
                </div>

                {simpanError && (
                  <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-600">
                    {simpanError}
                  </p>
                )}
                {simpanSukses && (
                  <p className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-600">
                    <CheckCircle2 size={14} />
                    {simpanSukses}
                  </p>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex shrink-0 justify-end gap-2.5 border-t border-slate-100 px-6 py-4">
              <button
                onClick={tutupFormAddProduct}
                disabled={simpanLoading}
                className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
              >
                Batal
              </button>
              <button
                onClick={handleSimpanProduk}
                disabled={simpanLoading}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60"
              >
                {simpanLoading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                {simpanLoading ? 'Menyimpan...' : 'Simpan Produk'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}