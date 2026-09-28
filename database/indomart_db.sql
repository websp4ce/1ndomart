-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Sep 28, 2026 at 04:43 AM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `indomart_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `barang_retur`
--

CREATE TABLE `barang_retur` (
  `id` int NOT NULL,
  `tanggal` date NOT NULL DEFAULT (curdate()),
  `jenis` enum('ke_supplier','dari_pelanggan') NOT NULL,
  `supplier` varchar(255) DEFAULT NULL,
  `product_barcode` varchar(50) NOT NULL,
  `qty` int NOT NULL,
  `alasan` varchar(255) NOT NULL,
  `status` enum('Menunggu','Diproses','Selesai','Dibuang') NOT NULL DEFAULT 'Menunggu',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `catatan` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `barang_retur`
--

INSERT INTO `barang_retur` (`id`, `tanggal`, `jenis`, `supplier`, `product_barcode`, `qty`, `alasan`, `status`, `created_at`, `catatan`) VALUES
(8, '2026-09-28', 'dari_pelanggan', NULL, '8991002102987', 5, 'Tidak sesuai', 'Selesai', '2026-09-28 03:42:09', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `barang_rusak`
--

CREATE TABLE `barang_rusak` (
  `id` int NOT NULL,
  `barcode` varchar(50) NOT NULL,
  `tanggal` date NOT NULL,
  `qty` int NOT NULL DEFAULT '1',
  `keterangan` varchar(255) NOT NULL,
  `status` enum('Menunggu','Diproses','Selesai','Dibuang') NOT NULL DEFAULT 'Menunggu',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `barang_rusak`
--

INSERT INTO `barang_rusak` (`id`, `barcode`, `tanggal`, `qty`, `keterangan`, `status`, `created_at`) VALUES
(6, '8991002102987', '2026-09-27', 5, 'bocor 3, basah 2', 'Selesai', '2026-09-28 03:02:06'),
(7, '089989010947', '2026-09-27', 3, 'bocor', 'Selesai', '2026-09-28 03:03:55');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int NOT NULL,
  `nama` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `nama`) VALUES
(4, 'Kebutuhan Rumah'),
(2, 'Makanan'),
(1, 'Minuman'),
(3, 'Snack');

-- --------------------------------------------------------

--
-- Table structure for table `gudang`
--

CREATE TABLE `gudang` (
  `id` int NOT NULL,
  `nama` varchar(100) NOT NULL,
  `lokasi` varchar(100) DEFAULT NULL,
  `tipe` enum('gudang','toko') DEFAULT 'toko',
  `alamat` varchar(255) DEFAULT NULL,
  `status` enum('Aktif','Nonaktif') DEFAULT 'Aktif',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `gudang`
--

INSERT INTO `gudang` (`id`, `nama`, `lokasi`, `tipe`, `alamat`, `status`, `created_at`) VALUES
(1, 'Gudang Pusat', NULL, 'gudang', NULL, 'Aktif', '2026-09-17 02:02:44'),
(2, 'Toko surabaya', NULL, 'toko', NULL, 'Aktif', '2026-09-17 02:32:52'),
(4, 'Gudang Jakarta Pusat', 'Jakarta Timur', 'gudang', 'Jl. Cendrawasih, Blok B9 No.18', 'Aktif', '2026-09-21 03:07:20'),
(6, 'Toko Bandung Barat BojongKoneng', NULL, 'toko', NULL, 'Aktif', '2026-09-28 03:34:49'),
(7, 'Gudang Hyundai', 'Bekasi Barat', 'gudang', 'Jl. Jend Sudirman Kav 44-46 Bendungan Hilir Tanah Abang Jakarta Pusat DKI Jakarta, RT.14/RW.1, Bend. Hilir, Tanah Abang, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10210, Indonesia.', 'Aktif', '2026-09-28 04:04:06');

-- --------------------------------------------------------

--
-- Table structure for table `lokasi_rak`
--

CREATE TABLE `lokasi_rak` (
  `id` int NOT NULL,
  `kode_rak` varchar(30) NOT NULL,
  `keterangan` varchar(150) DEFAULT NULL,
  `kapasitas` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `lokasi_rak`
--

INSERT INTO `lokasi_rak` (`id`, `kode_rak`, `keterangan`, `kapasitas`, `created_at`) VALUES
(1, 'A1-01', 'Zona Makanan Karbohidrat', 2, '2026-09-24 03:17:32'),
(2, 'A2-02', 'Zona Minuman Teh', 23, '2026-09-25 09:24:10'),
(3, 'A1-03', 'Zona Obat', 3, '2026-09-28 04:23:33');

-- --------------------------------------------------------

--
-- Table structure for table `packing`
--

CREATE TABLE `packing` (
  `id` int NOT NULL,
  `kode_packing` varchar(50) NOT NULL,
  `kode_picking` varchar(50) NOT NULL,
  `tanggal` date NOT NULL,
  `status` enum('Proses','Selesai') NOT NULL DEFAULT 'Proses',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `packing`
--

INSERT INTO `packing` (`id`, `kode_packing`, `kode_picking`, `tanggal`, `status`, `created_at`, `updated_at`) VALUES
(4, 'PKG-2026-001', 'PK-2026-0001', '2026-09-23', 'Selesai', '2026-09-23 13:19:37', '2026-09-24 02:15:45'),
(5, 'PKG-2026-002', 'PK-2026-0002', '2026-09-23', 'Proses', '2026-09-23 13:20:49', '2026-09-25 08:28:23'),
(6, 'PKG-2026-003', 'PK-2026-0003', '2026-09-27', 'Selesai', '2026-09-25 09:17:31', '2026-09-25 09:19:36'),
(7, 'PKG-2026-004', 'PK-2026-0004', '2026-09-28', 'Selesai', '2026-09-28 04:25:05', '2026-09-28 04:25:14');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int NOT NULL,
  `transaction_id` int NOT NULL,
  `metode` enum('Tunai','Debit','QRIS','GoPay','DANA','OVO','ShopeePay') NOT NULL,
  `jumlah_dibayar` int NOT NULL,
  `kembalian` int NOT NULL DEFAULT '0',
  `status` enum('Berhasil','Pending','Gagal') NOT NULL DEFAULT 'Berhasil',
  `dibayar_pada` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `transaction_id`, `metode`, `jumlah_dibayar`, `kembalian`, `status`, `dibayar_pada`) VALUES
(1, 1, 'Tunai', 20000, 7000, 'Berhasil', '2026-09-15 04:07:18'),
(2, 2, 'QRIS', 10500, 0, 'Berhasil', '2026-09-15 04:20:43'),
(3, 3, 'Debit', 9000, 0, 'Berhasil', '2026-09-15 04:59:04'),
(4, 4, 'ShopeePay', 11000, 0, 'Berhasil', '2026-09-15 05:01:02'),
(5, 5, 'QRIS', 10500, 0, 'Berhasil', '2026-09-17 05:03:21'),
(6, 6, 'Tunai', 20000, 7000, 'Berhasil', '2026-09-18 04:03:50'),
(7, 7, 'QRIS', 14500, 0, 'Berhasil', '2026-09-18 04:05:00'),
(8, 8, 'Tunai', 10000, 3000, 'Berhasil', '2026-09-20 14:37:36'),
(9, 9, 'Tunai', 20000, 5500, 'Berhasil', '2026-09-28 02:43:23'),
(10, 10, 'QRIS', 7000, 0, 'Berhasil', '2026-09-28 02:45:44');

-- --------------------------------------------------------

--
-- Table structure for table `pengiriman`
--

CREATE TABLE `pengiriman` (
  `id` int NOT NULL,
  `kode_pengiriman` varchar(50) NOT NULL,
  `kode_packing` varchar(50) NOT NULL,
  `tujuan` varchar(150) NOT NULL,
  `tanggal` date NOT NULL,
  `status` enum('Dalam Proses','Dikirim','Terkirim') NOT NULL DEFAULT 'Dalam Proses',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `pengiriman`
--

INSERT INTO `pengiriman` (`id`, `kode_pengiriman`, `kode_packing`, `tujuan`, `tanggal`, `status`, `created_at`) VALUES
(1, 'KIR-2026-001', 'PKG-2026-002', 'Toko Banjarnegara', '2026-09-24', 'Dikirim', '2026-09-24 02:30:33'),
(2, 'KIR-2026-003', 'PKG-2026-003', 'Toko Banjarmasin', '2026-09-29', 'Dalam Proses', '2026-09-25 09:19:56'),
(3, 'KIR-2026-004', 'PKG-2026-004', 'Toko Bekasi', '2026-09-28', 'Terkirim', '2026-09-28 04:26:09');

-- --------------------------------------------------------

--
-- Table structure for table `picking`
--

CREATE TABLE `picking` (
  `id` int NOT NULL,
  `kode` varchar(50) NOT NULL,
  `tanggal` varchar(50) NOT NULL,
  `tujuan` varchar(150) NOT NULL,
  `status` enum('Pending','Diproses','Selesai') NOT NULL DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `picking`
--

INSERT INTO `picking` (`id`, `kode`, `tanggal`, `tujuan`, `status`, `created_at`, `updated_at`) VALUES
(5, 'PK-2026-0001', '22 September 2026', 'Toko Banyumas', 'Selesai', '2026-09-23 13:06:55', '2026-09-24 02:15:34'),
(6, 'PK-2026-0002', '22 September 2026', 'Toko Banjarnegara', 'Selesai', '2026-09-23 13:20:16', '2026-09-24 02:11:44'),
(8, 'PK-2026-0003', '25 September 2-26', 'Toko Banjarmasin', 'Pending', '2026-09-25 09:12:36', '2026-09-25 09:12:36'),
(9, 'PK-2026-0004', '28 September 2029', 'Toko Bekasi', 'Diproses', '2026-09-28 04:20:10', '2026-09-28 04:20:10');

-- --------------------------------------------------------

--
-- Table structure for table `picking_items`
--

CREATE TABLE `picking_items` (
  `id` int NOT NULL,
  `picking_id` int NOT NULL,
  `barcode_produk` varchar(50) NOT NULL,
  `nama_produk` varchar(150) NOT NULL,
  `jumlah` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `picking_items`
--

INSERT INTO `picking_items` (`id`, `picking_id`, `barcode_produk`, `nama_produk`, `jumlah`) VALUES
(2, 5, '8991002102987', 'Kingkong', 3),
(3, 6, '089989010947', 'Indomie Goreng', 4),
(4, 8, '8991002101012', 'Teh Botol Sosro 450ml', 15),
(6, 9, '8991002102987', 'Kingkong', 4);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `barcode` varchar(50) NOT NULL,
  `nama` varchar(150) NOT NULL,
  `harga` int NOT NULL,
  `stok` int NOT NULL DEFAULT '0',
  `stok_minimum` int NOT NULL DEFAULT '10',
  `category_id` int NOT NULL,
  `gambar` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `batch` varchar(50) DEFAULT NULL,
  `tgl_expired` date DEFAULT NULL,
  `rak_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`barcode`, `nama`, `harga`, `stok`, `stok_minimum`, `category_id`, `gambar`, `created_at`, `updated_at`, `batch`, `tgl_expired`, `rak_id`) VALUES
('089989010947', 'Indomie Goreng', 3500, 22, 10, 2, '/produk/indomie-goreng.png', '2026-09-14 07:01:31', '2026-09-28 03:40:16', '12345', '2027-09-15', 1),
('8991002101012', 'Teh Botol Sosro 450ml', 5500, 18, 10, 1, '/produk/teh-botol.png', '2026-09-14 07:01:31', '2026-09-28 02:45:44', '67890', '2029-12-24', 2),
('8991002102987', 'Kingkong', 1500, 117, 10, 4, '/produk/kingkong.png', '2026-09-15 02:36:25', '2026-09-28 04:25:14', '33333', '2026-10-10', 3),
('8996001600017', 'Aqua Botol 600ml', 4000, 76, 10, 1, '/produk/aqua-600ml.png', '2026-09-14 07:01:31', '2026-09-28 03:08:08', '22222', '2027-10-08', NULL),
('8998866200059', 'Mie Sedaap Goreng', 3500, 29, 10, 2, '/produk/mie-sedaap.png', '2026-09-28 04:35:58', '2026-09-28 04:35:58', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `stok_lokasi`
--

CREATE TABLE `stok_lokasi` (
  `id` int NOT NULL,
  `barcode` varchar(50) NOT NULL,
  `gudang_id` int NOT NULL,
  `stok` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `stok_lokasi`
--

INSERT INTO `stok_lokasi` (`id`, `barcode`, `gudang_id`, `stok`) VALUES
(1, '089989010947', 1, 6),
(2, '8991002101012', 1, 14),
(3, '8991002102987', 1, 117),
(4, '8996001600017', 1, 100),
(5, '089989010947', 2, 5),
(6, '8991002102987', 6, 4);

-- --------------------------------------------------------

--
-- Table structure for table `supplier`
--

CREATE TABLE `supplier` (
  `id` int NOT NULL,
  `nama` varchar(255) NOT NULL,
  `kontak` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `status` enum('Aktif','Nonaktif') NOT NULL DEFAULT 'Aktif',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `supplier`
--

INSERT INTO `supplier` (`id`, `nama`, `kontak`, `email`, `status`, `created_at`) VALUES
(2, 'PT Hyundai', '085811354432', 'hyundai@gmail.com', 'Aktif', '2026-09-28 04:07:19');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int NOT NULL,
  `kasir_id` int NOT NULL,
  `total_belanja` int NOT NULL,
  `diskon` int NOT NULL DEFAULT '0',
  `kode_promo` varchar(50) DEFAULT NULL,
  `grand_total` int NOT NULL,
  `tanggal` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `kasir_id`, `total_belanja`, `diskon`, `kode_promo`, `grand_total`, `tanggal`) VALUES
(1, 2, 13000, 0, NULL, 13000, '2026-09-15 04:07:18'),
(2, 2, 10500, 0, NULL, 10500, '2026-09-15 04:20:43'),
(3, 2, 9000, 0, NULL, 9000, '2026-09-15 04:59:04'),
(4, 2, 11000, 0, NULL, 11000, '2026-09-15 05:01:02'),
(5, 3, 10500, 0, NULL, 10500, '2026-09-17 05:03:21'),
(6, 2, 13000, 0, NULL, 13000, '2026-09-18 04:03:50'),
(7, 2, 14500, 0, NULL, 14500, '2026-09-18 04:05:00'),
(8, 2, 7000, 0, NULL, 7000, '2026-09-20 14:37:36'),
(9, 2, 14500, 0, NULL, 14500, '2026-09-28 02:43:23'),
(10, 2, 7000, 0, NULL, 7000, '2026-09-28 02:45:44');

-- --------------------------------------------------------

--
-- Table structure for table `transaction_items`
--

CREATE TABLE `transaction_items` (
  `id` int NOT NULL,
  `transaction_id` int NOT NULL,
  `barcode` varchar(50) NOT NULL,
  `nama_produk` varchar(150) NOT NULL,
  `harga_satuan` int NOT NULL,
  `qty` int NOT NULL,
  `subtotal` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `transaction_items`
--

INSERT INTO `transaction_items` (`id`, `transaction_id`, `barcode`, `nama_produk`, `harga_satuan`, `qty`, `subtotal`) VALUES
(1, 1, '8996001600017', 'Aqua Botol 600ml', 4000, 1, 4000),
(2, 1, '089989010947', 'Indomie Goreng', 3500, 1, 3500),
(3, 1, '8991002101012', 'Teh Botol Sosro 450ml', 5500, 1, 5500),
(4, 2, '8991002101012', 'Teh Botol Sosro 450ml', 5500, 1, 5500),
(5, 2, '8991002102987', 'Kingkong', 1500, 1, 1500),
(6, 2, '089989010947', 'Indomie Goreng', 3500, 1, 3500),
(7, 3, '8991002101012', 'Teh Botol Sosro 450ml', 5500, 1, 5500),
(8, 3, '089989010947', 'Indomie Goreng', 3500, 1, 3500),
(9, 4, '8991002102987', 'Kingkong', 1500, 1, 1500),
(10, 4, '8996001600017', 'Aqua Botol 600ml', 4000, 1, 4000),
(11, 4, '8991002101012', 'Teh Botol Sosro 450ml', 5500, 1, 5500),
(12, 5, '8991002102987', 'Kingkong', 1500, 1, 1500),
(13, 5, '8991002101012', 'Teh Botol Sosro 450ml', 5500, 1, 5500),
(14, 5, '089989010947', 'Indomie Goreng', 3500, 1, 3500),
(15, 6, '8991002101012', 'Teh Botol Sosro 450ml', 5500, 1, 5500),
(16, 6, '089989010947', 'Indomie Goreng', 3500, 1, 3500),
(17, 6, '8996001600017', 'Aqua Botol 600ml', 4000, 1, 4000),
(18, 7, '8991002102987', 'Kingkong', 1500, 1, 1500),
(19, 7, '089989010947', 'Indomie Goreng', 3500, 1, 3500),
(20, 7, '8996001600017', 'Aqua Botol 600ml', 4000, 1, 4000),
(21, 7, '8991002101012', 'Teh Botol Sosro 450ml', 5500, 1, 5500),
(22, 8, '8991002102987', 'Kingkong', 1500, 1, 1500),
(23, 8, '8991002101012', 'Teh Botol Sosro 450ml', 5500, 1, 5500),
(24, 9, '8996001600017', 'Aqua Botol 600ml', 4000, 1, 4000),
(25, 9, '089989010947', 'Indomie Goreng', 3500, 1, 3500),
(26, 9, '8991002102987', 'Kingkong', 1500, 1, 1500),
(27, 9, '8991002101012', 'Teh Botol Sosro 450ml', 5500, 1, 5500),
(28, 10, '8991002101012', 'Teh Botol Sosro 450ml', 5500, 1, 5500),
(29, 10, '8991002102987', 'Kingkong', 1500, 1, 1500);

-- --------------------------------------------------------

--
-- Table structure for table `transfer_gudang`
--

CREATE TABLE `transfer_gudang` (
  `id` int NOT NULL,
  `kode_transfer` varchar(30) NOT NULL,
  `dari_gudang_id` int NOT NULL,
  `ke_gudang_id` int NOT NULL,
  `tanggal` date NOT NULL,
  `status` enum('Dalam Proses','Dikirim','Terkirim') NOT NULL DEFAULT 'Dalam Proses',
  `catatan` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `transfer_gudang`
--

INSERT INTO `transfer_gudang` (`id`, `kode_transfer`, `dari_gudang_id`, `ke_gudang_id`, `tanggal`, `status`, `catatan`, `created_at`) VALUES
(1, 'TRF-2026-001', 1, 4, '2026-09-25', 'Terkirim', '-', '2026-09-25 09:29:37'),
(2, 'TRF-2026-002', 1, 4, '2026-09-28', 'Dalam Proses', '-', '2026-09-28 04:28:32');

-- --------------------------------------------------------

--
-- Table structure for table `transfer_gudang_items`
--

CREATE TABLE `transfer_gudang_items` (
  `id` int NOT NULL,
  `transfer_gudang_id` int NOT NULL,
  `barcode` varchar(50) NOT NULL,
  `nama_produk` varchar(150) NOT NULL,
  `qty` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `transfer_gudang_items`
--

INSERT INTO `transfer_gudang_items` (`id`, `transfer_gudang_id`, `barcode`, `nama_produk`, `qty`) VALUES
(1, 1, '089989010947', 'Indomie Goreng', 10),
(2, 2, '089989010947', 'Indomie Goreng', 6);

-- --------------------------------------------------------

--
-- Table structure for table `transfer_stok`
--

CREATE TABLE `transfer_stok` (
  `id` int NOT NULL,
  `no_transfer` varchar(20) NOT NULL,
  `tanggal` date NOT NULL,
  `barcode` varchar(50) NOT NULL,
  `dari_gudang_id` int NOT NULL,
  `ke_gudang_id` int NOT NULL,
  `jumlah` int NOT NULL,
  `status` enum('Menunggu','Proses','Selesai','Dibatalkan') DEFAULT 'Menunggu',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `transfer_stok`
--

INSERT INTO `transfer_stok` (`id`, `no_transfer`, `tanggal`, `barcode`, `dari_gudang_id`, `ke_gudang_id`, `jumlah`, `status`, `created_at`) VALUES
(5, 'TRF-0001', '2026-09-28', '8991002102987', 1, 6, 4, 'Selesai', '2026-09-28 03:40:59');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `nama` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','kasir','inventory','warehouse') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `nama`, `email`, `password`, `role`, `created_at`) VALUES
(1, 'Admin', 'admin@indomart.com', 'admin123', 'admin', '2026-09-14 07:01:31'),
(2, 'Aulia Rahma', 'kasir@indomart.com', 'kasir123', 'kasir', '2026-09-14 07:01:31'),
(3, 'Staff Inventory', 'inventory@indomart.com', 'inventory123', 'inventory', '2026-09-14 07:01:31'),
(4, 'Staff Warehouse', 'warehouse@indomart.com', 'warehouse123', 'warehouse', '2026-09-14 07:01:31');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `barang_retur`
--
ALTER TABLE `barang_retur`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_barcode` (`product_barcode`);

--
-- Indexes for table `barang_rusak`
--
ALTER TABLE `barang_rusak`
  ADD PRIMARY KEY (`id`),
  ADD KEY `barcode` (`barcode`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nama` (`nama`);

--
-- Indexes for table `gudang`
--
ALTER TABLE `gudang`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `lokasi_rak`
--
ALTER TABLE `lokasi_rak`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode_rak` (`kode_rak`);

--
-- Indexes for table `packing`
--
ALTER TABLE `packing`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode_packing` (`kode_packing`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transaction_id` (`transaction_id`);

--
-- Indexes for table `pengiriman`
--
ALTER TABLE `pengiriman`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode_pengiriman` (`kode_pengiriman`);

--
-- Indexes for table `picking`
--
ALTER TABLE `picking`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode` (`kode`);

--
-- Indexes for table `picking_items`
--
ALTER TABLE `picking_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `picking_id` (`picking_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`barcode`),
  ADD KEY `fk_produk_kategori` (`category_id`),
  ADD KEY `fk_products_rak` (`rak_id`);

--
-- Indexes for table `stok_lokasi`
--
ALTER TABLE `stok_lokasi`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unik_produk_gudang` (`barcode`,`gudang_id`),
  ADD KEY `gudang_id` (`gudang_id`);

--
-- Indexes for table `supplier`
--
ALTER TABLE `supplier`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_transaksi_kasir` (`kasir_id`);

--
-- Indexes for table `transaction_items`
--
ALTER TABLE `transaction_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_item_transaksi` (`transaction_id`),
  ADD KEY `fk_item_produk` (`barcode`);

--
-- Indexes for table `transfer_gudang`
--
ALTER TABLE `transfer_gudang`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode_transfer` (`kode_transfer`),
  ADD KEY `dari_gudang_id` (`dari_gudang_id`),
  ADD KEY `ke_gudang_id` (`ke_gudang_id`);

--
-- Indexes for table `transfer_gudang_items`
--
ALTER TABLE `transfer_gudang_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `transfer_gudang_id` (`transfer_gudang_id`);

--
-- Indexes for table `transfer_stok`
--
ALTER TABLE `transfer_stok`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `no_transfer` (`no_transfer`),
  ADD KEY `barcode` (`barcode`),
  ADD KEY `dari_gudang_id` (`dari_gudang_id`),
  ADD KEY `ke_gudang_id` (`ke_gudang_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `barang_retur`
--
ALTER TABLE `barang_retur`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `barang_rusak`
--
ALTER TABLE `barang_rusak`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `gudang`
--
ALTER TABLE `gudang`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `lokasi_rak`
--
ALTER TABLE `lokasi_rak`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `packing`
--
ALTER TABLE `packing`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `pengiriman`
--
ALTER TABLE `pengiriman`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `picking`
--
ALTER TABLE `picking`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `picking_items`
--
ALTER TABLE `picking_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `stok_lokasi`
--
ALTER TABLE `stok_lokasi`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `supplier`
--
ALTER TABLE `supplier`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `transaction_items`
--
ALTER TABLE `transaction_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `transfer_gudang`
--
ALTER TABLE `transfer_gudang`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `transfer_gudang_items`
--
ALTER TABLE `transfer_gudang_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `transfer_stok`
--
ALTER TABLE `transfer_stok`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `barang_retur`
--
ALTER TABLE `barang_retur`
  ADD CONSTRAINT `barang_retur_ibfk_1` FOREIGN KEY (`product_barcode`) REFERENCES `products` (`barcode`);

--
-- Constraints for table `barang_rusak`
--
ALTER TABLE `barang_rusak`
  ADD CONSTRAINT `barang_rusak_ibfk_1` FOREIGN KEY (`barcode`) REFERENCES `products` (`barcode`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_pembayaran_transaksi` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `picking_items`
--
ALTER TABLE `picking_items`
  ADD CONSTRAINT `picking_items_ibfk_1` FOREIGN KEY (`picking_id`) REFERENCES `picking` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_rak` FOREIGN KEY (`rak_id`) REFERENCES `lokasi_rak` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_produk_kategori` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

--
-- Constraints for table `stok_lokasi`
--
ALTER TABLE `stok_lokasi`
  ADD CONSTRAINT `stok_lokasi_ibfk_1` FOREIGN KEY (`barcode`) REFERENCES `products` (`barcode`),
  ADD CONSTRAINT `stok_lokasi_ibfk_2` FOREIGN KEY (`gudang_id`) REFERENCES `gudang` (`id`);

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `fk_transaksi_kasir` FOREIGN KEY (`kasir_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `transaction_items`
--
ALTER TABLE `transaction_items`
  ADD CONSTRAINT `fk_item_produk` FOREIGN KEY (`barcode`) REFERENCES `products` (`barcode`),
  ADD CONSTRAINT `fk_item_transaksi` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `transfer_gudang`
--
ALTER TABLE `transfer_gudang`
  ADD CONSTRAINT `transfer_gudang_ibfk_1` FOREIGN KEY (`dari_gudang_id`) REFERENCES `gudang` (`id`),
  ADD CONSTRAINT `transfer_gudang_ibfk_2` FOREIGN KEY (`ke_gudang_id`) REFERENCES `gudang` (`id`);

--
-- Constraints for table `transfer_gudang_items`
--
ALTER TABLE `transfer_gudang_items`
  ADD CONSTRAINT `transfer_gudang_items_ibfk_1` FOREIGN KEY (`transfer_gudang_id`) REFERENCES `transfer_gudang` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `transfer_stok`
--
ALTER TABLE `transfer_stok`
  ADD CONSTRAINT `transfer_stok_ibfk_1` FOREIGN KEY (`barcode`) REFERENCES `products` (`barcode`),
  ADD CONSTRAINT `transfer_stok_ibfk_2` FOREIGN KEY (`dari_gudang_id`) REFERENCES `gudang` (`id`),
  ADD CONSTRAINT `transfer_stok_ibfk_3` FOREIGN KEY (`ke_gudang_id`) REFERENCES `gudang` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
