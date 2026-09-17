'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import SidebarKasir from '../components/SidebarKasir';
import {
  Store,
  Bell,
  User,
  ChevronDown,
  Wallet,
  Banknote,
  QrCode,
  CreditCard,
  ShoppingBag,
  Percent,
  Tag,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Printer,
  RefreshCw,
  X,
  Loader2,
} from 'lucide-react';

type MetodeId = 'tunai' | 'qris' | 'debit' | 'ewallet';

type Metode = {
  id: MetodeId;
  nama: string;
  Icon: typeof Wallet;
  cardBg: string;
  iconBg: string;
  textColor: string;
};

type ItemBelanja = {
  id: string;
  nama: string;
  harga: number;
  qty: number;
  gambar: string;
};

type TahapPembayaran = 'pilih' | 'proses' | 'berhasil';

type DetailBerhasil = {
  metode: string;
  totalBayar: number;
  kembalian: number;
};

const metodeList: Metode[] = [
  {
    id: 'tunai',
    nama: 'Tunai',
    Icon: Banknote,
    cardBg: '#eafaf1',
    iconBg: '#27ae60',
    textColor: '#1e7a45',
  },
  {
    id: 'qris',
    nama: 'QRIS',
    Icon: QrCode,
    cardBg: '#eaf3ff',
    iconBg: '#2f80ed',
    textColor: '#1c5aa8',
  },
  {
    id: 'debit',
    nama: 'Debit',
    Icon: CreditCard,
    cardBg: '#fff2e5',
    iconBg: '#f5a742',
    textColor: '#a15c12',
  },
  {
    id: 'ewallet',
    nama: 'E-Wallet',
    Icon: Wallet,
    cardBg: '#f3edff',
    iconBg: '#8a5cf6',
    textColor: '#5b3aa8',
  },
];

type EwalletProvider = {
  id: string;
  nama: string;
  warna: string;
};

const ewalletList: EwalletProvider[] = [
  { id: 'gopay', nama: 'GoPay', warna: '#00aed6' },
  { id: 'dana', nama: 'DANA', warna: '#118eea' },
  { id: 'ovo', nama: 'OVO', warna: '#4c3494' },
  { id: 'shopeepay', nama: 'ShopeePay', warna: '#ee4d2d' },
];

function formatRupiah(angka: number): string {
  return 'Rp ' + angka.toLocaleString('id-ID');
}

function formatWaktu(detik: number): string {
  const menit = Math.floor(detik / 60);
  const sisaDetik = detik % 60;
  return `${String(menit).padStart(2, '0')}:${String(sisaDetik).padStart(2, '0')}`;
}

export default function PembayaranPage() {
  const router = useRouter();
  const [namaUser, setNamaUser] = useState('Kasir');
  const [kasirId, setKasirId] = useState<string | null>(null);
  const [metodeAktif, setMetodeAktif] = useState<MetodeId | null>(null);
  const [kodePromo, setKodePromo] = useState('');
  const [itemBelanja, setItemBelanja] = useState<ItemBelanja[]>([]);
  const [diskon, setDiskon] = useState(0);

  const [tahap, setTahap] = useState<TahapPembayaran>('pilih');
  const [uangDiterima, setUangDiterima] = useState('');
  const [detailBerhasil, setDetailBerhasil] = useState<DetailBerhasil | null>(null);

  // Loading & error khusus proses simpan transaksi ke server, supaya
  // tombol "Bayar" / "Konfirmasi Pembayaran" tidak bisa diklik dobel
  // dan user tahu kalau penyimpanan gagal (bukan diam-diam dianggap sukses).
  const [menyimpan, setMenyimpan] = useState(false);
  const [simpanError, setSimpanError] = useState('');

  // Sub-langkah khusus E-Wallet: pilih provider dulu (GoPay/DANA/OVO/ShopeePay),
  // baru lanjut ke tampilan QR.
  const [ewalletProvider, setEwalletProvider] = useState<string | null>(null);
  const [ewalletTahap, setEwalletTahap] = useState<'pilih' | 'qr'>('pilih');

  // Hitung mundur khusus untuk metode non-tunai (mis. QRIS) selagi
  // menunggu pelanggan menyelesaikan pembayaran.
  const [sisaWaktu, setSisaWaktu] = useState(5 * 60);

  useEffect(() => {
  try {
    const raw = localStorage.getItem('indomart_user'); // sesuai key dari halaman login
    if (raw) {
      const user = JSON.parse(raw);
      if (user?.nama) setNamaUser(user.nama);
      if (user?.email) setKasirId(user.email); // pakai email sebagai identitas kasir
    }
  } catch {
    // biarkan default "Kasir"
  }

  try {
    const rawKeranjang = localStorage.getItem('keranjangAktif');
    if (rawKeranjang) {
      const data = JSON.parse(rawKeranjang);
      if (Array.isArray(data)) setItemBelanja(data);
    }
  } catch {
    // kalau gagal dibaca, biarkan keranjang kosong
  }
}, []);

  const jumlahItem = itemBelanja.length;
  const totalBelanja = itemBelanja.reduce((sum, item) => sum + item.harga * item.qty, 0);
  const grandTotal = Math.max(totalBelanja - diskon, 0);

  const metodeTerpilih = metodeList.find((m) => m.id === metodeAktif) ?? null;
  const providerAktif = ewalletList.find((p) => p.id === ewalletProvider) ?? null;

  const angkaUangDiterima = Number(uangDiterima) || 0;
  const kembalian = Math.max(angkaUangDiterima - grandTotal, 0);
  const uangCukup = angkaUangDiterima >= grandTotal && grandTotal > 0;

  // Countdown berjalan hanya saat sedang di tahap "proses" dengan metode
  // selain tunai (QRIS/Debit), dan untuk E-Wallet baru jalan setelah provider
  // dipilih (sub-langkah 'qr'). Reset tiap kali metode/tahap berubah.
  useEffect(() => {
    const perluCountdown =
      tahap === 'proses' &&
      !!metodeTerpilih &&
      metodeTerpilih.id !== 'tunai' &&
      (metodeTerpilih.id !== 'ewallet' || ewalletTahap === 'qr');

    if (!perluCountdown) return;

    setSisaWaktu(5 * 60);
    const interval = setInterval(() => {
      setSisaWaktu((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [tahap, metodeTerpilih, ewalletTahap]);

  const handleUangDiterimaChange = (e: ChangeEvent<HTMLInputElement>) => {
    const hanyaAngka = e.target.value.replace(/\D/g, '');
    setUangDiterima(hanyaAngka);
  };

  const handlePilihMetode = (id: MetodeId) => {
    setMetodeAktif(id);
    setUangDiterima('');
    setEwalletProvider(null);
    setEwalletTahap('pilih');
    setSimpanError('');
    setTahap('proses');
  };

  const handleGantiMetode = () => {
    setMetodeAktif(null);
    setUangDiterima('');
    setEwalletProvider(null);
    setEwalletTahap('pilih');
    setSimpanError('');
    setTahap('pilih');
  };

  // Kirim transaksi ke server. Dipakai bareng oleh pembayaran tunai
  // maupun non-tunai supaya logikanya tidak duplikat.
  async function simpanTransaksi(metode: string, jumlahDibayar: number, kembalianAkhir: number) {
    if (!kasirId) {
      setSimpanError('Data kasir tidak ditemukan. Silakan login ulang.');
      return false;
    }

    setMenyimpan(true);
    setSimpanError('');

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kasirId,
          items: itemBelanja.map((item) => ({
            id: item.id,
            nama: item.nama,
            harga: item.harga,
            qty: item.qty,
          })),
          diskon,
          kodePromo: kodePromo.trim() || null,
          metode,
          jumlahDibayar,
          kembalian: kembalianAkhir,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSimpanError(data.message || 'Gagal menyimpan transaksi ke server.');
        return false;
      }

      return true;
    } catch (err) {
      console.error(err);
      setSimpanError('Terjadi kesalahan koneksi saat menyimpan transaksi.');
      return false;
    } finally {
      setMenyimpan(false);
    }
  }

  const handleBayarTunai = async () => {
    if (!uangCukup || menyimpan) return;

    const sukses = await simpanTransaksi('Tunai', angkaUangDiterima, kembalian);
    if (!sukses) return; // tetap di modal, tampilkan error, jangan pindah tahap

    setDetailBerhasil({
      metode: 'Tunai',
      totalBayar: angkaUangDiterima,
      kembalian,
    });
    setTahap('berhasil');
  };

  const handleKonfirmasiNonTunai = async () => {
    if (!metodeTerpilih || menyimpan) return;
    const namaMetode =
      metodeTerpilih.id === 'ewallet' && providerAktif ? providerAktif.nama : metodeTerpilih.nama;

    const sukses = await simpanTransaksi(namaMetode, grandTotal, 0);
    if (!sukses) return;

    setDetailBerhasil({
      metode: namaMetode,
      totalBayar: grandTotal,
      kembalian: 0,
    });
    setTahap('berhasil');
  };

  const handleCetakStruk = () => {
    // TODO: sesuaikan path ini kalau halaman cetak struk kamu bukan di /struk
    router.push('/struk');
  };

  const handleTransaksiBaru = () => {
    try {
      localStorage.removeItem('keranjangAktif');
    } catch {
      // kalau gagal dihapus, tetap lanjut navigasi
    }
    router.push('/transaksi');
  };

  // Sama seperti handleTransaksiBaru (bersihkan keranjang & reset state),
  // tapi TIDAK redirect ke halaman transaksi. Setelah ditekan, tetap di
  // halaman /pembayaran dengan Ringkasan Belanja & modal sudah kosong/tertutup.
  const handleSelesai = () => {
    try {
      localStorage.removeItem('keranjangAktif');
    } catch {
      // kalau gagal dihapus, tetap lanjut reset state
    }
    setItemBelanja([]);
    setDiskon(0);
    setMetodeAktif(null);
    setUangDiterima('');
    setEwalletProvider(null);
    setEwalletTahap('pilih');
    setDetailBerhasil(null);
    setSimpanError('');
    setTahap('pilih');
  };

  const handleTerapkanPromo = () => {
    // TODO: validasi kode promo ke server, lalu setDiskon() sesuai hasil dari server
    console.log('Terapkan kode promo:', kodePromo);
  };

  return (
    <div className="wrapper">
      <SidebarKasir />

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <div className="store-icon">
              <Store size={19} strokeWidth={1.9} color="#2f80ed" />
            </div>
            <div>
              <div className="store-name">Indomaret</div>
              <div className="store-sub">Kasir / Pembayaran</div>
            </div>
          </div>

          <div className="topbar-right">
            <button className="icon-btn" aria-label="Notifikasi">
              <Bell size={18} strokeWidth={1.8} color="#4b5875" />
              <span className="dot" />
            </button>

            <div className="user-block">
              <div className="avatar">
                <User size={16} strokeWidth={2} color="#ffffff" />
              </div>
              <div>
                <div className="user-name">{namaUser}</div>
                <div className="user-role">Kasir</div>
              </div>
              <ChevronDown size={15} strokeWidth={2} color="#8794ab" />
            </div>
          </div>
        </header>

        <main className="content">
          <div className="page-header">
            <div className="page-icon">
              <Wallet size={20} strokeWidth={2} color="#2f80ed" />
            </div>
            <div>
              <h1>Pembayaran</h1>
              <p>Pilih metode pembayaran yang tersedia</p>
            </div>
          </div>

          <div className={`payment-grid ${tahap !== 'pilih' ? 'blur-belakang' : ''}`}>
            <div className="metode-panel">
              <div className="metode-grid">
                {metodeList.map(({ id, nama, Icon, cardBg, iconBg, textColor }) => (
                  <button
                    key={id}
                    type="button"
                    className="metode-card-mini"
                    style={{
                      background: cardBg,
                      borderColor: metodeAktif === id ? textColor : 'transparent',
                    }}
                    onClick={() => handlePilihMetode(id)}
                  >
                    <div className="metode-icon-mini" style={{ background: iconBg }}>
                      <Icon size={20} strokeWidth={2} color="#ffffff" />
                    </div>
                    <span className="metode-nama-mini" style={{ color: textColor }}>
                      {nama}
                    </span>
                  </button>
                ))}
              </div>

              <div className="promo-row">
                <div className="promo-icon">
                  <Tag size={17} strokeWidth={2} color="#2f80ed" />
                </div>
                <div className="promo-info">
                  <div className="promo-title">Promo &amp; Diskon</div>
                  <div className="promo-sub">Masukkan kode promo/kupon di sini</div>
                </div>
              </div>

              <div className="promo-form">
                <input
                  type="text"
                  placeholder="Masukkan kode promo..."
                  value={kodePromo}
                  onChange={(e) => setKodePromo(e.target.value)}
                />
                <button type="button" onClick={handleTerapkanPromo}>
                  Terapkan
                </button>
              </div>
            </div>

            <div className="ringkasan-panel">
              <div className="ringkasan-head">
                <div className="ringkasan-icon">
                  <ShoppingBag size={19} strokeWidth={2} color="#ffffff" />
                </div>
                <div>
                  <h2>Ringkasan Belanja</h2>
                  <p>{jumlahItem} item yang kamu beli</p>
                </div>
              </div>

              <div className="item-list">
                {itemBelanja.length === 0 && (
                  <div className="item-kosong">
                    Belum ada barang. Silakan pilih produk di halaman Transaksi
                    terlebih dahulu.
                  </div>
                )}

                {itemBelanja.map((item) => (
                  <div className="item-row" key={item.id}>
                    <div className="item-thumb">
                      <img src={item.gambar} alt={item.nama} />
                    </div>
                    <div className="item-info">
                      <div className="item-nama">{item.nama}</div>
                      <div className="item-qty">{item.qty} pcs</div>
                    </div>
                    <div className="item-harga">
                      {formatRupiah(item.harga * item.qty)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="diskon-box">
                <div className="diskon-icon">
                  <Percent size={16} strokeWidth={2} color="#2f80ed" />
                </div>
                <div className="diskon-rows">
                  <div className="diskon-row">
                    <span>Total Harga (sebelum diskon)</span>
                    <span className={diskon > 0 ? 'coret' : ''}>
                      {formatRupiah(totalBelanja)}
                    </span>
                  </div>
                  {diskon > 0 && (
                    <div className="diskon-row">
                      <span>Potongan Harga</span>
                      <span className="diskon-value">-{formatRupiah(diskon)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grand-total-box">
                <span>Total Belanja</span>
                <span className="grand-total-value">{formatRupiah(grandTotal)}</span>
              </div>

              {tahap === 'pilih' && (
                <div className="hint-pilih-metode">
                  <ArrowRight size={14} strokeWidth={2} />
                  Pilih metode pembayaran di sebelah kiri untuk lanjut.
                </div>
              )}
            </div>
          </div>

          {tahap !== 'pilih' && (
            <div className="modal-overlay" onClick={handleGantiMetode}>
              <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  {tahap === 'proses' && metodeTerpilih && metodeTerpilih.id === 'tunai' && (
                    <div className="modal-title-row">
                      <div className="modal-title-icon" style={{ background: metodeTerpilih.iconBg }}>
                        <metodeTerpilih.Icon size={15} strokeWidth={2.2} color="#ffffff" />
                      </div>
                      <h2>Tunai</h2>
                    </div>
                  )}

                  {tahap === 'berhasil' && <h2>Pembayaran Berhasil</h2>}

                  {tahap === 'proses' && (
                    <button
                      type="button"
                      className="modal-close"
                      onClick={handleGantiMetode}
                      aria-label="Tutup"
                    >
                      <X size={18} strokeWidth={2.2} color="#4b5875" />
                    </button>
                  )}
                </div>

                <div className="modal-body">
                  {simpanError && (
                    <div className="simpan-error">{simpanError}</div>
                  )}

                  {tahap === 'proses' && metodeTerpilih && metodeTerpilih.id === 'tunai' && (
                    <div className="tunai-box">
                      <div className="tunai-icon-row">
                        <div className="tunai-icon">
                          <Banknote size={18} strokeWidth={2} color="#27ae60" />
                        </div>
                        <span>Tunai</span>
                      </div>
                      <p className="tunai-desc">
                        Masukkan jumlah uang yang diterima dari pelanggan.
                      </p>

                      <div className="tunai-row">
                        <span>Total Belanja</span>
                        <span className="tunai-total">{formatRupiah(grandTotal)}</span>
                      </div>

                      <label className="tunai-label" htmlFor="uangDiterima">
                        Uang Diterima
                      </label>
                      <div className="tunai-input-wrap">
                        <span className="tunai-input-prefix">Rp</span>
                        <input
                          id="uangDiterima"
                          type="text"
                          inputMode="numeric"
                          className="tunai-input"
                          placeholder="0"
                          value={uangDiterima ? Number(uangDiterima).toLocaleString('id-ID') : ''}
                          onChange={handleUangDiterimaChange}
                        />
                      </div>

                      <div className="tunai-row kembalian-row">
                        <span>Kembalian</span>
                        <span className="kembalian-value">{formatRupiah(kembalian)}</span>
                      </div>

                      <button
                        type="button"
                        className="btn-konfirmasi"
                        disabled={!uangCukup || menyimpan}
                        onClick={handleBayarTunai}
                      >
                        {menyimpan ? (
                          <Loader2 size={16} className="spin" />
                        ) : (
                          <CheckCircle2 size={16} strokeWidth={2} />
                        )}
                        {menyimpan ? 'Menyimpan...' : 'Bayar'}
                      </button>

                      <button type="button" className="qris-kembali" onClick={handleGantiMetode}>
                        <ArrowLeft size={13} strokeWidth={2.2} />
                        Kembali
                      </button>
                    </div>
                  )}

                  {tahap === 'proses' && metodeTerpilih && metodeTerpilih.id === 'debit' && (
                    <div className="debit-box">
                      <div className="debit-header-row">
                        <div className="debit-icon" style={{ background: metodeTerpilih.iconBg }}>
                          <metodeTerpilih.Icon size={18} strokeWidth={2} color="#ffffff" />
                        </div>
                        <div>
                          <div className="debit-nama">{metodeTerpilih.nama}</div>
                          <div className="debit-desc">
                            Silakan lakukan pembayaran melalui mesin EDC / gesek kartu.
                          </div>
                        </div>
                      </div>

                      <div className="debit-total-box">
                        <span>Total Pembayaran</span>
                        <span className="debit-total-value">{formatRupiah(grandTotal)}</span>
                      </div>

                      <div className="debit-gambar-wrap">
                        <Image
                          src="/debit/gb-debit.png"
                          alt="Mesin EDC"
                          fill
                          className="debit-gambar-img"
                        />
                      </div>

                      <div className="debit-countdown">
                        <span className="qris-countdown-dot" />
                        Menunggu pembayaran... {formatWaktu(sisaWaktu)}
                      </div>

                      <button
                        type="button"
                        className="btn-konfirmasi"
                        disabled={grandTotal === 0 || menyimpan}
                        onClick={handleKonfirmasiNonTunai}
                      >
                        {menyimpan ? (
                          <Loader2 size={16} className="spin" />
                        ) : (
                          <CheckCircle2 size={16} strokeWidth={2} />
                        )}
                        {menyimpan ? 'Menyimpan...' : 'Konfirmasi Pembayaran'}
                      </button>

                      <button type="button" className="debit-kembali" onClick={handleGantiMetode}>
                        <ArrowLeft size={13} strokeWidth={2.2} />
                        Kembali
                      </button>
                    </div>
                  )}

                  {tahap === 'proses' && metodeTerpilih && metodeTerpilih.id === 'qris' && (
                    <div className="qris-box">
                      <div className="qris-icon-row">
                        <div className="qris-icon" style={{ background: metodeTerpilih.iconBg }}>
                          <metodeTerpilih.Icon size={18} strokeWidth={2} color="#ffffff" />
                        </div>
                        <div>
                          <div className="qris-nama">{metodeTerpilih.nama}</div>
                          <div className="qris-desc">
                            Scan QR Code menggunakan aplikasi pembayaran kamu.
                          </div>
                        </div>
                      </div>

                      <div className="qris-gambar-wrap">
                        <Image
                          src="/qris/scan-gb.png"
                          alt="QR Code Pembayaran"
                          fill
                          className="qris-gambar-img"
                        />
                      </div>

                      <div className="tunai-row qris-total-row">
                        <span>Total Pembayaran</span>
                        <span className="tunai-total qris-total-value">{formatRupiah(grandTotal)}</span>
                      </div>

                      <div className="qris-countdown">
                        <span className="qris-countdown-dot" />
                        Menunggu pembayaran... {formatWaktu(sisaWaktu)}
                      </div>

                      <button
                        type="button"
                        className="btn-konfirmasi"
                        disabled={grandTotal === 0 || menyimpan}
                        onClick={handleKonfirmasiNonTunai}
                      >
                        {menyimpan ? (
                          <Loader2 size={16} className="spin" />
                        ) : (
                          <CheckCircle2 size={16} strokeWidth={2} />
                        )}
                        {menyimpan ? 'Menyimpan...' : 'Bayar'}
                      </button>

                      <button type="button" className="qris-kembali" onClick={handleGantiMetode}>
                        <ArrowLeft size={13} strokeWidth={2.2} />
                        Kembali
                      </button>
                    </div>
                  )}

                  {tahap === 'proses' &&
                    metodeTerpilih &&
                    metodeTerpilih.id === 'ewallet' &&
                    ewalletTahap === 'pilih' && (
                      <div className="ewallet-box">
                        <div className="debit-header-row">
                          <div className="debit-icon" style={{ background: metodeTerpilih.iconBg }}>
                            <metodeTerpilih.Icon size={18} strokeWidth={2} color="#ffffff" />
                          </div>
                          <div>
                            <div className="debit-nama">{metodeTerpilih.nama}</div>
                            <div className="debit-desc">Pilih e-wallet yang kamu punya.</div>
                          </div>
                        </div>

                        <div className="ewallet-grid">
                          {ewalletList.map((provider) => (
                            <button
                              key={provider.id}
                              type="button"
                              className="ewallet-pill"
                              style={{
                                borderColor: ewalletProvider === provider.id ? provider.warna : 'transparent',
                              }}
                              onClick={() => setEwalletProvider(provider.id)}
                            >
                              <Wallet size={15} strokeWidth={2} color={provider.warna} />
                              <span style={{ color: provider.warna }}>{provider.nama}</span>
                            </button>
                          ))}
                        </div>

                        <div className="debit-total-box">
                          <span>Total Pembayaran</span>
                          <span className="debit-total-value">{formatRupiah(grandTotal)}</span>
                        </div>

                        <button
                          type="button"
                          className="btn-konfirmasi ewallet-lanjut"
                          disabled={!ewalletProvider}
                          onClick={() => setEwalletTahap('qr')}
                        >
                          Lanjutkan Pembayaran
                          <ArrowRight size={16} strokeWidth={2} />
                        </button>

                        <button type="button" className="qris-kembali" onClick={handleGantiMetode}>
                          <ArrowLeft size={13} strokeWidth={2.2} />
                          Kembali
                        </button>
                      </div>
                    )}

                  {tahap === 'proses' &&
                    metodeTerpilih &&
                    metodeTerpilih.id === 'ewallet' &&
                    ewalletTahap === 'qr' &&
                    providerAktif && (
                      <div className="qris-box">
                        <div className="qris-icon-row">
                          <div className="qris-icon" style={{ background: providerAktif.warna }}>
                            <Wallet size={18} strokeWidth={2} color="#ffffff" />
                          </div>
                          <div>
                            <div className="qris-nama">{providerAktif.nama}</div>
                            <div className="qris-desc">
                              Scan kode QR di aplikasi {providerAktif.nama} kamu.
                            </div>
                          </div>
                        </div>

                        <div className="qris-gambar-wrap">
                          <Image
                            src="/qris/scan-gb.png"
                            alt="QR Code Pembayaran"
                            fill
                            className="qris-gambar-img"
                          />
                        </div>

                        <div className="tunai-row qris-total-row">
                          <span>Total Pembayaran</span>
                          <span className="tunai-total qris-total-value">{formatRupiah(grandTotal)}</span>
                        </div>

                        <div className="qris-countdown">
                          <span className="qris-countdown-dot" />
                          Menunggu pembayaran... {formatWaktu(sisaWaktu)}
                        </div>

                        <button
                          type="button"
                          className="btn-konfirmasi"
                          disabled={grandTotal === 0 || menyimpan}
                          onClick={handleKonfirmasiNonTunai}
                        >
                          {menyimpan ? (
                            <Loader2 size={16} className="spin" />
                          ) : (
                            <CheckCircle2 size={16} strokeWidth={2} />
                          )}
                          {menyimpan ? 'Menyimpan...' : 'Bayar'}
                        </button>

                        <button
                          type="button"
                          className="qris-kembali"
                          onClick={() => setEwalletTahap('pilih')}
                        >
                          <ArrowLeft size={13} strokeWidth={2.2} />
                          Ganti Metode
                        </button>
                      </div>
                    )}

                  {tahap === 'berhasil' && detailBerhasil && (
                    <div className="berhasil-box">
                      <div className="berhasil-icon">
                        <CheckCircle2 size={44} strokeWidth={2} color="#27ae60" />
                      </div>
                      <h2 className="berhasil-judul">Pembayaran Berhasil!</h2>

                      <div className="berhasil-info">
                        <div className="berhasil-row">
                          <span>Metode Pembayaran</span>
                          <strong>{detailBerhasil.metode}</strong>
                        </div>
                        <div className="berhasil-row">
                          <span>Total Pembayaran</span>
                          <strong>{formatRupiah(detailBerhasil.totalBayar)}</strong>
                        </div>
                        {detailBerhasil.metode === 'Tunai' && (
                          <div className="berhasil-row">
                            <span>Kembalian</span>
                            <strong>{formatRupiah(detailBerhasil.kembalian)}</strong>
                          </div>
                        )}
                      </div>

                      <button type="button" className="btn-cetak" onClick={handleCetakStruk}>
                        <Printer size={16} strokeWidth={2} />
                        Cetak Struk
                      </button>
                      <button type="button" className="btn-transaksi-baru" onClick={handleTransaksiBaru}>
                        <RefreshCw size={16} strokeWidth={2} />
                        Transaksi Baru
                      </button>
                      <button type="button" className="btn-selesai" onClick={handleSelesai}>
                        <CheckCircle2 size={16} strokeWidth={2} />
                        Selesai
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        .wrapper {
          display: flex;
          min-height: 100vh;
          background: #f4f6fb;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          color: #16233d;
        }

        .main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border-bottom: 1px solid #eaeef5;
          padding: 12px 24px;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .store-icon {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: #eaf2ff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .store-name {
          font-weight: 800;
          font-size: 13.5px;
          color: #10295c;
          line-height: 1.25;
        }

        .store-sub {
          font-size: 10.5px;
          color: #8794ab;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .icon-btn {
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-btn .dot {
          position: absolute;
          top: -1px;
          right: -1px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #e2231a;
        }

        .user-block {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #10295c;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .user-name {
          font-size: 12.5px;
          font-weight: 700;
          color: #16233d;
          line-height: 1.25;
        }

        .user-role {
          font-size: 10.5px;
          color: #8794ab;
        }

        .content {
          padding: 24px 28px 36px;
        }

        .page-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 22px;
        }

        .page-icon {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          background: #e7f1ff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .page-header h1 {
          margin: 0 0 2px;
          font-size: 21px;
          font-weight: 800;
          color: #10295c;
        }

        .page-header p {
          margin: 0;
          font-size: 12.5px;
          color: #8794ab;
        }

        .payment-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 18px;
          align-items: start;
          max-width: 1080px;
        }

        .metode-panel {
          background: #ffffff;
          border: 1px solid #eef1f8;
          border-radius: 18px;
          padding: 18px;
          box-shadow: 0 10px 24px rgba(16, 41, 92, 0.06);
        }

        .payment-grid.blur-belakang {
          filter: blur(2px);
          pointer-events: none;
          user-select: none;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 20, 45, 0.55);
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          padding: 20px;
        }

        .modal-box {
          width: 100%;
          max-width: 440px;
          max-height: 88vh;
          overflow-y: auto;
          background: #ffffff;
          border-radius: 18px;
          box-shadow: 0 24px 60px rgba(8, 15, 35, 0.35);
        }

        .modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #ffffff;
          padding: 20px 20px 4px;
          border-radius: 18px 18px 0 0;
          position: sticky;
          top: 0;
        }

        .modal-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modal-title-icon {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 17px;
          font-weight: 800;
          color: #10295c;
        }

        .modal-close {
          margin-left: auto;
          background: #f1f4f9;
          border: none;
          border-radius: 9px;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }

        .modal-close:hover {
          background: #e4e9f2;
        }

        .modal-body {
          padding: 20px;
        }

        .simpan-error {
          background: #fdecea;
          color: #c0392b;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 11.5px;
          font-weight: 600;
          margin-bottom: 14px;
        }

        .spin {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .berhasil-judul {
          margin: 0 0 16px;
          font-size: 17px;
          font-weight: 800;
          color: #10295c;
        }

        .metode-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .metode-card-mini {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 18px 10px;
          border-radius: 14px;
          border: 1.5px solid transparent;
          cursor: pointer;
          transition: border-color 0.15s ease, transform 0.1s ease;
        }

        .metode-card-mini:hover {
          transform: translateY(-2px);
        }

        .metode-icon-mini {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .metode-nama-mini {
          font-size: 12.5px;
          font-weight: 800;
        }

        .promo-row {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          background: none;
          border: none;
          border-top: 1px solid #f0f2f8;
          padding-top: 14px;
          cursor: pointer;
          text-align: left;
        }

        .promo-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #e7f1ff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .promo-info {
          flex: 1;
          min-width: 0;
        }

        .promo-title {
          font-size: 13.5px;
          font-weight: 800;
          color: #10295c;
          margin-bottom: 2px;
        }

        .promo-sub {
          font-size: 11.5px;
          color: #8794ab;
        }

        .promo-form {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .promo-form input {
          flex: 1;
          border: 1px solid #e6ebf3;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 12.5px;
          outline: none;
          background: #f8fafd;
          color: #16233d;
        }

        .promo-form input::placeholder {
          color: #a5aec2;
        }

        .promo-form button {
          background: #2f80ed;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          padding: 0 16px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
        }

        .promo-form button:hover {
          background: #1c67cf;
        }

        .step-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .step-back {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          margin-right: 2px;
        }

        .step-badge {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #2f80ed;
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .step-badge.badge-sukses {
          background: #27ae60;
        }

        .step-header h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
          color: #10295c;
        }

        .tunai-box {
          background: #f3fbf6;
          border-radius: 14px;
          padding: 14px;
        }

        .tunai-icon-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .tunai-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .tunai-icon-row span {
          font-size: 13px;
          font-weight: 800;
          color: #10295c;
        }

        .tunai-desc {
          margin: 0 0 10px;
          font-size: 11px;
          color: #4b5875;
        }

        .tunai-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border-radius: 9px;
          padding: 9px 11px;
          font-size: 12px;
          font-weight: 700;
          color: #4b5875;
          margin-bottom: 9px;
        }

        .tunai-total {
          color: #10295c;
          font-weight: 800;
        }

        .tunai-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #4b5875;
          margin-bottom: 5px;
        }

        .tunai-input-wrap {
          position: relative;
          margin-bottom: 8px;
        }

        .tunai-input-prefix {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 13px;
          font-weight: 700;
          color: #6b95c4;
          pointer-events: none;
        }

        .tunai-input {
          width: 100%;
          box-sizing: border-box;
          border: 1.5px solid #cfe9d9;
          border-radius: 9px;
          padding: 10px 12px 10px 34px;
          font-size: 14px;
          font-weight: 500;
          color: #10295c;
          outline: none;
          background: #ffffff;
          transition: border-color 0.15s ease;
        }

        .tunai-input:focus {
          border-color: #2f80ed;
        }

        .tunai-input::placeholder {
          color: #a5aec2;
          font-weight: 600;
        }

        .kembalian-row {
          margin-bottom: 12px;
        }

        .kembalian-value {
          color: #27ae60;
          font-weight: 800;
        }

        .btn-konfirmasi {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px 0;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          background: #2f80ed;
          border: none;
          color: #ffffff;
        }

        .btn-konfirmasi:hover:not(:disabled) {
          background: #1c67cf;
        }

        .btn-konfirmasi:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .qris-box {
          background: #eaf3ff;
          border-radius: 14px;
          padding: 16px;
        }

        .qris-icon-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .qris-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .qris-nama {
          font-size: 13px;
          font-weight: 800;
          color: #10295c;
        }

        .qris-desc {
          font-size: 10.5px;
          color: #6b7d9c;
          margin-top: 1px;
        }

        .qris-gambar-wrap {
          position: relative;
          width: 160px;
          height: 160px;
          margin: 0 auto 14px;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
        }

        .qris-gambar-img {
          object-fit: contain;
          padding: 8px;
        }

        .qris-total-row {
          justify-content: center;
          flex-direction: column;
          gap: 4px;
          text-align: center;
        }

        .qris-total-value {
          font-size: 18px;
        }

        .qris-countdown {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #ffffff;
          border-radius: 10px;
          padding: 9px 0;
          margin: 12px 0;
          font-size: 12px;
          font-weight: 700;
          color: #2f80ed;
        }

        .qris-countdown-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2f80ed;
          animation: qris-pulse 1s infinite;
        }

        @keyframes qris-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .qris-kembali {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: none;
          border: none;
          color: #4b5875;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 10px;
        }

        .qris-kembali:hover {
          color: #2f80ed;
        }

        .debit-box {
          background: #ffffff;
          border: 1px solid #eef1f8;
          border-radius: 14px;
        }

        .debit-header-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px 16px 14px;
        }

        .debit-icon {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .debit-nama {
          font-size: 14px;
          font-weight: 800;
          color: #10295c;
          margin-bottom: 3px;
        }

        .debit-desc {
          font-size: 11.5px;
          color: #8794ab;
          line-height: 1.45;
        }

        .debit-total-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: #f4f7fc;
          padding: 14px 16px;
          font-size: 12px;
          font-weight: 700;
          color: #4b5875;
        }

        .debit-total-value {
          font-size: 19px;
          font-weight: 800;
          color: #10295c;
        }

        .debit-gambar-wrap {
          position: relative;
          width: 100%;
          height: 150px;
          margin: 4px 0;
        }

        .debit-gambar-img {
          object-fit: contain;
        }

        .debit-countdown {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #f4f7fc;
          border-radius: 10px;
          margin: 4px 16px 14px;
          padding: 9px 0;
          font-size: 12px;
          font-weight: 700;
          color: #2f80ed;
        }

        .debit-box .btn-konfirmasi {
          margin: 4px 16px 14px;
          width: calc(100% - 32px);
        }

        .debit-kembali {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: #2f80ed;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          padding: 0 16px 16px;
        }

        .debit-kembali:hover {
          color: #1c67cf;
        }

        .ewallet-box {
          background: #ffffff;
          border: 1px solid #eef1f8;
          border-radius: 14px;
        }

        .ewallet-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          padding: 0 16px 14px;
        }

        .ewallet-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafd;
          border: 1.5px solid transparent;
          border-radius: 10px;
          padding: 12px 14px;
          cursor: pointer;
          font-size: 12.5px;
          font-weight: 700;
          transition: border-color 0.15s ease, transform 0.1s ease;
        }

        .ewallet-pill:hover {
          transform: translateY(-1px);
        }

        .ewallet-box .debit-total-box {
          margin: 0 16px 14px;
          border-radius: 10px;
        }

        .ewallet-lanjut {
          margin: 4px 16px 14px;
          width: calc(100% - 32px);
        }

        .berhasil-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          background: #f8fafd;
          border-radius: 16px;
          padding: 28px 20px 22px;
        }

        .berhasil-icon {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background: #eafaf1;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
        }

        .berhasil-box h2 {
          margin: 0 0 16px;
          font-size: 17px;
          font-weight: 800;
          color: #10295c;
        }

        .berhasil-info {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .berhasil-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12.5px;
          color: #4b5875;
        }

        .berhasil-row strong {
          color: #10295c;
          font-weight: 800;
        }

        .btn-cetak {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 0;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          background: #e7f1ff;
          border: none;
          color: #1c5aa8;
          margin-bottom: 10px;
        }

        .btn-cetak:hover {
          background: #d7e8ff;
        }

        .btn-transaksi-baru {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 0;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          background: #2f80ed;
          border: none;
          color: #ffffff;
        }

        .btn-transaksi-baru:hover {
          background: #1c67cf;
        }

        .btn-selesai {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 0;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          background: #f1f4f9;
          border: none;
          color: #4b5875;
          margin-top: 10px;
        }

        .btn-selesai:hover {
          background: #e4e9f2;
        }

        .ringkasan-panel {
          background: #ffffff;
          border: 1px solid #eef1f8;
          border-radius: 18px;
          padding: 20px 20px 18px;
          box-shadow: 0 10px 24px rgba(16, 41, 92, 0.06);
        }

        .ringkasan-head {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .ringkasan-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #10295c;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ringkasan-head h2 {
          margin: 0 0 2px;
          font-size: 16px;
          font-weight: 800;
          color: #10295c;
        }

        .ringkasan-head p {
          margin: 0;
          font-size: 11.5px;
          color: #8794ab;
        }

        .item-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        .item-kosong {
          text-align: center;
          padding: 20px 8px;
          font-size: 12px;
          color: #8794ab;
          background: #f8fafd;
          border-radius: 12px;
        }

        .item-row {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f8fafd;
          border-radius: 14px;
          padding: 10px 12px;
        }

        .item-thumb {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: #ffffff;
          flex-shrink: 0;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .item-thumb img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 4px;
        }

        .item-info {
          flex: 1;
          min-width: 0;
        }

        .item-nama {
          font-size: 13px;
          font-weight: 800;
          color: #10295c;
        }

        .item-qty {
          font-size: 11px;
          color: #8794ab;
          margin-top: 1px;
        }

        .item-harga {
          font-size: 13.5px;
          font-weight: 800;
          color: #10295c;
          flex-shrink: 0;
        }

        .diskon-box {
          display: flex;
          gap: 10px;
          background: #eaf2ff;
          border-radius: 14px;
          padding: 13px 14px;
          margin-bottom: 12px;
        }

        .diskon-icon {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .diskon-rows {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .diskon-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11.5px;
          font-weight: 700;
          color: #4b5875;
        }

        .diskon-row .coret {
          text-decoration: line-through;
          color: #8794ab;
          font-weight: 600;
        }

        .diskon-row .diskon-value {
          color: #27ae60;
        }

        .grand-total-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 4px 16px;
          margin-bottom: 6px;
          font-size: 14.5px;
          font-weight: 800;
          color: #10295c;
        }

        .grand-total-value {
          font-size: 19px;
          font-weight: 800;
          color: #10295c;
        }

        .hint-pilih-metode {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f8fafd;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 11.5px;
          font-weight: 600;
          color: #8794ab;
        }

        @media (max-width: 1000px) {
          .payment-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 620px) {
          .metode-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}