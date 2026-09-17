-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Sep 17, 2026 at 10:37 AM
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
(1, '2026-09-15', 'dari_pelanggan', NULL, '8991002102987', 2, 'Barang rusak', 'Diproses', '2026-09-16 02:34:18', NULL);

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
(3, '8991002101012', '2026-09-15', 3, 'bocor', 'Dibuang', '2026-09-15 09:20:09'),
(4, '089989010947', '2026-09-16', 7, 'basah, bocor', 'Menunggu', '2026-09-16 02:19:06'),
(5, '8991002102987', '2026-09-16', 3, 'kemasan rusak dan bocor', 'Menunggu', '2026-09-16 10:34:32');

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
  `tipe` enum('gudang','toko') DEFAULT 'toko',
  `alamat` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `gudang`
--

INSERT INTO `gudang` (`id`, `nama`, `tipe`, `alamat`, `created_at`) VALUES
(1, 'Gudang Pusat', 'gudang', NULL, '2026-09-17 02:02:44'),
(2, 'Toko surabaya', 'toko', NULL, '2026-09-17 02:32:52'),
(3, 'Toko bekasi Rajawali', 'toko', NULL, '2026-09-17 03:49:16');

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
(5, 5, 'QRIS', 10500, 0, 'Berhasil', '2026-09-17 05:03:21');

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
  `tgl_expired` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`barcode`, `nama`, `harga`, `stok`, `stok_minimum`, `category_id`, `gambar`, `created_at`, `updated_at`, `batch`, `tgl_expired`) VALUES
('089989010947', 'Indomie Goreng', 3500, 10, 10, 2, '/produk/indomie-goreng.png', '2026-09-14 07:01:31', '2026-09-17 05:03:21', '12345', '2027-09-15'),
('8991002101012', 'Teh Botol Sosro 450ml', 5500, 13, 10, 1, '/produk/teh-botol.png', '2026-09-14 07:01:31', '2026-09-17 05:03:21', '67890', '2029-12-24'),
('8991002102987', 'Kingkong', 1500, 120, 10, 4, '/produk/kingkong.png', '2026-09-15 02:36:25', '2026-09-17 05:03:21', '33333', '2026-09-21'),
('8996001600017', 'Aqua Botol 600ml', 4000, 100, 10, 1, '/produk/aqua-600ml.png', '2026-09-14 07:01:31', '2026-09-16 03:06:20', '22222', '2026-09-18');

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
(1, '089989010947', 1, 11),
(2, '8991002101012', 1, 14),
(3, '8991002102987', 1, 121),
(4, '8996001600017', 1, 100);

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
(5, 3, 10500, 0, NULL, 10500, '2026-09-17 05:03:21');

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
(14, 5, '089989010947', 'Indomie Goreng', 3500, 1, 3500);

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
(1, 'TRF-0001', '2026-09-17', '089989010947', 1, 2, 5, 'Proses', '2026-09-17 02:32:52'),
(2, 'TRF-0002', '2026-09-17', '8991002102987', 1, 3, 12, 'Selesai', '2026-09-17 03:49:16');

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
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transaction_id` (`transaction_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`barcode`),
  ADD KEY `fk_produk_kategori` (`category_id`);

--
-- Indexes for table `stok_lokasi`
--
ALTER TABLE `stok_lokasi`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unik_produk_gudang` (`barcode`,`gudang_id`),
  ADD KEY `gudang_id` (`gudang_id`);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `barang_rusak`
--
ALTER TABLE `barang_rusak`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `gudang`
--
ALTER TABLE `gudang`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `stok_lokasi`
--
ALTER TABLE `stok_lokasi`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `transaction_items`
--
ALTER TABLE `transaction_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `transfer_stok`
--
ALTER TABLE `transfer_stok`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
-- Constraints for table `products`
--
ALTER TABLE `products`
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
