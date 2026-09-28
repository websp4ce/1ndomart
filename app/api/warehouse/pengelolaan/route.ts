import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const [penerimaan] = await db.query(`
      SELECT
        pb.id,
        pb.nomor_penerimaan,
        pb.tanggal,
        pb.status,
        po.nomor_po,
        s.nama_supplier
      FROM penerimaan_barang pb
      INNER JOIN purchase_order po
        ON po.id = pb.po_id
      INNER JOIN supplier s
        ON s.id = po.supplier_id
      ORDER BY pb.id DESC
    `);

    const [qc] = await db.query(`
      SELECT
        qc.id,
        qc.tanggal,
        qc.status,
        qc.catatan,
        pb.nomor_penerimaan,
        po.nomor_po
      FROM quality_check qc
      INNER JOIN penerimaan_barang pb
        ON pb.id = qc.penerimaan_id
      INNER JOIN purchase_order po
        ON po.id = pb.po_id
      ORDER BY qc.id DESC
    `);

    const [putaway] = await db.query(`
      SELECT
        pwa.id,
        pwa.tanggal,
        pwa.status,
        pwa.catatan,
        qc.id AS qc_id
      FROM putaway pwa
      INNER JOIN quality_check qc
        ON qc.id = pwa.qc_id
      ORDER BY pwa.id DESC
    `);

    const [produk] = await db.query(`
      SELECT
        p.id,
        p.kode_produk,
        p.nama,
        p.stok,
        COALESCE(k.nama, 'Tanpa Kategori') AS kategori
      FROM produk p
      LEFT JOIN kategori k
        ON k.id = p.kategori_id
      ORDER BY p.nama ASC
    `);

    const [opname] = await db.query(`
      SELECT
        so.id,
        so.nomor_opname,
        so.tanggal,
        so.status,
        so.catatan,
        COUNT(sod.id) AS jumlah_item
      FROM stock_opname so
      LEFT JOIN stock_opname_detail sod
        ON sod.opname_id = so.id
      GROUP BY
        so.id,
        so.nomor_opname,
        so.tanggal,
        so.status,
        so.catatan
      ORDER BY so.id DESC
    `);

    return NextResponse.json({
      success: true,
      penerimaan,
      qc,
      putaway,
      produk,
      opname,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data pengelolaan gudang.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const connection = await db.getConnection();

  try {
    const body = await req.json();

    /* =========================
       QUALITY CHECK
    ========================= */

    if (body.tipe === "qc") {
      const {
        penerimaan_id,
        tanggal,
        status,
        catatan,
      } = body;

      if (!penerimaan_id) {
        return NextResponse.json(
          { message: "Penerimaan belum dipilih." },
          { status: 400 }
        );
      }

      await connection.beginTransaction();

      const [result]: any = await connection.query(
        `
        INSERT INTO quality_check
        (penerimaan_id, tanggal, status, catatan)
        VALUES (?, ?, ?, ?)
        `,
        [
          penerimaan_id,
          tanggal,
          status || "Lulus",
          catatan || null,
        ]
      );

      const qcId = result.insertId;

      const [detail]: any = await connection.query(
        `
        SELECT
          produk_id,
          jumlah_diterima
        FROM penerimaan_detail
        WHERE penerimaan_id = ?
        `,
        [penerimaan_id]
      );

      for (const item of detail) {
        const jumlah = Number(item.jumlah_diterima || 0);

        await connection.query(
          `
          INSERT INTO quality_check_detail
          (qc_id, produk_id, jumlah_diterima,
           jumlah_baik, jumlah_rusak)
          VALUES (?, ?, ?, ?, ?)
          `,
          [
            qcId,
            item.produk_id,
            jumlah,
            status === "Ditolak" ? 0 : jumlah,
            status === "Ditolak" ? jumlah : 0,
          ]
        );
      }

      await connection.query(
        `
        UPDATE penerimaan_barang
        SET status = 'Selesai'
        WHERE id = ?
        `,
        [penerimaan_id]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: "Quality Check berhasil disimpan.",
      });
    }

    /* =========================
       PUTAWAY
    ========================= */

    if (body.tipe === "putaway") {
      const {
        qc_id,
        tanggal,
        items,
      } = body;

      if (!qc_id || !items?.length) {
        return NextResponse.json(
          { message: "Data Putaway belum lengkap." },
          { status: 400 }
        );
      }

      await connection.beginTransaction();

      const [result]: any = await connection.query(
        `
        INSERT INTO putaway
        (qc_id, tanggal, status)
        VALUES (?, ?, 'Selesai')
        `,
        [qc_id, tanggal]
      );

      const putawayId = result.insertId;

      for (const item of items) {
        const jumlah = Number(item.jumlah || 0);

        if (jumlah <= 0) continue;

        await connection.query(
          `
          INSERT INTO putaway_detail
          (putaway_id, produk_id, lokasi, jumlah)
          VALUES (?, ?, ?, ?)
          `,
          [
            putawayId,
            Number(item.produk_id),
            item.lokasi || "A-01",
            jumlah,
          ]
        );

        /*
         * BARANG SUDAH MASUK GUDANG,
         * MAKA STOK INVENTORY DITAMBAH.
         */
        await connection.query(
          `
          UPDATE produk
          SET stok = stok + ?
          WHERE id = ?
          `,
          [jumlah, Number(item.produk_id)]
        );
      }

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: "Putaway selesai dan stok Inventory diperbarui.",
      });
    }

    /* =========================
       STOCK OPNAME
    ========================= */

    if (body.tipe === "opname") {
      const {
        nomor_opname,
        tanggal,
        items,
        catatan,
      } = body;

      if (!nomor_opname || !items?.length) {
        return NextResponse.json(
          { message: "Data Stock Opname belum lengkap." },
          { status: 400 }
        );
      }

      await connection.beginTransaction();

      const [result]: any = await connection.query(
        `
        INSERT INTO stock_opname
        (nomor_opname, tanggal, status, catatan)
        VALUES (?, ?, 'Selesai', ?)
        `,
        [
          nomor_opname,
          tanggal,
          catatan || null,
        ]
      );

      const opnameId = result.insertId;

      for (const item of items) {
        const sistem = Number(item.stok_sistem || 0);
        const fisik = Number(item.stok_fisik || 0);
        const selisih = fisik - sistem;

        await connection.query(
          `
          INSERT INTO stock_opname_detail
          (opname_id, produk_id, stok_sistem,
           stok_fisik, selisih, keterangan)
          VALUES (?, ?, ?, ?, ?, ?)
          `,
          [
            opnameId,
            Number(item.produk_id),
            sistem,
            fisik,
            selisih,
            item.keterangan || null,
          ]
        );

        /*
         * SESUAIKAN STOK INVENTORY
         * DENGAN HASIL FISIK.
         */
        await connection.query(
          `
          UPDATE produk
          SET stok = ?
          WHERE id = ?
          `,
          [fisik, Number(item.produk_id)]
        );
      }

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: "Stock Opname berhasil disimpan.",
      });
    }

    return NextResponse.json(
      { message: "Tipe proses tidak dikenal." },
      { status: 400 }
    );
  } catch (error: any) {
    await connection.rollback();

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          error?.code === "ER_DUP_ENTRY"
            ? "Nomor data sudah digunakan."
            : "Gagal menyimpan data.",
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}