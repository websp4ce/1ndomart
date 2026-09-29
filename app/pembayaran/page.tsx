'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import SidebarKasir from '../components/SidebarKasir';
import {
  Store, Bell, User, ChevronDown, Wallet, Banknote, QrCode,
  CreditCard, ShoppingBag, Percent, ArrowLeft, ArrowRight,
  CheckCircle2, Printer, RefreshCw, X, Loader2, Tag
} from 'lucide-react';

type MetodeId = 'tunai' | 'qris' | 'debit' | 'ewallet';

type Item = {
  id: string;
  nama: string;
  harga: number;
  qty: number;
  gambar?: string;
};

type Promo = {
  nama?: string;
  persen?: number;
  diskon?: number;
};

type Transaksi = {
  items?: Item[];
  keranjang?: Item[];
  promo?: Promo | null;
  promoTerpilih?: Promo | null;
  selectedPromo?: Promo | null;
  diskon?: number;
};

type Detail = {
  metode: string;
  totalBayar: number;
  kembalian: number;
};

const metode = [
  { id: 'tunai' as const, nama: 'Tunai', Icon: Banknote, bg: '#eafaf1', color: '#27ae60' },
  { id: 'qris' as const, nama: 'QRIS', Icon: QrCode, bg: '#eaf3ff', color: '#2f80ed' },
  { id: 'debit' as const, nama: 'Debit', Icon: CreditCard, bg: '#fff2e5', color: '#f5a742' },
  { id: 'ewallet' as const, nama: 'E-Wallet', Icon: Wallet, bg: '#f3edff', color: '#8a5cf6' },
];

const ewallet = [
  { id: 'gopay', nama: 'GoPay', warna: '#00aed6' },
  { id: 'dana', nama: 'DANA', warna: '#118eea' },
  { id: 'ovo', nama: 'OVO', warna: '#4c3494' },
  { id: 'shopeepay', nama: 'ShopeePay', warna: '#ee4d2d' },
];

const rupiah = (n: number) =>
  'Rp ' + Number(n || 0).toLocaleString('id-ID');

const waktu = (detik: number) =>
  `${String(Math.floor(detik / 60)).padStart(2, '0')}:${String(
    detik % 60
  ).padStart(2, '0')}`;

export default function PembayaranPage() {
  const router = useRouter();

  const [namaUser, setNamaUser] = useState('Kasir');
  const [kasirId, setKasirId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [promo, setPromo] = useState<Promo | null>(null);
  const [diskon, setDiskon] = useState(0);
  const [metodeAktif, setMetodeAktif] = useState<MetodeId | null>(null);
  const [tahap, setTahap] = useState<'pilih' | 'proses' | 'berhasil'>('pilih');
  const [uang, setUang] = useState('');
  const [detail, setDetail] = useState<Detail | null>(null);
  const [waktuTransaksi, setWaktuTransaksi] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState<string | null>(null);
  const [ewalletTahap, setEwalletTahap] = useState<'pilih' | 'qr'>('pilih');
  const [timer, setTimer] = useState(300);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('indomart_user') || '{}');
      if (user.nama) setNamaUser(user.nama);
      if (user.email) setKasirId(user.email);

      const transaksi: Transaksi = JSON.parse(
        localStorage.getItem('transaksiAktif') || '{}'
      );

      const keranjang = JSON.parse(
        localStorage.getItem('keranjangAktif') || '[]'
      );

      const data = transaksi.items || transaksi.keranjang || keranjang;
      setItems(Array.isArray(data) ? data : []);

      const p =
        transaksi.promo ||
        transaksi.promoTerpilih ||
        transaksi.selectedPromo ||
        null;

      setPromo(p);

      const total = (data || []).reduce(
        (a: number, i: Item) => a + Number(i.harga) * Number(i.qty),
        0
      );

      let d = Number(transaksi.diskon || 0);

      if (!d && p) {
        const persen = Number(p.persen ?? p.diskon ?? 0);
        if (persen > 0) d = Math.round((total * persen) / 100);
      }

      setDiskon(Math.min(Math.max(d, 0), total));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const total = items.reduce(
    (a, i) => a + Number(i.harga) * Number(i.qty),
    0
  );

  const grandTotal = Math.max(total - diskon, 0);
  const uangDiterima = Number(uang) || 0;
  const kembalian = Math.max(uangDiterima - grandTotal, 0);

  const metodeDipilih = metode.find((m) => m.id === metodeAktif);
  const providerDipilih = ewallet.find((e) => e.id === provider);

  useEffect(() => {
    if (tahap !== 'proses' || metodeAktif === 'tunai') return;

    setTimer(300);
    const t = setInterval(() => {
      setTimer((x) => (x > 0 ? x - 1 : 0));
    }, 1000);

    return () => clearInterval(t);
  }, [tahap, metodeAktif]);

  const pilihMetode = (id: MetodeId) => {
    setMetodeAktif(id);
    setUang('');
    setProvider(null);
    setEwalletTahap('pilih');
    setError('');
    setTahap('proses');
  };

  const kembali = () => {
    setMetodeAktif(null);
    setUang('');
    setProvider(null);
    setEwalletTahap('pilih');
    setError('');
    setTahap('pilih');
  };

  const simpan = async (
    metodeBayar: string,
    dibayar: number,
    kembaliBayar: number
  ) => {
    if (!kasirId) {
      setError('Data kasir tidak ditemukan. Silakan login ulang.');
      return false;
    }

    if (!items.length) {
      setError('Keranjang belanja masih kosong.');
      return false;
    }

    setMenyimpan(true);
    setError('');

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kasirId,
          items: items.map((i) => ({
            id: i.id,
            nama: i.nama,
            harga: Number(i.harga),
            qty: Number(i.qty),
          })),
          diskon,
          kodePromo: promo?.nama || null,
          metode: metodeBayar,
          jumlahDibayar: dibayar,
          kembalian: kembaliBayar,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || 'Gagal menyimpan transaksi.');
        return false;
      }

      return true;
    } catch {
      setError('Terjadi kesalahan koneksi saat menyimpan transaksi.');
      return false;
    } finally {
      setMenyimpan(false);
    }
  };

  const berhasil = (
    metodeBayar: string,
    dibayar: number,
    kembaliBayar: number
  ) => {
    setWaktuTransaksi(
      new Date().toLocaleString('id-ID', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    );

    setDetail({
      metode: metodeBayar,
      totalBayar: dibayar,
      kembalian: kembaliBayar,
    });

    setTahap('berhasil');
  };

  const bayarTunai = async () => {
    if (uangDiterima < grandTotal || menyimpan) return;

    const ok = await simpan('Tunai', uangDiterima, kembalian);

    if (ok) berhasil('Tunai', uangDiterima, kembalian);
  };

  const bayarNonTunai = async () => {
    if (!metodeDipilih || menyimpan || grandTotal <= 0) return;

    const nama =
      metodeAktif === 'ewallet' && providerDipilih
        ? providerDipilih.nama
        : metodeDipilih.nama;

    const ok = await simpan(nama, grandTotal, 0);

    if (ok) berhasil(nama, grandTotal, 0);
  };

  /* CETAK KHUSUS STRUK */
  const cetakStruk = () => {
    if (!detail) return;

    const isi = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk INDOMARET</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 7mm 5mm;
            width: 80mm;
            font-family: Arial, Helvetica, sans-serif;
            color: #111;
            background: #fff;
            font-size: 11px;
          }

          .center {
            text-align: center;
          }

          .logo {
            width: 38px;
            height: 38px;
            margin: 0 auto 6px;
            border-radius: 8px;
            background: #eaf2ff;
            color: #2f80ed;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
          }

          h1 {
            margin: 0;
            font-size: 17px;
            letter-spacing: .5px;
          }

          .sub {
            margin-top: 3px;
            color: #666;
            font-size: 10px;
          }

          .line {
            border-top: 1px dashed #aaa;
            margin: 12px 0;
          }

          .item {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            margin: 0 0 8px;
          }

          .item-left {
            min-width: 0;
          }

          .nama {
            font-weight: bold;
            font-size: 11px;
          }

          .qty {
            margin-top: 3px;
            color: #777;
            font-size: 10px;
          }

          .harga {
            white-space: nowrap;
            font-weight: bold;
          }

          .row {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            margin: 7px 0;
          }

          .bold {
            font-weight: bold;
          }

          .green {
            color: #198754;
          }

          .thanks {
            margin-top: 14px;
            text-align: center;
            color: #777;
            font-size: 10px;
          }
        </style>
      </head>

      <body>
        <div class="center">
          <div class="logo">⌂</div>
          <h1>INDOMARET</h1>
          <div class="sub">Struk Pembayaran</div>
          <div class="sub">${waktuTransaksi}</div>
        </div>

        <div class="line"></div>

        ${items
          .map(
            (item) => `
              <div class="item">
                <div class="item-left">
                  <div class="nama">${item.nama}</div>
                  <div class="qty">
                    ${item.qty} x ${rupiah(item.harga)}
                  </div>
                </div>

                <div class="harga">
                  ${rupiah(item.harga * item.qty)}
                </div>
              </div>
            `
          )
          .join('')}

        <div class="line"></div>

        <div class="row">
          <span>Total Harga</span>
          <span>${rupiah(total)}</span>
        </div>

        ${
          diskon > 0
            ? `
              <div class="row green">
                <span>Diskon</span>
                <span>-${rupiah(diskon)}</span>
              </div>
            `
            : ''
        }

        ${
          promo?.nama
            ? `
              <div class="row">
                <span>Promo</span>
                <span>${promo.nama}</span>
              </div>
            `
            : ''
        }

        <div class="line"></div>

        <div class="row bold">
          <span>Harga Setelah Diskon</span>
          <span>${rupiah(grandTotal)}</span>
        </div>

        <div class="row">
          <span>Metode Pembayaran</span>
          <span class="bold">${detail.metode}</span>
        </div>

        <div class="row">
          <span>Dibayar</span>
          <span>${rupiah(detail.totalBayar)}</span>
        </div>

        ${
          detail.metode === 'Tunai'
            ? `
              <div class="row">
                <span>Kembalian</span>
                <span class="bold">${rupiah(detail.kembalian)}</span>
              </div>
            `
            : ''
        }

        <div class="line"></div>

        <div class="thanks">
          Terima kasih telah berbelanja
        </div>

        <script>
          window.onload = function () {
            window.print();
            setTimeout(function () {
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    const win = window.open('', '_blank', 'width=400,height=700');

    if (!win) {
      alert('Popup diblokir browser. Izinkan popup untuk mencetak struk.');
      return;
    }

    win.document.open();
    win.document.write(isi);
    win.document.close();
  };

  const transaksiBaru = () => {
    localStorage.removeItem('keranjangAktif');
    localStorage.removeItem('transaksiAktif');
    router.push('/transaksi');
  };

  const selesai = () => {
    localStorage.removeItem('keranjangAktif');
    localStorage.removeItem('transaksiAktif');

    setItems([]);
    setPromo(null);
    setDiskon(0);
    setMetodeAktif(null);
    setUang('');
    setProvider(null);
    setDetail(null);
    setTahap('pilih');
  };

  return (
    <div className="wrapper">
      <SidebarKasir />

      <div className="main">
        <header className="topbar">
          <div className="top-left">
            <div className="store-icon">
              <Store size={19} color="#2f80ed" />
            </div>
            <div>
              <b>Indomaret</b>
              <small>Kasir / Pembayaran</small>
            </div>
          </div>

          <div className="top-right">
            <button className="icon-btn">
              <Bell size={18} />
              <i />
            </button>

            <div className="user">
              <div className="avatar">
                <User size={16} color="#fff" />
              </div>
              <div>
                <b>{namaUser}</b>
                <small>Kasir</small>
              </div>
              <ChevronDown size={15} />
            </div>
          </div>
        </header>

        <main className="content">
          <div className="page-title">
            <div className="title-icon">
              <Wallet size={20} color="#2f80ed" />
            </div>
            <div>
              <h1>Pembayaran</h1>
              <p>Pilih metode pembayaran yang tersedia</p>
            </div>
          </div>

          <div className={`grid ${tahap !== 'pilih' ? 'blur' : ''}`}>
            <section className="panel">
              <h3>Metode Pembayaran</h3>

              <div className="methods">
                {metode.map((m) => (
                  <button
                    key={m.id}
                    className="method"
                    style={{
                      background: m.bg,
                      borderColor:
                        metodeAktif === m.id ? m.color : 'transparent',
                    }}
                    onClick={() => pilihMetode(m.id)}
                  >
                    <span style={{ background: m.color }}>
                      <m.Icon size={20} color="#fff" />
                    </span>
                    <b style={{ color: m.color }}>{m.nama}</b>
                  </button>
                ))}
              </div>

              <div className="promo">
                <div className="promo-icon">
                  <Tag size={17} color="#2f80ed" />
                </div>
                <div>
                  <b>{promo?.nama || 'Tidak Ada Promo'}</b>
                  <small>
                    {promo
                      ? 'Promo sudah diterapkan dari transaksi'
                      : 'Tidak ada promo yang digunakan'}
                  </small>
                </div>
              </div>
            </section>

            <section className="panel summary">
              <div className="summary-title">
                <div className="bag">
                  <ShoppingBag size={19} color="#fff" />
                </div>
                <div>
                  <h2>Ringkasan Belanja</h2>
                  <p>{items.reduce((a, i) => a + Number(i.qty), 0)} item</p>
                </div>
              </div>

              <div className="items">
                {items.length ? (
                  items.map((item) => (
                    <div className="item" key={item.id}>
                      <div className="thumb">
                        {item.gambar ? (
                          <img src={item.gambar} alt="" />
                        ) : (
                          <ShoppingBag size={18} color="#9aa7bc" />
                        )}
                      </div>
                      <div className="item-info">
                        <b>{item.nama}</b>
                        <small>{item.qty} pcs</small>
                      </div>
                      <strong>{rupiah(item.harga * item.qty)}</strong>
                    </div>
                  ))
                ) : (
                  <div className="empty">Belum ada barang.</div>
                )}
              </div>

              <div className="price-box">
                <div>
                  <span>Total Harga</span>
                  <span>{rupiah(total)}</span>
                </div>

                {diskon > 0 && (
                  <div className="discount">
                    <span>
                      <Percent size={13} /> Diskon
                    </span>
                    <span>-{rupiah(diskon)}</span>
                  </div>
                )}

                <div className="after">
                  <b>Harga Setelah Diskon</b>
                  <strong>{rupiah(grandTotal)}</strong>
                </div>
              </div>

              <div className="grand">
                <b>Total Pembayaran</b>
                <strong>{rupiah(grandTotal)}</strong>
              </div>

              <div className="hint">
                <ArrowRight size={14} />
                Pilih metode pembayaran untuk melanjutkan.
              </div>
            </section>
          </div>

          {tahap !== 'pilih' && (
            <div className="overlay">
              <div className="modal">
                {tahap === 'proses' && metodeDipilih && (
                  <>
                    <div className="modal-head">
                      <div className="modal-title">
                        <span style={{ background: metodeDipilih.color }}>
                          <metodeDipilih.Icon size={15} color="#fff" />
                        </span>
                        <h2>{metodeDipilih.nama}</h2>
                      </div>
                      <button onClick={kembali}>
                        <X size={18} />
                      </button>
                    </div>

                    <div className="modal-body">
                      {error && <div className="error">{error}</div>}

                      {metodeAktif === 'tunai' && (
                        <div className="cash">
                          <div className="cash-head">
                            <Banknote size={20} color="#27ae60" />
                            <div>
                              <b>Pembayaran Tunai</b>
                              <small>Masukkan uang yang diterima pelanggan.</small>
                            </div>
                          </div>

                          <div className="total-modal">
                            <span>Total Pembayaran</span>
                            <strong>{rupiah(grandTotal)}</strong>
                          </div>

                          <label>Uang Diterima</label>

                          <div className="money-input">
                            <span>Rp</span>
                            <input
                              value={
                                uang
                                  ? Number(uang).toLocaleString('id-ID')
                                  : ''
                              }
                              inputMode="numeric"
                              placeholder="0"
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                setUang(e.target.value.replace(/\D/g, ''))
                              }
                            />
                          </div>

                          <div className="change">
                            <span>Kembalian</span>
                            <strong>{rupiah(kembalian)}</strong>
                          </div>

                          <button
                            className="primary"
                            disabled={uangDiterima < grandTotal || menyimpan}
                            onClick={bayarTunai}
                          >
                            {menyimpan ? (
                              <Loader2 className="spin" size={16} />
                            ) : (
                              <CheckCircle2 size={16} />
                            )}
                            {menyimpan ? 'Menyimpan...' : 'Bayar'}
                          </button>

                          <button className="back" onClick={kembali}>
                            <ArrowLeft size={13} /> Kembali
                          </button>
                        </div>
                      )}

                      {metodeAktif === 'qris' && (
                        <div className="qris">
                          <b>QRIS</b>
                          <small>Scan QR untuk membayar.</small>

                          <div className="qr-img">
                            <Image
                              src="/qris/scan-gb.png"
                              alt="QRIS"
                              fill
                              className="object"
                            />
                          </div>

                          <strong>{rupiah(grandTotal)}</strong>

                          <div className="waiting">
                            Menunggu pembayaran... {waktu(timer)}
                          </div>

                          <button
                            className="primary"
                            onClick={bayarNonTunai}
                            disabled={menyimpan}
                          >
                            {menyimpan ? 'Menyimpan...' : 'Konfirmasi Pembayaran'}
                          </button>

                          <button className="back" onClick={kembali}>
                            <ArrowLeft size={13} /> Kembali
                          </button>
                        </div>
                      )}

                      {metodeAktif === 'debit' && (
                        <div className="qris">
                          <b>Debit</b>
                          <small>Lakukan pembayaran melalui mesin EDC.</small>

                          <div className="total-modal">
                            <span>Total Pembayaran</span>
                            <strong>{rupiah(grandTotal)}</strong>
                          </div>

                          <div className="debit-img">
                            <Image
                              src="/debit/gb-debit.png"
                              alt="EDC"
                              fill
                              className="object"
                            />
                          </div>

                          <div className="waiting">
                            Menunggu pembayaran... {waktu(timer)}
                          </div>

                          <button
                            className="primary"
                            onClick={bayarNonTunai}
                            disabled={menyimpan}
                          >
                            {menyimpan ? 'Menyimpan...' : 'Konfirmasi Pembayaran'}
                          </button>

                          <button className="back" onClick={kembali}>
                            <ArrowLeft size={13} /> Kembali
                          </button>
                        </div>
                      )}

                      {metodeAktif === 'ewallet' && ewalletTahap === 'pilih' && (
                        <div className="ewallet">
                          <b>E-Wallet</b>
                          <small>Pilih e-wallet pelanggan.</small>

                          <div className="wallet-grid">
                            {ewallet.map((e) => (
                              <button
                                key={e.id}
                                className="wallet"
                                style={{
                                  borderColor:
                                    provider === e.id ? e.warna : 'transparent',
                                }}
                                onClick={() => setProvider(e.id)}
                              >
                                <Wallet size={15} color={e.warna} />
                                <span style={{ color: e.warna }}>
                                  {e.nama}
                                </span>
                              </button>
                            ))}
                          </div>

                          <div className="total-modal">
                            <span>Total Pembayaran</span>
                            <strong>{rupiah(grandTotal)}</strong>
                          </div>

                          <button
                            className="primary"
                            disabled={!provider}
                            onClick={() => setEwalletTahap('qr')}
                          >
                            Lanjutkan <ArrowRight size={16} />
                          </button>

                          <button className="back" onClick={kembali}>
                            <ArrowLeft size={13} /> Kembali
                          </button>
                        </div>
                      )}

                      {metodeAktif === 'ewallet' &&
                        ewalletTahap === 'qr' &&
                        providerDipilih && (
                          <div className="qris">
                            <b>{providerDipilih.nama}</b>
                            <small>Scan QR untuk melakukan pembayaran.</small>

                            <div className="qr-img">
                              <Image
                                src="/qris/scan-gb.png"
                                alt="QR"
                                fill
                                className="object"
                              />
                            </div>

                            <strong>{rupiah(grandTotal)}</strong>

                            <div className="waiting">
                              Menunggu pembayaran... {waktu(timer)}
                            </div>

                            <button
                              className="primary"
                              onClick={bayarNonTunai}
                              disabled={menyimpan}
                            >
                              {menyimpan ? 'Menyimpan...' : 'Bayar'}
                            </button>

                            <button
                              className="back"
                              onClick={() => setEwalletTahap('pilih')}
                            >
                              <ArrowLeft size={13} /> Ganti E-Wallet
                            </button>
                          </div>
                        )}
                    </div>
                  </>
                )}

                {tahap === 'berhasil' && detail && (
                  <>
                    <div className="success-head">
                      <CheckCircle2 size={24} color="#27ae60" />
                      <h2>Pembayaran Berhasil</h2>
                    </div>

                    <div className="receipt">
                      <div className="receipt-logo">
                        <Store size={23} />
                      </div>

                      <h2>INDOMARET</h2>
                      <p>Struk Pembayaran</p>
                      <small>{waktuTransaksi}</small>

                      <div className="receipt-line" />

                      {items.map((item) => (
                        <div className="receipt-item" key={item.id}>
                          <div>
                            <b>{item.nama}</b>
                            <small>
                              {item.qty} x {rupiah(item.harga)}
                            </small>
                          </div>
                          <b>{rupiah(item.harga * item.qty)}</b>
                        </div>
                      ))}

                      <div className="receipt-line" />

                      <div className="receipt-row">
                        <span>Total Harga</span>
                        <span>{rupiah(total)}</span>
                      </div>

                      {diskon > 0 && (
                        <div className="receipt-row green">
                          <span>Diskon</span>
                          <span>-{rupiah(diskon)}</span>
                        </div>
                      )}

                      <div className="receipt-row bold">
                        <span>Harga Setelah Diskon</span>
                        <span>{rupiah(grandTotal)}</span>
                      </div>

                      <div className="receipt-row">
                        <span>Metode Pembayaran</span>
                        <b>{detail.metode}</b>
                      </div>

                      <div className="receipt-row">
                        <span>Dibayar</span>
                        <span>{rupiah(detail.totalBayar)}</span>
                      </div>

                      {detail.metode === 'Tunai' && (
                        <div className="receipt-row">
                          <span>Kembalian</span>
                          <b>{rupiah(detail.kembalian)}</b>
                        </div>
                      )}

                      <div className="receipt-line" />

                      <p className="thanks">
                        Terima kasih telah berbelanja
                      </p>

                      <button className="print-btn" onClick={cetakStruk}>
                        <Printer size={16} /> Cetak Struk
                      </button>

                      <button className="new-btn" onClick={transaksiBaru}>
                        <RefreshCw size={16} /> Transaksi Baru
                      </button>

                      <button className="done-btn" onClick={selesai}>
                        <CheckCircle2 size={16} /> Selesai
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        * { box-sizing:border-box; }
        .wrapper{min-height:100vh;display:flex;background:#f4f6fb;color:#16233d;font-family:Segoe UI,system-ui,sans-serif}
        .main{flex:1;min-width:0}
        .topbar{height:62px;padding:0 25px;background:#fff;border-bottom:1px solid #eaeef5;display:flex;justify-content:space-between;align-items:center}
        .top-left,.top-right,.user,.page-title,.summary-title,.promo,.modal-title{display:flex;align-items:center}
        .top-left{gap:10px}.top-left b{display:block;font-size:13px;color:#10295c}.top-left small,.user small{display:block;color:#8794ab;font-size:10px}
        .store-icon,.title-icon{width:38px;height:38px;border-radius:10px;background:#eaf2ff;display:flex;align-items:center;justify-content:center}
        .top-right{gap:18px}.icon-btn{border:0;background:none;position:relative;cursor:pointer}.icon-btn i{position:absolute;right:-1px;top:0;width:6px;height:6px;background:#e2231a;border-radius:50%}
        .user{gap:8px}.avatar{width:34px;height:34px;border-radius:50%;background:#10295c;display:flex;align-items:center;justify-content:center}.user b{font-size:12px}
        .content{padding:24px 28px}.page-title{gap:12px;margin-bottom:22px}.page-title h1{margin:0;color:#10295c;font-size:21px}.page-title p{margin:2px 0;color:#8794ab;font-size:12px}
        .grid{display:grid;grid-template-columns:1.6fr 1fr;gap:18px;max-width:1080px}.panel{background:#fff;border:1px solid #eef1f8;border-radius:18px;padding:18px;box-shadow:0 10px 24px #10295c0f}.panel h3{font-size:13px;color:#10295c;margin:0 0 13px}
        .methods{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.method{padding:17px 8px;border:1.5px solid transparent;border-radius:14px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px}.method span{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center}.method b{font-size:12px}
        .promo{gap:11px;margin-top:16px;padding-top:14px;border-top:1px solid #eee}.promo-icon{width:38px;height:38px;border-radius:10px;background:#e7f1ff;display:flex;align-items:center;justify-content:center}.promo b{display:block;font-size:12px;color:#10295c}.promo small{font-size:10px;color:#8794ab}
        .summary-title{gap:11px;margin-bottom:16px}.bag{width:42px;height:42px;border-radius:12px;background:#10295c;display:flex;align-items:center;justify-content:center}.summary-title h2{margin:0;font-size:16px;color:#10295c}.summary-title p{margin:2px 0;font-size:10px;color:#8794ab}
        .items{display:flex;flex-direction:column;gap:8px}.item{display:flex;align-items:center;gap:9px;padding:8px;background:#f8fafd;border-radius:11px}.thumb{width:43px;height:43px;background:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden}.thumb img{width:100%;height:100%;object-fit:contain}.item-info{flex:1}.item-info b,.item-info small{display:block}.item-info b{font-size:11px;color:#10295c}.item-info small{font-size:10px;color:#8794ab}.item>strong{font-size:11px;color:#10295c}.empty{text-align:center;padding:18px;color:#8794ab;font-size:11px}
        .price-box{margin-top:14px;padding:13px;background:#eaf2ff;border-radius:12px}.price-box>div{display:flex;justify-content:space-between;font-size:11px;margin:7px 0;color:#4b5875}.discount{color:#27ae60!important}.after{padding-top:9px;border-top:1px dashed #c8d9ef;color:#10295c!important}.after strong{font-size:14px}.grand{display:flex;justify-content:space-between;padding:15px 2px 10px;color:#10295c}.grand strong{font-size:18px}.hint{padding:9px;background:#f8fafd;border-radius:9px;font-size:10px;color:#8794ab;display:flex;gap:5px;align-items:center}
        .blur{filter:blur(2px);pointer-events:none}.overlay{position:fixed;inset:0;z-index:50;background:#0a142d8c;backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:20px}.modal{width:100%;max-width:440px;max-height:90vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 24px 60px #080f2359}
        .modal-head{display:flex;justify-content:space-between;align-items:center;padding:18px 20px 5px}.modal-title{gap:8px}.modal-title span{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center}.modal-title h2,.success-head h2{font-size:17px;color:#10295c;margin:0}.modal-head button{border:0;background:#f1f4f9;border-radius:8px;width:30px;height:30px;cursor:pointer}.modal-body{padding:18px 20px 20px}.error{padding:9px;background:#fdecea;color:#c0392b;border-radius:8px;font-size:11px;margin-bottom:10px}
        .cash,.ewallet,.qris{border-radius:13px;background:#f3fbf6;overflow:hidden}.cash-head{display:flex;gap:10px;padding:15px}.cash-head b,.ewallet>b,.qris>b{display:block;font-size:14px;color:#10295c}.cash-head small,.ewallet>small,.qris>small{display:block;color:#8794ab;font-size:10px;margin-top:3px}.total-modal{padding:12px 15px;background:#f4f7fc;display:flex;flex-direction:column;gap:3px;color:#4b5875;font-size:10px}.total-modal strong{font-size:18px;color:#10295c}
        .cash label{display:block;margin:13px 14px 5px;font-size:11px;font-weight:bold;color:#4b5875}.money-input{position:relative;margin:0 14px 8px}.money-input span{position:absolute;left:11px;top:50%;transform:translateY(-50%);font-weight:bold;color:#6b95c4}.money-input input{width:100%;padding:11px 10px 11px 33px;border:1px solid #cfe9d9;border-radius:9px;font-size:14px;outline:none}.change{display:flex;justify-content:space-between;margin:0 14px 12px;padding:9px;background:#fff;border-radius:8px;font-size:11px}.change strong{color:#27ae60}
        .primary{width:calc(100% - 28px);margin:0 14px 11px;padding:11px;border:0;border-radius:10px;background:#2f80ed;color:#fff;font-weight:bold;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}.primary:disabled{opacity:.5}.back{width:100%;border:0;background:none;padding:0 15px 15px;color:#4b5875;cursor:pointer;display:flex;justify-content:center;align-items:center;gap:5px;font-size:11px}
        .qris{padding:15px;background:#eaf3ff}.qris .qr-img{position:relative;width:160px;height:160px;background:#fff;border-radius:10px;margin:14px auto}.object{object-fit:contain;padding:7px}.qris>strong{display:block;text-align:center;background:#fff;padding:9px;border-radius:8px;font-size:18px;color:#10295c}.waiting{text-align:center;background:#fff;color:#2f80ed;border-radius:8px;padding:9px;margin:9px 0;font-size:10px;font-weight:bold}.debit-img{height:140px;position:relative}
        .ewallet{background:#fff;border:1px solid #eef1f8;padding:15px}.wallet-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}.wallet{display:flex;align-items:center;gap:7px;padding:10px;border:1.5px solid transparent;border-radius:9px;background:#f8fafd;cursor:pointer;font-weight:bold}
        .success-head{padding:18px 20px 5px;display:flex;align-items:center;gap:8px}.receipt{padding:20px;text-align:center}.receipt-logo{width:45px;height:45px;margin:auto auto 7px;border-radius:11px;background:#e7f1ff;color:#2f80ed;display:flex;align-items:center;justify-content:center}.receipt>h2{margin:0;color:#10295c;font-size:17px}.receipt>p{margin:3px;color:#8794ab;font-size:10px}.receipt>small{color:#9aa6b9;font-size:9px}.receipt-line{border-top:1px dashed #cfd6e2;margin:12px 0}.receipt-item{display:flex;justify-content:space-between;text-align:left;margin:8px 0;font-size:10px}.receipt-item b{display:block}.receipt-item small{display:block;color:#8794ab;margin-top:3px}.receipt-row{display:flex;justify-content:space-between;text-align:left;margin:7px 0;font-size:10px;color:#4b5875}.receipt-row b{color:#10295c}.receipt-row.bold{padding:8px 0;border-top:1px dashed #d5dce7;border-bottom:1px dashed #d5dce7;font-weight:bold}.green{color:#27ae60!important}.thanks{margin:13px 0!important}
        .print-btn,.new-btn,.done-btn{width:100%;border:0;border-radius:10px;padding:10px;margin-top:7px;display:flex;align-items:center;justify-content:center;gap:6px;font-weight:bold;cursor:pointer}.print-btn{background:#e7f1ff;color:#1c5aa8}.new-btn{background:#2f80ed;color:#fff}.done-btn{background:#f1f4f9;color:#4b5875}
        .spin{animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:1000px){.grid{grid-template-columns:1fr}}@media(max-width:620px){.methods{grid-template-columns:1fr 1fr}.content{padding:18px}}
      `}</style>
    </div>
  );
}