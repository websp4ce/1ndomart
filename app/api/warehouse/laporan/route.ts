import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const [data] = await db.query(`
      SELECT *
      FROM (
        /* PURCHASE ORDER */
        SELECT
          po.id,
          po.nomor_po AS nomor,
          DATE_FORMAT(po.tanggal, '%Y-%m-%d') AS tanggal,
          po.status AS status,
          CONCAT(
            'Purchase Order - ',
            COALESCE(s.nama_supplier, 'Supplier')
          ) AS keterangan
        FROM purchase_order po
        LEFT JOIN supplier s
          ON s.id = po.supplier_id

        UNION ALL

        /* PENERIMAAN BARANG */
        SELECT
          pb.id,
          CONCAT('PB-', LPAD(pb.id, 4, '0')) AS nomor,
          DATE_FORMAT(pb.tanggal, '%Y-%m-%d') AS tanggal,
          pb.status AS status,
          'Penerimaan Barang' AS keterangan
        FROM penerimaan_barang pb

        UNION ALL

        /* QUALITY CHECK */
        SELECT
          qc.id,
          CONCAT('QC-', LPAD(qc.id, 4, '0')) AS nomor,
          DATE_FORMAT(qc.tanggal, '%Y-%m-%d') AS tanggal,
          qc.status AS status,
          CONCAT(
            'Quality Check - Penerimaan #',
            qc.penerimaan_id
          ) AS keterangan
        FROM quality_check qc

        UNION ALL

        /* PUTAWAY */
        SELECT
          p.id,
          CONCAT('PA-', LPAD(p.id, 4, '0')) AS nomor,
          DATE_FORMAT(p.tanggal, '%Y-%m-%d') AS tanggal,
          p.status AS status,
          CONCAT(
            'Putaway - QC #',
            p.qc_id
          ) AS keterangan
        FROM putaway p

        UNION ALL

        /* STOCK OPNAME */
        SELECT
          so.id,
          so.nomor_opname AS nomor,
          DATE_FORMAT(so.tanggal, '%Y-%m-%d') AS tanggal,
          so.status AS status,
          'Stock Opname' AS keterangan
        FROM stock_opname so
      ) AS laporan
      ORDER BY tanggal DESC, id DESC
    `);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("API laporan warehouse error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil laporan warehouse",
      },
      { status: 500 }
    );
  }
}