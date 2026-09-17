'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import SidebarKasir from '../../components/SidebarKasir';
import {
  Search,
  ScanLine,
  X,
  Minus,
  Plus,
  CreditCard,
  ShoppingCart,
  Bell,
  ShieldCheck,
  Trash2,
  ChevronRight,
} from 'lucide-react';

type Produk = {
  id: string; // barcode
  nama: string;
  harga: number;
  kategori: string;
  gambar: string;
};

type Kategori = {
  id: number;
  nama: string;
};

// Item di keranjang. Dibuat generik (id/nama/harga/gambar/qty) supaya
// bentuknya SAMA dengan yang dipakai di halaman scan barcode — jadi
// walau disimpan/dibaca dari dua file berbeda, datanya tetap nyambung.
type ItemKeranjang = {
  id: string;
  nama: string;
  harga: number;
  gambar: string;
  qty: number;
};

// Kunci localStorage ini HARUS SAMA PERSIS dengan yang dipakai di
// halaman scan barcode, supaya keranjangnya jadi satu keranjang yang sama.
const KERANJANG_KEY = 'keranjangAktif';

// Kunci ini HARUS SAMA dengan yang dipakai halaman Login
// (localStorage.setItem('indomart_user', ...)).
const USER_KEY = 'indomart_user';

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

function formatRupiah(angka: number): string {
  return 'Rp ' + angka.toLocaleString('id-ID');
}

// Jaga-jaga kalau data gambar dari database formatnya salah
// (misal cuma "kingkong.png" tanpa "/" di depan, atau kosong).
function normalisasiGambar(src: string): string {
  if (!src) return '/placeholder.png';
  if (src.startsWith('/') || src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  return `/${src}`;
}

export default function TransaksiPenjualanPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [kategoriAktif, setKategoriAktif] = useState<string>('Semua');
  const [namaUser, setNamaUser] = useState('Kasir');
  const [keranjang, setKeranjang] = useState<ItemKeranjang[]>([]);

  // Data dari API (dulu array dummy: produkDummy & kategoriList)
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [loadingProduk, setLoadingProduk] = useState(true);
  const [errorMuat, setErrorMuat] = useState('');

  const kategoriScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) {
        const user = JSON.parse(raw);
        if (user?.nama) setNamaUser(user.nama);
      }
    } catch {
      // biarkan default "Kasir"
    }
  }, []);

  // Ambil produk & kategori dari API begitu halaman dibuka.
  useEffect(() => {
    async function muatData() {
      setLoadingProduk(true);
      setErrorMuat('');
      try {
        const [resProduk, resKategori] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories'),
        ]);

        if (!resProduk.ok || !resKategori.ok) {
          throw new Error('Gagal memuat data dari server');
        }

        const dataProduk: Produk[] = await resProduk.json();
        const dataKategori: Kategori[] = await resKategori.json();

        setProdukList(dataProduk);
        setKategoriList(dataKategori);
      } catch (err) {
        console.error(err);
        setErrorMuat('Gagal memuat produk/kategori. Pastikan server & database aktif.');
      } finally {
        setLoadingProduk(false);
      }
    }

    muatData();
  }, []);

  // Muat keranjang yang sudah tersimpan (misal dari hasil scan barcode)
  // begitu halaman transaksi dibuka.
  useEffect(() => {
    setKeranjang(bacaKeranjang());
  }, []);

  // Kalau keranjang diubah dari tab/halaman lain, ikut ter-update di sini.
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === KERANJANG_KEY) {
        setKeranjang(bacaKeranjang());
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const produkTersaring = useMemo(() => {
    return produkList.filter((p) => {
      const cocokKategori = kategoriAktif === 'Semua' || p.kategori === kategoriAktif;
      const cocokQuery = p.nama.toLowerCase().includes(query.toLowerCase());
      return cocokKategori && cocokQuery;
    });
  }, [produkList, query, kategoriAktif]);

  const total = useMemo(
    () => keranjang.reduce((sum, item) => sum + item.harga * item.qty, 0),
    [keranjang]
  );

  // Bungkus setKeranjang supaya setiap kali keranjang berubah, otomatis
  // ikut disimpan ke localStorage juga.
  function ubahKeranjang(fn: (prev: ItemKeranjang[]) => ItemKeranjang[]) {
    setKeranjang((prev) => {
      const next = fn(prev);
      simpanKeranjang(next);
      return next;
    });
  }

  const tambahKeKeranjang = (produk: Produk) => {
    ubahKeranjang((prev) => {
      const sudahAda = prev.find((item) => item.id === produk.id);
      if (sudahAda) {
        return prev.map((item) =>
          item.id === produk.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: produk.id,
          nama: produk.nama,
          harga: produk.harga,
          gambar: produk.gambar,
          qty: 1,
        },
      ];
    });
  };

  const ubahQty = (id: string, delta: number) => {
    ubahKeranjang((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const hapusItem = (id: string) => {
    ubahKeranjang((prev) => prev.filter((item) => item.id !== id));
  };

  const hapusSemua = () => ubahKeranjang(() => []);

  const geserKategori = () => {
    kategoriScrollRef.current?.scrollBy({ left: 180, behavior: 'smooth' });
  };

  const handleBayarSekarang = () => {
    // Keranjang sudah otomatis tersimpan tiap kali berubah, jadi di sini
    // tinggal lanjut navigasi ke halaman pembayaran.
    router.push('/pembayaran');
  };

  return (
    <div className="wrapper">
      <SidebarKasir />

      <div className="main">
        <header className="topbar">
          <div className="topbar-search">
            <Search size={17} strokeWidth={2} color="#8794ab" />
            <input
              type="text"
              placeholder="Cari produk, barcode, atau kategori..."
            />
          </div>

          <div className="topbar-right">
            <button className="icon-btn" aria-label="Notifikasi">
              <Bell size={18} strokeWidth={1.8} color="#4b5875" />
              <span className="dot" />
            </button>

            <div className="user-block">
              <div className="avatar">{namaUser.charAt(0).toUpperCase()}</div>
              <div>
                <div className="user-name">{namaUser}</div>
                <div className="user-role">Kasir</div>
              </div>
            </div>
          </div>
        </header>

        <main className="content">
          <div className="panel-row">
            <div className="left-col">
              <section className="promo-banner">
                <div className="promo-text">
                  <span className="promo-eyebrow">Belanja Lebih Mudah</span>
                  <h1>
                    Produk Kebutuhan Harian
                    <br />
                    Kini Lebih Dekat
                  </h1>
                  <p>
                    Temukan berbagai produk berkualitas dengan harga terbaik
                    hanya di Indomart.
                  </p>
                </div>

                <div className="promo-badge">Hemat Setiap Hari</div>

                <div className="promo-image">
                  <Image
                    src="/banner/promo-belanja3.png"
                    alt="Keranjang belanja Indomart"
                    fill
                    sizes="260px"
                    className="promo-image-img"
                  />
                </div>
              </section>

              <div className="panel transaksi-panel">
                <div className="search-row">
                  <div className="search-box">
                    <Search size={16} strokeWidth={2} color="#8794ab" />
                    <input
                      type="text"
                      placeholder="Scan barcode / cari produk..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <ScanLine size={16} strokeWidth={2} color="#8794ab" />
                  </div>
                </div>

                <div className="kategori-row-wrapper">
                  <div className="kategori-row" ref={kategoriScrollRef}>
                    <button
                      type="button"
                      className={`kategori-pill ${kategoriAktif === 'Semua' ? 'aktif' : ''}`}
                      onClick={() => setKategoriAktif('Semua')}
                    >
                      Semua
                    </button>

                    {kategoriList.map((k) => (
                      <button
                        key={k.id}
                        type="button"
                        className={`kategori-pill ${kategoriAktif === k.nama ? 'aktif' : ''}`}
                        onClick={() => setKategoriAktif(k.nama)}
                      >
                        {k.nama}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="kategori-scroll-btn"
                    onClick={geserKategori}
                    aria-label="Geser kategori"
                  >
                    <ChevronRight size={16} strokeWidth={2.2} color="#4b5875" />
                  </button>
                </div>

                {loadingProduk && (
                  <div className="produk-status">Memuat produk...</div>
                )}

                {!loadingProduk && errorMuat && (
                  <div className="produk-status produk-error">{errorMuat}</div>
                )}

                {!loadingProduk && !errorMuat && (
                  <div className="produk-grid">
                    {produkTersaring.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="produk-card"
                        onClick={() => tambahKeKeranjang(p)}
                      >
                        <div className="produk-gambar">
                          <Image
                            src={normalisasiGambar(p.gambar)}
                            alt={p.nama}
                            fill
                            sizes="120px"
                            className="produk-gambar-img"
                          />
                        </div>

                        <div className="produk-nama">{p.nama}</div>
                        <div className="produk-harga">{formatRupiah(p.harga)}</div>
                      </button>
                    ))}

                    {produkTersaring.length === 0 && (
                      <div className="produk-kosong">Produk tidak ditemukan.</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="panel keranjang-panel">
              <div className="keranjang-head">
                <div className="keranjang-title">
                  <div className="cart-icon-wrap">
                    <ShoppingCart size={18} strokeWidth={2} color="#2f80ed" />
                    {keranjang.length > 0 && (
                      <span className="cart-badge">{keranjang.length}</span>
                    )}
                  </div>
                  <h2>Keranjang Belanja</h2>
                </div>

                <button
                  type="button"
                  className="hapus-semua"
                  onClick={hapusSemua}
                  disabled={keranjang.length === 0}
                >
                  <Trash2 size={13} strokeWidth={2} />
                  Hapus Semua
                </button>
              </div>

              <div className="keranjang-list">
                {keranjang.length === 0 && (
                  <div className="keranjang-kosong">Keranjang masih kosong.</div>
                )}

                {keranjang.map((item) => (
                  <div className="keranjang-item" key={item.id}>
                    <div className="item-gambar">
                      <Image
                        src={normalisasiGambar(item.gambar)}
                        alt={item.nama}
                        fill
                        sizes="52px"
                        className="item-gambar-img"
                      />
                    </div>

                    <div className="item-info">
                      <div className="item-top">
                        <span className="item-nama">{item.nama}</span>
                        <button
                          type="button"
                          className="item-close"
                          aria-label={`Hapus ${item.nama}`}
                          onClick={() => hapusItem(item.id)}
                        >
                          <X size={14} strokeWidth={2} />
                        </button>
                      </div>
                      <div className="item-harga">{formatRupiah(item.harga)}</div>

                      <div className="item-bottom">
                        <div className="qty-control">
                          <button
                            type="button"
                            onClick={() => ubahQty(item.id, -1)}
                            aria-label="Kurangi"
                          >
                            <Minus size={13} strokeWidth={2.2} />
                          </button>
                          <span>{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => ubahQty(item.id, 1)}
                            aria-label="Tambah"
                          >
                            <Plus size={13} strokeWidth={2.2} />
                          </button>
                        </div>
                        <div className="item-subtotal">
                          {formatRupiah(item.harga * item.qty)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="keranjang-footer">
                <div className="total-row">
                  <span>Total</span>
                  <span className="total-value">{formatRupiah(total)}</span>
                </div>

                <button
                  type="button"
                  className="btn-bayar"
                  disabled={keranjang.length === 0}
                  onClick={handleBayarSekarang}
                >
                  <CreditCard size={16} strokeWidth={2} />
                  Bayar Sekarang
                </button>

                <div className="trust-badge">
                  <ShieldCheck size={16} strokeWidth={2} color="#2f80ed" />
                  <div>
                    <div className="trust-title">Belanja Aman &amp; Mudah</div>
                    <div className="trust-sub">
                      Produk original, harga terjangkau, pembayaran aman
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        .wrapper {
          display: flex;
          min-height: 100vh;
          background: #eef3fb;
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
          gap: 20px;
          background: #ffffff;
          border-radius: 16px;
          margin: 18px 20px 0;
          padding: 12px 18px;
          box-shadow: 0 8px 20px rgba(16, 41, 92, 0.05);
        }

        .topbar-search {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f4f7fc;
          border-radius: 12px;
          padding: 10px 16px;
          max-width: 480px;
        }

        .topbar-search input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 13px;
          color: #16233d;
        }

        .topbar-search input::placeholder {
          color: #a5aec2;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .icon-btn {
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
        }

        .icon-btn .dot {
          position: absolute;
          top: -3px;
          right: -3px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #e2231a;
          border: 2px solid #ffffff;
        }

        .user-block {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #dfeaff;
          color: #1646a0;
          font-weight: 800;
          font-size: 13px;
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
          color: #8794ab;
        }

        .content {
          padding: 18px 20px 30px;
        }

        .panel-row {
          display: grid;
          grid-template-columns: 1.8fr 1fr;
          gap: 16px;
          align-items: start;
        }

        .left-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }

        .promo-banner {
          position: relative;
          overflow: hidden;
          border-radius: 16px;
          padding: 14px 20px;
          background: linear-gradient(120deg, #0b3d91 0%, #1e6fd9 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 80px;
        }

        .promo-text {
          position: relative;
          z-index: 1;
          max-width: 320px;
        }

        .promo-eyebrow {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          color: #ffd166;
          margin-bottom: 8px;
        }

        .promo-text h1 {
          margin: 0 0 6px;
          font-size: 17px;
          font-weight: 800;
          line-height: 1.3;
        }

        .promo-text p {
          margin: 0;
          font-size: 11.5px;
          color: #dbe9fd;
          line-height: 1.45;
        }

        .promo-badge {
          position: absolute;
          top: 10px;
          right: 16px;
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          padding: 3px 10px;
          font-size: 9.5px;
          font-weight: 700;
        }

        .promo-image {
          position: relative;
          width: 100px;
          height: 60px;
          flex-shrink: 0;
        }

        .promo-image-img {
          object-fit: contain;
        }

        .panel {
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 10px 24px rgba(16, 41, 92, 0.06);
          min-width: 0;
        }

        .transaksi-panel {
          padding: 22px 24px 26px;
        }

        .search-row {
          margin-bottom: 16px;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f4f7fc;
          border: 1px solid #e6ebf3;
          border-radius: 12px;
          padding: 11px 14px;
        }

        .search-box input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 13px;
          color: #16233d;
        }

        .search-box input::placeholder {
          color: #a5aec2;
        }

        .kategori-row-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
        }

        .kategori-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          flex: 1;
          min-width: 0;
          scrollbar-width: none;
        }

        .kategori-row::-webkit-scrollbar {
          display: none;
        }

        .kategori-pill {
          flex-shrink: 0;
          background: #ffffff;
          border: 1px solid #e2e6ee;
          border-radius: 999px;
          padding: 9px 18px;
          font-size: 12.5px;
          font-weight: 600;
          color: #5a6478;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .kategori-pill:hover {
          border-color: #2f80ed;
          color: #2f80ed;
        }

        .kategori-pill.aktif {
          background: #2f80ed;
          border-color: #2f80ed;
          color: #ffffff;
        }

        .kategori-scroll-btn {
          flex-shrink: 0;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1px solid #e2e6ee;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.15s ease;
        }

        .kategori-scroll-btn:hover {
          border-color: #2f80ed;
        }

        .produk-status {
          text-align: center;
          padding: 30px 0;
          color: #8794ab;
          font-size: 13px;
        }

        .produk-error {
          color: #e2231a;
        }

        .produk-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .produk-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          background: #f8fafd;
          border: 1px solid #eef1f8;
          border-radius: 14px;
          padding: 16px;
          cursor: pointer;
          text-align: left;
          transition: border-color 0.15s ease, transform 0.1s ease;
        }

        .produk-card:hover {
          border-color: #2f80ed;
          transform: translateY(-2px);
        }

        .produk-gambar {
          position: relative;
          width: 100%;
          height: 76px;
          margin-bottom: 10px;
        }

        .produk-gambar-img {
          object-fit: contain;
        }

        .produk-nama {
          font-size: 13px;
          font-weight: 700;
          color: #16233d;
          margin-bottom: 4px;
        }

        .produk-harga {
          font-size: 12.5px;
          font-weight: 700;
          color: #2f80ed;
        }

        .produk-kosong {
          grid-column: 1 / -1;
          text-align: center;
          padding: 30px 0;
          color: #8794ab;
          font-size: 13px;
        }

        .keranjang-panel {
          display: flex;
          flex-direction: column;
          padding: 22px 22px 20px;
          box-sizing: border-box;
        }

        .keranjang-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .keranjang-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cart-icon-wrap {
          position: relative;
          display: flex;
        }

        .cart-badge {
          position: absolute;
          top: -6px;
          right: -8px;
          background: #e2231a;
          color: #ffffff;
          font-size: 9px;
          font-weight: 800;
          border-radius: 50%;
          width: 15px;
          height: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .keranjang-head h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: #10295c;
        }

        .hapus-semua {
          display: flex;
          align-items: center;
          gap: 5px;
          background: none;
          border: none;
          color: #e2231a;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .hapus-semua:disabled {
          color: #c4cbdb;
          cursor: not-allowed;
        }

        .keranjang-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 12px;
          max-height: 360px;
          overflow-y: auto;
        }

        .keranjang-kosong {
          text-align: center;
          padding: 24px 0;
          color: #8794ab;
          font-size: 13px;
        }

        .keranjang-item {
          display: flex;
          gap: 12px;
          border-bottom: 1px solid #f4f6fb;
          padding-bottom: 14px;
        }

        .item-gambar {
          position: relative;
          width: 52px;
          height: 52px;
          border-radius: 10px;
          background: #f4f7fc;
          flex-shrink: 0;
          overflow: hidden;
        }

        .item-gambar-img {
          object-fit: contain;
          padding: 6px;
        }

        .item-info {
          flex: 1;
          min-width: 0;
        }

        .item-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .item-nama {
          font-size: 13px;
          font-weight: 700;
          color: #16233d;
        }

        .item-close {
          background: none;
          border: none;
          color: #c4cbdb;
          cursor: pointer;
          padding: 2px;
          flex-shrink: 0;
        }

        .item-close:hover {
          color: #e2231a;
        }

        .item-harga {
          font-size: 12px;
          color: #2f80ed;
          font-weight: 700;
          margin-top: 2px;
        }

        .item-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
        }

        .qty-control {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .qty-control button {
          width: 24px;
          height: 24px;
          border-radius: 7px;
          border: 1px solid #e6ebf3;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #2f80ed;
        }

        .qty-control span {
          min-width: 18px;
          text-align: center;
          font-size: 12.5px;
          font-weight: 700;
        }

        .item-subtotal {
          font-size: 12.5px;
          font-weight: 800;
          color: #10295c;
        }

        .keranjang-footer {
          margin-top: 6px;
          border-top: 1px solid #f0f2f8;
          padding-top: 14px;
        }

        .total-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .total-row span:first-child {
          font-size: 15px;
          font-weight: 800;
          color: #10295c;
        }

        .total-value {
          font-size: 18px;
          font-weight: 800;
          color: #10295c;
        }

        .btn-bayar {
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
          margin-bottom: 14px;
        }

        .btn-bayar:hover:not(:disabled) {
          background: #1c67cf;
        }

        .btn-bayar:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .trust-badge {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #f4f7fc;
          border-radius: 12px;
          padding: 12px 14px;
        }

        .trust-title {
          font-size: 12px;
          font-weight: 700;
          color: #16233d;
          margin-bottom: 2px;
        }

        .trust-sub {
          font-size: 10.5px;
          color: #8794ab;
          line-height: 1.4;
        }

        @media (max-width: 1150px) {
          .panel-row {
            grid-template-columns: 1fr;
          }
          .produk-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .promo-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .promo-image {
            width: 100%;
            height: 100px;
          }
        }

        @media (max-width: 640px) {
          .produk-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}