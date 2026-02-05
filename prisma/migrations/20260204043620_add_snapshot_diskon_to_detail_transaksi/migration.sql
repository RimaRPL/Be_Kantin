-- AlterTable
ALTER TABLE `detail_transaksi` ADD COLUMN `harga_awal` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `persentase_diskon` DOUBLE NOT NULL DEFAULT 0;
