-- 迁移脚本：为 cases 表添加 schema.ts 中定义但数据库中缺失的列
-- 执行时间：2026-03-14

SET @col_exists = 0;

-- source_id
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='gujia' AND TABLE_NAME='cases' AND COLUMN_NAME='source_id';
SET @sql = IF(@col_exists=0, 'ALTER TABLE cases ADD COLUMN source_id VARCHAR(200) NULL', 'SELECT "source_id already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- source_url
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='gujia' AND TABLE_NAME='cases' AND COLUMN_NAME='source_url';
SET @sql = IF(@col_exists=0, 'ALTER TABLE cases ADD COLUMN source_url VARCHAR(1000) NULL', 'SELECT "source_url already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- community
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='gujia' AND TABLE_NAME='cases' AND COLUMN_NAME='community';
SET @sql = IF(@col_exists=0, 'ALTER TABLE cases ADD COLUMN community VARCHAR(200) NULL', 'SELECT "community already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- total_price
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='gujia' AND TABLE_NAME='cases' AND COLUMN_NAME='total_price';
SET @sql = IF(@col_exists=0, 'ALTER TABLE cases ADD COLUMN total_price INT NULL', 'SELECT "total_price already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- rooms_str
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='gujia' AND TABLE_NAME='cases' AND COLUMN_NAME='rooms_str';
SET @sql = IF(@col_exists=0, 'ALTER TABLE cases ADD COLUMN rooms_str VARCHAR(50) NULL', 'SELECT "rooms_str already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- decoration
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='gujia' AND TABLE_NAME='cases' AND COLUMN_NAME='decoration';
SET @sql = IF(@col_exists=0, 'ALTER TABLE cases ADD COLUMN decoration VARCHAR(50) NULL', 'SELECT "decoration already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- build_year
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='gujia' AND TABLE_NAME='cases' AND COLUMN_NAME='build_year';
SET @sql = IF(@col_exists=0, 'ALTER TABLE cases ADD COLUMN build_year INT NULL', 'SELECT "build_year already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- deal_date
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='gujia' AND TABLE_NAME='cases' AND COLUMN_NAME='deal_date';
SET @sql = IF(@col_exists=0, 'ALTER TABLE cases ADD COLUMN deal_date TIMESTAMP NULL', 'SELECT "deal_date already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- listing_price
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='gujia' AND TABLE_NAME='cases' AND COLUMN_NAME='listing_price';
SET @sql = IF(@col_exists=0, 'ALTER TABLE cases ADD COLUMN listing_price INT NULL', 'SELECT "listing_price already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- deal_cycle
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='gujia' AND TABLE_NAME='cases' AND COLUMN_NAME='deal_cycle';
SET @sql = IF(@col_exists=0, 'ALTER TABLE cases ADD COLUMN deal_cycle INT NULL', 'SELECT "deal_cycle already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- is_verified
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='gujia' AND TABLE_NAME='cases' AND COLUMN_NAME='is_verified';
SET @sql = IF(@col_exists=0, 'ALTER TABLE cases ADD COLUMN is_verified TINYINT(1) DEFAULT 0', 'SELECT "is_verified already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'cases 表迁移完成' AS migration_status;
