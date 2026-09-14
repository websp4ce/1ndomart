'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import SidebarKasir from '../../components/SidebarKasir';
import {
  Search, ScanLine, X, Minus, Plus, ShoppingCart, Trash2,
  LayoutGrid, Coffee, UtensilsCrossed, Cookie, Home,
  UserRound, Tag, ChevronDown,
} from 'lucide-react';

type Kategori =
  | 'Semua'
  | 'Minuman'
  | 'Makanan'
  | 'Snack'
  | 'Kebutuhan Rumah';

type Produk = {
  id: string;
  nama: string;
  harga: number;
  kategori: Kategori;
  gambar: string;
  barcode: string;
};

/* DATA MEMBER MENGIKUTI PAGE MEMBER */
type Member = {
  id: number;
  nama: string;
  telepon: string;
  poin: number;
  tanggal: string;
};

type Promo = {
  id: string;
  nama: string;
  keterangan: string;
  tipe: 'persen' | 'nominal';
  nilai: number;
  minimal: number;
};

type Item = Produk & { qty: number };

const produk: Produk[] = [
  {
    id: '1',
    nama: 'Indomie Goreng',
    harga: 3000,
    kategori: 'Makanan',
    gambar: '/produk/indomie-goreng.png',
    barcode: '8992388111111',
  },
  {
    id: '2',
    nama: 'Aqua 600ml',
    harga: 2500,
    kategori: 'Minuman',
    gambar: '/produk/aqua-600ml.png',
    barcode: '8992761111111',
  },
  {
    id: '3',
    nama: 'Roma Malkist Abon',
    harga: 5000,
    kategori: 'Snack',
    gambar: '/produk/roma-malkist.png',
    barcode: '8993176111111',
  },
  {
    id: '4',
    nama: 'Coca-Cola 1.5L',
    harga: 12000,
    kategori: 'Minuman',
    gambar: '/produk/coca-cola-1.5l.png',
    barcode: '8991001111111',
  },
  {
    id: '5',
    nama: 'Tango',
    harga: 8500,
    kategori: 'Snack',
    gambar: '/produk/tango.png',
    barcode: '8994504111111',
  },
  {
    id: '6',
    nama: 'Susu Ultra Milk',
    harga: 11000,
    kategori: 'Minuman',
    gambar: '/produk/susu-ultra.png',
    barcode: '8998001111111',
  },
  {
    id: '7',
    nama: 'Mie Sedaap Goreng',
    harga: 3500,
    kategori: 'Makanan',
    gambar: '/produk/mie-sedaap.png',
    barcode: '8998866111111',
  },
  {
    id: '8',
    nama: 'Beng-Beng',
    harga: 2500,
    kategori: 'Snack',
    gambar: '/produk/beng-beng.png',
    barcode: '8996001111111',
  },
];

const promos: Promo[] = [
  {
    id: '1',
    nama: 'Diskon 10%',
    keterangan: 'Minimal transaksi Rp 20.000',
    tipe: 'persen',
    nilai: 10,
    minimal: 20000,
  },
  {
    id: '2',
    nama: 'Hemat Rp 5.000',
    keterangan: 'Minimal transaksi Rp 30.000',
    tipe: 'nominal',
    nilai: 5000,
    minimal: 30000,
  },
  {
    id: '3',
    nama: 'Diskon Member 5%',
    keterangan: 'Khusus pelanggan member',
    tipe: 'persen',
    nilai: 5,
    minimal: 0,
  },
];

const kategori = [
  { nama: 'Semua', Icon: LayoutGrid },
  { nama: 'Minuman', Icon: Coffee },
  { nama: 'Makanan', Icon: UtensilsCrossed },
  { nama: 'Snack', Icon: Cookie },
  { nama: 'Kebutuhan Rumah', Icon: Home },
];

const rupiah = (angka: number) =>
  `Rp ${angka.toLocaleString('id-ID')}`;

export default function TransaksiPage() {
  const [search, setSearch] = useState('');
  const [kategoriAktif, setKategoriAktif] =
    useState<Kategori>('Semua');

  const [keranjang, setKeranjang] = useState<Item[]>([
    { ...produk[0], qty: 1 },
    { ...produk[1], qty: 2 },
    { ...produk[2], qty: 1 },
  ]);

  /*
   * MEMBER SEKARANG DIAMBIL DARI DATABASE
   * BUKAN LAGI DATA 5 ORANG YANG DIHARDCODE
   */
  const [members, setMembers] = useState<Member[]>([]);
  const [member, setMember] = useState<Member | null>(null);
  const [loadingMember, setLoadingMember] = useState(false);

  const [promo, setPromo] = useState<Promo | null>(null);
  const [showMember, setShowMember] = useState(false);
  const [showPromo, setShowPromo] = useState(false);

  /*
   * AMBIL DATA MEMBER DARI API YANG SAMA
   * DENGAN PAGE MEMBER
   */
  useEffect(() => {
    const ambilMember = async () => {
      try {
        setLoadingMember(true);

        const response = await fetch(
          '/api/manajemen?menu=member',
          {
            method: 'GET',
            cache: 'no-store',
          }
        );

        if (!response.ok) {
          throw new Error('Gagal mengambil data member');
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setMembers(data);
        } else {
          setMembers([]);
        }
      } catch (error) {
        console.error(
          'Gagal mengambil data member:',
          error
        );

        setMembers([]);
      } finally {
        setLoadingMember(false);
      }
    };

    ambilMember();
  }, []);

  const hasilProduk = useMemo(() => {
    const q = search.toLowerCase();

    return produk.filter((item) => {
      const cocokKategori =
        kategoriAktif === 'Semua' ||
        item.kategori === kategoriAktif;

      const cocokSearch =
        item.nama.toLowerCase().includes(q) ||
        item.barcode.includes(q);

      return cocokKategori && cocokSearch;
    });
  }, [search, kategoriAktif]);

  const jumlahItem = keranjang.reduce(
    (total, item) => total + item.qty,
    0
  );

  const subtotal = keranjang.reduce(
    (total, item) => total + item.harga * item.qty,
    0
  );

  const diskon = useMemo(() => {
    if (!promo || subtotal < promo.minimal) return 0;

    if (promo.tipe === 'persen') {
      return Math.floor(
        (subtotal * promo.nilai) / 100
      );
    }

    return Math.min(promo.nilai, subtotal);
  }, [promo, subtotal]);

  const total = subtotal - diskon;

  const tambahProduk = (item: Produk) => {
    setKeranjang((data) => {
      const ada = data.find((p) => p.id === item.id);

      if (ada) {
        return data.map((p) =>
          p.id === item.id
            ? { ...p, qty: p.qty + 1 }
            : p
        );
      }

      return [...data, { ...item, qty: 1 }];
    });
  };

  const ubahQty = (id: string, nilai: number) => {
    setKeranjang((data) =>
      data
        .map((item) =>
          item.id === id
            ? { ...item, qty: item.qty + nilai }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const hapusItem = (id: string) => {
    setKeranjang((data) =>
      data.filter((item) => item.id !== id)
    );
  };

  const hapusSemua = () => {
    setKeranjang([]);
    setMember(null);
    setPromo(null);
  };

  return (
    <div className="wrapper">
      <SidebarKasir />

      <div className="main">
        <header className="topbar">
          <div className="top-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk, barcode, atau kategori..."
            />
          </div>

          <div className="profile">
            <div className="avatar">A</div>
            <div>
              <b>Aulia Rahma</b>
              <span>Kasir</span>
            </div>
          </div>
        </header>

        <main className="content">
          <div className="layout">
            <section className="left">
              <div className="banner">
                <div>
                  <small>Belanja Lebih Mudah</small>
                  <h1>
                    Produk Kebutuhan Harian
                    <br />
                    Kini Lebih Dekat
                  </h1>
                  <p>
                    Temukan berbagai produk berkualitas
                    dengan harga terbaik hanya di Indomart.
                  </p>
                </div>

                <div className="banner-img">
                  <Image
                    src="/banner/promo-belanja3.png"
                    alt="Promo"
                    fill
                    sizes="180px"
                  />
                </div>
              </div>

              <div className="product-panel">
                <div className="product-search">
                  <Search size={16} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Scan barcode / cari produk..."
                  />
                  <ScanLine size={17} />
                </div>

                <div className="categories">
                  {kategori.map(({ nama, Icon }) => (
                    <button
                      key={nama}
                      onClick={() =>
                        setKategoriAktif(nama as Kategori)
                      }
                      className={
                        kategoriAktif === nama ? 'active' : ''
                      }
                    >
                      <Icon size={15} />
                      {nama}
                    </button>
                  ))}
                </div>

                <div className="products">
                  {hasilProduk.map((item) => (
                    <button
                      key={item.id}
                      className="product"
                      onClick={() => tambahProduk(item)}
                    >
                      <div className="product-img">
                        <Image
                          src={item.gambar}
                          alt={item.nama}
                          fill
                          sizes="120px"
                        />
                      </div>
                      <b>{item.nama}</b>
                      <span>{rupiah(item.harga)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="cart-panel">
              <div className="cart-header">
                <div className="cart-title">
                  <ShoppingCart size={20} />
                  <h2>Keranjang Belanja</h2>
                  <span className="badge">{jumlahItem}</span>
                </div>

                <button
                  className="delete-all"
                  onClick={hapusSemua}
                >
                  <Trash2 size={14} />
                  Hapus Semua
                </button>
              </div>

              {/* MEMBER */}
              <div className="feature">
                <button
                  className="feature-button"
                  onClick={() => {
                    setShowMember(!showMember);
                    setShowPromo(false);
                  }}
                >
                  <div className="feature-icon member">
                    <UserRound size={18} />
                  </div>

                  <div className="feature-text">
                    <small>Member & Pelanggan</small>
                    <b>
                      {member
                        ? member.nama
                        : 'Pilih Member / Pelanggan'}
                    </b>
                  </div>

                  <ChevronDown
                    size={17}
                    className={showMember ? 'rotate' : ''}
                  />
                </button>

                {showMember && (
                  <div className="dropdown">
                    {/* PELANGGAN UMUM */}
                    <button
                      onClick={() => {
                        setMember(null);
                        setShowMember(false);
                      }}
                    >
                      <div className="round-icon">
                        <UserRound size={15} />
                      </div>

                      <div>
                        <b>Pelanggan Umum</b>
                        <small>
                          Tidak menggunakan member
                        </small>
                      </div>
                    </button>

                    {/* LOADING */}
                    {loadingMember && (
                      <div
                        style={{
                          padding: '12px',
                          textAlign: 'center',
                          color: '#8794ab',
                          fontSize: '10px',
                        }}
                      >
                        Memuat data member...
                      </div>
                    )}

                    {/* DATA MEMBER DARI DATABASE */}
                    {!loadingMember &&
                      members.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setMember(item);
                            setShowMember(false);
                          }}
                        >
                          <div className="member-avatar">
                            {item.nama?.charAt(0)?.toUpperCase()}
                          </div>

                          <div>
                            <b>{item.nama}</b>

                            <small>
                              {item.telepon}
                            </small>

                            <small>
                              {item.poin} poin
                            </small>
                          </div>
                        </button>
                      ))}

                    {/* KALAU DATABASE KOSONG */}
                    {!loadingMember &&
                      members.length === 0 && (
                        <div
                          style={{
                            padding: '12px',
                            textAlign: 'center',
                            color: '#8794ab',
                            fontSize: '10px',
                          }}
                        >
                          Belum ada data member
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* PROMO */}
              <div className="feature">
                <button
                  className="feature-button"
                  onClick={() => {
                    setShowPromo(!showPromo);
                    setShowMember(false);
                  }}
                >
                  <div className="feature-icon promo">
                    <Tag size={18} />
                  </div>

                  <div className="feature-text">
                    <small>Promo & Diskon</small>
                    <b>
                      {promo
                        ? promo.nama
                        : 'Pilih Promo / Diskon'}
                    </b>
                  </div>

                  <ChevronDown
                    size={17}
                    className={showPromo ? 'rotate' : ''}
                  />
                </button>

                {showPromo && (
                  <div className="dropdown">
                    <button
                      onClick={() => {
                        setPromo(null);
                        setShowPromo(false);
                      }}
                    >
                      <div className="round-icon">
                        <X size={15} />
                      </div>
                      <div>
                        <b>Tanpa Promo</b>
                        <small>
                          Menggunakan harga normal
                        </small>
                      </div>
                    </button>

                    {promos.map((item) => {
                      const tidakBerlaku =
                        subtotal < item.minimal;

                      return (
                        <button
                          key={item.id}
                          disabled={tidakBerlaku}
                          className={
                            tidakBerlaku ? 'disabled' : ''
                          }
                          onClick={() => {
                            setPromo(item);
                            setShowPromo(false);
                          }}
                        >
                          <div className="round-icon promo-round">
                            <Tag size={14} />
                          </div>

                          <div>
                            <b>{item.nama}</b>
                            <small>{item.keterangan}</small>

                            {tidakBerlaku && (
                              <em>
                                Belum memenuhi minimum
                              </em>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* KERANJANG */}
              <div className="cart-list">
                {keranjang.length === 0 && (
                  <div className="empty">
                    <ShoppingCart size={30} />
                    <b>Keranjang kosong</b>
                    <span>
                      Pilih produk untuk menambahkan
                    </span>
                  </div>
                )}

                {keranjang.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <div className="cart-img">
                      <Image
                        src={item.gambar}
                        alt={item.nama}
                        fill
                        sizes="55px"
                      />
                    </div>

                    <div className="cart-info">
                      <div className="item-name">
                        <b>{item.nama}</b>

                        <button
                          onClick={() => hapusItem(item.id)}
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <span className="price">
                        {rupiah(item.harga)}
                      </span>

                      <div className="item-bottom">
                        <div className="quantity">
                          <button
                            onClick={() =>
                              ubahQty(item.id, -1)
                            }
                          >
                            <Minus size={13} />
                          </button>

                          <b>{item.qty}</b>

                          <button
                            onClick={() =>
                              ubahQty(item.id, 1)
                            }
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <strong>
                          {rupiah(item.harga * item.qty)}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* RINGKASAN */}
              <div className="summary">
                <div>
                  <span>Subtotal</span>
                  <b>{rupiah(subtotal)}</b>
                </div>

                <div className="discount-row">
                  <span>
                    <Tag size={13} />
                    Diskon
                  </span>
                  <b>- {rupiah(diskon)}</b>
                </div>

                <div className="total">
                  <span>Total</span>
                  <strong>{rupiah(total)}</strong>
                </div>

                <div className="payment-placeholder">
                  <span>Total transaksi siap diproses</span>
                  <small>
                    Bagian pembayaran dapat dilanjutkan
                    oleh modul kasir.
                  </small>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      <style jsx>{`
        *{box-sizing:border-box}
        .wrapper{
          min-height:100vh;
          display:flex;
          background:#eef3fb;
          color:#17233d;
          font-family:'Segoe UI',system-ui,sans-serif
        }
        .main{flex:1;min-width:0}
        .topbar{
          margin:18px 20px 0;
          padding:12px 18px;
          background:#fff;
          border-radius:16px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:20px;
          box-shadow:0 8px 25px rgba(20,50,100,.05)
        }
        .top-search{
          width:480px;
          max-width:100%;
          padding:11px 15px;
          display:flex;
          align-items:center;
          gap:9px;
          background:#f4f7fc;
          border-radius:12px;
          color:#8794ab
        }
        .top-search input,.product-search input{
          width:100%;
          border:0;
          outline:0;
          background:transparent;
          font-size:13px
        }
        .profile{
          display:flex;
          align-items:center;
          gap:9px
        }
        .avatar{
          width:36px;
          height:36px;
          border-radius:50%;
          display:grid;
          place-items:center;
          background:#dfeaff;
          color:#1d5fc1;
          font-weight:800
        }
        .profile b,.profile span{display:block}
        .profile b{font-size:12px}
        .profile span{
          margin-top:2px;
          color:#8794ab;
          font-size:10px
        }
        .content{padding:18px 20px 30px}
        .layout{
          display:grid;
          grid-template-columns:1.8fr 1fr;
          gap:16px;
          align-items:start
        }
        .left{
          display:flex;
          flex-direction:column;
          gap:16px;
          min-width:0
        }
        .banner{
          min-height:170px;
          position:relative;
          overflow:hidden;
          padding:25px;
          border-radius:18px;
          background:linear-gradient(120deg,#0b419b,#2477df);
          color:#fff
        }
        .banner small{
          color:#ffd15c;
          font-weight:800;
          font-size:12px
        }
        .banner h1{
          margin:9px 0 7px;
          font-size:20px;
          line-height:1.3
        }
        .banner p{
          margin:0;
          max-width:390px;
          color:#dceaff;
          font-size:12px;
          line-height:1.5
        }
        .banner-img{
          position:absolute;
          right:25px;
          bottom:8px;
          width:150px;
          height:110px
        }
        .banner-img :global(img){object-fit:contain}
        .product-panel,.cart-panel{
          background:#fff;
          border-radius:20px;
          box-shadow:0 10px 25px rgba(20,50,100,.05)
        }
        .product-panel{padding:22px}
        .product-search{
          padding:11px 14px;
          display:flex;
          align-items:center;
          gap:9px;
          background:#f5f8fc;
          border:1px solid #e6ebf3;
          border-radius:12px;
          color:#8794ab
        }
        .categories{
          display:flex;
          gap:8px;
          flex-wrap:wrap;
          margin:16px 0 20px
        }
        .categories button{
          display:flex;
          align-items:center;
          gap:6px;
          padding:8px 14px;
          border:1px solid #e5eaf2;
          border-radius:20px;
          background:#fff;
          color:#4d5a75;
          font-weight:700;
          font-size:12px;
          cursor:pointer
        }
        .categories button.active{
          background:#2f80ed;
          border-color:#2f80ed;
          color:#fff
        }
        .products{
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:13px
        }
        .product{
          padding:13px;
          border:1px solid #edf0f6;
          border-radius:14px;
          background:#f8fafd;
          text-align:left;
          cursor:pointer
        }
        .product:hover{border-color:#2f80ed}
        .product-img{
          height:80px;
          position:relative;
          margin-bottom:9px
        }
        .product-img :global(img){object-fit:contain}
        .product b,.product span{display:block}
        .product b{font-size:12px}
        .product span{
          margin-top:4px;
          color:#2f80ed;
          font-size:11.5px;
          font-weight:700
        }
        .cart-panel{padding:20px}
        .cart-header{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          margin-bottom:14px
        }
        .cart-title{
          display:flex;
          align-items:center;
          gap:8px;
          color:#2f80ed
        }
        .cart-title h2{
          margin:0;
          color:#10295c;
          font-size:16px
        }
        .badge{
          width:18px;
          height:18px;
          display:grid;
          place-items:center;
          border-radius:50%;
          background:#e2231a;
          color:#fff;
          font-size:9px;
          font-weight:800
        }
        .delete-all{
          display:flex;
          align-items:center;
          gap:5px;
          border:0;
          background:transparent;
          color:#e2231a;
          font-size:11px;
          font-weight:700;
          cursor:pointer
        }
        .feature{
          position:relative;
          margin-bottom:9px
        }
        .feature-button{
          width:100%;
          display:flex;
          align-items:center;
          gap:10px;
          padding:10px;
          border:1px solid #e5eaf2;
          border-radius:12px;
          background:#f8fafd;
          text-align:left;
          cursor:pointer
        }
        .feature-button:hover{
          border-color:#b9d4f8;
          background:#f4f8ff
        }
        .feature-button>svg:last-child{margin-left:auto}
        .rotate{transform:rotate(180deg)}
        .feature-icon{
          width:35px;
          height:35px;
          display:grid;
          place-items:center;
          border-radius:9px;
          flex-shrink:0
        }
        .feature-icon.member{
          background:#e8f1ff;
          color:#2f80ed
        }
        .feature-icon.promo{
          background:#fff2d8;
          color:#e49b00
        }
        .feature-text{min-width:0}
        .feature-text small,.feature-text b{display:block}
        .feature-text small{
          color:#8794ab;
          font-size:9.5px;
          margin-bottom:3px
        }
        .feature-text b{
          color:#17233d;
          font-size:12px;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap
        }
        .dropdown{
          position:absolute;
          z-index:20;
          top:calc(100% + 5px);
          left:0;
          right:0;
          padding:6px;
          background:#fff;
          border:1px solid #e5eaf2;
          border-radius:12px;
          box-shadow:0 15px 35px rgba(20,50,100,.13);
          max-height:330px;
          overflow-y:auto
        }
        .dropdown button{
          width:100%;
          display:flex;
          align-items:center;
          gap:9px;
          padding:9px;
          border:0;
          border-radius:9px;
          background:#fff;
          text-align:left;
          cursor:pointer
        }
        .dropdown button:hover{background:#f4f7fc}
        .dropdown button.disabled{
          opacity:.45;
          cursor:not-allowed
        }
        .dropdown button>div:last-child{min-width:0}
        .dropdown b,.dropdown small,.dropdown em{display:block}
        .dropdown b{color:#17233d;font-size:11px}
        .dropdown small{
          margin-top:2px;
          color:#8794ab;
          font-size:9px
        }
        .dropdown em{
          margin-top:3px;
          color:#e2231a;
          font-size:8.5px;
          font-style:normal
        }
        .round-icon,.member-avatar{
          width:30px;
          height:30px;
          flex-shrink:0;
          display:grid;
          place-items:center;
          border-radius:50%
        }
        .round-icon{
          background:#e9f2ff;
          color:#2f80ed
        }
        .promo-round{
          background:#fff2d8;
          color:#e49b00
        }
        .member-avatar{
          background:#dfeaff;
          color:#1646a0;
          font-size:11px;
          font-weight:800
        }
        .cart-list{
          max-height:315px;
          overflow-y:auto;
          margin-top:13px
        }
        .cart-item{
          display:flex;
          gap:10px;
          padding:12px 0;
          border-bottom:1px solid #f0f2f7
        }
        .cart-img{
          width:53px;
          height:53px;
          position:relative;
          flex-shrink:0;
          border-radius:10px;
          background:#f4f7fc;
          overflow:hidden
        }
        .cart-img :global(img){
          padding:5px;
          object-fit:contain
        }
        .cart-info{flex:1;min-width:0}
        .item-name{
          display:flex;
          justify-content:space-between;
          gap:8px
        }
        .item-name b{font-size:12px}
        .item-name button{
          border:0;
          background:transparent;
          color:#c0c8d8;
          cursor:pointer
        }
        .price{
          display:block;
          margin-top:3px;
          color:#2f80ed;
          font-size:11px;
          font-weight:700
        }
        .item-bottom{
          display:flex;
          align-items:center;
          justify-content:space-between;
          margin-top:8px
        }
        .quantity{
          display:flex;
          align-items:center;
          gap:8px
        }
        .quantity button{
          width:24px;
          height:24px;
          display:grid;
          place-items:center;
          border:1px solid #e1e7f0;
          border-radius:7px;
          background:#fff;
          color:#2f80ed;
          cursor:pointer
        }
        .quantity b{font-size:11px}
        .item-bottom>strong{
          color:#10295c;
          font-size:11.5px
        }
        .empty{
          min-height:150px;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          gap:5px;
          color:#a3adbf
        }
        .empty b{color:#4b5875;font-size:12px}
        .empty span{font-size:9px}
        .summary{
          margin-top:10px;
          padding-top:14px;
          border-top:1px solid #edf0f5
        }
        .summary>div{
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:8px
        }
        .summary span{color:#8794ab;font-size:11px}
        .summary b{color:#4b5875;font-size:11px}
        .discount-row span{
          display:flex;
          align-items:center;
          gap:5px;
          color:#e2231a
        }
        .discount-row b{color:#e2231a}
        .total{
          margin-top:11px;
          padding-top:11px;
          border-top:1px dashed #e1e6ef
        }
        .total span{
          color:#10295c;
          font-size:15px;
          font-weight:800
        }
        .total strong{
          color:#10295c;
          font-size:18px
        }
        .payment-placeholder{
          margin-top:13px;
          padding:11px;
          display:block!important;
          background:#f4f7fc;
          border-radius:10px
        }
        .payment-placeholder span,
        .payment-placeholder small{display:block}
        .payment-placeholder span{
          color:#17233d;
          font-size:10px;
          font-weight:700
        }
        .payment-placeholder small{
          margin-top:3px;
          color:#8794ab;
          font-size:8.5px
        }
        @media(max-width:1100px){
          .layout{grid-template-columns:1fr}
          .products{grid-template-columns:repeat(4,1fr)}
        }
        @media(max-width:750px){
          .topbar{margin:10px}
          .content{padding:10px}
          .products{grid-template-columns:repeat(2,1fr)}
          .banner-img{opacity:.5}
        }
        @media(max-width:480px){
          .products{grid-template-columns:1fr 1fr}
          .product-panel,.cart-panel{padding:15px}
          .banner{padding:18px}
          .banner h1{font-size:17px}
        }
      `}</style>
    </div>
  );
}