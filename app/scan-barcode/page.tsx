'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Search, Camera, CameraOff } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';
import SidebarKasir from '../components/SidebarKasir';
import HeaderKasir from '../components/HeaderKasir';

type Produk = {
  kode: string;
  nama: string;
  harga: number;
  stok: number;
  gambar: string;
};

const daftarProduk: Produk[] = [
  {
    kode: '8992388101015',
    nama: 'Indomie Goreng',
    harga: 3000,
    stok: 48,
    gambar: '/produk/indomie-goreng.png',
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
];

function formatRupiah(angka: number) {
  return `Rp ${angka.toLocaleString('id-ID')}`;
}

export default function ScanBarcodePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  const [kodeManual, setKodeManual] = useState('');
  const [hasil, setHasil] = useState<Produk | null>(null);
  const [tidakDitemukan, setTidakDitemukan] = useState(false);
  const [kameraAktif, setKameraAktif] = useState(false);
  const [kameraError, setKameraError] = useState('');

  function cariProduk(kode: string) {
    const kodeBersih = kode.trim();
    if (!kodeBersih) return;

    const produk = daftarProduk.find((p) => p.kode === kodeBersih);

    if (produk) {
      setHasil(produk);
      setTidakDitemukan(false);
    } else {
      setHasil(null);
      setTidakDitemukan(true);
    }
  }

  function handleCariManual() {
    cariProduk(kodeManual);
  }

  async function nyalakanKamera() {
    setKameraError('');

    if (!videoRef.current) return;

    try {
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      // decodeFromConstraints mengurus getUserMedia + render ke <video> + loop pembacaan
      // frame sekaligus — dan jalan di semua browser modern (Chrome, Firefox, Safari, Edge),
      // tidak bergantung API BarcodeDetector bawaan browser yang dukungannya belum merata.
      await codeReader.decodeFromConstraints(
        { video: { facingMode: 'environment' } },
        videoRef.current,
        (result) => {
          if (result) {
            cariProduk(result.getText());
          }
        }
      );

      setKameraAktif(true);
    } catch {
      setKameraError(
        'Tidak bisa mengakses kamera. Pastikan izin kamera diaktifkan, atau gunakan input manual.'
      );
      setKameraAktif(false);
    }
  }

  function matikanKamera() {
    codeReaderRef.current?.reset();
    codeReaderRef.current = null;
    setKameraAktif(false);
  }

  // Pastikan kamera dimatikan saat pindah halaman
  useEffect(() => {
    return () => {
      codeReaderRef.current?.reset();
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarKasir />

      <div className="flex flex-1 flex-col">
        <HeaderKasir judul="Indomart" breadcrumb="Kasir / Transaksi" />

        <main className="flex-1 px-8 py-7">
          <h1 className="text-[22px] font-extrabold text-blue-900">
            Scan Barcode
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Arahkan barcode ke kamera atau masukkan kode secara manual
          </p>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            {/* Panel kamera */}
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-900">
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

              {/* Bingkai target scan */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-[46%] w-[46%]">
                  <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-lg border-l-4 border-t-4 border-red-500" />
                  <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-lg border-r-4 border-t-4 border-red-500" />
                  <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-4 border-l-4 border-red-500" />
                  <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-lg border-b-4 border-r-4 border-red-500" />
                </div>
              </div>

              {/* Tombol kontrol kamera */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                {kameraAktif ? (
                  <button
                    onClick={matikanKamera}
                    className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-[12px] font-semibold text-slate-800 shadow"
                  >
                    <CameraOff size={15} strokeWidth={2} />
                    Matikan Kamera
                  </button>
                ) : (
                  <button
                    onClick={nyalakanKamera}
                    className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-[12px] font-semibold text-white shadow hover:bg-blue-700"
                  >
                    <Camera size={15} strokeWidth={2} />
                    Nyalakan Kamera
                  </button>
                )}
              </div>

              {kameraError && (
                <div className="absolute bottom-16 left-1/2 w-[85%] -translate-x-1/2 rounded-lg bg-red-50 px-3 py-2 text-center text-[11px] text-red-600">
                  {kameraError}
                </div>
              )}

            </div>

            {/* Panel kanan: input manual + hasil */}
            <div className="flex flex-col gap-5">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="text-[14px] font-bold text-slate-900">
                  Input Manual
                </h3>

                <div className="mt-3 flex gap-2">
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
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="text-[14px] font-bold text-slate-900">
                  Hasil Pencarian
                </h3>

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
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-[12px] text-slate-400">
                      Produk dengan kode tersebut tidak ditemukan.
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-[12px] text-slate-400">
                      Scan atau masukkan kode produk untuk melihat hasilnya di sini.
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