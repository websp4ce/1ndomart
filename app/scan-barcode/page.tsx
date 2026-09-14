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
import HeaderKasir from '../components/HeaderKasir';

type Produk = {
  kode: string;
  nama: string;
  harga: number;
  stok: number;
  gambar: string;
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

const daftarProduk: Produk[] = [
  {
    kode: '089989010947',
    nama: 'Indomie Goreng',
    harga: 3500,
    stok: 48,
    gambar: '/produk/indomie-goreng.png',
  },
  {
    kode: '8992870310100',
    nama: 'Salonpas',
    harga: 7000,
    stok: 48,
    gambar: '/produk/salonpas.png',
  },
  {
    kode: '8996001600017',
    nama: 'Aqua Botol 600ml',
    harga: 4000,
    stok: 120,
    gambar: '/produk/aqua-600ml.png',
  },
  {
    kode: '8991002101012',
    nama: 'Teh Botol Sosro 450ml',
    harga: 5500,
    stok: 76,
    gambar: '/produk/teh-botol.png',
  },
  {
    kode: '8993188111120',
    nama: 'kingkong',
    harga: 15000,
    stok: 10000,
    gambar: '/produk/kingkong.png',
  },
];

function formatRupiah(angka: number) {
  return `Rp ${angka.toLocaleString('id-ID')}`;
}

export default function ScanBarcodePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<MultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sedangMemprosesRef = useRef(false);

  const [kodeManual, setKodeManual] = useState('');
  const [hasil, setHasil] = useState<Produk | null>(null);
  const [tidakDitemukan, setTidakDitemukan] = useState(false);
  const [kameraAktif, setKameraAktif] = useState(false);
  const [kameraError, setKameraError] = useState('');
  const kodeTerakhirRef = useRef<{ kode: string; waktu: number } | null>(null);
  const COOLDOWN_MS = 2000;
  const kodeDicari = kodeManual.trim();
  const saranProduk = kodeDicari
    ? daftarProduk.filter((p) => p.kode.startsWith(kodeDicari))
    : [];
  const tampilkanSaran =
    saranProduk.length > 0 && !(hasil && hasil.kode === kodeDicari);

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
            gambar: produk.gambar,
            qty: 1,
          },
        ];
    simpanKeranjang(next);
  }

  function pilihSaran(produk: Produk) {
    setKodeManual(produk.kode);
    cariProduk(produk.kode);
  }

  function cariProduk(kode: string) {
    const kodeBersih = kode.trim();
    if (!kodeBersih) return;

    const sekarang = Date.now();
    const terakhir = kodeTerakhirRef.current;
    if (terakhir && terakhir.kode === kodeBersih && sekarang - terakhir.waktu < COOLDOWN_MS) {
      return;
    }
    kodeTerakhirRef.current = { kode: kodeBersih, waktu: sekarang };

    const produk = daftarProduk.find((p) => p.kode === kodeBersih);

    if (produk) {
      setHasil(produk);
      setTidakDitemukan(false);
      tambahKeKeranjang(produk);
    } else {
      setHasil(null);
      setTidakDitemukan(true);
    }
  }

  function handleCariManual() {
    cariProduk(kodeManual);
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

  // Kalau yang diketik sudah persis cocok satu kode produk secara penuh,
  // langsung tampilkan hasilnya otomatis tanpa perlu klik "Cari".
  useEffect(() => {
    const kodeBersih = kodeManual.trim();
    if (!kodeBersih) return;
    const cocokPersis = daftarProduk.find((p) => p.kode === kodeBersih);
    if (cocokPersis) {
      cariProduk(kodeBersih);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kodeManual]);

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
        <HeaderKasir judul="Indomart" breadcrumb="Kasir / Transaksi" />

        <main className="flex-1 px-8 py-7">
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
                    className="flex h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-[12px] font-semibold text-white hover:bg-blue-700"
                  >
                    <Search size={14} strokeWidth={2.2} />
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
                              src={produk.gambar}
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
                            src={hasil.gambar}
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

                      <div className="mt-3 border-t border-slate-100 pt-3 text-center text-[12px] text-slate-500">
                        Stok : {hasil.stok}
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
    </div>
  );
}