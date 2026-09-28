'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SidebarKasir from '../../components/SidebarKasir';
import RiwayatTransaksiPanel from '../../components/RiwayatTransaksiPanel';
import {
  Store,
  Wallet,
  LogOut,
  Package,
  TrendingUp,
  CalendarDays,
  Clock as ClockIcon,
  Box,
  ChevronRight,
  ArrowRight,
  History,
  Sparkles,
} from 'lucide-react';

type ProdukTerlaris = {
  no: number;
  nama: string;
  terjual: number;
};

type Ringkasan = {
  hariIni: {
    totalPenjualan: number;
    jumlahTransaksi: number;
    jumlahItem: number;
  };
  keseluruhan: {
    totalPenjualan: number;
    jumlahTransaksi: number;
  };
};

type TransaksiHariIni = {
  id: number;
  nomor: string;
  waktu: string;
  jumlahItem: number;
  total: number;
  status: string;
};

function formatTanggalPanjang(d: Date): string {
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatJamSekarang(d: Date): string {
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatJamTransaksi(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRupiah(angka: number): string {
  return 'Rp ' + angka.toLocaleString('id-ID');
}

const MEDALI = ['#f5b53d', '#b9c2d0', '#d99a5b'];

export default function DashboardKasirPage() {
  const router = useRouter();
  const [sekarang, setSekarang] = useState<Date | null>(null);
  const [namaUser, setNamaUser] = useState('Kasir');

  const [ringkasan, setRingkasan] = useState<Ringkasan | null>(null);
  const [produkTerlaris, setProdukTerlaris] = useState<ProdukTerlaris[]>([]);
  const [transaksiHariIni, setTransaksiHariIni] = useState<TransaksiHariIni[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRiwayat, setShowRiwayat] = useState(false);

  useEffect(() => {
    setSekarang(new Date());
    const interval = setInterval(() => setSekarang(new Date()), 1000);

    try {
      const raw = localStorage.getItem('currentUser');
      if (raw) {
        const user = JSON.parse(raw);
        if (user?.nama) setNamaUser(user.nama);
      }
    } catch {
      // biarkan default "Kasir"
    }

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function muatSemua() {
      setLoading(true);

      try {
        const [resRingkasan, resTerlaris, resTransaksi] = await Promise.all([
          fetch('/api/dashboard/summary'),
          fetch('/api/dashboard/produk-terlaris?limit=5'),
          fetch('/api/transactions'),
        ]);

        if (resRingkasan.ok) {
          setRingkasan(await resRingkasan.json());
        }

        if (resTerlaris.ok) {
          setProdukTerlaris(await resTerlaris.json());
        }

        if (resTransaksi.ok) {
          setTransaksiHariIni(await resTransaksi.json());
        }
      } catch (err) {
        console.error('Gagal memuat data dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    muatSemua();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/kasir-logout', { method: 'POST' });
      localStorage.removeItem('currentUser');
    } catch {
      // abaikan error logout
    }

    router.push('/login');
  };

  return (
    <div className="wrapper">
      <SidebarKasir />

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <div className="store-icon">
              <Store size={20} strokeWidth={1.8} color="#ffffff" />
            </div>

            <div>
              <div className="store-name">Indomaret</div>
              <div className="store-sub">Toko Pusat</div>
            </div>
          </div>

          <div className="topbar-right">
            {/* Tanggal dan jam dipindahkan ke sini */}
            <div className="topbar-datetime">
              <div className="datetime-item">
                <CalendarDays size={15} strokeWidth={1.8} />
                <span>
                  {sekarang ? formatTanggalPanjang(sekarang) : '...'}
                </span>
              </div>

              <div className="datetime-item">
                <ClockIcon size={15} strokeWidth={1.8} />
                <span>
                  {sekarang ? formatJamSekarang(sekarang) : '...'}
                </span>
              </div>
            </div>

            <div className="user-block">
              <div className="avatar">
                {namaUser.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="user-name">{namaUser}</div>
                <div className="user-role">Kasir</div>
              </div>
            </div>

            <button
              className="icon-btn round"
              aria-label="Logout"
              title="Logout"
              onClick={handleLogout}
            >
              <LogOut size={15} strokeWidth={2.1} />
            </button>
          </div>
        </header>

        <main className="content">
          <div className="stat-grid">
            <div className="stat-card blue">
              <div className="stat-glow" />

              <div className="stat-icon">
                <Wallet
                  size={19}
                  strokeWidth={1.9}
                  color="#ffffff"
                />
              </div>

              <div className="stat-label">
                Total Penjualan Hari Ini
              </div>

              <div className="stat-value">
                {loading
                  ? '...'
                  : formatRupiah(
                      ringkasan?.hariIni.totalPenjualan ?? 0
                    )}
              </div>

              <div className="stat-sub">
                {loading
                  ? ''
                  : `${ringkasan?.hariIni.jumlahTransaksi ?? 0} transaksi`}
              </div>
            </div>

            <div className="stat-card orange">
              <div className="stat-glow" />

              <div className="stat-icon">
                <Package
                  size={19}
                  strokeWidth={1.9}
                  color="#ffffff"
                />
              </div>

              <div className="stat-label">
                Jumlah Item Terjual
              </div>

              <div className="stat-value">
                {loading
                  ? '...'
                  : ringkasan?.hariIni.jumlahItem ?? 0}
              </div>

              <div className="stat-sub">
                item terjual hari ini
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-glow" />

              <div className="stat-icon">
                <TrendingUp
                  size={19}
                  strokeWidth={1.9}
                  color="#ffffff"
                />
              </div>

              <div className="stat-label">
                Total Penjualan Keseluruhan
              </div>

              <div className="stat-value">
                {loading
                  ? '...'
                  : formatRupiah(
                      ringkasan?.keseluruhan.totalPenjualan ?? 0
                    )}
              </div>

              <div className="stat-sub-row">
                <span className="stat-sub">
                  {loading
                    ? ''
                    : `${ringkasan?.keseluruhan.jumlahTransaksi ?? 0} transaksi`}
                </span>

                <button
                  className="lihat-riwayat-btn"
                  onClick={() => setShowRiwayat(true)}
                >
                  <History size={12} strokeWidth={2.2} />
                  Lihat Riwayat
                </button>
              </div>
            </div>
          </div>

          <div className="panel table-panel">
            <div className="panel-head">
              <div className="panel-title">
                <div className="panel-icon blue-tint">
                  <Box
                    size={16}
                    strokeWidth={2}
                    color="#4f6bed"
                  />
                </div>

                <div>
                  <h2>Produk Terlaris</h2>
                  <p className="panel-sub">
                    Ranking penjualan produk
                  </p>
                </div>
              </div>

              <Link
                href="/laporan-penjualan"
                className="lihat-semua-link"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#4f6bed',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Lihat Semua
                <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Produk</th>
                    <th className="right">Terjual</th>
                    <th className="chevron-col" />
                  </tr>
                </thead>

                <tbody>
                  {produkTerlaris.map((p) => (
                    <tr key={p.no}>
                      <td>
                        <span
                          className="no-badge"
                          style={
                            MEDALI[p.no - 1]
                              ? {
                                  background: MEDALI[p.no - 1],
                                  color: '#ffffff',
                                }
                              : undefined
                          }
                        >
                          {p.no}
                        </span>
                      </td>

                      <td>{p.nama}</td>

                      <td className="right">
                        <span className="terjual-pill">
                          {p.terjual} terjual
                        </span>
                      </td>

                      <td className="chevron-col">
                        <ChevronRight
                          size={15}
                          strokeWidth={2}
                          color="#c4cbdb"
                        />
                      </td>
                    </tr>
                  ))}

                  {!loading && produkTerlaris.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="kosong-text"
                      >
                        Belum ada penjualan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel riwayat-panel">
            <div className="panel-head">
              <div className="panel-title">
                <div className="panel-icon blue-tint">
                  <ClockIcon
                    size={16}
                    strokeWidth={2}
                    color="#4f6bed"
                  />
                </div>

                <div>
                  <h2>Riwayat Transaksi Hari Ini</h2>
                  <p className="panel-sub">
                    Daftar transaksi yang sudah selesai
                  </p>
                </div>
              </div>

              <button
                className="lihat-semua-link"
                onClick={() => setShowRiwayat(true)}
                type="button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#4f6bed',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Lihat Semua
                <ArrowRight size={14} strokeWidth={2} />
              </button>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>No. Transaksi</th>
                    <th>Waktu</th>
                    <th className="right">Jumlah Item</th>
                    <th className="right">Total</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {transaksiHariIni.map((t) => (
                    <tr key={t.id}>
                      <td className="trx-nomor-cell">
                        {t.nomor}
                      </td>

                      <td>
                        {formatJamTransaksi(t.waktu)}
                      </td>

                      <td className="right">
                        {t.jumlahItem} item
                      </td>

                      <td className="right">
                        {formatRupiah(t.total)}
                      </td>

                      <td>
                        <span className="status-pill">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {!loading && transaksiHariIni.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="kosong-text"
                      >
                        Belum ada transaksi hari ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <RiwayatTransaksiPanel
        open={showRiwayat}
        onClose={() => setShowRiwayat(false)}
      />

      <style jsx>{`
        .wrapper {
          display: flex;
          min-height: 100vh;
          background: #f5f7fb;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          color: #182136;
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
          border-bottom: 1px solid #edf0f7;
          padding: 14px 28px;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .store-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: linear-gradient(
            135deg,
            #5b7cf5 0%,
            #3654d6 100%
          );
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 6px 14px rgba(59, 92, 219, 0.28);
        }

        .store-name {
          font-weight: 800;
          font-size: 14px;
          color: #101a33;
          line-height: 1.25;
          letter-spacing: -0.2px;
        }

        .store-sub {
          font-size: 11px;
          color: #96a1b8;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .topbar-datetime {
          display: flex;
          align-items: center;
          gap: 16px;
          color: #182136;
          margin-right: 2px;
        }

        .datetime-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          color: #182136;
          white-space: nowrap;
        }

        .icon-btn {
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #5b6478;
        }

        .icon-btn.round {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #eef2ff;
          color: #3654d6;
          transition: background 0.15s ease, transform 0.15s ease;
        }

        .icon-btn.round:hover {
          background: #dfe6ff;
          transform: translateY(-1px);
        }

        .user-block {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            #dfe8ff 0%,
            #c7d6ff 100%
          );
          color: #2a48b8;
          font-weight: 800;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-name {
          font-size: 12.5px;
          font-weight: 700;
          color: #182136;
          line-height: 1.25;
        }

        .user-role {
          font-size: 10.5px;
          color: #96a1b8;
        }

        .content {
          padding: 28px 28px 44px;
          max-width: 1180px;
          width: 100%;
          overflow-x: hidden;
        }

        .table-scroll {
          overflow-x: auto;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 22px;
        }

        .stat-card {
          position: relative;
          overflow: hidden;
          border-radius: 18px;
          padding: 20px 22px;
          color: #ffffff;
          isolation: isolate;
        }

        .stat-glow {
          position: absolute;
          top: -40px;
          right: -30px;
          width: 130px;
          height: 130px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.14);
          z-index: -1;
        }

        .stat-card.blue {
          background: linear-gradient(
            135deg,
            #5b8bf5 0%,
            #3654d6 100%
          );
          box-shadow: 0 14px 28px rgba(54, 84, 214, 0.25);
        }

        .stat-card.orange {
          background: linear-gradient(
            135deg,
            #f8b85c 0%,
            #f0902f 100%
          );
          box-shadow: 0 14px 28px rgba(240, 144, 47, 0.22);
        }

        .stat-card.green {
          background: linear-gradient(
            135deg,
            #3fcf7f 0%,
            #1fa85c 100%
          );
          box-shadow: 0 14px 28px rgba(31, 168, 92, 0.22);
        }

        .stat-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.24);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 22px;
        }

        .stat-label {
          font-size: 12.5px;
          font-weight: 600;
          opacity: 0.92;
          margin-bottom: 6px;
        }

        .stat-value {
          font-size: 21px;
          font-weight: 800;
          margin-bottom: 4px;
          letter-spacing: -0.3px;
        }

        .stat-sub {
          font-size: 11.5px;
          opacity: 0.85;
        }

        .stat-sub-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 6px;
        }

        .lihat-riwayat-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(255, 255, 255, 0.22);
          border: none;
          border-radius: 999px;
          padding: 6px 11px;
          font-size: 10.5px;
          font-weight: 700;
          color: #ffffff;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .lihat-riwayat-btn:hover {
          background: rgba(255, 255, 255, 0.34);
        }

        .panel {
          background: #ffffff;
          border: 1px solid #eef1f8;
          border-radius: 20px;
          padding: 20px 22px 18px;
          box-shadow: 0 12px 28px rgba(16, 41, 92, 0.05);
          min-width: 0;
          margin-bottom: 16px;
        }

        .table-panel,
        .riwayat-panel {
          padding: 18px 22px 22px;
          box-sizing: border-box;
        }

        .panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: nowrap;
          gap: 10px;
          margin-bottom: 14px;
        }

        .panel-head .lihat-semua-link {
          flex-shrink: 0;
        }

        .panel-title {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .panel h2,
        .panel-sub {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .panel-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .panel-icon.blue-tint {
          background: #eef2ff;
        }

        .panel h2 {
          margin: 0;
          font-size: 14.5px;
          font-weight: 800;
          color: #101a33;
        }

        .panel-sub {
          margin: 1px 0 0;
          font-size: 11px;
          color: #96a1b8;
        }

        .lihat-semua-link {
          background: none;
          border: none;
          cursor: pointer;
          color: #4f6bed;
          font-size: 12px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          padding: 6px 10px;
          border-radius: 8px;
          transition: background 0.15s ease;
        }

        .lihat-semua-link:hover {
          background: #eef2ff;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12.5px;
        }

        thead th {
          text-align: left;
          font-size: 10.5px;
          color: #8b95ac;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          padding: 9px 0 9px 14px;
          background: #f4f6fc;
        }

        thead th:first-child {
          border-top-left-radius: 10px;
          border-bottom-left-radius: 10px;
        }

        thead th:last-child {
          border-top-right-radius: 10px;
          border-bottom-right-radius: 10px;
        }

        thead th.chevron-col {
          border-top-right-radius: 10px;
          border-bottom-right-radius: 10px;
        }

        thead th.right,
        td.right {
          text-align: right;
        }

        thead th.chevron-col,
        td.chevron-col {
          width: 24px;
          padding-left: 8px;
        }

        tbody td {
          padding: 12px 8px 12px 14px;
          border-bottom: 1px solid #f4f6fb;
          color: #223561;
          font-weight: 700;
          font-size: 12.5px;
        }

        tbody tr:last-child td {
          border-bottom: none;
        }

        tbody tr:hover td {
          background: #fafbff;
        }

        tbody td:first-child {
          padding-left: 14px;
        }

        .table-panel tbody td:first-child {
          padding-left: 0;
          text-align: center;
          width: 40px;
        }

        .trx-nomor-cell {
          color: #101a33;
        }

        .terjual-pill {
          display: inline-block;
          background: #eef2ff;
          color: #3654d6;
          font-size: 11px;
          font-weight: 700;
          border-radius: 999px;
          padding: 3px 11px;
        }

        .status-pill {
          display: inline-block;
          background: #e7f9ee;
          color: #1fa85c;
          font-size: 10.5px;
          font-weight: 700;
          border-radius: 999px;
          padding: 4px 11px;
        }

        .kosong-text {
          text-align: center;
          padding: 26px 0 !important;
          color: #96a1b8;
          font-weight: 500 !important;
        }

        .no-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #eef2ff;
          color: #3654d6;
          font-weight: 800;
          font-size: 11.5px;
        }

        @media (max-width: 1100px) {
          .stat-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}