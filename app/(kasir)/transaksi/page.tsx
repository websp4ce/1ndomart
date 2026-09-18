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
  Users,
  Tag,
  ChevronDown,
  UserRound,
  Check,
  Percent,
} from 'lucide-react';

type Produk = {
  id: string;
  nama: string;
  harga: number;
  kategori: string;
  gambar: string;
};

type Kategori = {
  id: number;
  nama: string;
};

type ItemKeranjang = {
  id: string;
  nama: string;
  harga: number;
  gambar: string;
  qty: number;
};

type Member = {
  id: string;
  nama: string;
  telepon: string;
  poin: number;
  status?: string;
};

type Promo = {
  id: string;
  nama: string;
  tipe?: string;
  persen: number;
  mulai?: string;
  selesai?: string;
  status?: string;
};

const KERANJANG_KEY = 'keranjangAktif';
const USER_KEY = 'indomart_user';
const TRANSAKSI_KEY = 'transaksiAktif';

const formatRupiah = (angka: number) =>
  'Rp ' + Number(angka || 0).toLocaleString('id-ID');

const gambar = (src: string) =>
  !src
    ? '/placeholder.png'
    : src.startsWith('/') ||
        src.startsWith('http://') ||
        src.startsWith('https://')
      ? src
      : `/${src}`;

const inisial = (nama: string) =>
  nama
    .split(' ')
    .map((x) => x[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function TransaksiPenjualanPage() {
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [kategoriAktif, setKategoriAktif] = useState('Semua');
  const [namaUser, setNamaUser] = useState('Kasir');

  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [keranjang, setKeranjang] = useState<ItemKeranjang[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [members, setMembers] = useState<Member[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);

  const [memberTerpilih, setMemberTerpilih] =
    useState<Member | null>(null);
  const [promoTerpilih, setPromoTerpilih] =
    useState<Promo | null>(null);

  const [showMember, setShowMember] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [promoSearch, setPromoSearch] = useState('');

  const kategoriRef = useRef<HTMLDivElement>(null);
  const memberPromoRef = useRef<HTMLDivElement>(null);

  /* USER */
  useEffect(() => {
    try {
      const data = JSON.parse(
        localStorage.getItem(USER_KEY) || '{}'
      );

      if (data?.nama) setNamaUser(data.nama);
    } catch {}
  }, []);

  /* PRODUK + KATEGORI */
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const [produkRes, kategoriRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories'),
        ]);

        if (!produkRes.ok || !kategoriRes.ok) {
          throw new Error('Gagal mengambil produk');
        }

        setProdukList(await produkRes.json());
        setKategoriList(await kategoriRes.json());
      } catch (err) {
        console.error(err);
        setError(
          'Gagal memuat produk. Pastikan server dan database aktif.'
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  /* MEMBER + PROMO DARI API */
  useEffect(() => {
    async function loadManajemen() {
      try {
        const [memberRes, promoRes] = await Promise.all([
          fetch('/api/manajemen?menu=member'),
          fetch('/api/manajemen?menu=promo'),
        ]);

        if (memberRes.ok) {
          const data = await memberRes.json();
          setMembers(Array.isArray(data) ? data : []);
        }

        if (promoRes.ok) {
          const data = await promoRes.json();
          setPromos(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Gagal mengambil member/promo:', err);
        setMembers([]);
        setPromos([]);
      }
    }

    loadManajemen();
  }, []);

  /* KERANJANG */
  useEffect(() => {
    try {
      setKeranjang(
        JSON.parse(
          localStorage.getItem(KERANJANG_KEY) || '[]'
        )
      );
    } catch {
      setKeranjang([]);
    }
  }, []);

  /* CLOSE DROPDOWN */
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (
        memberPromoRef.current &&
        !memberPromoRef.current.contains(e.target as Node)
      ) {
        setShowMember(false);
        setShowPromo(false);
      }
    };

    document.addEventListener('mousedown', close);

    return () =>
      document.removeEventListener('mousedown', close);
  }, []);

  /* FILTER */
  const produkTersaring = useMemo(() => {
    const q = query.toLowerCase();

    return produkList.filter(
      (p) =>
        (kategoriAktif === 'Semua' ||
          p.kategori === kategoriAktif) &&
        p.nama.toLowerCase().includes(q)
    );
  }, [produkList, query, kategoriAktif]);

  const memberTersaring = useMemo(() => {
    const q = memberSearch.toLowerCase();

    return members.filter((m) => {
      if (
        m.status &&
        m.status.toLowerCase() !== 'aktif'
      ) {
        return false;
      }

      return `${m.nama} ${m.telepon}`
        .toLowerCase()
        .includes(q);
    });
  }, [members, memberSearch]);

  const promoTersaring = useMemo(() => {
    const q = promoSearch.toLowerCase();

    return promos.filter((p) => {
      if (
        p.status &&
        p.status.toLowerCase() !== 'aktif'
      ) {
        return false;
      }

      return `${p.nama} ${p.tipe} ${p.persen}`
        .toLowerCase()
        .includes(q);
    });
  }, [promos, promoSearch]);

  /* TOTAL */
  const subtotal = useMemo(
    () =>
      keranjang.reduce(
        (total, item) =>
          total + item.harga * item.qty,
        0
      ),
    [keranjang]
  );

  const diskon = useMemo(() => {
    if (!promoTerpilih) return 0;

    if (
      promoTerpilih.tipe?.toLowerCase() ===
      'cashback'
    ) {
      return 0;
    }

    return Math.round(
      (subtotal *
        Number(promoTerpilih.persen || 0)) /
        100
    );
  }, [subtotal, promoTerpilih]);

  const total = Math.max(0, subtotal - diskon);

  /* CART */
  const simpanCart = (items: ItemKeranjang[]) => {
    setKeranjang(items);
    localStorage.setItem(
      KERANJANG_KEY,
      JSON.stringify(items)
    );
  };

  const tambahProduk = (produk: Produk) => {
    const ada = keranjang.find(
      (x) => x.id === produk.id
    );

    if (ada) {
      simpanCart(
        keranjang.map((x) =>
          x.id === produk.id
            ? { ...x, qty: x.qty + 1 }
            : x
        )
      );
      return;
    }

    simpanCart([
      ...keranjang,
      {
        id: produk.id,
        nama: produk.nama,
        harga: produk.harga,
        gambar: produk.gambar,
        qty: 1,
      },
    ]);
  };

  const ubahQty = (id: string, jumlah: number) => {
    simpanCart(
      keranjang
        .map((item) =>
          item.id === id
            ? {
                ...item,
                qty: Math.max(
                  1,
                  item.qty + jumlah
                ),
              }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const hapusItem = (id: string) => {
    simpanCart(
      keranjang.filter((item) => item.id !== id)
    );
  };

  const hapusSemua = () => {
    simpanCart([]);
  };

  const bayar = () => {
    localStorage.setItem(
      TRANSAKSI_KEY,
      JSON.stringify({
        keranjang,
        member: memberTerpilih,
        promo: promoTerpilih,
        subtotal,
        diskon,
        total,
      })
    );

    router.push('/pembayaran');
  };

  const geserKategori = () => {
    kategoriRef.current?.scrollBy({
      left: 180,
      behavior: 'smooth',
    });
  };

  return (
    <div className="wrapper">
      <SidebarKasir />

      <div className="main">
        <header className="topbar">
          <div className="topbar-search">
            <Search size={17} />
            <input
              placeholder="Cari produk, barcode, atau kategori..."
            />
          </div>

          <div className="topbar-right">
            <button className="icon-btn">
              <Bell size={18} />
              <span className="dot" />
            </button>

            <div className="user-block">
              <div className="avatar">
                {namaUser.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="user-name">
                  {namaUser}
                </div>
                <div className="user-role">
                  Kasir
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="content">
          <div className="panel-row">

            {/* PRODUK */}
            <div className="left-col">
              <section className="promo-banner">
                <div className="promo-text">
                  <span>
                    Belanja Lebih Mudah
                  </span>

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

                <div className="promo-badge">
                  Hemat Setiap Hari
                </div>

                <div className="promo-image">
                  <Image
                    src="/banner/promo-belanja3.png"
                    alt="Keranjang belanja"
                    fill
                    sizes="120px"
                  />
                </div>
              </section>

              <div className="panel transaksi-panel">
                <div className="search-box">
                  <Search size={16} />

                  <input
                    value={query}
                    onChange={(e) =>
                      setQuery(e.target.value)
                    }
                    placeholder="Scan barcode / cari produk..."
                  />

                  <ScanLine size={16} />
                </div>

                <div className="kategori-wrapper">
                  <div
                    className="kategori-row"
                    ref={kategoriRef}
                  >
                    <button
                      className={`kategori-pill ${
                        kategoriAktif === 'Semua'
                          ? 'aktif'
                          : ''
                      }`}
                      onClick={() =>
                        setKategoriAktif('Semua')
                      }
                    >
                      Semua
                    </button>

                    {kategoriList.map((k) => (
                      <button
                        key={k.id}
                        className={`kategori-pill ${
                          kategoriAktif === k.nama
                            ? 'aktif'
                            : ''
                        }`}
                        onClick={() =>
                          setKategoriAktif(k.nama)
                        }
                      >
                        {k.nama}
                      </button>
                    ))}
                  </div>

                  <button
                    className="kategori-next"
                    onClick={geserKategori}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {loading && (
                  <div className="status">
                    Memuat produk...
                  </div>
                )}

                {!loading && error && (
                  <div className="status error">
                    {error}
                  </div>
                )}

                {!loading && !error && (
                  <div className="produk-grid">
                    {produkTersaring.map((p) => (
                      <button
                        key={p.id}
                        className="produk-card"
                        onClick={() =>
                          tambahProduk(p)
                        }
                      >
                        <div className="produk-gambar">
                          <Image
                            src={gambar(p.gambar)}
                            alt={p.nama}
                            fill
                            sizes="120px"
                          />
                        </div>

                        <div className="produk-nama">
                          {p.nama}
                        </div>

                        <div className="produk-harga">
                          {formatRupiah(p.harga)}
                        </div>
                      </button>
                    ))}

                    {!produkTersaring.length && (
                      <div className="produk-kosong">
                        Produk tidak ditemukan.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* KERANJANG */}
            <div className="panel keranjang-panel">
              <div className="keranjang-head">
                <div className="keranjang-title">
                  <div className="cart-icon">
                    <ShoppingCart size={18} />
                    {keranjang.length > 0 && (
                      <span>
                        {keranjang.length}
                      </span>
                    )}
                  </div>

                  <h2>Keranjang Belanja</h2>
                </div>

                <button
                  className="hapus-semua"
                  onClick={hapusSemua}
                  disabled={!keranjang.length}
                >
                  <Trash2 size={13} />
                  Hapus Semua
                </button>
              </div>

              {/* MEMBER + PROMO */}
              <div
                className="benefit-area"
                ref={memberPromoRef}
              >

                {/* MEMBER */}
                <div className="benefit-box">
                  <div className="benefit-title">
                    <div className="benefit-icon member">
                      <Users size={14} />
                    </div>

                    <div>
                      <strong>
                        Member & Pelanggan
                      </strong>
                      <span>
                        Pilih pelanggan untuk transaksi
                      </span>
                    </div>
                  </div>

                  <button
                    className={`benefit-trigger ${
                      showMember ? 'open' : ''
                    }`}
                    onClick={() => {
                      setShowMember(!showMember);
                      setShowPromo(false);
                    }}
                  >
                    <div className="selected-left">
                      <div className="selected-avatar">
                        {memberTerpilih ? (
                          inisial(memberTerpilih.nama)
                        ) : (
                          <UserRound size={16} />
                        )}
                      </div>

                      <div className="selected-info">
                        <strong>
                          {memberTerpilih?.nama ||
                            'Pelanggan Umum'}
                        </strong>

                        <span>
                          {memberTerpilih
                            ? `${memberTerpilih.telepon || '-'} • ${memberTerpilih.poin || 0} poin`
                            : 'Transaksi tanpa member'}
                        </span>
                      </div>
                    </div>

                    <ChevronDown
                      size={16}
                      className={
                        showMember ? 'rotate' : ''
                      }
                    />
                  </button>

                  {showMember && (
                    <div className="dropdown">
                      <div className="dropdown-top">
                        <div>
                          <strong>Pilih Member</strong>
                          <span>
                            Member aktif dari database
                          </span>
                        </div>

                        <button
                          onClick={() =>
                            setShowMember(false)
                          }
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="dropdown-search">
                        <Search size={14} />

                        <input
                          autoFocus
                          value={memberSearch}
                          onChange={(e) =>
                            setMemberSearch(
                              e.target.value
                            )
                          }
                          placeholder="Cari nama / nomor telepon..."
                        />
                      </div>

                      <button
                        className={`option ${
                          !memberTerpilih
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() => {
                          setMemberTerpilih(null);
                          setMemberSearch('');
                          setShowMember(false);
                        }}
                      >
                        <div className="option-icon general">
                          <UserRound size={15} />
                        </div>

                        <div className="option-info">
                          <strong>
                            Pelanggan Umum
                          </strong>
                          <span>
                            Transaksi tanpa member
                          </span>
                        </div>

                        {!memberTerpilih && (
                          <Check size={15} />
                        )}
                      </button>

                      <div className="option-list">
                        {memberTersaring.length > 0 ? (
                          memberTersaring.map((member) => (
                            <button
                              key={member.id}
                              className={`option ${
                                memberTerpilih?.id ===
                                member.id
                                  ? 'selected'
                                  : ''
                              }`}
                              onClick={() => {
                                setMemberTerpilih(
                                  member
                                );
                                setMemberSearch('');
                                setShowMember(false);
                              }}
                            >
                              <div className="member-avatar">
                                {inisial(member.nama)}
                              </div>

                              <div className="option-info">
                                <strong>
                                  {member.nama}
                                </strong>

                                <span>
                                  {member.telepon ||
                                    'Nomor belum tersedia'}
                                </span>

                                <small>
                                  {member.poin || 0} poin
                                </small>
                              </div>

                              {memberTerpilih?.id ===
                                member.id && (
                                <Check size={15} />
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="empty">
                            <Users size={23} />
                            <strong>
                              Belum ada member
                            </strong>
                            <span>
                              Belum ada data member aktif.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* PROMO */}
                <div className="benefit-box">
                  <div className="benefit-title">
                    <div className="benefit-icon promo">
                      <Tag size={14} />
                    </div>

                    <div>
                      <strong>
                        Promo & Diskon
                      </strong>
                      <span>
                        Gunakan promo yang tersedia
                      </span>
                    </div>
                  </div>

                  <button
                    className={`benefit-trigger ${
                      showPromo ? 'open' : ''
                    }`}
                    onClick={() => {
                      setShowPromo(!showPromo);
                      setShowMember(false);
                    }}
                  >
                    <div className="selected-left">
                      <div className="selected-avatar promo">
                        {promoTerpilih ? (
                          <Percent size={16} />
                        ) : (
                          <Tag size={16} />
                        )}
                      </div>

                      <div className="selected-info">
                        <strong>
                          {promoTerpilih?.nama ||
                            'Tanpa Promo'}
                        </strong>

                        <span>
                          {promoTerpilih
                            ? `${promoTerpilih.tipe || 'Promo'} • Diskon ${promoTerpilih.persen}%`
                            : 'Tidak ada promo digunakan'}
                        </span>
                      </div>
                    </div>

                    <ChevronDown
                      size={16}
                      className={
                        showPromo ? 'rotate' : ''
                      }
                    />
                  </button>

                  {showPromo && (
                    <div className="dropdown">
                      <div className="dropdown-top">
                        <div>
                          <strong>Pilih Promo</strong>
                          <span>
                            Promo aktif dari database
                          </span>
                        </div>

                        <button
                          onClick={() =>
                            setShowPromo(false)
                          }
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="dropdown-search">
                        <Search size={14} />

                        <input
                          autoFocus
                          value={promoSearch}
                          onChange={(e) =>
                            setPromoSearch(
                              e.target.value
                            )
                          }
                          placeholder="Cari promo..."
                        />
                      </div>

                      <button
                        className={`option ${
                          !promoTerpilih
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() => {
                          setPromoTerpilih(null);
                          setPromoSearch('');
                          setShowPromo(false);
                        }}
                      >
                        <div className="option-icon no-promo">
                          <X size={15} />
                        </div>

                        <div className="option-info">
                          <strong>
                            Tanpa Promo
                          </strong>
                          <span>
                            Tidak menggunakan diskon
                          </span>
                        </div>

                        {!promoTerpilih && (
                          <Check size={15} />
                        )}
                      </button>

                      <div className="option-list">
                        {promoTersaring.length > 0 ? (
                          promoTersaring.map((promo) => (
                            <button
                              key={promo.id}
                              className={`option ${
                                promoTerpilih?.id ===
                                promo.id
                                  ? 'selected'
                                  : ''
                              }`}
                              onClick={() => {
                                setPromoTerpilih(
                                  promo
                                );
                                setPromoSearch('');
                                setShowPromo(false);
                              }}
                            >
                              <div className="promo-percent">
                                {promo.persen}%
                              </div>

                              <div className="option-info">
                                <strong>
                                  {promo.nama}
                                </strong>

                                <span>
                                  {promo.tipe ||
                                    'Promo transaksi'}
                                </span>

                                <small>
                                  {promo.mulai &&
                                  promo.selesai
                                    ? `${promo.mulai} - ${promo.selesai}`
                                    : `Diskon ${promo.persen}%`}
                                </small>
                              </div>

                              {promoTerpilih?.id ===
                                promo.id && (
                                <Check size={15} />
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="empty">
                            <Tag size={23} />
                            <strong>
                              Belum ada promo
                            </strong>
                            <span>
                              Belum ada promo aktif.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ISI KERANJANG */}
              <div className="cart-list">
                {!keranjang.length && (
                  <div className="cart-empty">
                    Keranjang masih kosong.
                  </div>
                )}

                {keranjang.map((item) => (
                  <div
                    className="cart-item"
                    key={item.id}
                  >
                    <div className="item-image">
                      <Image
                        src={gambar(item.gambar)}
                        alt={item.nama}
                        fill
                        sizes="52px"
                      />
                    </div>

                    <div className="item-info">
                      <div className="item-name-row">
                        <span>
                          {item.nama}
                        </span>

                        <button
                          onClick={() =>
                            hapusItem(item.id)
                          }
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="item-price">
                        {formatRupiah(item.harga)}
                      </div>

                      <div className="item-bottom">
                        <div className="qty">
                          <button
                            onClick={() =>
                              ubahQty(item.id, -1)
                            }
                          >
                            <Minus size={13} />
                          </button>

                          <span>{item.qty}</span>

                          <button
                            onClick={() =>
                              ubahQty(item.id, 1)
                            }
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <strong>
                          {formatRupiah(
                            item.harga * item.qty
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* TOTAL */}
              <div className="footer">
                <div className="summary">
                  <span>Subtotal</span>
                  <strong>
                    {formatRupiah(subtotal)}
                  </strong>
                </div>

                {diskon > 0 && (
                  <div className="summary discount">
                    <span>
                      <Tag size={12} />
                      Diskon {promoTerpilih?.persen}%
                    </span>

                    <strong>
                      -{formatRupiah(diskon)}
                    </strong>
                  </div>
                )}

                <div className="total-row">
                  <strong>Total</strong>
                  <strong>
                    {formatRupiah(total)}
                  </strong>
                </div>

                <button
                  className="pay"
                  disabled={!keranjang.length}
                  onClick={bayar}
                >
                  <CreditCard size={16} />
                  Bayar Sekarang
                </button>

                <div className="trust">
                  <ShieldCheck size={16} />
                  <div>
                    <strong>
                      Belanja Aman & Mudah
                    </strong>
                    <span>
                      Produk original, harga terjangkau,
                      pembayaran aman
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .wrapper {
          min-height: 100vh;
          display: flex;
          background: #eef3fb;
          color: #16233d;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        .main {
          flex: 1;
          min-width: 0;
        }

        .topbar {
          margin: 18px 20px 0;
          padding: 12px 18px;
          background: white;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          box-shadow: 0 8px 20px rgba(16, 41, 92, 0.05);
        }

        .topbar-search {
          max-width: 480px;
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f4f7fc;
          padding: 10px 15px;
          border-radius: 11px;
        }

        .topbar-search svg,
        .search-box svg {
          color: #8794ab;
          flex-shrink: 0;
        }

        .topbar-search input,
        .search-box input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          font-size: 12px;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .icon-btn {
          position: relative;
          border: 0;
          background: transparent;
          cursor: pointer;
          color: #4b5875;
        }

        .dot {
          position: absolute;
          right: -2px;
          top: -2px;
          width: 8px;
          height: 8px;
          background: #e2231a;
          border: 2px solid white;
          border-radius: 50%;
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
          display: flex;
          align-items: center;
          justify-content: center;
          background: #dfeaff;
          color: #1646a0;
          font-size: 13px;
          font-weight: 800;
        }

        .user-name {
          font-size: 12px;
          font-weight: 700;
        }

        .user-role {
          font-size: 10px;
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
          min-height: 80px;
          position: relative;
          overflow: hidden;
          border-radius: 16px;
          padding: 14px 20px;
          background: linear-gradient(
            120deg,
            #0b3d91,
            #1e6fd9
          );
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .promo-text {
          z-index: 1;
        }

        .promo-text span {
          color: #ffd166;
          font-size: 10px;
          font-weight: 800;
        }

        .promo-text h1 {
          margin: 5px 0;
          font-size: 17px;
          line-height: 1.3;
        }

        .promo-text p {
          margin: 0;
          font-size: 10.5px;
          color: #dbe9fd;
        }

        .promo-badge {
          position: absolute;
          top: 10px;
          right: 16px;
          padding: 3px 9px;
          border: 1px solid rgba(255,255,255,.3);
          border-radius: 20px;
          font-size: 9px;
        }

        .promo-image {
          position: relative;
          width: 100px;
          height: 65px;
        }

        .promo-image img {
          object-fit: contain;
        }

        .panel {
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 24px rgba(16,41,92,.06);
        }

        .transaksi-panel {
          padding: 22px 24px 26px;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f4f7fc;
          border: 1px solid #e6ebf3;
          padding: 11px 14px;
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .kategori-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
        }

        .kategori-row {
          flex: 1;
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .kategori-row::-webkit-scrollbar {
          display: none;
        }

        .kategori-pill {
          flex-shrink: 0;
          border: 1px solid #e2e6ee;
          background: white;
          border-radius: 999px;
          padding: 8px 17px;
          font-size: 12px;
          color: #5a6478;
          cursor: pointer;
        }

        .kategori-pill.aktif {
          color: white;
          background: #2f80ed;
          border-color: #2f80ed;
        }

        .kategori-next {
          width: 30px;
          height: 30px;
          flex-shrink: 0;
          border: 1px solid #e2e6ee;
          border-radius: 50%;
          background: white;
          cursor: pointer;
        }

        .status {
          padding: 30px;
          text-align: center;
          color: #8794ab;
          font-size: 12px;
        }

        .status.error {
          color: #e2231a;
        }

        .produk-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .produk-card {
          border: 1px solid #eef1f8;
          border-radius: 14px;
          background: #f8fafd;
          padding: 14px;
          text-align: left;
          cursor: pointer;
          transition: .2s;
        }

        .produk-card:hover {
          border-color: #2f80ed;
          transform: translateY(-2px);
        }

        .produk-gambar {
          position: relative;
          height: 76px;
          margin-bottom: 10px;
        }

        .produk-gambar img {
          object-fit: contain;
        }

        .produk-nama {
          font-size: 12.5px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .produk-harga {
          color: #2f80ed;
          font-size: 12px;
          font-weight: 800;
        }

        .produk-kosong {
          grid-column: 1 / -1;
          text-align: center;
          padding: 30px;
          color: #8794ab;
          font-size: 12px;
        }

        /* KERANJANG */

        .keranjang-panel {
          padding: 20px 22px;
          position: relative;
          z-index: 5;
          overflow: visible;
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

        .keranjang-title h2 {
          margin: 0;
          font-size: 16px;
          color: #10295c;
        }

        .cart-icon {
          position: relative;
          color: #2f80ed;
        }

        .cart-icon span {
          position: absolute;
          top: -7px;
          right: -8px;
          width: 15px;
          height: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #e2231a;
          color: white;
          font-size: 8px;
          font-weight: 800;
        }

        .hapus-semua {
          border: 0;
          background: transparent;
          color: #e2231a;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .hapus-semua:disabled {
          color: #c4cbdb;
          cursor: not-allowed;
        }

        /* MEMBER PROMO */

        .benefit-area {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-bottom: 13px;
          margin-bottom: 13px;
          border-bottom: 1px solid #eef2f7;
          position: relative;
          z-index: 30;
        }

        .benefit-box {
          position: relative;
        }

        .benefit-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .benefit-title > div:last-child {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .benefit-title strong {
          font-size: 10.5px;
          color: #25324a;
        }

        .benefit-title span {
          font-size: 8px;
          color: #9aa6b8;
        }

        .benefit-icon {
          width: 27px;
          height: 27px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .benefit-icon.member {
          background: #eff6ff;
          color: #2563eb;
        }

        .benefit-icon.promo {
          background: #fff7ed;
          color: #ea580c;
        }

        .benefit-trigger {
          width: 100%;
          border: 1px solid #e5eaf2;
          background: linear-gradient(135deg,#fff,#f9fbff);
          border-radius: 12px;
          padding: 8px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          text-align: left;
          cursor: pointer;
          transition: .2s;
        }

        .benefit-trigger:hover,
        .benefit-trigger.open {
          border-color: #93c5fd;
          box-shadow: 0 5px 16px rgba(37,99,235,.08);
        }

        .selected-left {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .selected-avatar {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          border-radius: 9px;
          background: linear-gradient(135deg,#2563eb,#60a5fa);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 900;
        }

        .selected-avatar.promo {
          background: linear-gradient(135deg,#f97316,#fb923c);
        }

        .selected-info {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .selected-info strong,
        .selected-info span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .selected-info strong {
          font-size: 10.5px;
          color: #172033;
        }

        .selected-info span {
          font-size: 8px;
          color: #94a3b8;
        }

        .rotate {
          transform: rotate(180deg);
          color: #2563eb;
        }

        /* DROPDOWN */

        .dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          padding: 9px;
          background: white;
          border: 1px solid #e4eaf2;
          border-radius: 14px;
          box-shadow: 0 18px 40px rgba(15,23,42,.14);
          z-index: 100;
          animation: dropdown .15s ease;
        }

        @keyframes dropdown {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2px 2px 8px;
        }

        .dropdown-top div {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .dropdown-top strong {
          font-size: 10.5px;
        }

        .dropdown-top span {
          font-size: 8px;
          color: #94a3b8;
        }

        .dropdown-top button {
          width: 24px;
          height: 24px;
          border: 0;
          border-radius: 7px;
          background: #f8fafc;
          color: #64748b;
          cursor: pointer;
        }

        .dropdown-search {
          height: 32px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 8px;
          background: #f8fafc;
          border: 1px solid #e7ecf3;
          border-radius: 8px;
          margin-bottom: 6px;
        }

        .dropdown-search svg {
          color: #94a3b8;
        }

        .dropdown-search input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          font-size: 9px;
        }

        .option-list {
          max-height: 175px;
          overflow-y: auto;
        }

        .option {
          width: 100%;
          min-height: 45px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px;
          border: 1px solid transparent;
          border-radius: 9px;
          background: transparent;
          text-align: left;
          cursor: pointer;
        }

        .option:hover {
          background: #f8fafc;
        }

        .option.selected {
          background: #eff6ff;
          border-color: #dbeafe;
        }

        .option-icon,
        .member-avatar {
          width: 30px;
          height: 30px;
          flex-shrink: 0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .option-icon.general {
          background: #f1f5f9;
          color: #64748b;
        }

        .option-icon.no-promo {
          background: #fff7ed;
          color: #ea580c;
        }

        .member-avatar {
          background: #dbeafe;
          color: #1d4ed8;
          font-size: 9px;
          font-weight: 900;
        }

        .promo-percent {
          width: 36px;
          height: 30px;
          flex-shrink: 0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff1df;
          color: #ea580c;
          font-size: 9px;
          font-weight: 900;
        }

        .option-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .option-info strong,
        .option-info span,
        .option-info small {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .option-info strong {
          font-size: 9.5px;
          color: #1e293b;
        }

        .option-info span {
          font-size: 8px;
          color: #64748b;
        }

        .option-info small {
          font-size: 7.5px;
          color: #94a3b8;
        }

        .empty {
          min-height: 90px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: #cbd5e1;
          text-align: center;
        }

        .empty strong {
          color: #64748b;
          font-size: 9px;
        }

        .empty span {
          color: #a3afbf;
          font-size: 7.5px;
        }

        /* CART */

        .cart-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 360px;
          overflow-y: auto;
          margin-bottom: 10px;
        }

        .cart-empty {
          padding: 25px;
          text-align: center;
          color: #8794ab;
          font-size: 12px;
        }

        .cart-item {
          display: flex;
          gap: 10px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f4f6fb;
        }

        .item-image {
          width: 52px;
          height: 52px;
          position: relative;
          flex-shrink: 0;
          border-radius: 10px;
          background: #f4f7fc;
          overflow: hidden;
        }

        .item-image img {
          object-fit: contain;
          padding: 6px;
        }

        .item-info {
          flex: 1;
          min-width: 0;
        }

        .item-name-row {
          display: flex;
          justify-content: space-between;
          gap: 5px;
        }

        .item-name-row span {
          font-size: 12px;
          font-weight: 700;
        }

        .item-name-row button {
          border: 0;
          background: transparent;
          color: #c4cbdb;
          cursor: pointer;
        }

        .item-name-row button:hover {
          color: #e2231a;
        }

        .item-price {
          margin-top: 2px;
          color: #2f80ed;
          font-size: 11px;
          font-weight: 700;
        }

        .item-bottom {
          margin-top: 7px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .qty {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .qty button {
          width: 23px;
          height: 23px;
          border: 1px solid #e6ebf3;
          border-radius: 7px;
          background: white;
          color: #2f80ed;
          cursor: pointer;
        }

        .qty span {
          min-width: 15px;
          text-align: center;
          font-size: 11px;
          font-weight: 700;
        }

        .item-bottom strong {
          color: #10295c;
          font-size: 11.5px;
        }

        .footer {
          border-top: 1px solid #f0f2f8;
          padding-top: 13px;
        }

        .summary,
        .total-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .summary {
          margin-bottom: 7px;
          color: #8794ab;
          font-size: 11px;
        }

        .summary strong {
          color: #4b5875;
        }

        .discount span {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #ef8c00;
        }

        .discount strong {
          color: #ef8c00;
        }

        .total-row {
          margin: 12px 0;
          color: #10295c;
          font-size: 15px;
        }

        .total-row strong:last-child {
          font-size: 18px;
        }

        .pay {
          width: 100%;
          border: 0;
          border-radius: 11px;
          padding: 12px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 7px;
          background: #2f80ed;
          color: white;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
        }

        .pay:hover:not(:disabled) {
          background: #1c67cf;
        }

        .pay:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .trust {
          margin-top: 12px;
          padding: 10px 12px;
          display: flex;
          gap: 8px;
          background: #f4f7fc;
          border-radius: 10px;
          color: #2f80ed;
        }

        .trust div {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .trust strong {
          color: #16233d;
          font-size: 10px;
        }

        .trust span {
          color: #8794ab;
          font-size: 8.5px;
        }

        @media (max-width: 1150px) {
          .panel-row {
            grid-template-columns: 1fr;
          }

          .produk-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 640px) {
          .produk-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .topbar {
            margin: 10px;
          }

          .content {
            padding: 10px;
          }

          .topbar-search {
            max-width: none;
          }

          .user-block {
            display: none;
          }

          .dropdown {
            position: fixed;
            left: 16px;
            right: 16px;
            top: 50%;
            max-height: 80vh;
            overflow-y: auto;
          }
        }
      `}</style>
    </div>
  );
}