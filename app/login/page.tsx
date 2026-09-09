'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Monitor,
  Package,
  Home,
  ArrowRight,
} from 'lucide-react';

type Role = 'admin' | 'kasir' | 'inventory' | 'warehouse';

type Akun = {
  email: string;
  password: string;
  role: Role;
  nama: string;
};

const daftarAkun: Akun[] = [
  {
    email: 'admin@indomart.com',
    password: 'admin123',
    role: 'admin',
    nama: 'Admin',
  },
  {
    email: 'kasir@indomart.com',
    password: 'kasir123',
    role: 'kasir',
    nama: 'Aulia Rahma',
  },
  {
    email: 'inventory@indomart.com',
    password: 'inventory123',
    role: 'inventory',
    nama: 'Staff Inventory',
  },
  {
    email: 'warehouse@indomart.com',
    password: 'warehouse123',
    role: 'warehouse',
    nama: 'Staff Warehouse',
  },
];

const roleOptions: {
  id: Role;
  label: string;
  desc: string;
  Icon: typeof User;
}[] = [
  {
    id: 'admin',
    label: 'Admin',
    desc: 'Akses penuh ke semua fitur sistem',
    Icon: User,
  },
  {
    id: 'kasir',
    label: 'Kasir',
    desc: 'Akses ke fitur POS',
    Icon: Monitor,
  },
  {
    id: 'inventory',
    label: 'Staff Inventory',
    desc: 'Akses ke fitur Inventory',
    Icon: Package,
  },
  {
    id: 'warehouse',
    label: 'Staff Warehouse',
    desc: 'Akses ke fitur Warehouse',
    Icon: Home,
  },
];

const tujuanRedirect: Record<Role, string> = {
  admin: '/dashboard/admin',
  kasir: '/dashboard/kasir',
  inventory: '/dashboard/inventory',
  warehouse: '/dashboard/warehouse',
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tampilkanPassword, setTampilkanPassword] = useState(false);
  const [roleTerpilih, setRoleTerpilih] = useState<Role>('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleLogin() {
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email/Username dan Password wajib diisi.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const akun = daftarAkun.find(
        (a) =>
          a.email.toLowerCase() === email.trim().toLowerCase() &&
          a.password === password
      );

      if (!akun) {
        setError('Email/Username atau Password salah.');
        setLoading(false);
        return;
      }

      if (akun.role !== roleTerpilih) {
        setError(
          `Akun ini terdaftar sebagai "${
            roleOptions.find((r) => r.id === akun.role)?.label
          }", bukan role yang dipilih.`
        );
        setLoading(false);
        return;
      }

      // Simpan sesi user supaya bisa dipakai di header halaman-halaman berikutnya
      localStorage.setItem(
        'indomart_user',
        JSON.stringify({
          nama: akun.nama,
          email: akun.email,
          role: akun.role,
        })
      );

      router.push(tujuanRedirect[akun.role]);
    }, 600);
  }

  return (
    <div className="wrapper">
      <div className="left">
        <div className="text-block">
          <div className="logo-frame">
            <Image
              src="/logo-indomart2.png"
              alt="Logo Indomart"
              fill
              className="logo-img"
              priority
            />
          </div>

          <h1>
            Selamat Datang di
            <br />
            Indomart Management System
          </h1>

          <p className="subtitle">
            Kelola bisnis Indomart dengan lebih mudah, cepat, dan terintegrasi.
          </p>
        </div>
      </div>

      <div className="right">
        <div className="login-card">
          <div className="login-header">
            <User
              className="login-icon"
              size={27}
              strokeWidth={1.8}
            />

            <div>
              <h2>Login</h2>
              <p>Masuk ke akun Anda untuk melanjutkan</p>
            </div>
          </div>

          {error && (
            <div className="error-msg">
              {error}
            </div>
          )}

          <div className="field">
            <User
              className="field-icon"
              size={17}
              strokeWidth={1.8}
            />

            <input
              type="text"
              placeholder="Email / Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <Lock
              className="field-icon"
              size={17}
              strokeWidth={1.8}
            />

            <input
              type={tampilkanPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && handleLogin()
              }
            />

     <span
  className="field-toggle"
  onClick={() =>
    setTampilkanPassword(!tampilkanPassword)
  }
>
  {tampilkanPassword ? (
    <Eye
      size={17}
      strokeWidth={1.8}
    />
  ) : (
    <EyeOff
      size={17}
      strokeWidth={1.8}
    />
  )}
</span>
          </div>

          <div className="role-section">
            <h3>Pilih Role</h3>

            <p>
              Gunakan role yang sesuai dengan akun Anda
            </p>

            <div className="role-grid">
              {roleOptions.map((role) => {
                const Icon = role.Icon;

                return (
                  <div
                    key={role.id}
                    className={`role-card ${
                      roleTerpilih === role.id
                        ? 'selected'
                        : ''
                    }`}
                    onClick={() =>
                      setRoleTerpilih(role.id)
                    }
                  >
                    <Icon
                      className="role-icon"
                      size={19}
                      strokeWidth={1.8}
                    />

                    <div className="role-text">
                      <div className="role-label">
                        {role.label}
                      </div>

                      <div className="role-desc">
                        {role.desc}
                      </div>
                    </div>

                    <span
                      className={`radio ${
                        roleTerpilih === role.id
                          ? 'checked'
                          : ''
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <button
            className="login-btn"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? (
              'Memproses...'
            ) : (
              <>
                Login
                <ArrowRight
                  size={17}
                  strokeWidth={2}
                />
              </>
            )}
          </button>

          <p className="footer-text">
            Belum punya akun?{' '}
            <span className="link">
              Hubungi Admin
            </span>
          </p>
        </div>
      </div>

      <style jsx>{`
        .wrapper {
          display: flex;
          min-height: 100vh;
          background: url('/bg-indostore.png') no-repeat center center;
          background-size: cover;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          overflow: hidden;
        }

        .left {
          flex: 1;
          position: relative;
          padding: 60px 60px 40px 70px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .text-block {
          position: relative;
          z-index: 1;
          background: transparent;
          backdrop-filter: none;
          padding: 0;
          max-width: 460px;
          transform: translateY(-160px);
        }

        .logo-frame {
          position: relative;
          width: 190px;
          height: 78px;
          margin-bottom: 20px;
          border-radius: 8px;
          overflow: hidden;
        }

        .logo-img {
          object-fit: cover !important;
        }

        .left h1 {
          font-size: 26px;
          font-weight: 800;
          color: #0b3d91;
          margin: 0 0 10px 0;
          line-height: 1.3;
        }

        .subtitle {
          color: #33455e;
          font-size: 14px;
          margin: 0;
        }

        .right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px;
        }

        .login-card {
          box-sizing: border-box;
          width: 100%;
          max-width: 415px;
          padding: 28px 30px 24px;
          background: rgba(255, 255, 255, 0.98);
          border-radius: 14px;
          box-shadow: 0 12px 35px rgba(15, 40, 90, 0.08);
        }

        .login-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .login-icon {
          color: #0b3d91;
          flex-shrink: 0;
        }

        .login-header h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          color: #10295c;
          line-height: 1.2;
        }

        .login-header p {
          margin: 4px 0 0;
          font-size: 11px;
          color: #61769a;
          line-height: 1.3;
        }

        .error-msg {
          background: #fdeceb;
          color: #e2231a;
          font-size: 11px;
          padding: 8px 11px;
          border-radius: 7px;
          margin-bottom: 12px;
        }

        .field {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 39px;
          box-sizing: border-box;
          border: 1px solid #d9e3f0;
          border-radius: 8px;
          padding: 0 12px;
          margin-bottom: 10px;
          background: #ffffff;
        }

        .field:focus-within {
          border-color: #2b7de9;
          box-shadow: 0 0 0 2px rgba(43, 125, 233, 0.08);
        }

        .field input {
          border: none;
          outline: none;
          flex: 1;
          min-width: 0;
          font-size: 12px;
          color: #16233d;
          background: transparent;
        }

        .field input::placeholder {
          color: #8292ad;
        }

        .field input::-ms-reveal,
.field input::-ms-clear {
  display: none;
}

.field input::-webkit-textfield-decoration-container,
.field input::-webkit-credentials-auto-fill-button {
  visibility: hidden;
  display: none !important;
}
        .field-icon {
          color: #123f91;
          flex-shrink: 0;
        }

        .field-toggle {
          cursor: pointer;
          color: #7d8da8;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .role-section {
          margin: 18px 0 16px;
        }

        .role-section h3 {
          margin: 0 0 3px;
          font-size: 13px;
          font-weight: 700;
          color: #16233d;
        }

        .role-section > p {
          margin: 0 0 10px;
          font-size: 10px;
          color: #6b7690;
        }

        .role-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
        }

        .role-card {
          box-sizing: border-box;
          min-height: 62px;
          border: 1px solid #e1e7f0;
          border-radius: 9px;
          padding: 10px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          cursor: pointer;
          position: relative;
          transition:
            border-color 0.15s ease,
            background 0.15s ease,
            box-shadow 0.15s ease;
          background: #ffffff;
        }

        .role-card:hover {
          border-color: #b9cce6;
        }

        .role-card.selected {
          border-color: #2780ed;
          background: #eef6ff;
          box-shadow: 0 2px 8px rgba(39, 128, 237, 0.06);
        }

        .role-icon {
          color: #1646a0;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .role-text {
          padding-right: 15px;
          min-width: 0;
        }

        .role-label {
          font-weight: 700;
          font-size: 12px;
          line-height: 1.2;
          color: #16233d;
        }

        .role-desc {
          font-size: 9px;
          line-height: 1.35;
          color: #6b7690;
          margin-top: 4px;
        }

        .radio {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 13px;
          height: 13px;
          border-radius: 50%;
          border: 2px solid #ccd7e6;
          box-sizing: border-box;
        }

        .radio.checked {
          border-color: #1e6fd9;
          background: radial-gradient(
            circle,
            #1e6fd9 40%,
            transparent 45%
          );
        }

        .login-btn {
          width: 100%;
          height: 38px;
          background: #1e6fd9;
          color: #ffffff;
          border: none;
          padding: 0;
          border-radius: 8px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          margin-top: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: background 0.15s ease;
        }

        .login-btn:hover {
          background: #0b3d91;
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: default;
        }

        .footer-text {
          text-align: center;
          font-size: 10px;
          color: #6b7690;
          margin: 14px 0 0;
        }

        .link {
          color: #1e6fd9;
          font-weight: 600;
          cursor: pointer;
        }

        @media (max-width: 900px) {
          .wrapper {
            flex-direction: column;
          }

          .left {
            padding: 40px 24px;
          }

          .right {
            padding: 24px;
          }

          .login-card {
            max-width: 415px;
          }
        }
      `}</style>
    </div>
  );
}