'use client';

import { useEffect, useState } from 'react';
import { X, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';

type TransaksiRow = {
  id: number;
  nomor: string;
  waktu: string;
  jumlahItem: number;
  total: number;
  status: string;
};

type ItemDetail = {
  nama: string;
  qty: number;
  hargaSatuan: number;
  subtotal: number;
};

function formatRupiah(angka: number): string {
  return 'Rp ' + angka.toLocaleString('id-ID');
}

function formatJam(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function tanggalHariIni(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function RiwayatTransaksiPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [tanggal, setTanggal] = useState(tanggalHariIni());
  const [daftar, setDaftar] = useState<TransaksiRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [idTerbuka, setIdTerbuka] = useState<number | null>(null);
  const [itemDetail, setItemDetail] = useState<Record<number, ItemDetail[]>>({});

  useEffect(() => {
    if (!open) return;

    async function muat() {
      setLoading(true);
      try {
        const res = await fetch(`/api/transactions?tanggal=${tanggal}`);
        const data: TransaksiRow[] = res.ok ? await res.json() : [];
        setDaftar(data);
      } catch {
        setDaftar([]);
      } finally {
        setLoading(false);
      }
    }

    muat();
  }, [open, tanggal]);

  async function toggleDetail(id: number) {
    if (idTerbuka === id) {
      setIdTerbuka(null);
      return;
    }
    setIdTerbuka(id);

    if (!itemDetail[id]) {
      try {
        const res = await fetch(`/api/transactions/${id}`);
        if (res.ok) {
          const data = await res.json();
          setItemDetail((prev) => ({ ...prev, [id]: data.items }));
        }
      } catch {
        // biarkan kosong, baris tetap terbuka tanpa rincian
      }
    }
  }

  const totalTransaksi = daftar.length;
  const totalItem = daftar.reduce((sum, t) => sum + t.jumlahItem, 0);
  const totalPenjualan = daftar.reduce((sum, t) => sum + t.total, 0);

  if (!open) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <div className="head">
          <h2>Riwayat Transaksi</h2>
          <button className="close-btn" onClick={onClose} aria-label="Tutup">
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        <div className="tanggal-row">
          <CalendarDays size={15} strokeWidth={1.8} color="#37415a" />
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
          />
        </div>

        <div className="ringkasan">
          <div className="ringkasan-item">
            <span className="label">Total Transaksi</span>
            <span className="value">{totalTransaksi}</span>
          </div>
          <div className="ringkasan-item">
            <span className="label">Total Item</span>
            <span className="value">{totalItem}</span>
          </div>
          <div className="ringkasan-item">
            <span className="label">Total Penjualan</span>
            <span className="value">{formatRupiah(totalPenjualan)}</span>
          </div>
        </div>

        <div className="list">
          {loading && <div className="status-text">Memuat...</div>}

          {!loading && daftar.length === 0 && (
            <div className="status-text">Tidak ada transaksi di tanggal ini.</div>
          )}

          {!loading &&
            daftar.map((t) => (
              <div className="trx-card" key={t.id}>
                <button className="trx-head" onClick={() => toggleDetail(t.id)}>
                  <div className="trx-head-left">
                    <span className="trx-nomor">{t.nomor}</span>
                    <span className="trx-waktu">{formatJam(t.waktu)}</span>
                    <span className="trx-status">{t.status}</span>
                  </div>
                  <div className="trx-head-right">
                    <span className="trx-total">{formatRupiah(t.total)}</span>
                    {idTerbuka === t.id ? (
                      <ChevronUp size={15} strokeWidth={2} color="#8794ab" />
                    ) : (
                      <ChevronDown size={15} strokeWidth={2} color="#8794ab" />
                    )}
                  </div>
                </button>

                {idTerbuka === t.id && (
                  <div className="trx-detail">
                    {itemDetail[t.id] ? (
                      itemDetail[t.id].map((item, i) => (
                        <div className="detail-row" key={i}>
                          <span>
                            {item.nama} x{item.qty}
                          </span>
                          <span>{formatRupiah(item.subtotal)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="detail-row status-text">Memuat rincian...</div>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(16, 41, 92, 0.35);
          z-index: 60;
          display: flex;
          justify-content: flex-end;
        }

        .panel {
          width: 100%;
          max-width: 380px;
          height: 100%;
          background: #ffffff;
          padding: 20px;
          overflow-y: auto;
          box-sizing: border-box;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          color: #16233d;
        }

        .head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .head h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: #10295c;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #8794ab;
          padding: 4px;
        }

        .tanggal-row {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f4f7fc;
          border: 1px solid #e6ebf3;
          border-radius: 10px;
          padding: 8px 12px;
          margin-bottom: 14px;
        }

        .tanggal-row input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 12.5px;
          color: #16233d;
          flex: 1;
        }

        .ringkasan {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 18px;
        }

        .ringkasan-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
          background: #f4f7fc;
          border-radius: 10px;
          padding: 10px;
        }

        .ringkasan-item .label {
          font-size: 9.5px;
          color: #8794ab;
          font-weight: 700;
        }

        .ringkasan-item .value {
          font-size: 12px;
          font-weight: 800;
          color: #10295c;
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .status-text {
          text-align: center;
          padding: 20px 0;
          color: #8794ab;
          font-size: 12.5px;
        }

        .trx-card {
          border: 1px solid #eef1f8;
          border-radius: 12px;
          overflow: hidden;
        }

        .trx-head {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: none;
          border: none;
          cursor: pointer;
          padding: 12px 14px;
          text-align: left;
        }

        .trx-head-left {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .trx-nomor {
          font-size: 12.5px;
          font-weight: 800;
          color: #10295c;
        }

        .trx-waktu {
          font-size: 10.5px;
          color: #8794ab;
        }

        .trx-status {
          display: inline-block;
          margin-top: 2px;
          font-size: 9.5px;
          font-weight: 700;
          color: #27ae60;
          background: #e8f8ee;
          border-radius: 999px;
          padding: 2px 8px;
          width: fit-content;
        }

        .trx-head-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .trx-total {
          font-size: 12.5px;
          font-weight: 800;
          color: #16233d;
        }

        .trx-detail {
          border-top: 1px solid #f0f2f8;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: #fafbfe;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          font-size: 11.5px;
          color: #37415a;
        }
      `}</style>
    </div>
  );
}