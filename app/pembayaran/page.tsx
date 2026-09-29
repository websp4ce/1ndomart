'use client';

import {
  useEffect,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import SidebarKasir from '../components/SidebarKasir';
import {
  Store, Wallet, Banknote, QrCode, CreditCard, ShoppingBag,
  Percent, ArrowLeft, ArrowRight, CheckCircle2, Printer,
  RefreshCw, X, Loader2, Tag, ShieldCheck, Check
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
  { id: 'tunai' as const, nama: 'Tunai', desc: 'Bayar dengan uang cash', Icon: Banknote, bg: '#eafaf1', color: '#22a75d' },
  { id: 'qris' as const, nama: 'QRIS', desc: 'Scan QR dari aplikasi apa pun', Icon: QrCode, bg: '#eaf3ff', color: '#2f80ed' },
  { id: 'debit' as const, nama: 'Debit', desc: 'Gesek kartu di mesin EDC', Icon: CreditCard, bg: '#fff2e5', color: '#f08c1a' },
  { id: 'ewallet' as const, nama: 'E-Wallet', desc: 'GoPay, DANA, OVO, ShopeePay', Icon: Wallet, bg: '#f3edff', color: '#8a5cf6' },
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
  const jumlahItem = items.reduce((a, i) => a + Number(i.qty), 0);

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

  const stepAktif = tahap === 'pilih' ? 1 : tahap === 'proses' ? 2 : 3;

  const uangCepat = Array.from(
    new Set(
      [grandTotal, 50000, 100000, 200000].filter(
        (n) => n > 0 && n >= grandTotal
      )
    )
  ).slice(0, 4);

  return (
    <div className="wrapper">
      <SidebarKasir />

      <div className="main">
        <main className="content">
          {/* HEADER HALAMAN */}
          <div className="page-head">
            <div className="page-title">
              <div className="title-icon">
                <Wallet size={22} color="#fff" />
              </div>
              <div>
                <h1>Pembayaran</h1>
                <p>Pilih metode pembayaran untuk menyelesaikan transaksi</p>
              </div>
            </div>

            <div className="steps">
              {['Pilih Metode', 'Bayar', 'Selesai'].map((s, i) => {
                const n = i + 1;
                const state =
                  stepAktif > n ? 'done' : stepAktif === n ? 'now' : '';
                return (
                  <div className={`step ${state}`} key={s}>
                    <span className="step-dot">
                      {stepAktif > n ? <Check size={12} /> : n}
                    </span>
                    <em>{s}</em>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`grid ${tahap !== 'pilih' ? 'blur' : ''}`}>
            {/* KIRI */}
            <section className="left">
              <div className="panel">
                <div className="panel-head">
                  <h3>Metode Pembayaran</h3>
                  <span>Pilih salah satu</span>
                </div>

                <div className="methods">
                  {metode.map((m) => (
                    <button
                      key={m.id}
                      className={`method ${metodeAktif === m.id ? 'active' : ''}`}
                      style={
                        {
                          '--c': m.color,
                          '--bg': m.bg,
                        } as CSSProperties
                      }
                      onClick={() => pilihMetode(m.id)}
                    >
                      <span className="method-icon">
                        <m.Icon size={22} color="#fff" />
                      </span>
                      <div className="method-text">
                        <b>{m.nama}</b>
                        <small>{m.desc}</small>
                      </div>
                      <ArrowRight size={16} className="method-arrow" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel promo">
                <div className="promo-icon">
                  <Tag size={18} color="#f08c1a" />
                </div>
                <div className="promo-text">
                  <small>Promo Digunakan</small>
                  <b>{promo?.nama || 'Tidak Ada Promo'}</b>
                  <span>
                    {promo
                      ? 'Promo sudah diterapkan dari transaksi'
                      : 'Tidak ada promo yang digunakan'}
                  </span>
                </div>
                {diskon > 0 && (
                  <div className="promo-save">-{rupiah(diskon)}</div>
                )}
              </div>

              <div className="secure">
                <ShieldCheck size={17} />
                <div>
                  <b>Transaksi Aman</b>
                  <span>Pembayaran tercatat otomatis ke sistem kasir.</span>
                </div>
              </div>
            </section>

            {/* KANAN */}
            <section className="panel summary">
              <div className="summary-title">
                <div className="bag">
                  <ShoppingBag size={20} color="#fff" />
                </div>
                <div>
                  <h2>Ringkasan Belanja</h2>
                  <p>{jumlahItem} item</p>
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
                        <small>
                          {item.qty} x {rupiah(item.harga)}
                        </small>
                      </div>
                      <strong>{rupiah(item.harga * item.qty)}</strong>
                    </div>
                  ))
                ) : (
                  <div className="empty">
                    <ShoppingBag size={26} />
                    Belum ada barang.
                  </div>
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
                <span>Total Pembayaran</span>
                <strong>{rupiah(grandTotal)}</strong>
              </div>

              <div className="hint">
                <ArrowRight size={14} />
                Pilih metode pembayaran untuk melanjutkan.
              </div>
            </section>
          </div>

          {/* MODAL */}
          {tahap !== 'pilih' && (
            <div className="overlay">
              <div className="modal">
                {tahap === 'proses' && metodeDipilih && (
                  <>
                    <div className="modal-head">
                      <div className="modal-title">
                        <span style={{ background: metodeDipilih.color }}>
                          <metodeDipilih.Icon size={17} color="#fff" />
                        </span>
                        <div>
                          <h2>{metodeDipilih.nama}</h2>
                          <small>{metodeDipilih.desc}</small>
                        </div>
                      </div>
                      <button onClick={kembali}>
                        <X size={18} />
                      </button>
                    </div>

                    <div className="modal-body">
                      {error && <div className="error">{error}</div>}

                      {metodeAktif === 'tunai' && (
                        <div className="cash">
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
                              autoFocus
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                setUang(e.target.value.replace(/\D/g, ''))
                              }
                            />
                          </div>

                          <div className="quick">
                            {uangCepat.map((n, i) => (
                              <button
                                key={n}
                                onClick={() => setUang(String(n))}
                              >
                                {i === 0 && n === grandTotal
                                  ? 'Uang Pas'
                                  : rupiah(n)}
                              </button>
                            ))}
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
                            {menyimpan ? 'Menyimpan...' : 'Bayar Sekarang'}
                          </button>

                          <button className="back" onClick={kembali}>
                            <ArrowLeft size={13} /> Kembali
                          </button>
                        </div>
                      )}

                      {metodeAktif === 'qris' && (
                        <div className="qris">
                          <small className="lead">Scan QR untuk membayar.</small>

                          <div className="qr-img">
                            <Image
                              src="/qris/scan-gb.png"
                              alt="QRIS"
                              fill
                              className="object"
                            />
                          </div>

                          <strong className="amount">{rupiah(grandTotal)}</strong>

                          <div className="waiting">
                            <Loader2 className="spin" size={13} />
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
                          <small className="lead">
                            Lakukan pembayaran melalui mesin EDC.
                          </small>

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
                            <Loader2 className="spin" size={13} />
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
                          <small className="lead">Pilih e-wallet pelanggan.</small>

                          <div className="wallet-grid">
                            {ewallet.map((e) => (
                              <button
                                key={e.id}
                                className={`wallet ${provider === e.id ? 'on' : ''}`}
                                style={{
                                  borderColor:
                                    provider === e.id ? e.warna : 'transparent',
                                }}
                                onClick={() => setProvider(e.id)}
                              >
                                <span
                                  className="wallet-ic"
                                  style={{ background: e.warna }}
                                >
                                  <Wallet size={14} color="#fff" />
                                </span>
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
                            <small className="lead">
                              Scan QR {providerDipilih.nama} untuk melakukan
                              pembayaran.
                            </small>

                            <div className="qr-img">
                              <Image
                                src="/qris/scan-gb.png"
                                alt="QR"
                                fill
                                className="object"
                              />
                            </div>

                            <strong className="amount">{rupiah(grandTotal)}</strong>

                            <div className="waiting">
                              <Loader2 className="spin" size={13} />
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
                      <div className="success-ic">
                        <CheckCircle2 size={30} color="#fff" />
                      </div>
                      <h2>Pembayaran Berhasil</h2>
                      <p>Transaksi telah tersimpan</p>
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
        * { box-sizing: border-box; }

        .wrapper {
          min-height: 100vh;
          display: flex;
          background:
            radial-gradient(900px 400px at 100% -10%, #dbe8ff 0%, transparent 60%),
            linear-gradient(180deg, #f4f7fd, #eef2fa);
          color: #16233d;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        .main { flex: 1; min-width: 0; }

        .content {
          padding: 30px 34px 40px;
          max-width: 1180px;
        }

        /* HEADER */
        .page-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 26px;
        }

        .page-title { display: flex; align-items: center; gap: 14px; }

        .title-icon {
          width: 50px;
          height: 50px;
          border-radius: 15px;
          background: linear-gradient(135deg, #1e6fd9, #0b3d91);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 22px rgba(30, 111, 217, .32);
        }

        .page-title h1 {
          margin: 0;
          font-size: 25px;
          font-weight: 800;
          color: #0f2557;
          letter-spacing: -.3px;
        }

        .page-title p {
          margin: 3px 0 0;
          color: #7a89a3;
          font-size: 12.5px;
        }

        .steps {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          background: rgba(255, 255, 255, .8);
          border: 1px solid #e6ecf6;
          border-radius: 999px;
          box-shadow: 0 6px 16px rgba(16, 41, 92, .05);
        }

        .step {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 5px 12px 5px 6px;
          border-radius: 999px;
          color: #9aa8bf;
        }

        .step em { font-style: normal; font-size: 11.5px; font-weight: 600; }

        .step-dot {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #eaeff8;
          font-size: 10.5px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .step.now { background: #eaf2ff; color: #1c5aa8; }
        .step.now .step-dot { background: #2f80ed; color: #fff; }
        .step.done { color: #22a75d; }
        .step.done .step-dot { background: #22a75d; color: #fff; }

        /* GRID */
        .grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 22px;
          align-items: start;
          transition: filter .2s;
        }

        .left { display: flex; flex-direction: column; gap: 18px; }

        .panel {
          background: #fff;
          border: 1px solid #edf1f8;
          border-radius: 22px;
          padding: 22px;
          box-shadow: 0 14px 34px rgba(16, 41, 92, .07);
        }

        .panel-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .panel-head h3 { margin: 0; font-size: 15px; color: #0f2557; font-weight: 800; }
        .panel-head span { font-size: 11px; color: #9aa8bf; }

        /* METODE */
        .methods {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .method {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 16px;
          text-align: left;
          background: #fff;
          border: 1.5px solid #e8edf6;
          border-radius: 18px;
          cursor: pointer;
          transition: all .2s ease;
          overflow: hidden;
        }

        .method::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--bg);
          opacity: 0;
          transition: opacity .2s;
        }

        .method:hover {
          transform: translateY(-3px);
          border-color: var(--c);
          box-shadow: 0 14px 28px rgba(16, 41, 92, .1);
        }

        .method:hover::before, .method.active::before { opacity: 1; }
        .method.active { border-color: var(--c); }

        .method > * { position: relative; }

        .method-icon {
          width: 50px;
          height: 50px;
          flex-shrink: 0;
          border-radius: 15px;
          background: var(--c);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 16px color-mix(in srgb, var(--c) 35%, transparent);
        }

        .method-text { flex: 1; min-width: 0; }
        .method-text b { display: block; font-size: 14px; color: #10295c; }
        .method-text small { display: block; margin-top: 3px; font-size: 10.5px; color: #7a89a3; line-height: 1.35; }

        .method-arrow { color: #b5c0d3; transition: all .2s; }
        .method:hover .method-arrow { color: var(--c); transform: translateX(3px); }

        /* PROMO */
        .promo {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
        }

        .promo-icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: #fff4e5;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .promo-text { flex: 1; min-width: 0; }
        .promo-text small { display: block; font-size: 10px; color: #9aa8bf; font-weight: 600; }
        .promo-text b { display: block; margin: 2px 0; font-size: 13.5px; color: #10295c; }
        .promo-text span { font-size: 10.5px; color: #7a89a3; }

        .promo-save {
          padding: 6px 12px;
          background: #eafaf1;
          color: #22a75d;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 800;
          white-space: nowrap;
        }

        .secure {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 13px 16px;
          background: rgba(47, 128, 237, .07);
          border: 1px dashed #b9d3f7;
          border-radius: 14px;
          color: #2f80ed;
        }

        .secure b { display: block; font-size: 11.5px; color: #10295c; }
        .secure span { font-size: 10.5px; color: #7a89a3; }

        /* RINGKASAN */
        .summary { position: sticky; top: 24px; }

        .summary-title { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }

        .bag {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: linear-gradient(135deg, #1e6fd9, #0b3d91);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 18px rgba(30, 111, 217, .3);
        }

        .summary-title h2 { margin: 0; font-size: 16px; color: #10295c; font-weight: 800; }
        .summary-title p { margin: 2px 0 0; font-size: 11px; color: #8794ab; }

        .items {
          display: flex;
          flex-direction: column;
          gap: 9px;
          max-height: 300px;
          overflow-y: auto;
          padding-right: 2px;
        }

        .item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 9px;
          background: #f7f9fd;
          border: 1px solid #eef2f9;
          border-radius: 14px;
        }

        .thumb {
          width: 46px;
          height: 46px;
          flex-shrink: 0;
          background: #fff;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .thumb img { width: 100%; height: 100%; object-fit: contain; }

        .item-info { flex: 1; min-width: 0; }
        .item-info b { display: block; font-size: 11.5px; color: #10295c; }
        .item-info small { display: block; margin-top: 2px; font-size: 10px; color: #8794ab; }
        .item > strong { font-size: 11.5px; color: #10295c; white-space: nowrap; }

        .empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 26px;
          color: #aab6ca;
          font-size: 11.5px;
        }

        .price-box {
          margin-top: 16px;
          padding: 14px 16px;
          background: #f4f7fd;
          border-radius: 14px;
        }

        .price-box > div {
          display: flex;
          justify-content: space-between;
          margin: 7px 0;
          font-size: 11.5px;
          color: #4b5875;
        }

        .discount { color: #22a75d !important; }
        .discount span { display: flex; align-items: center; gap: 4px; }

        .after {
          padding-top: 10px;
          margin-top: 10px !important;
          border-top: 1px dashed #c9d6ea;
          color: #10295c !important;
        }

        .after strong { font-size: 14px; }

        .grand {
          margin-top: 14px;
          padding: 18px;
          border-radius: 16px;
          background: linear-gradient(120deg, #0b3d91, #1e6fd9);
          color: #dbe9fd;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 11.5px;
          box-shadow: 0 12px 24px rgba(30, 111, 217, .28);
        }

        .grand strong { font-size: 24px; color: #fff; letter-spacing: -.3px; }

        .hint {
          margin-top: 12px;
          padding: 10px 12px;
          background: #f7f9fd;
          border-radius: 11px;
          font-size: 10.5px;
          color: #8794ab;
          display: flex;
          gap: 6px;
          align-items: center;
        }

        /* MODAL */
        .blur { filter: blur(3px); pointer-events: none; }

        .overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: rgba(10, 20, 45, .55);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fade .2s ease;
        }

        .modal {
          width: 100%;
          max-width: 450px;
          max-height: 92vh;
          overflow: auto;
          background: #fff;
          border-radius: 26px;
          box-shadow: 0 30px 70px rgba(8, 15, 35, .4);
          animation: pop .25s cubic-bezier(.2, .9, .3, 1.2);
        }

        @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pop { from { opacity: 0; transform: translateY(14px) scale(.96); } to { opacity: 1; transform: none; } }

        .modal-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 22px 6px;
        }

        .modal-title { display: flex; align-items: center; gap: 12px; }

        .modal-title span {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-title h2 { margin: 0; font-size: 18px; font-weight: 800; color: #10295c; }
        .modal-title small { display: block; margin-top: 2px; font-size: 10.5px; color: #8794ab; }

        .modal-head > button {
          border: 0;
          background: #f1f4f9;
          border-radius: 10px;
          width: 34px;
          height: 34px;
          cursor: pointer;
          color: #5a6982;
          transition: background .15s;
        }

        .modal-head > button:hover { background: #e4e9f2; }

        .modal-body { padding: 14px 22px 22px; }

        .error {
          padding: 10px 12px;
          background: #fdecea;
          color: #c0392b;
          border-radius: 10px;
          font-size: 11.5px;
          margin-bottom: 12px;
        }

        .cash, .ewallet, .qris { border-radius: 18px; overflow: hidden; }

        .lead { display: block; margin: 2px 2px 12px; color: #7a89a3; font-size: 11.5px; }

        .total-modal {
          padding: 15px 18px;
          background: linear-gradient(120deg, #0b3d91, #1e6fd9);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          color: #dbe9fd;
          font-size: 11px;
          margin-bottom: 4px;
        }

        .total-modal strong { font-size: 25px; color: #fff; letter-spacing: -.3px; }

        .cash label {
          display: block;
          margin: 16px 2px 7px;
          font-size: 11.5px;
          font-weight: 700;
          color: #4b5875;
        }

        .money-input { position: relative; margin-bottom: 10px; }

        .money-input span {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          font-weight: 800;
          color: #6b95c4;
        }

        .money-input input {
          width: 100%;
          padding: 15px 14px 15px 44px;
          border: 1.5px solid #dfe7f3;
          border-radius: 14px;
          font-size: 20px;
          font-weight: 800;
          color: #10295c;
          outline: none;
          transition: all .15s;
        }

        .money-input input:focus {
          border-color: #2f80ed;
          box-shadow: 0 0 0 4px rgba(47, 128, 237, .12);
        }

        .quick { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }

        .quick button {
          padding: 7px 13px;
          border: 1px solid #dbe6f7;
          background: #f4f8ff;
          color: #1c5aa8;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all .15s;
        }

        .quick button:hover { background: #2f80ed; color: #fff; border-color: #2f80ed; }

        .change {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          padding: 13px 16px;
          background: #eafaf1;
          border-radius: 13px;
          font-size: 12px;
          color: #3b6b50;
        }

        .change strong { font-size: 17px; color: #22a75d; }

        .primary {
          width: 100%;
          padding: 14px;
          border: 0;
          border-radius: 14px;
          background: linear-gradient(120deg, #2f80ed, #1c67cf);
          color: #fff;
          font-size: 13.5px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          box-shadow: 0 10px 20px rgba(47, 128, 237, .3);
          transition: all .15s;
        }

        .primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 24px rgba(47, 128, 237, .38); }
        .primary:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; }

        .back {
          width: 100%;
          margin-top: 8px;
          padding: 9px;
          border: 0;
          background: none;
          color: #6b7a94;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          font-weight: 600;
        }

        .back:hover { color: #10295c; }

        .qris .qr-img {
          position: relative;
          width: 190px;
          height: 190px;
          background: #fff;
          border: 1px solid #e4ebf6;
          border-radius: 18px;
          margin: 4px auto 14px;
          box-shadow: 0 10px 24px rgba(16, 41, 92, .08);
        }

        .object { object-fit: contain; padding: 10px; }

        .amount {
          display: block;
          text-align: center;
          background: #f4f7fd;
          padding: 12px;
          border-radius: 13px;
          font-size: 22px;
          color: #10295c;
          letter-spacing: -.3px;
        }

        .waiting {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          background: #eaf3ff;
          color: #2f80ed;
          border-radius: 12px;
          padding: 11px;
          margin: 11px 0 14px;
          font-size: 11px;
          font-weight: 700;
        }

        .debit-img { height: 150px; position: relative; margin: 6px 0; }

        .wallet-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 0 0 14px; }

        .wallet {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px;
          border: 1.5px solid transparent;
          border-radius: 14px;
          background: #f6f8fc;
          cursor: pointer;
          font-weight: 800;
          font-size: 12.5px;
          transition: all .15s;
        }

        .wallet:hover { background: #fff; box-shadow: 0 8px 18px rgba(16, 41, 92, .08); }
        .wallet.on { background: #fff; box-shadow: 0 8px 18px rgba(16, 41, 92, .1); }

        .wallet-ic {
          width: 28px;
          height: 28px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* BERHASIL */
        .success-head {
          padding: 28px 22px 4px;
          text-align: center;
        }

        .success-ic {
          width: 62px;
          height: 62px;
          margin: 0 auto 12px;
          border-radius: 50%;
          background: linear-gradient(135deg, #34c77b, #22a75d);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 26px rgba(34, 167, 93, .38);
          animation: pop .4s cubic-bezier(.2, .9, .3, 1.4);
        }

        .success-head h2 { margin: 0; font-size: 19px; font-weight: 800; color: #10295c; }
        .success-head p { margin: 4px 0 0; font-size: 11.5px; color: #8794ab; }

        .receipt {
          margin: 16px 20px 22px;
          padding: 20px 18px;
          text-align: center;
          background: #fbfcfe;
          border: 1px solid #eaeff7;
          border-radius: 18px;
        }

        .receipt-logo {
          width: 46px;
          height: 46px;
          margin: 0 auto 8px;
          border-radius: 13px;
          background: #e7f1ff;
          color: #2f80ed;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .receipt > h2 { margin: 0; color: #10295c; font-size: 17px; letter-spacing: .5px; }
        .receipt > p { margin: 3px 0; color: #8794ab; font-size: 10.5px; }
        .receipt > small { color: #9aa6b9; font-size: 9.5px; }

        .receipt-line { border-top: 1px dashed #cfd6e2; margin: 13px 0; }

        .receipt-item {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          text-align: left;
          margin: 9px 0;
          font-size: 10.5px;
        }

        .receipt-item b { display: block; color: #10295c; }
        .receipt-item small { display: block; color: #8794ab; margin-top: 3px; }

        .receipt-row {
          display: flex;
          justify-content: space-between;
          text-align: left;
          margin: 7px 0;
          font-size: 10.5px;
          color: #4b5875;
        }

        .receipt-row b { color: #10295c; }

        .receipt-row.bold {
          padding: 9px 0;
          border-top: 1px dashed #d5dce7;
          border-bottom: 1px dashed #d5dce7;
          font-weight: bold;
          color: #10295c;
        }

        .green { color: #22a75d !important; }
        .thanks { margin: 14px 0 !important; }

        .print-btn, .new-btn, .done-btn {
          width: 100%;
          border: 0;
          border-radius: 13px;
          padding: 12px;
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-weight: 800;
          font-size: 12.5px;
          cursor: pointer;
          transition: all .15s;
        }

        .print-btn { background: #e7f1ff; color: #1c5aa8; }
        .print-btn:hover { background: #d7e8ff; }
        .new-btn { background: linear-gradient(120deg, #2f80ed, #1c67cf); color: #fff; box-shadow: 0 8px 18px rgba(47, 128, 237, .28); }
        .new-btn:hover { transform: translateY(-1px); }
        .done-btn { background: #f1f4f9; color: #4b5875; }
        .done-btn:hover { background: #e6ebf3; }

        .spin { animation: spin .8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 1000px) {
          .grid { grid-template-columns: 1fr; }
          .summary { position: static; }
        }

        @media (max-width: 620px) {
          .content { padding: 18px; }
          .methods { grid-template-columns: 1fr; }
          .steps { display: none; }
        }
      `}</style>
    </div>
  );
}