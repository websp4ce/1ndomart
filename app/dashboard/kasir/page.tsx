'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SidebarKasir from '../../components/SidebarKasir';
import {
  Store,
  Wallet,
  Bell,
  LogOut,
  Package,
  TrendingUp,
  Clock as ClockIcon,
  CalendarDays,
  BarChart3,
  Box,
  ChevronDown,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

type ProdukTerlaris = {
  no: number;
  nama: string;
  terjual: number;
};

const produkTerlarisDummy: ProdukTerlaris[] = [
  { no: 1, nama: 'Indomie Goreng', terjual: 245 },
  { no: 2, nama: 'Aqua 600ml', terjual: 198 },
  { no: 3, nama: 'Roma Malkist', terjual: 176 },
  { no: 4, nama: 'Segitiga Biru', terjual: 142 },
  { no: 5, nama: 'Coca-Cola 1.5L', terjual: 120 },
];

const penjualanMingguDummy = [
  12_300_000, 14_200_000, 11_800_000, 16_700_000, 10_500_000, 12_100_000,
  17_600_000,
];

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diffKeSenin = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffKeSenin);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDates(baseDate: Date): Date[] {
  const senin = getMondayOfWeek(baseDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(senin);
    d.setDate(senin.getDate() + i);
    return d;
  });
}

function formatTanggalPendek(d: Date): string {
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

function formatTanggalPanjang(d: Date): string {
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatJam(d: Date): string {
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatRupiah(angka: number): string {
  return 'Rp ' + angka.toLocaleString('id-ID');
}

function formatJutaAxis(angka: number): string {
  if (angka === 0) return '0';
  return `${(angka / 1_000_000).toLocaleString('id-ID')}jt`;
}

function formatRupiahJutaSingkat(angka: number): string {
  const jt = angka / 1_000_000;
  return `Rp ${jt.toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
}

export default function DashboardKasirPage() {
  const router = useRouter();
  const [sekarang, setSekarang] = useState<Date | null>(null);
  const [namaUser, setNamaUser] = useState('Kasir');

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

const handleLogout = async () => {
  try {
    await fetch('/api/auth/kasir-logout', {
      method: 'POST',
    });

    localStorage.removeItem('currentUser');
  } catch {
    // abaikan error logout
  }

  router.push('/login');
};

  const tanggalMinggu = getWeekDates(sekarang ?? new Date());
  const nilaiPenjualan = penjualanMingguDummy;

  const maxNilai = Math.max(...nilaiPenjualan);
  const skalaMax = Math.max(5_000_000, Math.ceil(maxNilai / 5_000_000) * 5_000_000);
  const jumlahTick = 5;
  const tickValues = Array.from({ length: jumlahTick }, (_, i) =>
    Math.round((skalaMax / (jumlahTick - 1)) * i)
  ).reverse();

  const totalTransaksiHariIni = 48;
  const totalRupiahHariIni = 12_450_000;
  const jumlahItemTerjual = 248;
  const rataRataPerTransaksi = Math.round(totalRupiahHariIni / totalTransaksiHariIni);
  const transaksiPending = 2;

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
              <div className="store-sub">Toko Pusat</div>
            </div>
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

            <button
              className="icon-btn round"
              aria-label="Logout"
              title="Logout"
              onClick={handleLogout}
            >
              <LogOut size={15} strokeWidth={2.1} color="#2f80ed" />
            </button>
          </div>
        </header>

        <main className="content">
          <div className="page-title-row">
            <div>
              <h1>Dashboard Kasir</h1>
              <p>Selamat datang, {namaUser}! Semoga hari ini penuh transaksi.</p>
            </div>

            <div className="badges">
              <span className="badge">
                <CalendarDays size={14} strokeWidth={1.8} color="#37415a" />
                {sekarang ? formatTanggalPanjang(sekarang) : '...'}
              </span>
              <span className="badge">
                <ClockIcon size={14} strokeWidth={1.8} color="#37415a" />
                {sekarang ? formatJam(sekarang) : '...'}
              </span>
            </div>
          </div>

          <div className="stat-grid">
            <div className="stat-card blue">
              <div className="stat-icon">
                <Wallet size={18} strokeWidth={1.9} color="#ffffff" />
              </div>
              <div className="stat-label">Total Transaksi Hari Ini</div>
              <div className="stat-value">{formatRupiah(totalRupiahHariIni)}</div>
              <div className="stat-sub">{totalTransaksiHariIni} transaksi</div>
            </div>

            <div className="stat-card orange">
              <div className="stat-icon">
                <Package size={18} strokeWidth={1.9} color="#ffffff" />
              </div>
              <div className="stat-label">Jumlah Item Terjual</div>
              <div className="stat-value">{jumlahItemTerjual}</div>
              <div className="stat-sub">produk</div>
            </div>

            <div className="stat-card green">
              <div className="stat-icon">
                <TrendingUp size={18} strokeWidth={1.9} color="#ffffff" />
              </div>
              <div className="stat-label">Rata-rata per Transaksi</div>
              <div className="stat-value">{formatRupiah(rataRataPerTransaksi)}</div>
              <div className="stat-sub">&nbsp;</div>
            </div>

            <div className="stat-card red">
              <div className="stat-icon">
                <ClockIcon size={18} strokeWidth={1.9} color="#ffffff" />
              </div>
              <div className="stat-label">Transaksi Pending</div>
              <div className="stat-value">{transaksiPending}</div>
              <div className="stat-sub">transaksi</div>
            </div>
          </div>

          <div className="bottom-grid">
            <div className="panel chart-panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="panel-icon blue-tint">
                    <BarChart3 size={16} strokeWidth={2} color="#2f80ed" />
                  </div>
                  <h2>Grafik Penjualan (7 Hari Terakhir)</h2>
                </div>
                <button className="dropdown-pill" type="button">
                  <CalendarDays size={13} strokeWidth={1.8} color="#37415a" />
                  7 Hari Terakhir
                  <ChevronDown size={13} strokeWidth={2} color="#8794ab" />
                </button>
              </div>

              <div className="chart">
                <div className="chart-axis">
                  {tickValues.map((v) => (
                    <span key={v}>{formatJutaAxis(v)}</span>
                  ))}
                </div>

                <div className="chart-bars">
                  {tanggalMinggu.map((tgl, i) => {
                    const nilai = nilaiPenjualan[i] ?? 0;
                    const tinggiPersen = (nilai / skalaMax) * 100;
                    return (
                      <div className="bar-col" key={tgl.toISOString()}>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{ height: `${tinggiPersen}%` }}
                            title={formatRupiah(nilai)}
                          >
                            <span className="bar-value">
                              {formatRupiahJutaSingkat(nilai)}
                            </span>
                          </div>
                        </div>
                        <span className="bar-label">{formatTanggalPendek(tgl)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="panel table-panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="panel-icon blue-tint">
                    <Box size={16} strokeWidth={2} color="#2f80ed" />
                  </div>
                  <h2>Produk Terlaris</h2>
                </div>
          <Link
  href="/laporan-penjualan"
  style={{
    color: '#2f80ed',
    fontSize: '12px',
    fontWeight: 700,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  }}
>
  Lihat Semua
  <ArrowRight size={14} strokeWidth={2} />
</Link>
              </div>

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
                  {produkTerlarisDummy.map((p) => (
                    <tr key={p.no}>
                      <td>
                        <span className="no-badge">{p.no}</span>
                      </td>
                      <td>{p.nama}</td>
                      <td className="right">{p.terjual}</td>
                      <td className="chevron-col">
                        <ChevronRight size={15} strokeWidth={2} color="#c4cbdb" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          </div>
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
          gap: 16px;
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

        .icon-btn.round {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #eaf2ff;
          transition: background 0.15s ease;
        }

        .icon-btn.round:hover {
          background: #d7e8ff;
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
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #dfeaff;
          color: #1646a0;
          font-weight: 800;
          font-size: 12.5px;
          display: flex;
          align-items: center;
          justify-content: center;
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
          padding: 22px 24px 36px;
        }

        .page-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 18px;
        }

        .page-title-row h1 {
          margin: 0 0 3px;
          font-size: 23px;
          font-weight: 800;
          color: #10295c;
        }

        .page-title-row p {
          margin: 0;
          font-size: 12.5px;
          color: #8794ab;
        }

        .badges {
          display: flex;
          gap: 8px;
        }

        .badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1px solid #e6ebf3;
          border-radius: 9px;
          padding: 7px 12px;
          font-size: 11.5px;
          font-weight: 700;
          color: #16233d;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .stat-card {
          border-radius: 12px;
          padding: 15px 17px;
          color: #ffffff;
        }

        .stat-card.blue {
          background: #2f80ed;
        }
        .stat-card.orange {
          background: #f5a742;
        }
        .stat-card.green {
          background: #27ae60;
        }
        .stat-card.red {
          background: #eb5757;
        }

        .stat-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .stat-label {
          font-size: 12px;
          font-weight: 600;
          opacity: 0.92;
          margin-bottom: 5px;
        }

        .stat-value {
          font-size: 19px;
          font-weight: 800;
          margin-bottom: 3px;
        }

        .stat-sub {
          font-size: 11px;
          opacity: 0.85;
        }

        .bottom-grid {
          display: grid;
          grid-template-columns: 1.7fr 1fr;
          align-items: start;
          gap: 14px;
          background: linear-gradient(135deg, #eef4ff 0%, #f6f9ff 100%);
          border-radius: 22px;
          padding: 10px;
          max-width: 1040px;
        }

       .panel {
  background: #ffffff;
  border: 1px solid #eef1f8;
  border-radius: 18px;
  padding: 18px 20px 16px;
  box-shadow: 0 10px 24px rgba(16, 41, 92, 0.06);
  min-width: 0;
}

.table-panel {
  padding: 14px 20px 20px;
  box-sizing: border-box;
}
        .panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  gap: 8px;
  margin-bottom: 12px;
}

        .panel-title {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .panel-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .panel-icon.blue-tint {
          background: #e9f1ff;
        }

        .panel h2 {
          margin: 0;
          font-size: 13.5px;
          font-weight: 800;
          color: #10295c;
        }

        .dropdown-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          background: #ffffff;
          border: 1px solid #e6ebf3;
          border-radius: 18px;
          padding: 6px 11px;
          font-size: 11px;
          font-weight: 700;
          color: #37415a;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .chart {
          display: flex;
          gap: 8px;
          height: 200px;
          max-width: 480px;
          margin: 0 auto;
        }

        .chart-axis {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          font-size: 10px;
          color: #9aa7bd;
          padding-bottom: 20px;
          flex-shrink: 0;
        }

        .chart-bars {
          flex: 1;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 8px;
          border-left: 1px solid #eef1f7;
          border-bottom: 1px solid #eef1f7;
          padding-left: 8px;
        }

        .bar-col {
          flex: 0 1 44px;
          max-width: 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }

        .bar-track {
          flex: 1;
          width: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .bar-fill {
          position: relative;
          width: 26px;
          background: linear-gradient(180deg, #7cb2ff 0%, #2f80ed 55%, #1c67cf 100%);
          border-radius: 7px 7px 0 0;
          transition: height 0.3s ease;
        }

        .bar-value {
          position: absolute;
          top: -18px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 9.5px;
          font-weight: 700;
          color: #10295c;
          white-space: nowrap;
        }

        .bar-label {
          margin-top: 8px;
          font-size: 10px;
          color: #8794ab;
          font-weight: 600;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        thead th {
          text-align: left;
          font-size: 10.5px;
          color: #8b95ac;
          font-weight: 700;
          padding: 7px 0 7px 12px;
          background: #eef1fb;
        }

        thead th:first-child {
          border-top-left-radius: 9px;
          border-bottom-left-radius: 9px;
        }

        thead th.chevron-col {
          border-top-right-radius: 9px;
          border-bottom-right-radius: 9px;
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
         padding: 3px 0 3px 12px;
          border-bottom: 1px solid #f4f6fb;
          color: #1d3f78;
          font-weight: 700;
          font-size: 12px;
        }

        tbody td:first-child {
          padding-left: 0;
          text-align: center;
          width: 34px;
        }

        .no-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #e4ecfd;
          color: #2f5fd0;
          font-weight: 800;
          font-size: 11.5px;
        }
          
        @media (max-width: 1100px) {
          .stat-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .bottom-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}