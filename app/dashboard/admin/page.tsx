'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Home,
  Monitor,
  Package,
  Warehouse,
  ChevronDown,
  Search,
  Bell,
  User,
  ShoppingBag,
  Receipt,
  Boxes,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

type SesiUser = {
  nama: string;
  email: string;
  role: string;
};

const dataPenjualan = [
  { tanggal: '22 Apr', total: 5 },
  { tanggal: '23 Apr', total: 6 },
  { tanggal: '24 Apr', total: 7 },
  { tanggal: '25 Apr', total: 9 },
  { tanggal: '26 Apr', total: 10.2 },
  { tanggal: '27 Apr', total: 10 },
  { tanggal: '28 Apr', total: 15 },
];

const produkTerlaris = [
  { no: 1, nama: 'Indomie Goreng', terjual: 245 },
  { no: 2, nama: 'Aqua 600ml', terjual: 198 },
  { no: 3, nama: 'Roma Malkist', terjual: 176 },
  { no: 4, nama: 'Segitiga Biru', terjual: 142 },
  { no: 5, nama: 'Coca-Cola 1.5L', terjual: 120 },
];

const statCards = [
  {
    label: 'Total Penjualan Hari Ini',
    value: 'Rp 12.450.000',
    note: '↑ 12% dari kemarin',
    Icon: ShoppingBag,
    gradient: 'linear-gradient(135deg, #ff9a56, #ff6b6b)',
  },
  {
    label: 'Total Transaksi',
    value: '48',
    note: '↑ 8% dari kemarin',
    Icon: Receipt,
    gradient: 'linear-gradient(135deg, #3ecfcf, #2bb3a3)',
  },
  {
    label: 'Total Produk',
    value: '248',
    note: 'Produk aktif',
    Icon: Boxes,
    gradient: 'linear-gradient(135deg, #ff6b8a, #e2231a)',
  },
  {
    label: 'Stok Menipis',
    value: '12',
    note: 'Produk ≤ 5 stok',
    Icon: AlertTriangle,
    gradient: 'linear-gradient(135deg, #4f9eff, #1e6fd9)',
  },
];

const navItems = [
  { id: 'dashboard', label: 'Dashboard', Icon: Home, hasSub: false },
  { id: 'pos', label: 'POS', Icon: Monitor, hasSub: true },
  { id: 'inventory', label: 'Inventory', Icon: Package, hasSub: true },
  { id: 'warehouse', label: 'Warehouse', Icon: Warehouse, hasSub: true },
];

export default function DashboardAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<SesiUser | null>(null);
  const [activeNav, setActiveNav] = useState('dashboard');

  useEffect(() => {
    const raw = localStorage.getItem('indomart_user');

    if (!raw) {
      router.push('/login');
      return;
    }

    const sesi: SesiUser = JSON.parse(raw);

    if (sesi.role !== 'admin') {
      router.push('/login');
      return;
    }

    setUser(sesi);
  }, [router]);

  const namaTampil = user?.nama ?? 'Admin';
  const emailTampil = user?.email ?? 'admin@indomart.com';

  return (
    <div className="dash-wrapper">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">
            <Image
              src="/logo-indomart2.png"
              alt="Logo Indomart"
              fill
              className="brand-logo-img"
              priority
            />
          </div>
        </div>

        <nav className="nav">
          {navItems.map((item) => {
            const Icon = item.Icon;
            const active = activeNav === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => setActiveNav(item.id)}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
                {item.hasSub && (
                  <ChevronDown
                    size={15}
                    strokeWidth={1.8}
                    className="nav-chevron"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="profile-avatar">
            <User size={16} strokeWidth={1.8} />
          </div>
          <div className="profile-text">
            <div className="profile-name">{namaTampil}</div>
            <div className="profile-email">{emailTampil}</div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="search-field">
            <Search size={16} strokeWidth={1.8} />
            <input type="text" placeholder="Cari menu atau fitur..." />
          </div>

          <div className="topbar-actions">
            <button type="button" className="icon-btn" aria-label="Notifikasi">
              <Bell size={18} strokeWidth={1.8} />
              <span className="notif-dot" />
            </button>

            <div className="topbar-profile">
              <div className="topbar-avatar">
                <User size={15} strokeWidth={1.8} />
              </div>
              <span>{namaTampil}</span>
              <ChevronDown size={14} strokeWidth={1.8} />
            </div>
          </div>
        </header>

        <main className="content">
          <div className="page-title">
            <h1>Dashboard</h1>
            <p>Selamat datang, {namaTampil}!</p>
            <span className="page-subtitle">
              Berikut ringkasan aktivitas di Indomart Management System.
            </span>
          </div>

          <section className="stat-grid">
            {statCards.map((card) => {
              const Icon = card.Icon;

              return (
                <div
                  key={card.label}
                  className="stat-card"
                  style={{ background: card.gradient }}
                >
                  <div className="stat-icon">
                    <Icon size={18} strokeWidth={1.8} />
                  </div>
                  <div className="stat-label">{card.label}</div>
                  <div className="stat-value">{card.value}</div>
                  <div className="stat-note">{card.note}</div>
                </div>
              );
            })}
          </section>

          <section className="panels">
            <div className="panel chart-panel">
              <h2>Grafik Penjualan (7 Hari Terakhir)</h2>

              <div className="chart-holder">
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart data={dataPenjualan} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f8" />
                    <XAxis
                      dataKey="tanggal"
                      tick={{ fontSize: 11, fill: '#8292ad' }}
                      axisLine={{ stroke: '#e1e7f0' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#8292ad' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}jt`}
                    />
                    <Tooltip
                      formatter={(value) => [`Rp ${value} jt`, 'Penjualan']}
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e1e7f0',
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#2b7de9"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#2b7de9', strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel table-panel">
              <h2>Produk Terlaris</h2>

              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Produk</th>
                    <th>Terjual</th>
                  </tr>
                </thead>
                <tbody>
                  {produkTerlaris.map((p) => (
                    <tr key={p.no}>
                      <td>{p.no}</td>
                      <td>{p.nama}</td>
                      <td>{p.terjual}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      <style jsx>{`
        .dash-wrapper {
          display: flex;
          min-height: 100vh;
          background: #f4f6fb;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        }

        .sidebar {
          width: 230px;
          flex-shrink: 0;
          background: #ffffff;
          border-right: 1px solid #edf1f7;
          display: flex;
          flex-direction: column;
          padding: 18px 14px;
          box-sizing: border-box;
        }

        .brand {
          padding: 4px 6px 18px;
        }

        .brand-logo {
          position: relative;
          width: 140px;
          height: 46px;
        }

        .brand-logo-img {
          object-fit: contain !important;
        }

        .nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          border: none;
          background: transparent;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #47546b;
          cursor: pointer;
          text-align: left;
        }

        .nav-item span {
          flex: 1;
        }

        .nav-chevron {
          color: #a7b2c5;
        }

        .nav-item:hover {
          background: #f2f6fc;
        }

        .nav-item.active {
          background: #1e6fd9;
          color: #ffffff;
        }

        .nav-item.active .nav-chevron {
          color: #dbe9fd;
        }

        .sidebar-footer {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 10px 4px;
          border-top: 1px solid #edf1f7;
        }

        .profile-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #eef4ff;
          color: #1e6fd9;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .profile-text {
          min-width: 0;
        }

        .profile-name {
          font-size: 12px;
          font-weight: 700;
          color: #16233d;
        }

        .profile-email {
          font-size: 10px;
          color: #8292ad;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 16px 28px;
          background: #ffffff;
          border-bottom: 1px solid #edf1f7;
        }

        .search-field {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f4f6fb;
          border-radius: 8px;
          padding: 8px 14px;
          width: 100%;
          max-width: 420px;
          color: #8292ad;
        }

        .search-field input {
          border: none;
          outline: none;
          background: transparent;
          font-size: 12px;
          flex: 1;
          color: #16233d;
        }

        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .icon-btn {
          position: relative;
          border: none;
          background: transparent;
          color: #47546b;
          cursor: pointer;
          display: flex;
        }

        .notif-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #e2231a;
          border: 1.5px solid #ffffff;
        }

        .topbar-profile {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          color: #16233d;
          cursor: pointer;
        }

        .topbar-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #eef4ff;
          color: #1e6fd9;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .content {
          padding: 26px 28px 40px;
          overflow-y: auto;
        }

        .page-title h1 {
          margin: 0 0 4px;
          font-size: 22px;
          font-weight: 800;
          color: #10295c;
        }

        .page-title p {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          color: #16233d;
        }

        .page-subtitle {
          display: block;
          font-size: 12px;
          color: #6b7690;
          margin-top: 2px;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin: 22px 0;
        }

        .stat-card {
          border-radius: 12px;
          padding: 16px 18px;
          color: #ffffff;
          box-shadow: 0 8px 20px rgba(15, 40, 90, 0.1);
        }

        .stat-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }

        .stat-label {
          font-size: 11.5px;
          font-weight: 600;
          opacity: 0.92;
          margin-bottom: 6px;
        }

        .stat-value {
          font-size: 21px;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .stat-note {
          font-size: 10.5px;
          opacity: 0.9;
        }

        .panels {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 16px;
        }

        .panel {
          background: #ffffff;
          border-radius: 12px;
          padding: 18px 20px;
          box-shadow: 0 8px 20px rgba(15, 40, 90, 0.05);
        }

        .panel h2 {
          margin: 0 0 14px;
          font-size: 14px;
          font-weight: 700;
          color: #16233d;
        }

        .chart-holder {
          width: 100%;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        thead th {
          text-align: left;
          font-size: 10.5px;
          text-transform: none;
          color: #8292ad;
          font-weight: 700;
          padding: 0 0 8px;
          border-bottom: 1px solid #edf1f7;
        }

        tbody td {
          font-size: 12.5px;
          color: #16233d;
          padding: 10px 0;
          border-bottom: 1px solid #f4f6fb;
        }

        tbody tr:last-child td {
          border-bottom: none;
        }

        @media (max-width: 1100px) {
          .stat-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .panels {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 780px) {
          .dash-wrapper {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
            flex-direction: row;
            align-items: center;
            overflow-x: auto;
          }

          .nav {
            flex-direction: row;
          }

          .sidebar-footer {
            display: none;
          }

          .stat-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}