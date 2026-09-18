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
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Printer,
  RefreshCw,
  X,
  Loader2,
  Tag,
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
  gambar?: string;
};

type Promo = {
  id?: string | number;
  nama?: string;
  tipe?: string;
  persen?: number;
  diskon?: number;
};

type TransaksiAktif = {
  items?: ItemBelanja[];
  keranjang?: ItemBelanja[];
  promo?: Promo | null;
  promoTerpilih?: Promo | null;
  selectedPromo?: Promo | null;
  diskon?: number;
  member?: {
    id?: string | number;
    nama?: string;
  } | null;
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

const ewalletList = [
  {
    id: 'gopay',
    nama: 'GoPay',
    warna: '#00aed6',
  },
  {
    id: 'dana',
    nama: 'DANA',
    warna: '#118eea',
  },
  {
    id: 'ovo',
    nama: 'OVO',
    warna: '#4c3494',
  },
  {
    id: 'shopeepay',
    nama: 'ShopeePay',
    warna: '#ee4d2d',
  },
];

function formatRupiah(angka: number) {
  return 'Rp ' + Number(angka || 0).toLocaleString('id-ID');
}

function formatWaktu(detik: number) {
  const menit = Math.floor(detik / 60);
  const sisa = detik % 60;

  return `${String(menit).padStart(2, '0')}:${String(
    sisa
  ).padStart(2, '0')}`;
}

export default function PembayaranPage() {
  const router = useRouter();

  const [namaUser, setNamaUser] = useState('Kasir');
  const [kasirId, setKasirId] = useState<string | null>(null);

  const [itemBelanja, setItemBelanja] = useState<ItemBelanja[]>(
    []
  );

  const [promo, setPromo] = useState<Promo | null>(null);
  const [diskon, setDiskon] = useState(0);

  const [metodeAktif, setMetodeAktif] =
    useState<MetodeId | null>(null);

  const [tahap, setTahap] =
    useState<TahapPembayaran>('pilih');

  const [uangDiterima, setUangDiterima] = useState('');

  const [detailBerhasil, setDetailBerhasil] =
    useState<DetailBerhasil | null>(null);

  const [menyimpan, setMenyimpan] = useState(false);
  const [simpanError, setSimpanError] = useState('');

  const [ewalletProvider, setEwalletProvider] =
    useState<string | null>(null);

  const [ewalletTahap, setEwalletTahap] = useState<
    'pilih' | 'qr'
  >('pilih');

  const [sisaWaktu, setSisaWaktu] = useState(300);

  const [waktuTransaksi, setWaktuTransaksi] =
    useState('');

  useEffect(() => {
    try {
      const userRaw =
        localStorage.getItem('indomart_user');

      if (userRaw) {
        const user = JSON.parse(userRaw);

        if (user?.nama) {
          setNamaUser(user.nama);
        }

        if (user?.email) {
          setKasirId(user.email);
        }
      }

      const transaksiRaw =
        localStorage.getItem('transaksiAktif');

      let transaksi: TransaksiAktif | null = null;

      if (transaksiRaw) {
        transaksi = JSON.parse(transaksiRaw);
      }

      const keranjangRaw =
        localStorage.getItem('keranjangAktif');

      let keranjangFallback: ItemBelanja[] = [];

      if (keranjangRaw) {
        try {
          const parsed = JSON.parse(keranjangRaw);

          if (Array.isArray(parsed)) {
            keranjangFallback = parsed;
          }
        } catch {
          keranjangFallback = [];
        }
      }

      const items =
        transaksi?.items ??
        transaksi?.keranjang ??
        keranjangFallback;

      if (Array.isArray(items)) {
        setItemBelanja(items);
      }

      const promoAktif =
        transaksi?.promo ??
        transaksi?.promoTerpilih ??
        transaksi?.selectedPromo ??
        null;

      setPromo(promoAktif);

      const total = (items ?? []).reduce(
        (sum, item) =>
          sum +
          Number(item.harga || 0) *
            Number(item.qty || 0),
        0
      );

      let diskonFinal = Number(
        transaksi?.diskon ?? 0
      );

      if (!diskonFinal && promoAktif) {
        const persen = Number(
          promoAktif.persen ??
            promoAktif.diskon ??
            0
        );

        if (persen > 0) {
          diskonFinal = Math.round(
            (total * persen) / 100
          );
        }
      }

      setDiskon(
        Math.min(Math.max(diskonFinal, 0), total)
      );
    } catch (error) {
      console.error(
        'Gagal membaca transaksi:',
        error
      );
    }
  }, []);

  const jumlahItem = itemBelanja.reduce(
    (sum, item) => sum + Number(item.qty || 0),
    0
  );

  const totalBelanja = itemBelanja.reduce(
    (sum, item) =>
      sum +
      Number(item.harga || 0) *
        Number(item.qty || 0),
    0
  );

  const grandTotal = Math.max(
    totalBelanja - diskon,
    0
  );

  const metodeTerpilih =
    metodeList.find(
      (metode) => metode.id === metodeAktif
    ) ?? null;

  const providerAktif =
    ewalletList.find(
      (provider) =>
        provider.id === ewalletProvider
    ) ?? null;

  const angkaUangDiterima =
    Number(uangDiterima) || 0;

  const kembalian = Math.max(
    angkaUangDiterima - grandTotal,
    0
  );

  const uangCukup =
    angkaUangDiterima >= grandTotal &&
    grandTotal > 0;

  useEffect(() => {
    const perluCountdown =
      tahap === 'proses' &&
      metodeTerpilih &&
      metodeTerpilih.id !== 'tunai';

    if (!perluCountdown) {
      return;
    }

    setSisaWaktu(300);

    const timer = setInterval(() => {
      setSisaWaktu((prev) =>
        prev > 0 ? prev - 1 : 0
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [tahap, metodeTerpilih]);

  const handleUangDiterimaChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setUangDiterima(
      e.target.value.replace(/\D/g, '')
    );
  };

  const handlePilihMetode = (
    id: MetodeId
  ) => {
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

  const simpanTransaksi = async (
    metode: string,
    jumlahDibayar: number,
    kembalianAkhir: number
  ) => {
    if (!kasirId) {
      setSimpanError(
        'Data kasir tidak ditemukan. Silakan login ulang.'
      );
      return false;
    }

    if (itemBelanja.length === 0) {
      setSimpanError(
        'Keranjang belanja masih kosong.'
      );
      return false;
    }

    setMenyimpan(true);
    setSimpanError('');

    try {
      const response = await fetch(
        '/api/transactions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            kasirId,

            items: itemBelanja.map((item) => ({
              id: item.id,
              nama: item.nama,
              harga: Number(item.harga),
              qty: Number(item.qty),
            })),

            diskon,
            kodePromo: promo?.nama ?? null,
            metode,
            jumlahDibayar,
            kembalian: kembalianAkhir,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setSimpanError(
          data?.message ||
            'Gagal menyimpan transaksi.'
        );

        return false;
      }

      return true;
    } catch (error) {
      console.error(error);

      setSimpanError(
        'Terjadi kesalahan koneksi saat menyimpan transaksi.'
      );

      return false;
    } finally {
      setMenyimpan(false);
    }
  };

  const tampilkanStruk = (
    metode: string,
    totalBayar: number,
    kembalianAkhir: number
  ) => {
    setWaktuTransaksi(
      new Date().toLocaleString('id-ID', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    );

    setDetailBerhasil({
      metode,
      totalBayar,
      kembalian: kembalianAkhir,
    });

    setTahap('berhasil');
  };

  const handleBayarTunai = async () => {
    if (!uangCukup || menyimpan) {
      return;
    }

    const sukses = await simpanTransaksi(
      'Tunai',
      angkaUangDiterima,
      kembalian
    );

    if (!sukses) {
      return;
    }

    tampilkanStruk(
      'Tunai',
      angkaUangDiterima,
      kembalian
    );
  };

  const handleKonfirmasiNonTunai =
    async () => {
      if (
        !metodeTerpilih ||
        menyimpan ||
        grandTotal <= 0
      ) {
        return;
      }

      const namaMetode =
        metodeTerpilih.id === 'ewallet' &&
        providerAktif
          ? providerAktif.nama
          : metodeTerpilih.nama;

      const sukses = await simpanTransaksi(
        namaMetode,
        grandTotal,
        0
      );

      if (!sukses) {
        return;
      }

      tampilkanStruk(
        namaMetode,
        grandTotal,
        0
      );
    };

  const handleCetakStruk = () => {
    window.print();
  };

  const handleTransaksiBaru = () => {
    localStorage.removeItem(
      'keranjangAktif'
    );

    localStorage.removeItem(
      'transaksiAktif'
    );

    router.push('/transaksi');
  };

  const handleSelesai = () => {
    localStorage.removeItem(
      'keranjangAktif'
    );

    localStorage.removeItem(
      'transaksiAktif'
    );

    setItemBelanja([]);
    setPromo(null);
    setDiskon(0);
    setMetodeAktif(null);
    setUangDiterima('');
    setEwalletProvider(null);
    setEwalletTahap('pilih');
    setDetailBerhasil(null);
    setWaktuTransaksi('');
    setSimpanError('');
    setTahap('pilih');
  };

  return (
    <div className="wrapper">
      <SidebarKasir />

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <div className="store-icon">
              <Store
                size={19}
                color="#2f80ed"
              />
            </div>

            <div>
              <div className="store-name">
                Indomaret
              </div>

              <div className="store-sub">
                Kasir / Pembayaran
              </div>
            </div>
          </div>

          <div className="topbar-right">
            <button
              className="icon-btn"
              type="button"
            >
              <Bell
                size={18}
                color="#4b5875"
              />

              <span className="dot" />
            </button>

            <div className="user-block">
              <div className="avatar">
                <User
                  size={16}
                  color="#fff"
                />
              </div>

              <div>
                <div className="user-name">
                  {namaUser}
                </div>

                <div className="user-role">
                  Kasir
                </div>
              </div>

              <ChevronDown
                size={15}
                color="#8794ab"
              />
            </div>
          </div>
        </header>

        <main className="content">
          <div className="page-header">
            <div className="page-icon">
              <Wallet
                size={20}
                color="#2f80ed"
              />
            </div>

            <div>
              <h1>Pembayaran</h1>
              <p>
                Pilih metode pembayaran yang
                tersedia
              </p>
            </div>
          </div>

          <div
            className={`payment-grid ${
              tahap !== 'pilih'
                ? 'blur-belakang'
                : ''
            }`}
          >
            <div className="metode-panel">
              <div className="section-title">
                Metode Pembayaran
              </div>

              <div className="metode-grid">
                {metodeList.map(
                  ({
                    id,
                    nama,
                    Icon,
                    cardBg,
                    iconBg,
                    textColor,
                  }) => (
                    <button
                      key={id}
                      type="button"
                      className="metode-card-mini"
                      style={{
                        background: cardBg,
                        borderColor:
                          metodeAktif === id
                            ? textColor
                            : 'transparent',
                      }}
                      onClick={() =>
                        handlePilihMetode(id)
                      }
                    >
                      <div
                        className="metode-icon-mini"
                        style={{
                          background: iconBg,
                        }}
                      >
                        <Icon
                          size={20}
                          color="#fff"
                        />
                      </div>

                      <span
                        style={{
                          color: textColor,
                        }}
                      >
                        {nama}
                      </span>
                    </button>
                  )
                )}
              </div>

              <div className="promo-info-box">
                <div className="promo-icon">
                  <Tag
                    size={17}
                    color="#2f80ed"
                  />
                </div>

                <div>
                  <div className="promo-title">
                    {promo?.nama ||
                      'Tidak Ada Promo'}
                  </div>

                  <div className="promo-sub">
                    {promo
                      ? 'Promo sudah diterapkan dari transaksi'
                      : 'Tidak ada promo yang digunakan'}
                  </div>
                </div>
              </div>
            </div>

            <div className="ringkasan-panel">
              <div className="ringkasan-head">
                <div className="ringkasan-icon">
                  <ShoppingBag
                    size={19}
                    color="#fff"
                  />
                </div>

                <div>
                  <h2>
                    Ringkasan Belanja
                  </h2>

                  <p>
                    {jumlahItem} item
                  </p>
                </div>
              </div>

              <div className="item-list">
                {itemBelanja.length === 0 ? (
                  <div className="item-kosong">
                    Belum ada barang.
                    <br />
                    Silakan pilih produk
                    terlebih dahulu.
                  </div>
                ) : (
                  itemBelanja.map((item) => (
                    <div
                      className="item-row"
                      key={item.id}
                    >
                      <div className="item-thumb">
                        {item.gambar ? (
                          <img
                            src={item.gambar}
                            alt={item.nama}
                          />
                        ) : (
                          <ShoppingBag
                            size={18}
                            color="#9aa7bc"
                          />
                        )}
                      </div>

                      <div className="item-info">
                        <div className="item-nama">
                          {item.nama}
                        </div>

                        <div className="item-qty">
                          {item.qty} pcs
                        </div>
                      </div>

                      <div className="item-harga">
                        {formatRupiah(
                          item.harga *
                            item.qty
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="harga-box">
                <div className="harga-row">
                  <span>
                    Total Harga
                  </span>

                  <span>
                    {formatRupiah(
                      totalBelanja
                    )}
                  </span>
                </div>

                {diskon > 0 && (
                  <div className="harga-row diskon-row">
                    <span>
                      <Percent size={13} />
                      Diskon
                    </span>

                    <span>
                      -{formatRupiah(diskon)}
                    </span>
                  </div>
                )}

                <div className="harga-row harga-setelah">
                  <span>
                    Harga Setelah Diskon
                  </span>

                  <strong>
                    {formatRupiah(
                      grandTotal
                    )}
                  </strong>
                </div>
              </div>

              <div className="grand-total-box">
                <span>
                  Total Pembayaran
                </span>

                <strong>
                  {formatRupiah(
                    grandTotal
                  )}
                </strong>
              </div>

              <div className="hint-pilih-metode">
                <ArrowRight size={14} />
                Pilih metode pembayaran
                untuk melanjutkan.
              </div>
            </div>
          </div>

          {tahap !== 'pilih' && (
            <div className="modal-overlay">
              <div className="modal-box">
                {tahap === 'proses' &&
                  metodeTerpilih && (
                    <>
                      <div className="modal-header">
                        <div className="modal-title-row">
                          <div
                            className="modal-title-icon"
                            style={{
                              background:
                                metodeTerpilih.iconBg,
                            }}
                          >
                            <metodeTerpilih.Icon
                              size={15}
                              color="#fff"
                            />
                          </div>

                          <h2>
                            {metodeTerpilih.nama}
                          </h2>
                        </div>

                        <button
                          type="button"
                          className="modal-close"
                          onClick={
                            handleGantiMetode
                          }
                        >
                          <X
                            size={18}
                            color="#4b5875"
                          />
                        </button>
                      </div>

                      <div className="modal-body">
                        {simpanError && (
                          <div className="simpan-error">
                            {simpanError}
                          </div>
                        )}

                        {metodeTerpilih.id ===
                          'tunai' && (
                          <div className="tunai-box">
                            <div className="debit-header-row">
                              <div
                                className="debit-icon"
                                style={{
                                  background:
                                    '#27ae60',
                                }}
                              >
                                <Banknote
                                  size={18}
                                  color="#fff"
                                />
                              </div>

                              <div>
                                <div className="debit-nama">
                                  Pembayaran Tunai
                                </div>

                                <div className="debit-desc">
                                  Masukkan uang
                                  yang diterima
                                  pelanggan.
                                </div>
                              </div>
                            </div>

                            <div className="debit-total-box">
                              <span>
                                Total Pembayaran
                              </span>

                              <strong>
                                {formatRupiah(
                                  grandTotal
                                )}
                              </strong>
                            </div>

                            <label
                              className="tunai-label"
                              htmlFor="uangDiterima"
                            >
                              Uang Diterima
                            </label>

                            <div className="tunai-input-wrap">
                              <span className="tunai-input-prefix">
                                Rp
                              </span>

                              <input
                                id="uangDiterima"
                                type="text"
                                inputMode="numeric"
                                className="tunai-input"
                                placeholder="0"
                                value={
                                  uangDiterima
                                    ? Number(
                                        uangDiterima
                                      ).toLocaleString(
                                        'id-ID'
                                      )
                                    : ''
                                }
                                onChange={
                                  handleUangDiterimaChange
                                }
                              />
                            </div>

                            <div className="tunai-row">
                              <span>
                                Kembalian
                              </span>

                              <strong>
                                {formatRupiah(
                                  kembalian
                                )}
                              </strong>
                            </div>

                            <button
                              type="button"
                              className="btn-konfirmasi"
                              disabled={
                                !uangCukup ||
                                menyimpan
                              }
                              onClick={
                                handleBayarTunai
                              }
                            >
                              {menyimpan ? (
                                <Loader2
                                  size={16}
                                  className="spin"
                                />
                              ) : (
                                <CheckCircle2
                                  size={16}
                                />
                              )}

                              {menyimpan
                                ? 'Menyimpan...'
                                : 'Bayar'}
                            </button>

                            <button
                              type="button"
                              className="kembali-btn"
                              onClick={
                                handleGantiMetode
                              }
                            >
                              <ArrowLeft
                                size={13}
                              />
                              Kembali
                            </button>
                          </div>
                        )}

                        {metodeTerpilih.id ===
                          'qris' && (
                          <div className="qris-box">
                            <div className="qris-icon-row">
                              <div
                                className="qris-icon"
                                style={{
                                  background:
                                    '#2f80ed',
                                }}
                              >
                                <QrCode
                                  size={18}
                                  color="#fff"
                                />
                              </div>

                              <div>
                                <div className="qris-nama">
                                  QRIS
                                </div>

                                <div className="qris-desc">
                                  Scan QR untuk
                                  membayar.
                                </div>
                              </div>
                            </div>

                            <div className="qris-gambar-wrap">
                              <Image
                                src="/qris/scan-gb.png"
                                alt="QRIS"
                                fill
                                className="qris-gambar-img"
                              />
                            </div>

                            <div className="qris-total">
                              {formatRupiah(
                                grandTotal
                              )}
                            </div>

                            <div className="qris-countdown">
                              Menunggu pembayaran...
                              {' '}
                              {formatWaktu(
                                sisaWaktu
                              )}
                            </div>

                            <button
                              type="button"
                              className="btn-konfirmasi"
                              disabled={
                                menyimpan
                              }
                              onClick={
                                handleKonfirmasiNonTunai
                              }
                            >
                              {menyimpan ? (
                                <Loader2
                                  size={16}
                                  className="spin"
                                />
                              ) : (
                                <CheckCircle2
                                  size={16}
                                />
                              )}

                              {menyimpan
                                ? 'Menyimpan...'
                                : 'Konfirmasi Pembayaran'}
                            </button>

                            <button
                              type="button"
                              className="kembali-btn"
                              onClick={
                                handleGantiMetode
                              }
                            >
                              <ArrowLeft
                                size={13}
                              />
                              Kembali
                            </button>
                          </div>
                        )}

                        {metodeTerpilih.id ===
                          'debit' && (
                          <div className="debit-box">
                            <div className="debit-header-row">
                              <div
                                className="debit-icon"
                                style={{
                                  background:
                                    '#f5a742',
                                }}
                              >
                                <CreditCard
                                  size={18}
                                  color="#fff"
                                />
                              </div>

                              <div>
                                <div className="debit-nama">
                                  Debit
                                </div>

                                <div className="debit-desc">
                                  Lakukan pembayaran
                                  melalui mesin
                                  EDC.
                                </div>
                              </div>
                            </div>

                            <div className="debit-total-box">
                              <span>
                                Total Pembayaran
                              </span>

                              <strong>
                                {formatRupiah(
                                  grandTotal
                                )}
                              </strong>
                            </div>

                            <div className="debit-gambar-wrap">
                              <Image
                                src="/debit/gb-debit.png"
                                alt="Mesin EDC"
                                fill
                                className="debit-gambar-img"
                              />
                            </div>

                            <div className="qris-countdown">
                              Menunggu pembayaran...
                              {' '}
                              {formatWaktu(
                                sisaWaktu
                              )}
                            </div>

                            <button
                              type="button"
                              className="btn-konfirmasi"
                              disabled={
                                menyimpan
                              }
                              onClick={
                                handleKonfirmasiNonTunai
                              }
                            >
                              {menyimpan ? (
                                <Loader2
                                  size={16}
                                  className="spin"
                                />
                              ) : (
                                <CheckCircle2
                                  size={16}
                                />
                              )}

                              {menyimpan
                                ? 'Menyimpan...'
                                : 'Konfirmasi Pembayaran'}
                            </button>

                            <button
                              type="button"
                              className="kembali-btn"
                              onClick={
                                handleGantiMetode
                              }
                            >
                              <ArrowLeft
                                size={13}
                              />
                              Kembali
                            </button>
                          </div>
                        )}

                        {metodeTerpilih.id ===
                          'ewallet' &&
                          ewalletTahap ===
                            'pilih' && (
                            <div className="ewallet-box">
                              <div className="debit-header-row">
                                <div
                                  className="debit-icon"
                                  style={{
                                    background:
                                      '#8a5cf6',
                                  }}
                                >
                                  <Wallet
                                    size={18}
                                    color="#fff"
                                  />
                                </div>

                                <div>
                                  <div className="debit-nama">
                                    E-Wallet
                                  </div>

                                  <div className="debit-desc">
                                    Pilih e-wallet
                                    pelanggan.
                                  </div>
                                </div>
                              </div>

                              <div className="ewallet-grid">
                                {ewalletList.map(
                                  (
                                    provider
                                  ) => (
                                    <button
                                      key={
                                        provider.id
                                      }
                                      type="button"
                                      className="ewallet-pill"
                                      style={{
                                        borderColor:
                                          ewalletProvider ===
                                          provider.id
                                            ? provider.warna
                                            : 'transparent',
                                      }}
                                      onClick={() =>
                                        setEwalletProvider(
                                          provider.id
                                        )
                                      }
                                    >
                                      <Wallet
                                        size={
                                          15
                                        }
                                        color={
                                          provider.warna
                                        }
                                      />

                                      <span
                                        style={{
                                          color:
                                            provider.warna,
                                        }}
                                      >
                                        {
                                          provider.nama
                                        }
                                      </span>
                                    </button>
                                  )
                                )}
                              </div>

                              <div className="debit-total-box">
                                <span>
                                  Total Pembayaran
                                </span>

                                <strong>
                                  {formatRupiah(
                                    grandTotal
                                  )}
                                </strong>
                              </div>

                              <button
                                type="button"
                                className="btn-konfirmasi"
                                disabled={
                                  !ewalletProvider
                                }
                                onClick={() =>
                                  setEwalletTahap(
                                    'qr'
                                  )
                                }
                              >
                                Lanjutkan
                                <ArrowRight
                                  size={16}
                                />
                              </button>

                              <button
                                type="button"
                                className="kembali-btn"
                                onClick={
                                  handleGantiMetode
                                }
                              >
                                <ArrowLeft
                                  size={13}
                                />
                                Kembali
                              </button>
                            </div>
                          )}

                        {metodeTerpilih.id ===
                          'ewallet' &&
                          ewalletTahap ===
                            'qr' &&
                          providerAktif && (
                            <div className="qris-box">
                              <div className="qris-icon-row">
                                <div
                                  className="qris-icon"
                                  style={{
                                    background:
                                      providerAktif.warna,
                                  }}
                                >
                                  <Wallet
                                    size={18}
                                    color="#fff"
                                  />
                                </div>

                                <div>
                                  <div className="qris-nama">
                                    {
                                      providerAktif.nama
                                    }
                                  </div>

                                  <div className="qris-desc">
                                    Scan QR untuk
                                    melakukan
                                    pembayaran.
                                  </div>
                                </div>
                              </div>

                              <div className="qris-gambar-wrap">
                                <Image
                                  src="/qris/scan-gb.png"
                                  alt="QR E-Wallet"
                                  fill
                                  className="qris-gambar-img"
                                />
                              </div>

                              <div className="qris-total">
                                {formatRupiah(
                                  grandTotal
                                )}
                              </div>

                              <div className="qris-countdown">
                                Menunggu pembayaran...
                                {' '}
                                {formatWaktu(
                                  sisaWaktu
                                )}
                              </div>

                              <button
                                type="button"
                                className="btn-konfirmasi"
                                disabled={
                                  menyimpan
                                }
                                onClick={
                                  handleKonfirmasiNonTunai
                                }
                              >
                                {menyimpan ? (
                                  <Loader2
                                    size={16}
                                    className="spin"
                                  />
                                ) : (
                                  <CheckCircle2
                                    size={16}
                                  />
                                )}

                                {menyimpan
                                  ? 'Menyimpan...'
                                  : 'Bayar'}
                              </button>

                              <button
                                type="button"
                                className="kembali-btn"
                                onClick={() =>
                                  setEwalletTahap(
                                    'pilih'
                                  )
                                }
                              >
                                <ArrowLeft
                                  size={13}
                                />
                                Ganti E-Wallet
                              </button>
                            </div>
                          )}
                      </div>
                    </>
                  )}

                {tahap === 'berhasil' &&
                  detailBerhasil && (
                    <>
                      <div className="modal-header berhasil-header">
                        <h2>
                          Pembayaran Berhasil
                        </h2>
                      </div>

                      <div className="modal-body">
                        <div className="struk-box">
                          <div className="struk-logo">
                            <Store
                              size={22}
                            />
                          </div>

                          <h2>INDOMARET</h2>

                          <p className="struk-sub">
                            Struk Pembayaran
                          </p>

                          {waktuTransaksi && (
                            <p className="struk-waktu">
                              {waktuTransaksi}
                            </p>
                          )}

                          <div className="struk-line" />

                          <div className="struk-items">
                            {itemBelanja.map(
                              (item) => (
                                <div
                                  className="struk-item"
                                  key={item.id}
                                >
                                  <div>
                                    <strong>
                                      {item.nama}
                                    </strong>

                                    <span>
                                      {item.qty} x{' '}
                                      {formatRupiah(
                                        item.harga
                                      )}
                                    </span>
                                  </div>

                                  <strong>
                                    {formatRupiah(
                                      item.harga *
                                        item.qty
                                    )}
                                  </strong>
                                </div>
                              )
                            )}
                          </div>

                          <div className="struk-line" />

                          <div className="struk-row">
                            <span>
                              Total Harga
                            </span>

                            <span>
                              {formatRupiah(
                                totalBelanja
                              )}
                            </span>
                          </div>

                          {promo?.nama && (
                            <div className="struk-row promo-struk">
                              <span>
                                Promo
                              </span>

                              <span>
                                {promo.nama}
                              </span>
                            </div>
                          )}

                          {diskon > 0 && (
                            <div className="struk-row diskon-struk">
                              <span>
                                Diskon
                              </span>

                              <span>
                                -{formatRupiah(
                                  diskon
                                )}
                              </span>
                            </div>
                          )}

                          <div className="struk-row harga-setelah-struk">
                            <strong>
                              Harga Setelah Diskon
                            </strong>

                            <strong>
                              {formatRupiah(
                                grandTotal
                              )}
                            </strong>
                          </div>

                          <div className="struk-row">
                            <span>
                              Metode Pembayaran
                            </span>

                            <strong>
                              {
                                detailBerhasil.metode
                              }
                            </strong>
                          </div>

                          <div className="struk-row">
                            <span>
                              Dibayar
                            </span>

                            <span>
                              {formatRupiah(
                                detailBerhasil.totalBayar
                              )}
                            </span>
                          </div>

                          {detailBerhasil.metode ===
                            'Tunai' && (
                            <div className="struk-row">
                              <span>
                                Kembalian
                              </span>

                              <strong>
                                {formatRupiah(
                                  detailBerhasil.kembalian
                                )}
                              </strong>
                            </div>
                          )}

                          <div className="struk-line" />

                          <p className="terima-kasih">
                            Terima kasih telah
                            berbelanja
                          </p>

                          <button
                            type="button"
                            className="btn-cetak"
                            onClick={
                              handleCetakStruk
                            }
                          >
                            <Printer
                              size={16}
                            />
                            Cetak Struk
                          </button>

                          <button
                            type="button"
                            className="btn-transaksi-baru"
                            onClick={
                              handleTransaksiBaru
                            }
                          >
                            <RefreshCw
                              size={16}
                            />
                            Transaksi Baru
                          </button>

                          <button
                            type="button"
                            className="btn-selesai"
                            onClick={
                              handleSelesai
                            }
                          >
                            <CheckCircle2
                              size={16}
                            />
                            Selesai
                          </button>
                        </div>
                      </div>
                    </>
                  )}
              </div>
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        .wrapper {
          min-height: 100vh;
          display: flex;
          background: #f4f6fb;
          color: #16233d;
          font-family: 'Segoe UI',
            system-ui, sans-serif;
        }

        .main {
          flex: 1;
          min-width: 0;
        }

        .topbar {
          height: 62px;
          padding: 0 25px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #fff;
          border-bottom: 1px solid #eaeef5;
        }

        .topbar-left,
        .topbar-right,
        .user-block,
        .promo-info-box,
        .ringkasan-head,
        .modal-title-row,
        .debit-header-row,
        .qris-icon-row {
          display: flex;
          align-items: center;
        }

        .topbar-left {
          gap: 10px;
        }

        .topbar-right {
          gap: 18px;
        }

        .store-icon {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: #eaf2ff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .store-name {
          font-size: 13.5px;
          font-weight: 800;
          color: #10295c;
        }

        .store-sub,
        .user-role,
        .page-header p,
        .promo-sub,
        .ringkasan-head p,
        .debit-desc,
        .qris-desc {
          color: #8794ab;
        }

        .store-sub {
          font-size: 10.5px;
        }

        .icon-btn {
          position: relative;
          border: 0;
          background: none;
          cursor: pointer;
        }

        .dot {
          position: absolute;
          top: -1px;
          right: -1px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #e2231a;
        }

        .user-block {
          gap: 8px;
        }

        .avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #10295c;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-name {
          font-size: 12.5px;
          font-weight: 700;
        }

        .user-role {
          font-size: 10.5px;
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
        }

        .page-header h1 {
          margin: 0 0 2px;
          font-size: 21px;
          font-weight: 800;
          color: #10295c;
        }

        .page-header p {
          margin: 0;
          font-size: 12px;
        }

        .payment-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 18px;
          max-width: 1080px;
          align-items: start;
        }

        .metode-panel,
        .ringkasan-panel {
          background: #fff;
          border: 1px solid #eef1f8;
          border-radius: 18px;
          padding: 18px;
          box-shadow: 0 10px 24px
            rgba(16, 41, 92, 0.06);
        }

        .blur-belakang {
          filter: blur(2px);
          pointer-events: none;
        }

        .section-title {
          margin-bottom: 13px;
          font-size: 13px;
          font-weight: 800;
          color: #10295c;
        }

        .metode-grid {
          display: grid;
          grid-template-columns: repeat(
            4,
            1fr
          );
          gap: 12px;
        }

        .metode-card-mini {
          padding: 18px 10px;
          border: 1.5px solid
            transparent;
          border-radius: 14px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 9px;
          transition: 0.18s;
        }

        .metode-card-mini:hover {
          transform: translateY(-2px);
        }

        .metode-card-mini span {
          font-size: 12.5px;
          font-weight: 800;
        }

        .metode-icon-mini {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .promo-info-box {
          gap: 12px;
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid #f0f2f8;
        }

        .promo-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #e7f1ff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .promo-title {
          font-size: 13px;
          font-weight: 800;
          color: #10295c;
        }

        .promo-sub {
          margin-top: 2px;
          font-size: 11px;
        }

        .ringkasan-head {
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
        }

        .ringkasan-head h2 {
          margin: 0 0 2px;
          font-size: 16px;
          color: #10295c;
        }

        .ringkasan-head p {
          margin: 0;
          font-size: 11px;
        }

        .item-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 15px;
        }

        .item-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          background: #f8fafd;
          border-radius: 12px;
        }

        .item-thumb {
          width: 44px;
          height: 44px;
          border-radius: 9px;
          background: #fff;
          overflow: hidden;
          flex-shrink: 0;
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
          font-size: 12.5px;
          font-weight: 800;
          color: #10295c;
        }

        .item-qty {
          font-size: 10.5px;
          color: #8794ab;
        }

        .item-harga {
          font-size: 12.5px;
          font-weight: 800;
          color: #10295c;
        }

        .item-kosong {
          padding: 20px 8px;
          text-align: center;
          border-radius: 12px;
          background: #f8fafd;
          color: #8794ab;
          font-size: 11px;
        }

        .harga-box {
          padding: 14px;
          background: #eaf2ff;
          border-radius: 13px;
        }

        .harga-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 9px;
          font-size: 11.5px;
          font-weight: 700;
          color: #4b5875;
        }

        .harga-row:last-child {
          margin-bottom: 0;
        }

        .diskon-row {
          color: #27ae60;
        }

        .diskon-row span:first-child {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .harga-setelah {
          margin-top: 9px;
          padding-top: 11px;
          border-top: 1px dashed
            #c8d9ef;
          color: #10295c;
        }

        .harga-setelah strong {
          font-size: 15px;
          color: #10295c;
        }

        .grand-total-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 3px 11px;
          color: #10295c;
          font-weight: 800;
        }

        .grand-total-box strong {
          font-size: 19px;
        }

        .hint-pilih-metode {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 12px;
          border-radius: 10px;
          background: #f8fafd;
          color: #8794ab;
          font-size: 11px;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(
            10,
            20,
            45,
            0.55
          );
          backdrop-filter: blur(3px);
        }

        .modal-box {
          width: 100%;
          max-width: 440px;
          max-height: 90vh;
          overflow-y: auto;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 24px 60px
            rgba(8, 15, 35, 0.35);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px 5px;
        }

        .modal-title-row {
          gap: 8px;
        }

        .modal-title-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 17px;
          color: #10295c;
        }

        .modal-close {
          width: 30px;
          height: 30px;
          border: 0;
          border-radius: 9px;
          background: #f1f4f9;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-body {
          padding: 18px 20px 20px;
        }

        .simpan-error {
          margin-bottom: 12px;
          padding: 10px;
          border-radius: 9px;
          background: #fdecea;
          color: #c0392b;
          font-size: 11px;
          font-weight: 600;
        }

        .debit-box,
        .ewallet-box {
          border: 1px solid #eef1f8;
          border-radius: 14px;
          overflow: hidden;
        }

        .tunai-box {
          background: #f3fbf6;
          border-radius: 14px;
          overflow: hidden;
        }

        .debit-header-row {
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
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
        }

        .debit-desc {
          margin-top: 3px;
          font-size: 11px;
          line-height: 1.4;
        }

        .debit-total-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 13px 16px;
          background: #f4f7fc;
          font-size: 11px;
          color: #4b5875;
        }

        .debit-total-box strong {
          font-size: 19px;
          color: #10295c;
        }

        .tunai-label {
          display: block;
          margin: 14px 14px 5px;
          font-size: 11px;
          font-weight: 700;
          color: #4b5875;
        }

        .tunai-input-wrap {
          position: relative;
          margin: 0 14px 8px;
        }

        .tunai-input-prefix {
          position: absolute;
          top: 50%;
          left: 12px;
          transform: translateY(-50%);
          font-size: 13px;
          font-weight: 700;
          color: #6b95c4;
        }

        .tunai-input {
          width: 100%;
          box-sizing: border-box;
          padding: 11px 12px 11px 34px;
          border: 1.5px solid #cfe9d9;
          border-radius: 9px;
          outline: none;
          font-size: 14px;
          background: #fff;
        }

        .tunai-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 0 14px 12px;
          padding: 9px 11px;
          border-radius: 9px;
          background: #fff;
          font-size: 12px;
          font-weight: 700;
          color: #4b5875;
        }

        .tunai-row strong {
          color: #27ae60;
        }

        .btn-konfirmasi {
          width: calc(100% - 28px);
          margin: 0 14px 12px;
          padding: 12px;
          border: 0;
          border-radius: 11px;
          background: #2f80ed;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }

        .btn-konfirmasi:hover:not(:disabled) {
          background: #1c67cf;
        }

        .btn-konfirmasi:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .kembali-btn {
          width: 100%;
          padding: 0 15px 15px;
          border: 0;
          background: none;
          color: #4b5875;
          cursor: pointer;
          font-size: 11.5px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .qris-box {
          padding: 16px;
          background: #eaf3ff;
          border-radius: 14px;
        }

        .qris-icon-row {
          align-items: flex-start;
          gap: 10px;
        }

        .qris-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qris-nama {
          font-size: 13px;
          font-weight: 800;
          color: #10295c;
        }

        .qris-desc {
          margin-top: 2px;
          font-size: 10.5px;
        }

        .qris-gambar-wrap {
          position: relative;
          width: 160px;
          height: 160px;
          margin: 14px auto;
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
        }

        .qris-gambar-img {
          object-fit: contain;
          padding: 8px;
        }

        .qris-total {
          padding: 9px;
          border-radius: 9px;
          background: #fff;
          text-align: center;
          font-size: 18px;
          font-weight: 800;
          color: #10295c;
        }

        .qris-countdown {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin: 10px 0;
          padding: 9px;
          border-radius: 9px;
          background: #fff;
          color: #2f80ed;
          font-size: 11.5px;
          font-weight: 700;
        }

        .debit-gambar-wrap {
          position: relative;
          width: 100%;
          height: 150px;
        }

        .debit-gambar-img {
          object-fit: contain;
        }

        .ewallet-grid {
          display: grid;
          grid-template-columns: repeat(
            2,
            1fr
          );
          gap: 9px;
          padding: 0 16px 14px;
        }

        .ewallet-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px;
          border: 1.5px solid
            transparent;
          border-radius: 10px;
          background: #f8fafd;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
        }

        .ewallet-box
          .debit-total-box {
          margin: 0 16px 14px;
          border-radius: 10px;
        }

        .ewallet-box
          .btn-konfirmasi {
          width: calc(100% - 32px);
          margin: 0 16px 12px;
        }

        .struk-box {
          padding: 20px;
          background: #fff;
          text-align: center;
        }

        .struk-logo {
          width: 46px;
          height: 46px;
          margin: 0 auto 7px;
          border-radius: 12px;
          background: #e7f1ff;
          color: #2f80ed;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .struk-box > h2 {
          margin: 0;
          font-size: 17px;
          color: #10295c;
          letter-spacing: 0.5px;
        }

        .struk-sub {
          margin: 3px 0 2px;
          font-size: 10.5px;
          color: #8794ab;
        }

        .struk-waktu {
          margin: 0 0 14px;
          font-size: 9.5px;
          color: #9aa6b9;
        }

        .struk-line {
          border-top: 1px dashed #cfd6e2;
          margin: 12px 0;
        }

        .struk-item {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 10px;
          text-align: left;
          font-size: 11px;
        }

        .struk-item div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .struk-item span {
          color: #8794ab;
        }

        .struk-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          text-align: left;
          margin: 8px 0;
          font-size: 11px;
          color: #4b5875;
        }

        .struk-row strong {
          color: #10295c;
        }

        .promo-struk {
          color: #2f80ed;
        }

        .diskon-struk {
          color: #27ae60;
        }

        .harga-setelah-struk {
          padding: 9px 0;
          border-top: 1px dashed #d5dce7;
          border-bottom: 1px dashed #d5dce7;
        }

        .terima-kasih {
          margin: 14px 0;
          font-size: 10.5px;
          color: #8794ab;
        }

        .btn-cetak,
        .btn-transaksi-baru,
        .btn-selesai {
          width: 100%;
          padding: 11px;
          border: 0;
          border-radius: 11px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }

        .btn-cetak {
          background: #e7f1ff;
          color: #1c5aa8;
          margin-bottom: 9px;
        }

        .btn-transaksi-baru {
          background: #2f80ed;
          color: #fff;
        }

        .btn-selesai {
          margin-top: 9px;
          background: #f1f4f9;
          color: #4b5875;
        }

        .spin {
          animation: spin 0.8s linear
            infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media print {
          body * {
            visibility: hidden !important;
          }

          .struk-box,
          .struk-box * {
            visibility: visible !important;
          }

          .struk-box {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            max-width: 80mm;
            padding: 8mm;
            box-shadow: none;
            border-radius: 0;
          }

          .btn-cetak,
          .btn-transaksi-baru,
          .btn-selesai {
            display: none !important;
          }
        }

        @media (max-width: 1000px) {
          .payment-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 620px) {
          .metode-grid {
            grid-template-columns: repeat(
              2,
              1fr
            );
          }

          .content {
            padding: 18px;
          }
        }
      `}</style>
    </div>
  );
}