-- ============================================================
-- 分库分表 DDL：楼盘、楼栋、房屋单元、成交案例
-- 每个大区分库（gujia_south/east/north/central/west）均执行此脚本
-- 按 city_id 分片，每个分库内再按 city_id % 4 分为 4 张物理表
-- ============================================================

-- ─── 楼盘表 ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS estates_0 (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  city_id     INT NOT NULL COMMENT '城市ID（Sharding Key）',
  name        VARCHAR(200) NOT NULL,
  pinyin      VARCHAR(200) COMMENT '拼音首字母',
  district_id INT,
  address     VARCHAR(500),
  developer   VARCHAR(200),
  build_year  INT,
  property_type VARCHAR(100),
  total_units INT,
  latitude    DECIMAL(10,7) COMMENT '纬度',
  longitude   DECIMAL(10,7) COMMENT '经度',
  geohash     VARCHAR(12)   COMMENT 'GeoHash 编码（8位精度约19m）',
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_city_id (city_id),
  KEY idx_geohash (geohash),
  KEY idx_name (name(50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS estates_1 LIKE estates_0;
CREATE TABLE IF NOT EXISTS estates_2 LIKE estates_0;
CREATE TABLE IF NOT EXISTS estates_3 LIKE estates_0;

-- ─── 楼栋表 ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS buildings_0 (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  city_id         INT NOT NULL COMMENT '城市ID（Sharding Key）',
  estate_id       BIGINT UNSIGNED NOT NULL,
  name            VARCHAR(100) NOT NULL,
  floors          INT,
  units_per_floor INT,
  total_units     INT,
  building_type   VARCHAR(50),
  build_structure VARCHAR(50),
  floor_height    DECIMAL(5,2),
  unit_amount     INT,
  building_area   DECIMAL(12,2),
  completion_date VARCHAR(50),
  sale_date       VARCHAR(50),
  avg_price       DECIMAL(10,2),
  elevator_rate   VARCHAR(50),
  sale_licence    VARCHAR(200),
  source_id       INT,
  source_estate_id INT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_city_id (city_id),
  KEY idx_estate_id (estate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS buildings_1 LIKE buildings_0;
CREATE TABLE IF NOT EXISTS buildings_2 LIKE buildings_0;
CREATE TABLE IF NOT EXISTS buildings_3 LIKE buildings_0;

-- ─── 房屋单元表 ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS units_0 (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  city_id         INT NOT NULL COMMENT '城市ID（Sharding Key）',
  building_id     BIGINT UNSIGNED NOT NULL,
  estate_id       BIGINT UNSIGNED NOT NULL,
  unit_number     VARCHAR(50) NOT NULL,
  floor           INT,
  area            DECIMAL(10,2),
  build_area      DECIMAL(10,2),
  rooms           INT,
  bathrooms       INT,
  orientation     VARCHAR(50),
  towards         VARCHAR(50),
  landscape       VARCHAR(100),
  unit_price      DECIMAL(12,2),
  total_price     DECIMAL(14,2),
  property_type   VARCHAR(100),
  property_no     VARCHAR(50),
  remark          VARCHAR(500),
  source_id       INT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_city_id (city_id),
  KEY idx_building_id (building_id),
  KEY idx_estate_id (estate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS units_1 LIKE units_0;
CREATE TABLE IF NOT EXISTS units_2 LIKE units_0;
CREATE TABLE IF NOT EXISTS units_3 LIKE units_0;

-- ─── 成交案例表 ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cases_0 (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  city_id          INT NOT NULL COMMENT '城市ID（Sharding Key）',
  estate_id        BIGINT UNSIGNED,
  building_id      BIGINT UNSIGNED,
  unit_id          BIGINT UNSIGNED,
  address          VARCHAR(500),
  area             DECIMAL(10,2),
  floor            INT,
  total_floors     INT,
  orientation      VARCHAR(50),
  property_type    VARCHAR(100),
  transaction_type ENUM('sale','rent') DEFAULT 'sale',
  price            DECIMAL(15,2),
  unit_price       DECIMAL(10,2),
  total_price      INT,
  listing_price    INT,
  deal_cycle       INT,
  transaction_date DATETIME,
  deal_date        DATETIME,
  source           VARCHAR(100),
  source_id        VARCHAR(200),
  source_url       VARCHAR(1000),
  community        VARCHAR(200),
  rooms            VARCHAR(50),
  decoration       VARCHAR(50),
  build_year       INT,
  latitude         DECIMAL(10,7),
  longitude        DECIMAL(10,7),
  geohash          VARCHAR(12),
  is_verified      TINYINT(1) DEFAULT 0,
  is_anomaly       TINYINT(1) DEFAULT 0,
  anomaly_reason   TEXT,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_city_id (city_id),
  KEY idx_geohash (geohash),
  KEY idx_estate_id (estate_id),
  KEY idx_deal_date (deal_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cases_1 LIKE cases_0;
CREATE TABLE IF NOT EXISTS cases_2 LIKE cases_0;
CREATE TABLE IF NOT EXISTS cases_3 LIKE cases_0;
