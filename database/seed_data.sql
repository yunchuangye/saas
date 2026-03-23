-- ============================================================
-- 示例数据：主要城市楼盘/楼栋/房屋/案例
-- 深圳(190) 北京(1) 上海(69) 广州(188) 杭州(83) 成都(228)
-- ============================================================
SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- ============================================================
-- 1. 楼盘数据（estates 主表）
-- ============================================================
TRUNCATE TABLE estates;
ALTER TABLE estates AUTO_INCREMENT = 1;

INSERT INTO estates (name, pinyin, city_id, district_id, address, developer, build_year, property_type, total_units, is_active) VALUES
-- 深圳·福田区(505)
('万科金色家园', 'WKJSJY', 190, 505, '深圳市福田区莲花路1号', '万科地产', 2015, '住宅', 1200, 1),
('保利中央公园', 'BLZYGQ', 190, 505, '深圳市福田区中心路88号', '保利发展', 2018, '住宅', 980, 1),
('招商花园城', 'ZSHYC', 190, 505, '深圳市福田区红荔路168号', '招商蛇口', 2016, '住宅', 756, 1),
('华润城润府', 'HRCLF', 190, 505, '深圳市福田区笋岗路100号', '华润置地', 2019, '住宅', 1560, 1),
('中海天钻', 'ZHTZ', 190, 505, '深圳市福田区深南大道6008号', '中海地产', 2020, '住宅', 860, 1),
-- 深圳·南山区(506)
('万科云城', 'WKYC', 190, 506, '深圳市南山区留仙大道3333号', '万科地产', 2017, '住宅', 2100, 1),
('华侨城天鹅湖', 'HQCTEH', 190, 506, '深圳市南山区华侨城路1号', '华侨城集团', 2014, '住宅', 680, 1),
('深业上城', 'SYSC', 190, 506, '深圳市南山区科苑路8号', '深业集团', 2018, '住宅', 1340, 1),
('招商太子湾', 'ZSTZW', 190, 506, '深圳市南山区太子路1号', '招商蛇口', 2021, '住宅', 920, 1),
('绿景虹湾', 'LJHW', 190, 506, '深圳市南山区后海大道68号', '绿景集团', 2016, '住宅', 1100, 1),
-- 深圳·宝安区(507)
('万科星城', 'WKXC', 190, 507, '深圳市宝安区宝城路88号', '万科地产', 2016, '住宅', 1800, 1),
('碧桂园凤凰城', 'BGYFHYC', 190, 507, '深圳市宝安区福永路168号', '碧桂园', 2017, '住宅', 3200, 1),
('恒大御景湾', 'HDYJW', 190, 507, '深圳市宝安区新安路66号', '恒大集团', 2015, '住宅', 2400, 1),
('龙光玖龙台', 'LGJLT', 190, 507, '深圳市宝安区西乡大道888号', '龙光地产', 2019, '住宅', 1560, 1),
-- 深圳·龙岗区(508)
('万科城', 'WKC', 190, 508, '深圳市龙岗区坂田街道万科路1号', '万科地产', 2008, '住宅', 8800, 1),
('碧桂园天汇', 'BGYTH', 190, 508, '深圳市龙岗区龙城街道龙翔大道88号', '碧桂园', 2018, '住宅', 2600, 1),
('保利香槟国际', 'BLXCGJ', 190, 508, '深圳市龙岗区布吉街道香槟路1号', '保利发展', 2016, '住宅', 1900, 1),
-- 深圳·罗湖区(504)
('万象城住宅', 'WXCZZ', 190, 504, '深圳市罗湖区宝安南路1881号', '华润置地', 2012, '住宅', 560, 1),
('东门御景', 'DMYJ', 190, 504, '深圳市罗湖区东门中路168号', '中洲控股', 2014, '住宅', 780, 1),
('翠竹苑', 'CZY', 190, 504, '深圳市罗湖区翠竹路88号', '深圳市房产', 2005, '住宅', 1200, 1),
-- 北京(1)
('万科长阳天地', 'WKCYTD', 1, NULL, '北京市房山区长阳镇长兴路1号', '万科地产', 2016, '住宅', 3200, 1),
('中海寰宇天下', 'ZHHYTX', 1, NULL, '北京市西城区西二环路88号', '中海地产', 2018, '住宅', 1200, 1),
('保利罗兰香谷', 'BLLXG', 1, NULL, '北京市朝阳区东四环路168号', '保利发展', 2015, '住宅', 2800, 1),
-- 上海(69)
('万科翡翠公园', 'WKFCGQ', 69, NULL, '上海市浦东新区张江路188号', '万科地产', 2019, '住宅', 1800, 1),
('绿地海珀旭晖', 'LDHPXH', 69, NULL, '上海市黄浦区西藏南路168号', '绿地集团', 2020, '住宅', 560, 1),
-- 广州(188)
('万科金色城品', 'WKJSCP', 188, NULL, '广州市天河区天河路385号', '万科地产', 2017, '住宅', 2200, 1),
('保利天汇', 'BLTH', 188, NULL, '广州市越秀区东风中路168号', '保利发展', 2018, '住宅', 980, 1),
-- 杭州(83)
('万科大都会', 'WKDDH', 83, NULL, '杭州市上城区钱江路88号', '万科地产', 2019, '住宅', 1600, 1),
('绿城玫瑰园', 'LCMGY', 83, NULL, '杭州市西湖区文一路168号', '绿城中国', 2016, '住宅', 860, 1),
-- 成都(228)
('万科魅力之城', 'WKMLZC', 228, NULL, '成都市锦江区锦华路88号', '万科地产', 2017, '住宅', 3600, 1),
('保利时代', 'BLSD', 228, NULL, '成都市武侯区天府大道168号', '保利发展', 2018, '住宅', 2400, 1);

-- ============================================================
-- 2. 楼栋数据（buildings 主表）
-- ============================================================
TRUNCATE TABLE buildings;
ALTER TABLE buildings AUTO_INCREMENT = 1;

INSERT INTO buildings (estate_id, name, floors, units_per_floor, build_year, property_type, total_units, avg_price, completion_date) VALUES
-- 万科金色家园(1)
(1, '1栋', 32, 4, 2015, '住宅', 128, 85000.00, '2015-12'),
(1, '2栋', 32, 4, 2015, '住宅', 128, 85000.00, '2015-12'),
(1, '3栋', 28, 4, 2015, '住宅', 112, 84000.00, '2015-12'),
(1, '4栋', 28, 4, 2015, '住宅', 112, 84000.00, '2015-12'),
-- 保利中央公园(2)
(2, 'A座', 36, 4, 2018, '住宅', 144, 92000.00, '2018-06'),
(2, 'B座', 36, 4, 2018, '住宅', 144, 92000.00, '2018-06'),
(2, 'C座', 30, 4, 2018, '住宅', 120, 90000.00, '2018-06'),
-- 万科云城(6)
(6, '1期1栋', 40, 4, 2017, '住宅', 160, 105000.00, '2017-09'),
(6, '1期2栋', 40, 4, 2017, '住宅', 160, 105000.00, '2017-09'),
(6, '2期1栋', 42, 4, 2018, '住宅', 168, 112000.00, '2018-12'),
(6, '2期2栋', 42, 4, 2018, '住宅', 168, 112000.00, '2018-12'),
-- 招商太子湾(9)
(9, '1号楼', 45, 4, 2021, '住宅', 180, 145000.00, '2021-06'),
(9, '2号楼', 45, 4, 2021, '住宅', 180, 145000.00, '2021-06'),
(9, '3号楼', 38, 4, 2021, '住宅', 152, 140000.00, '2021-06'),
-- 万科城(15)
(15, '1区1栋', 18, 6, 2008, '住宅', 108, 55000.00, '2008-06'),
(15, '1区2栋', 18, 6, 2008, '住宅', 108, 55000.00, '2008-06'),
(15, '2区1栋', 22, 6, 2010, '住宅', 132, 58000.00, '2010-09'),
(15, '2区2栋', 22, 6, 2010, '住宅', 132, 58000.00, '2010-09'),
(15, '3区1栋', 26, 4, 2012, '住宅', 104, 62000.00, '2012-12'),
-- 万科长阳天地(21) - 北京
(21, '1号楼', 24, 4, 2016, '住宅', 96, 42000.00, '2016-12'),
(21, '2号楼', 24, 4, 2016, '住宅', 96, 42000.00, '2016-12'),
(21, '3号楼', 28, 4, 2017, '住宅', 112, 44000.00, '2017-06'),
-- 万科翡翠公园(24) - 上海
(24, 'A栋', 34, 4, 2019, '住宅', 136, 78000.00, '2019-09'),
(24, 'B栋', 34, 4, 2019, '住宅', 136, 78000.00, '2019-09'),
-- 万科金色城品(26) - 广州
(26, '1座', 32, 4, 2017, '住宅', 128, 38000.00, '2017-12'),
(26, '2座', 32, 4, 2017, '住宅', 128, 38000.00, '2017-12'),
-- 万科大都会(28) - 杭州
(28, '1幢', 30, 4, 2019, '住宅', 120, 45000.00, '2019-06'),
(28, '2幢', 30, 4, 2019, '住宅', 120, 45000.00, '2019-06'),
-- 万科魅力之城(30) - 成都
(30, '1栋', 20, 4, 2017, '住宅', 80, 18000.00, '2017-09'),
(30, '2栋', 20, 4, 2017, '住宅', 80, 18000.00, '2017-09'),
(30, '3栋', 24, 4, 2018, '住宅', 96, 19000.00, '2018-06');

-- ============================================================
-- 3. 房屋单元数据（units 主表）
-- ============================================================
TRUNCATE TABLE units;
ALTER TABLE units AUTO_INCREMENT = 1;

-- 万科金色家园 1栋(building_id=1)，estate_id=1
INSERT INTO units (building_id, estate_id, unit_number, floor, area, build_area, rooms, bathrooms, orientation, unit_price, total_price, property_type) VALUES
(1, 1, '101', 1, 89.50, 98.20, 3, 2, '南', 82000.00, 8059000.00, '住宅'),
(1, 1, '102', 1, 120.30, 132.10, 4, 2, '南北', 83000.00, 10965000.00, '住宅'),
(1, 1, '201', 2, 89.50, 98.20, 3, 2, '南', 83000.00, 7929000.00, '住宅'),
(1, 1, '501', 5, 89.50, 98.20, 3, 2, '南', 85000.00, 8348000.00, '住宅'),
(1, 1, '1001', 10, 89.50, 98.20, 3, 2, '南', 87000.00, 8548000.00, '住宅'),
(1, 1, '2001', 20, 89.50, 98.20, 3, 2, '南', 90000.00, 8806000.00, '住宅'),
(1, 1, '3201', 32, 89.50, 98.20, 3, 2, '南', 98000.00, 9271000.00, '住宅'),
-- 万科金色家园 2栋(building_id=2)，estate_id=1
(2, 1, '101', 1, 95.60, 105.00, 3, 2, '南', 82000.00, 8609000.00, '住宅'),
(2, 1, '1001', 10, 95.60, 105.00, 3, 2, '南', 87000.00, 9137000.00, '住宅'),
(2, 1, '2001', 20, 95.60, 105.00, 3, 2, '南', 91000.00, 9500000.00, '住宅'),
(2, 1, '3001', 30, 95.60, 105.00, 3, 2, '南', 96000.00, 10058000.00, '住宅'),
-- 保利中央公园 A座(building_id=5)，estate_id=2
(5, 2, '101', 1, 108.00, 118.50, 3, 2, '南', 88000.00, 10428000.00, '住宅'),
(5, 2, '1001', 10, 108.00, 118.50, 3, 2, '南', 93000.00, 11016000.00, '住宅'),
(5, 2, '2001', 20, 108.00, 118.50, 3, 2, '南', 97000.00, 11448000.00, '住宅'),
(5, 2, '3601', 36, 108.00, 118.50, 3, 2, '南', 105000.00, 12420000.00, '住宅'),
-- 万科云城 1期1栋(building_id=8)，estate_id=6
(8, 6, '101', 1, 88.00, 96.80, 3, 2, '南', 100000.00, 9680000.00, '住宅'),
(8, 6, '1001', 10, 88.00, 96.80, 3, 2, '南', 106000.00, 10261000.00, '住宅'),
(8, 6, '2001', 20, 88.00, 96.80, 3, 2, '南', 112000.00, 10842000.00, '住宅'),
(8, 6, '4001', 40, 88.00, 96.80, 3, 2, '南', 125000.00, 12100000.00, '住宅'),
-- 招商太子湾 1号楼(building_id=12)，estate_id=9
(12, 9, '101', 1, 128.00, 140.50, 4, 2, '南', 135000.00, 18968000.00, '住宅'),
(12, 9, '1001', 10, 128.00, 140.50, 4, 2, '南', 142000.00, 19951000.00, '住宅'),
(12, 9, '2001', 20, 128.00, 140.50, 4, 2, '南', 150000.00, 21075000.00, '住宅'),
(12, 9, '4501', 45, 128.00, 140.50, 4, 2, '南', 175000.00, 24588000.00, '住宅'),
-- 万科城 1区1栋(building_id=15)，estate_id=15
(15, 15, '101', 1, 78.00, 85.80, 2, 1, '南', 52000.00, 4462000.00, '住宅'),
(15, 15, '1001', 10, 78.00, 85.80, 2, 1, '南', 56000.00, 4805000.00, '住宅'),
(15, 15, '1801', 18, 78.00, 85.80, 2, 1, '南', 60000.00, 5148000.00, '住宅'),
-- 万科长阳天地 1号楼(building_id=20)，estate_id=21，北京
(20, 21, '101', 1, 88.00, 96.80, 3, 2, '南', 40000.00, 3872000.00, '住宅'),
(20, 21, '1001', 10, 88.00, 96.80, 3, 2, '南', 43000.00, 4162000.00, '住宅'),
(20, 21, '2401', 24, 88.00, 96.80, 3, 2, '南', 47000.00, 4550000.00, '住宅'),
-- 万科翡翠公园 A栋(building_id=23)，estate_id=24，上海
(23, 24, '101', 1, 98.00, 107.80, 3, 2, '南', 74000.00, 7977000.00, '住宅'),
(23, 24, '1001', 10, 98.00, 107.80, 3, 2, '南', 79000.00, 8516000.00, '住宅'),
(23, 24, '3401', 34, 98.00, 107.80, 3, 2, '南', 90000.00, 9702000.00, '住宅'),
-- 万科大都会 1幢(building_id=27)，estate_id=28，杭州
(27, 28, '101', 1, 89.00, 97.80, 3, 2, '南', 42000.00, 4108000.00, '住宅'),
(27, 28, '1001', 10, 89.00, 97.80, 3, 2, '南', 46000.00, 4499000.00, '住宅'),
-- 万科魅力之城 1栋(building_id=30)，estate_id=30，成都
(30, 30, '101', 1, 88.00, 96.80, 3, 2, '南', 17000.00, 1646000.00, '住宅'),
(30, 30, '1001', 10, 88.00, 96.80, 3, 2, '南', 19000.00, 1839000.00, '住宅'),
(30, 30, '2001', 20, 88.00, 96.80, 3, 2, '南', 21000.00, 2033000.00, '住宅');

-- ============================================================
-- 4. 成交案例数据（cases 主表）
-- ============================================================
TRUNCATE TABLE cases;
ALTER TABLE cases AUTO_INCREMENT = 1;

INSERT INTO cases (city_id, estate_id, building_id, unit_id, address, area, floor, total_floors, orientation, property_type, transaction_type, price, unit_price, deal_date, source) VALUES
-- 深圳·福田·万科金色家园
(190, 1, 1, 1, '深圳市福田区莲花路1号1栋101', 89.50, 1, 32, '南', '住宅', 'sale', 7900000.00, 88268.00, '2025-12-15', '链家'),
(190, 1, 1, 3, '深圳市福田区莲花路1号1栋201', 89.50, 2, 32, '南', '住宅', 'sale', 8050000.00, 89944.00, '2025-11-20', '安居客'),
(190, 1, 1, 5, '深圳市福田区莲花路1号1栋1001', 89.50, 10, 32, '南', '住宅', 'sale', 8500000.00, 94972.00, '2026-01-08', '链家'),
(190, 1, 1, 6, '深圳市福田区莲花路1号1栋2001', 89.50, 20, 32, '南', '住宅', 'sale', 9200000.00, 102793.00, '2026-02-15', '贝壳'),
(190, 1, 2, 8, '深圳市福田区莲花路1号2栋101', 95.60, 1, 32, '南', '住宅', 'sale', 8400000.00, 87866.00, '2025-10-12', '链家'),
(190, 1, 2, 9, '深圳市福田区莲花路1号2栋1001', 95.60, 10, 32, '南', '住宅', 'sale', 9100000.00, 95188.00, '2026-01-22', '安居客'),
-- 深圳·南山·万科云城
(190, 6, 8, 17, '深圳市南山区留仙大道3333号1期1栋101', 88.00, 1, 40, '南', '住宅', 'sale', 9500000.00, 107955.00, '2025-11-05', '链家'),
(190, 6, 8, 18, '深圳市南山区留仙大道3333号1期1栋1001', 88.00, 10, 40, '南', '住宅', 'sale', 10200000.00, 115909.00, '2026-01-18', '贝壳'),
(190, 6, 8, 19, '深圳市南山区留仙大道3333号1期1栋2001', 88.00, 20, 40, '南', '住宅', 'sale', 11000000.00, 125000.00, '2026-02-28', '链家'),
-- 深圳·南山·招商太子湾
(190, 9, 12, 21, '深圳市南山区太子路1号1号楼101', 128.00, 1, 45, '南', '住宅', 'sale', 18500000.00, 144531.00, '2025-09-20', '链家'),
(190, 9, 12, 22, '深圳市南山区太子路1号1号楼1001', 128.00, 10, 45, '南', '住宅', 'sale', 20000000.00, 156250.00, '2025-12-08', '贝壳'),
(190, 9, 12, 23, '深圳市南山区太子路1号1号楼2001', 128.00, 20, 45, '南', '住宅', 'sale', 22000000.00, 171875.00, '2026-03-01', '链家'),
-- 深圳·龙岗·万科城
(190, 15, 15, 25, '深圳市龙岗区坂田万科路1号1区1栋101', 78.00, 1, 18, '南', '住宅', 'sale', 4200000.00, 53846.00, '2025-10-30', '链家'),
(190, 15, 15, 26, '深圳市龙岗区坂田万科路1号1区1栋1001', 78.00, 10, 18, '南', '住宅', 'sale', 4600000.00, 58974.00, '2026-01-15', '安居客'),
-- 北京·万科长阳天地
(1, 21, 20, 28, '北京市房山区长阳镇1号楼101', 88.00, 1, 24, '南', '住宅', 'sale', 3800000.00, 43182.00, '2025-11-12', '链家'),
(1, 21, 20, 29, '北京市房山区长阳镇1号楼1001', 88.00, 10, 24, '南', '住宅', 'sale', 4200000.00, 47727.00, '2026-02-20', '贝壳'),
-- 上海·万科翡翠公园
(69, 24, 23, 31, '上海市浦东新区张江路188号A栋101', 98.00, 1, 34, '南', '住宅', 'sale', 7600000.00, 77551.00, '2025-12-01', '链家'),
(69, 24, 23, 32, '上海市浦东新区张江路188号A栋1001', 98.00, 10, 34, '南', '住宅', 'sale', 8200000.00, 83673.00, '2026-01-25', '贝壳'),
-- 广州·万科金色城品
(188, 26, 25, NULL, '广州市天河区天河路385号1座101', 95.00, 1, 32, '南', '住宅', 'sale', 3600000.00, 37895.00, '2025-10-18', '链家'),
(188, 26, 25, NULL, '广州市天河区天河路385号1座1001', 95.00, 10, 32, '南', '住宅', 'sale', 3900000.00, 41053.00, '2026-02-10', '安居客'),
-- 杭州·万科大都会
(83, 28, 27, NULL, '杭州市上城区钱江路88号1幢101', 89.00, 1, 30, '南', '住宅', 'sale', 3800000.00, 42697.00, '2025-11-28', '链家'),
(83, 28, 27, NULL, '杭州市上城区钱江路88号1幢1001', 89.00, 10, 30, '南', '住宅', 'sale', 4200000.00, 47191.00, '2026-01-30', '贝壳'),
-- 成都·万科魅力之城
(228, 30, 30, NULL, '成都市锦江区锦华路88号1栋101', 88.00, 1, 20, '南', '住宅', 'sale', 1580000.00, 17955.00, '2025-12-20', '链家'),
(228, 30, 30, NULL, '成都市锦江区锦华路88号1栋1001', 88.00, 10, 20, '南', '住宅', 'sale', 1750000.00, 19886.00, '2026-02-05', '安居客');

-- ============================================================
-- 5. 同步数据到分片表
-- 深圳 city_id=190，190 % 8 = 6 → _6 表
-- 北京 city_id=1，1 % 8 = 1 → _1 表
-- 上海 city_id=69，69 % 8 = 5 → _5 表
-- 广州 city_id=188，188 % 8 = 4 → _4 表
-- 杭州 city_id=83，83 % 8 = 3 → _3 表
-- 成都 city_id=228，228 % 8 = 4 → _4 表（与广州同分片）
-- ============================================================

-- 深圳 → _6
INSERT INTO estates_6 (id, name, pinyin, city_id, district_id, address, developer, build_year, property_type, total_units, is_active, created_at)
SELECT id, name, pinyin, city_id, district_id, address, developer, build_year, property_type, total_units, is_active, created_at FROM estates WHERE city_id = 190;

INSERT INTO buildings_6 (id, estate_id, name, floors, units_per_floor, build_year, property_type, total_units, avg_price, completion_date, created_at)
SELECT b.id, b.estate_id, b.name, b.floors, b.units_per_floor, b.build_year, b.property_type, b.total_units, b.avg_price, b.completion_date, b.created_at
FROM buildings b JOIN estates e ON b.estate_id = e.id WHERE e.city_id = 190;

INSERT INTO units_6 (id, building_id, estate_id, unit_number, floor, area, build_area, rooms, bathrooms, orientation, unit_price, total_price, property_type, created_at)
SELECT u.id, u.building_id, u.estate_id, u.unit_number, u.floor, u.area, u.build_area, u.rooms, u.bathrooms, u.orientation, u.unit_price, u.total_price, u.property_type, u.created_at
FROM units u JOIN estates e ON u.estate_id = e.id WHERE e.city_id = 190;

INSERT INTO cases_6 (city_id, estate_id, building_id, unit_id, address, area, floor, total_floors, unit_price, total_price, transaction_type, deal_date, source, created_at)
SELECT city_id, estate_id, building_id, unit_id, address, area, floor, total_floors, unit_price, price, transaction_type, deal_date, source, created_at
FROM cases WHERE city_id = 190;

-- 北京 → _1
INSERT INTO estates_1 (id, name, pinyin, city_id, district_id, address, developer, build_year, property_type, total_units, is_active, created_at)
SELECT id, name, pinyin, city_id, district_id, address, developer, build_year, property_type, total_units, is_active, created_at FROM estates WHERE city_id = 1;

INSERT INTO buildings_1 (id, estate_id, name, floors, units_per_floor, build_year, property_type, total_units, avg_price, completion_date, created_at)
SELECT b.id, b.estate_id, b.name, b.floors, b.units_per_floor, b.build_year, b.property_type, b.total_units, b.avg_price, b.completion_date, b.created_at
FROM buildings b JOIN estates e ON b.estate_id = e.id WHERE e.city_id = 1;

INSERT INTO cases_1 (city_id, estate_id, building_id, unit_id, address, area, floor, total_floors, unit_price, total_price, transaction_type, deal_date, source, created_at)
SELECT city_id, estate_id, building_id, unit_id, address, area, floor, total_floors, unit_price, price, transaction_type, deal_date, source, created_at
FROM cases WHERE city_id = 1;

-- 上海 → _5
INSERT INTO estates_5 (id, name, pinyin, city_id, district_id, address, developer, build_year, property_type, total_units, is_active, created_at)
SELECT id, name, pinyin, city_id, district_id, address, developer, build_year, property_type, total_units, is_active, created_at FROM estates WHERE city_id = 69;

INSERT INTO buildings_5 (id, estate_id, name, floors, units_per_floor, build_year, property_type, total_units, avg_price, completion_date, created_at)
SELECT b.id, b.estate_id, b.name, b.floors, b.units_per_floor, b.build_year, b.property_type, b.total_units, b.avg_price, b.completion_date, b.created_at
FROM buildings b JOIN estates e ON b.estate_id = e.id WHERE e.city_id = 69;

INSERT INTO cases_5 (city_id, estate_id, building_id, unit_id, address, area, floor, total_floors, unit_price, total_price, transaction_type, deal_date, source, created_at)
SELECT city_id, estate_id, building_id, unit_id, address, area, floor, total_floors, unit_price, price, transaction_type, deal_date, source, created_at
FROM cases WHERE city_id = 69;

-- 广州 → _4
INSERT INTO estates_4 (id, name, pinyin, city_id, district_id, address, developer, build_year, property_type, total_units, is_active, created_at)
SELECT id, name, pinyin, city_id, district_id, address, developer, build_year, property_type, total_units, is_active, created_at FROM estates WHERE city_id = 188;

INSERT INTO cases_4 (city_id, estate_id, building_id, unit_id, address, area, floor, total_floors, unit_price, total_price, transaction_type, deal_date, source, created_at)
SELECT city_id, estate_id, building_id, unit_id, address, area, floor, total_floors, unit_price, price, transaction_type, deal_date, source, created_at
FROM cases WHERE city_id = 188;

-- 杭州 → _3
INSERT INTO estates_3 (id, name, pinyin, city_id, district_id, address, developer, build_year, property_type, total_units, is_active, created_at)
SELECT id, name, pinyin, city_id, district_id, address, developer, build_year, property_type, total_units, is_active, created_at FROM estates WHERE city_id = 83;

INSERT INTO cases_3 (city_id, estate_id, building_id, unit_id, address, area, floor, total_floors, unit_price, total_price, transaction_type, deal_date, source, created_at)
SELECT city_id, estate_id, building_id, unit_id, address, area, floor, total_floors, unit_price, price, transaction_type, deal_date, source, created_at
FROM cases WHERE city_id = 83;

-- 成都 → _4（与广州同分片，追加）
INSERT INTO estates_4 (id, name, pinyin, city_id, district_id, address, developer, build_year, property_type, total_units, is_active, created_at)
SELECT id, name, pinyin, city_id, district_id, address, developer, build_year, property_type, total_units, is_active, created_at FROM estates WHERE city_id = 228;

INSERT INTO cases_4 (city_id, estate_id, building_id, unit_id, address, area, floor, total_floors, unit_price, total_price, transaction_type, deal_date, source, created_at)
SELECT city_id, estate_id, building_id, unit_id, address, area, floor, total_floors, unit_price, price, transaction_type, deal_date, source, created_at
FROM cases WHERE city_id = 228;

SET foreign_key_checks = 1;
