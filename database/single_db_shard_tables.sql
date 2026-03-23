-- ============================================================
-- 单库分表方案（Single Database Sharding）
-- 数据库：gujia（唯一主库）
-- 分表规则：city_id % 8，分为 8 张物理表（_0 ~ _7）
-- 覆盖容量：每张表 2000万行 × 8 = 1.6亿行（楼盘/楼栋/房屋/案例各自）
-- ============================================================

USE gujia;

-- ══════════════════════════════════════════════════════════════
-- 楼盘分表：estates_0 ~ estates_7
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS estates_0 LIKE estates;
CREATE TABLE IF NOT EXISTS estates_1 LIKE estates;
CREATE TABLE IF NOT EXISTS estates_2 LIKE estates;
CREATE TABLE IF NOT EXISTS estates_3 LIKE estates;
CREATE TABLE IF NOT EXISTS estates_4 LIKE estates;
CREATE TABLE IF NOT EXISTS estates_5 LIKE estates;
CREATE TABLE IF NOT EXISTS estates_6 LIKE estates;
CREATE TABLE IF NOT EXISTS estates_7 LIKE estates;

-- ══════════════════════════════════════════════════════════════
-- 楼栋分表：buildings_0 ~ buildings_7
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS buildings_0 LIKE buildings;
CREATE TABLE IF NOT EXISTS buildings_1 LIKE buildings;
CREATE TABLE IF NOT EXISTS buildings_2 LIKE buildings;
CREATE TABLE IF NOT EXISTS buildings_3 LIKE buildings;
CREATE TABLE IF NOT EXISTS buildings_4 LIKE buildings;
CREATE TABLE IF NOT EXISTS buildings_5 LIKE buildings;
CREATE TABLE IF NOT EXISTS buildings_6 LIKE buildings;
CREATE TABLE IF NOT EXISTS buildings_7 LIKE buildings;

-- ══════════════════════════════════════════════════════════════
-- 房屋分表：units_0 ~ units_7
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS units_0 LIKE units;
CREATE TABLE IF NOT EXISTS units_1 LIKE units;
CREATE TABLE IF NOT EXISTS units_2 LIKE units;
CREATE TABLE IF NOT EXISTS units_3 LIKE units;
CREATE TABLE IF NOT EXISTS units_4 LIKE units;
CREATE TABLE IF NOT EXISTS units_5 LIKE units;
CREATE TABLE IF NOT EXISTS units_6 LIKE units;
CREATE TABLE IF NOT EXISTS units_7 LIKE units;

-- ══════════════════════════════════════════════════════════════
-- 成交案例分表：cases_0 ~ cases_7
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS cases_0 (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  city_id      INT NOT NULL COMMENT '城市ID（Sharding Key）',
  estate_id    BIGINT UNSIGNED NULL COMMENT '关联楼盘ID',
  building_id  BIGINT UNSIGNED NULL COMMENT '关联楼栋ID',
  unit_id      BIGINT UNSIGNED NULL COMMENT '关联房屋ID',
  address      VARCHAR(500) NULL COMMENT '地址',
  community    VARCHAR(200) NULL COMMENT '小区名称',
  area         DECIMAL(10,2) NULL COMMENT '建筑面积（㎡）',
  floor        INT NULL COMMENT '所在楼层',
  total_floors INT NULL COMMENT '总楼层',
  rooms        VARCHAR(20) NULL COMMENT '户型（如3室2厅）',
  unit_price   DECIMAL(12,2) NULL COMMENT '单价（元/㎡）',
  total_price  DECIMAL(14,2) NULL COMMENT '总价（元）',
  transaction_type ENUM('sale','rent') DEFAULT 'sale' COMMENT '交易类型',
  deal_date    DATE NULL COMMENT '成交日期',
  source       VARCHAR(100) NULL COMMENT '数据来源',
  latitude     DECIMAL(10,7) NULL COMMENT '纬度',
  longitude    DECIMAL(10,7) NULL COMMENT '经度',
  geohash      VARCHAR(12) NULL COMMENT 'GeoHash编码',
  raw_data     JSON NULL COMMENT '原始爬虫数据',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_city_id (city_id),
  INDEX idx_estate_id (estate_id),
  INDEX idx_deal_date (deal_date),
  INDEX idx_geohash (geohash),
  INDEX idx_unit_price (unit_price),
  INDEX idx_transaction_type (transaction_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='成交案例分表_0';

CREATE TABLE IF NOT EXISTS cases_1 LIKE cases_0;
CREATE TABLE IF NOT EXISTS cases_2 LIKE cases_0;
CREATE TABLE IF NOT EXISTS cases_3 LIKE cases_0;
CREATE TABLE IF NOT EXISTS cases_4 LIKE cases_0;
CREATE TABLE IF NOT EXISTS cases_5 LIKE cases_0;
CREATE TABLE IF NOT EXISTS cases_6 LIKE cases_0;
CREATE TABLE IF NOT EXISTS cases_7 LIKE cases_0;

-- 修正分表注释
ALTER TABLE cases_1 COMMENT='成交案例分表_1';
ALTER TABLE cases_2 COMMENT='成交案例分表_2';
ALTER TABLE cases_3 COMMENT='成交案例分表_3';
ALTER TABLE cases_4 COMMENT='成交案例分表_4';
ALTER TABLE cases_5 COMMENT='成交案例分表_5';
ALTER TABLE cases_6 COMMENT='成交案例分表_6';
ALTER TABLE cases_7 COMMENT='成交案例分表_7';

-- ══════════════════════════════════════════════════════════════
-- 验证分表创建结果
-- ══════════════════════════════════════════════════════════════
SELECT 
  TABLE_NAME,
  TABLE_COMMENT,
  TABLE_ROWS,
  CREATE_TIME
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'gujia' 
  AND TABLE_NAME REGEXP '^(estates|buildings|units|cases)_[0-7]$'
ORDER BY TABLE_NAME;
