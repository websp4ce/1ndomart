import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const [supplier] = await db.query(`
      SELECT id, kode_supplier, nama_supplier, telepon, alamat
      FROM supplier
      ORDER BY nama_supplier ASC
    `);

    const [produk] = await db.query(`
      SELECT
        p.id,
        p.kode_produk,
        p.nama,
        p.harga,
        p.stok,
        COALESCE(k.nama, 'Tanpa Kategori') AS kategori
      FROM produk p
      LEFT JOIN kategori k ON k.id = p.kategori_id
      ORDER BY p.nama ASC
    `);

    const [po] = await db.query(`
      SELECT
        po.id,
        po.nomor_po,
        po.tanggal,
        po.status,
        po.total,
        s.nama_supplier,
        COUNT(pod.id) AS jumlah_item
      FROM purchase_order po
      INNER JOIN supplier s ON s.id = po.supplier_id
      LEFT JOIN purchase_order_detail pod ON pod.po_id = po.id
      GROUP BY
        po.id,
        po.nomor_po,
        po.tanggal,
        po.status,
        po.total,
        s.nama_supplier
      ORDER BY po.id DESC
    `);

    const [penerimaan] = await db.query(`
      SELECT
        pb.id,
        pb.nomor_penerimaan,
        pb.tanggal,
        pb.status,
        pb.keterangan,
        po.nomor_po,
        s.nama_supplier
      FROM penerimaan_barang pb
      INNER JOIN purchase_order po ON po.id = pb.po_id
      INNER JOIN supplier s ON s.id = po.supplier_id
      ORDER BY pb.id DESC
    `);

    return NextResponse.json({
      success: true,
      supplier,
      produk,
      po,
      penerimaan,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data pengadaan.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const connection = await db.getConnection();

  try {
    const body = await req.json();

    if (body.tipe === "supplier") {
      const { kode_supplier, nama_supplier, telepon, alamat } = body;

      if (!kode_supplier || !nama_supplier) {
        return NextResponse.json(
          { message: "Kode dan nama supplier wajib diisi." },
          { status: 400 }
        );
      }

      await connection.query(
        `
        INSERT INTO supplier
        (kode_supplier, nama_supplier, telepon, alamat)
        VALUES (?, ?, ?, ?)
        `,
        [
          kode_supplier,
          nama_supplier,
          telepon || null,
          alamat || null,
        ]
      );

      return NextResponse.json({
        success: true,
        message: "Supplier berhasil ditambahkan.",
      });
    }

    if (body.tipe === "po") {
      const {
        nomor_po,
        supplier_id,
        tanggal,
        items,
      } = body;

      if (!nomor_po || !supplier_id || !tanggal || !items?.length) {
        return NextResponse.json(
          { message: "Data PO belum lengkap." },
          { status: 400 }
        );
      }

      await connection.beginTransaction();

      let total = 0;

      for (const item of items) {
        total +=
          Number(item.jumlah || 0) *
          Number(item.harga || 0);
      }

      const [result]: any = await connection.query(
        `
        INSERT INTO purchase_order
        (nomor_po, supplier_id, tanggal, status, total)
        VALUES (?, ?, ?, 'Dipesan', ?)
        `,
        [
          nomor_po,
          Number(supplier_id),
          tanggal,
          total,
        ]
      );

      const poId = result.insertId;

      for (const item of items) {
        const jumlah = Number(item.jumlah || 0);
        const harga = Number(item.harga || 0);

        await connection.query(
          `
          INSERT INTO purchase_order_detail
          (po_id, produk_id, jumlah, harga, subtotal)
          VALUES (?, ?, ?, ?, ?)
          `,
          [
            poId,
            Number(item.produk_id),
            jumlah,
            harga,
            jumlah * harga,
          ]
        );
      }

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: "Purchase Order berhasil dibuat.",
      });
    }

    if (body.tipe === "penerimaan") {
      const {
        nomor_penerimaan,
        po_id,
        tanggal,
        keterangan,
      } = body;

      if (!nomor_penerimaan || !po_id || !tanggal) {
        return NextResponse.json(
          { message: "Data penerimaan belum lengkap." },
          { status: 400 }
        );
      }

      await connection.beginTransaction();

      const [result]: any = await connection.query(
        `
        INSERT INTO penerimaan_barang
        (nomor_penerimaan, po_id, tanggal, status, keterangan)
        VALUES (?, ?, ?, 'Menunggu QC', ?)
        `,
        [
          nomor_penerimaan,
          Number(po_id),
          tanggal,
          keterangan || null,
        ]
      );

      const penerimaanId = result.insertId;

      const [detail]: any = await connection.query(
        `
        SELECT produk_id, jumlah
        FROM purchase_order_detail
        WHERE po_id = ?
        `,
        [Number(po_id)]
      );

      for (const item of detail) {
        await connection.query(
          `
          INSERT INTO penerimaan_detail
          (penerimaan_id, produk_id, jumlah_dipesan, jumlah_diterima)
          VALUES (?, ?, ?, ?)
          `,
          [
            penerimaanId,
            item.produk_id,
            item.jumlah,
            item.jumlah,
          ]
        );
      }

      await connection.query(
        `
        UPDATE purchase_order
        SET status = 'Selesai'
        WHERE id = ?
        `,
        [Number(po_id)]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: "Penerimaan barang berhasil dicatat.",
      });
    }

    return NextResponse.json(
      { message: "Tipe data tidak dikenali." },
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
            ? "Nomor atau kode sudah digunakan."
            : "Gagal menyimpan data.",
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}