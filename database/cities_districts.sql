-- ============================================================
-- 全国主要城市及下辖区/县数据
-- 覆盖：4个直辖市 + 27个省会城市 + 5个计划单列市 + 部分重要地级市
-- 共约 40 个城市，600+ 个区/县
-- 生成时间：2026-03-13
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 1. 清空并重置 cities 表（保留原有数据结构）
-- ------------------------------------------------------------
TRUNCATE TABLE cities;
ALTER TABLE cities AUTO_INCREMENT = 1;

-- ------------------------------------------------------------
-- 2. 新建 districts（区/县）表
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `districts`;
CREATE TABLE `districts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `city_id` int NOT NULL COMMENT '所属城市ID',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '区/县名称',
  `code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '行政区划代码',
  `type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'district' COMMENT 'district=市辖区 county=县/县级市 new_area=新区',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `idx_city_id` (`city_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='区/县数据表';

-- ------------------------------------------------------------
-- 3. 插入城市数据
-- ------------------------------------------------------------
INSERT INTO `cities` (`id`, `name`, `province`, `code`, `is_active`) VALUES
-- 直辖市
(1,  '北京',   '北京市',   '110000', 1),
(2,  '上海',   '上海市',   '310000', 1),
(3,  '天津',   '天津市',   '120000', 1),
(4,  '重庆',   '重庆市',   '500000', 1),
-- 广东省
(5,  '广州',   '广东省',   '440100', 1),
(6,  '深圳',   '广东省',   '440300', 1),
(7,  '东莞',   '广东省',   '441900', 1),
(8,  '佛山',   '广东省',   '440600', 1),
(9,  '珠海',   '广东省',   '440400', 1),
-- 江苏省
(10, '南京',   '江苏省',   '320100', 1),
(11, '苏州',   '江苏省',   '320500', 1),
(12, '无锡',   '江苏省',   '320200', 1),
(13, '南通',   '江苏省',   '320600', 1),
-- 浙江省
(14, '杭州',   '浙江省',   '330100', 1),
(15, '宁波',   '浙江省',   '330200', 1),
(16, '温州',   '浙江省',   '330300', 1),
(17, '金华',   '浙江省',   '330700', 1),
-- 四川省
(18, '成都',   '四川省',   '510100', 1),
-- 湖北省
(19, '武汉',   '湖北省',   '420100', 1),
-- 湖南省
(20, '长沙',   '湖南省',   '430100', 1),
-- 陕西省
(21, '西安',   '陕西省',   '610100', 1),
-- 辽宁省
(22, '沈阳',   '辽宁省',   '210100', 1),
(23, '大连',   '辽宁省',   '210200', 1),
-- 山东省
(24, '济南',   '山东省',   '370100', 1),
(25, '青岛',   '山东省',   '370200', 1),
(26, '烟台',   '山东省',   '370600', 1),
-- 福建省
(27, '福州',   '福建省',   '350100', 1),
(28, '厦门',   '福建省',   '350200', 1),
-- 安徽省
(29, '合肥',   '安徽省',   '340100', 1),
-- 江西省
(30, '南昌',   '江西省',   '360100', 1),
-- 河南省
(31, '郑州',   '河南省',   '410100', 1),
-- 河北省
(32, '石家庄', '河北省',   '130100', 1),
-- 山西省
(33, '太原',   '山西省',   '140100', 1),
-- 黑龙江省
(34, '哈尔滨', '黑龙江省', '230100', 1),
-- 吉林省
(35, '长春',   '吉林省',   '220100', 1),
-- 广西
(36, '南宁',   '广西壮族自治区', '450100', 1),
-- 云南省
(37, '昆明',   '云南省',   '530100', 1),
-- 贵州省
(38, '贵阳',   '贵州省',   '520100', 1),
-- 海南省
(39, '海口',   '海南省',   '460100', 1),
-- 内蒙古
(40, '呼和浩特','内蒙古自治区','150100', 1),
-- 新疆
(41, '乌鲁木齐','新疆维吾尔自治区','650100', 1),
-- 甘肃省
(42, '兰州',   '甘肃省',   '620100', 1),
-- 宁夏
(43, '银川',   '宁夏回族自治区','640100', 1),
-- 青海省
(44, '西宁',   '青海省',   '630100', 1),
-- 西藏
(45, '拉萨',   '西藏自治区','540100', 1);

-- ------------------------------------------------------------
-- 4. 插入区/县数据
-- ------------------------------------------------------------

-- 北京市 (city_id=1)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(1, '东城区',   '110101', 'district'),
(1, '西城区',   '110102', 'district'),
(1, '朝阳区',   '110105', 'district'),
(1, '丰台区',   '110106', 'district'),
(1, '石景山区', '110107', 'district'),
(1, '海淀区',   '110108', 'district'),
(1, '门头沟区', '110109', 'district'),
(1, '房山区',   '110111', 'district'),
(1, '通州区',   '110112', 'district'),
(1, '顺义区',   '110113', 'district'),
(1, '昌平区',   '110114', 'district'),
(1, '大兴区',   '110115', 'district'),
(1, '怀柔区',   '110116', 'district'),
(1, '平谷区',   '110117', 'district'),
(1, '密云区',   '110118', 'district'),
(1, '延庆区',   '110119', 'district');

-- 上海市 (city_id=2)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(2, '黄浦区',   '310101', 'district'),
(2, '徐汇区',   '310104', 'district'),
(2, '长宁区',   '310105', 'district'),
(2, '静安区',   '310106', 'district'),
(2, '普陀区',   '310107', 'district'),
(2, '虹口区',   '310109', 'district'),
(2, '杨浦区',   '310110', 'district'),
(2, '闵行区',   '310112', 'district'),
(2, '宝山区',   '310113', 'district'),
(2, '嘉定区',   '310114', 'district'),
(2, '浦东新区', '310115', 'new_area'),
(2, '金山区',   '310116', 'district'),
(2, '松江区',   '310117', 'district'),
(2, '青浦区',   '310118', 'district'),
(2, '奉贤区',   '310120', 'district'),
(2, '崇明区',   '310151', 'district');

-- 天津市 (city_id=3)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(3, '和平区',   '120101', 'district'),
(3, '河东区',   '120102', 'district'),
(3, '河西区',   '120103', 'district'),
(3, '南开区',   '120104', 'district'),
(3, '河北区',   '120105', 'district'),
(3, '红桥区',   '120106', 'district'),
(3, '东丽区',   '120110', 'district'),
(3, '西青区',   '120111', 'district'),
(3, '津南区',   '120112', 'district'),
(3, '北辰区',   '120113', 'district'),
(3, '武清区',   '120114', 'district'),
(3, '宝坻区',   '120115', 'district'),
(3, '滨海新区', '120116', 'new_area'),
(3, '宁河区',   '120117', 'district'),
(3, '静海区',   '120118', 'district'),
(3, '蓟州区',   '120119', 'district');

-- 重庆市 (city_id=4)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(4, '渝中区',   '500103', 'district'),
(4, '大渡口区', '500104', 'district'),
(4, '江北区',   '500105', 'district'),
(4, '沙坪坝区', '500106', 'district'),
(4, '九龙坡区', '500107', 'district'),
(4, '南岸区',   '500108', 'district'),
(4, '北碚区',   '500109', 'district'),
(4, '綦江区',   '500110', 'district'),
(4, '大足区',   '500111', 'district'),
(4, '渝北区',   '500112', 'district'),
(4, '巴南区',   '500113', 'district'),
(4, '黔江区',   '500114', 'district'),
(4, '长寿区',   '500115', 'district'),
(4, '江津区',   '500116', 'district'),
(4, '合川区',   '500117', 'district'),
(4, '永川区',   '500118', 'district'),
(4, '南川区',   '500119', 'district'),
(4, '璧山区',   '500120', 'district'),
(4, '铜梁区',   '500151', 'district'),
(4, '潼南区',   '500152', 'district'),
(4, '荣昌区',   '500153', 'district'),
(4, '开州区',   '500154', 'district'),
(4, '梁平区',   '500155', 'district'),
(4, '武隆区',   '500156', 'district');

-- 广州市 (city_id=5)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(5, '荔湾区',   '440103', 'district'),
(5, '越秀区',   '440104', 'district'),
(5, '海珠区',   '440105', 'district'),
(5, '天河区',   '440106', 'district'),
(5, '白云区',   '440111', 'district'),
(5, '黄埔区',   '440112', 'district'),
(5, '番禺区',   '440113', 'district'),
(5, '花都区',   '440114', 'district'),
(5, '南沙区',   '440115', 'new_area'),
(5, '从化区',   '440117', 'district'),
(5, '增城区',   '440118', 'district');

-- 深圳市 (city_id=6)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(6, '罗湖区',   '440303', 'district'),
(6, '福田区',   '440304', 'district'),
(6, '南山区',   '440305', 'district'),
(6, '宝安区',   '440306', 'district'),
(6, '龙岗区',   '440307', 'district'),
(6, '盐田区',   '440308', 'district'),
(6, '龙华区',   '440309', 'district'),
(6, '坪山区',   '440310', 'district'),
(6, '光明区',   '440311', 'new_area'),
(6, '大鹏新区', '440312', 'new_area');

-- 东莞市 (city_id=7) - 直筒子市，无区级行政区
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(7, '莞城街道', '441900001', 'district'),
(7, '南城街道', '441900002', 'district'),
(7, '东城街道', '441900003', 'district'),
(7, '万江街道', '441900004', 'district'),
(7, '松山湖',   '441900005', 'new_area'),
(7, '虎门镇',   '441900006', 'district'),
(7, '长安镇',   '441900007', 'district'),
(7, '塘厦镇',   '441900008', 'district'),
(7, '凤岗镇',   '441900009', 'district'),
(7, '寮步镇',   '441900010', 'district');

-- 佛山市 (city_id=8)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(8, '禅城区',   '440604', 'district'),
(8, '南海区',   '440605', 'district'),
(8, '顺德区',   '440606', 'district'),
(8, '三水区',   '440607', 'district'),
(8, '高明区',   '440608', 'district');

-- 珠海市 (city_id=9)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(9, '香洲区',   '440402', 'district'),
(9, '斗门区',   '440403', 'district'),
(9, '金湾区',   '440404', 'district'),
(9, '横琴新区', '440405', 'new_area');

-- 南京市 (city_id=10)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(10, '玄武区',  '320102', 'district'),
(10, '秦淮区',  '320104', 'district'),
(10, '建邺区',  '320105', 'district'),
(10, '鼓楼区',  '320106', 'district'),
(10, '浦口区',  '320111', 'district'),
(10, '栖霞区',  '320113', 'district'),
(10, '雨花台区','320114', 'district'),
(10, '江宁区',  '320115', 'district'),
(10, '六合区',  '320116', 'district'),
(10, '溧水区',  '320117', 'district'),
(10, '高淳区',  '320118', 'district'),
(10, '江北新区','320119', 'new_area');

-- 苏州市 (city_id=11)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(11, '姑苏区',  '320508', 'district'),
(11, '虎丘区',  '320505', 'district'),
(11, '吴中区',  '320506', 'district'),
(11, '相城区',  '320507', 'district'),
(11, '吴江区',  '320509', 'district'),
(11, '苏州工业园区','320571', 'new_area'),
(11, '常熟市',  '320581', 'county'),
(11, '张家港市','320582', 'county'),
(11, '昆山市',  '320583', 'county'),
(11, '太仓市',  '320585', 'county');

-- 无锡市 (city_id=12)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(12, '梁溪区',  '320202', 'district'),
(12, '锡山区',  '320205', 'district'),
(12, '惠山区',  '320206', 'district'),
(12, '滨湖区',  '320211', 'district'),
(12, '新吴区',  '320214', 'new_area'),
(12, '江阴市',  '320281', 'county'),
(12, '宜兴市',  '320282', 'county');

-- 南通市 (city_id=13)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(13, '崇川区',  '320602', 'district'),
(13, '通州区',  '320612', 'district'),
(13, '海门区',  '320615', 'district'),
(13, '如皋市',  '320682', 'county'),
(13, '启东市',  '320681', 'county'),
(13, '如东县',  '320623', 'county'),
(13, '海安市',  '320685', 'county');

-- 杭州市 (city_id=14)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(14, '上城区',  '330102', 'district'),
(14, '拱墅区',  '330105', 'district'),
(14, '西湖区',  '330106', 'district'),
(14, '滨江区',  '330108', 'district'),
(14, '萧山区',  '330109', 'district'),
(14, '余杭区',  '330110', 'district'),
(14, '富阳区',  '330111', 'district'),
(14, '临安区',  '330112', 'district'),
(14, '临平区',  '330113', 'district'),
(14, '钱塘区',  '330114', 'new_area'),
(14, '桐庐县',  '330122', 'county'),
(14, '淳安县',  '330127', 'county'),
(14, '建德市',  '330182', 'county');

-- 宁波市 (city_id=15)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(15, '海曙区',  '330203', 'district'),
(15, '江北区',  '330205', 'district'),
(15, '北仑区',  '330206', 'district'),
(15, '镇海区',  '330211', 'district'),
(15, '鄞州区',  '330212', 'district'),
(15, '奉化区',  '330213', 'district'),
(15, '象山县',  '330225', 'county'),
(15, '宁海县',  '330226', 'county'),
(15, '余姚市',  '330281', 'county'),
(15, '慈溪市',  '330282', 'county');

-- 温州市 (city_id=16)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(16, '鹿城区',  '330302', 'district'),
(16, '龙湾区',  '330303', 'district'),
(16, '瓯海区',  '330304', 'district'),
(16, '洞头区',  '330305', 'district'),
(16, '瑞安市',  '330381', 'county'),
(16, '乐清市',  '330382', 'county'),
(16, '龙港市',  '330383', 'county'),
(16, '永嘉县',  '330324', 'county'),
(16, '平阳县',  '330326', 'county'),
(16, '苍南县',  '330327', 'county'),
(16, '文成县',  '330328', 'county'),
(16, '泰顺县',  '330329', 'county');

-- 金华市 (city_id=17)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(17, '婺城区',  '330702', 'district'),
(17, '金东区',  '330703', 'district'),
(17, '义乌市',  '330782', 'county'),
(17, '东阳市',  '330783', 'county'),
(17, '永康市',  '330784', 'county'),
(17, '兰溪市',  '330781', 'county'),
(17, '浦江县',  '330726', 'county'),
(17, '武义县',  '330723', 'county'),
(17, '磐安县',  '330727', 'county');

-- 成都市 (city_id=18)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(18, '锦江区',  '510104', 'district'),
(18, '青羊区',  '510105', 'district'),
(18, '金牛区',  '510106', 'district'),
(18, '武侯区',  '510107', 'district'),
(18, '成华区',  '510108', 'district'),
(18, '龙泉驿区','510112', 'district'),
(18, '青白江区','510113', 'district'),
(18, '新都区',  '510114', 'district'),
(18, '温江区',  '510115', 'district'),
(18, '双流区',  '510116', 'district'),
(18, '郫都区',  '510117', 'district'),
(18, '新津区',  '510118', 'district'),
(18, '天府新区', '510119', 'new_area'),
(18, '金堂县',  '510121', 'county'),
(18, '大邑县',  '510129', 'county'),
(18, '蒲江县',  '510131', 'county'),
(18, '都江堰市','510181', 'county'),
(18, '彭州市',  '510182', 'county'),
(18, '邛崃市',  '510183', 'county'),
(18, '崇州市',  '510184', 'county'),
(18, '简阳市',  '510185', 'county');

-- 武汉市 (city_id=19)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(19, '江岸区',  '420102', 'district'),
(19, '江汉区',  '420103', 'district'),
(19, '硚口区',  '420104', 'district'),
(19, '汉阳区',  '420105', 'district'),
(19, '武昌区',  '420106', 'district'),
(19, '青山区',  '420107', 'district'),
(19, '洪山区',  '420111', 'district'),
(19, '东西湖区','420112', 'district'),
(19, '汉南区',  '420113', 'district'),
(19, '蔡甸区',  '420114', 'district'),
(19, '江夏区',  '420115', 'district'),
(19, '黄陂区',  '420116', 'district'),
(19, '新洲区',  '420117', 'district'),
(19, '武汉经济技术开发区','420118', 'new_area'),
(19, '东湖新技术开发区','420119', 'new_area');

-- 长沙市 (city_id=20)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(20, '芙蓉区',  '430102', 'district'),
(20, '天心区',  '430103', 'district'),
(20, '岳麓区',  '430104', 'district'),
(20, '开福区',  '430105', 'district'),
(20, '雨花区',  '430111', 'district'),
(20, '望城区',  '430112', 'district'),
(20, '长沙县',  '430121', 'county'),
(20, '浏阳市',  '430181', 'county'),
(20, '宁乡市',  '430182', 'county');

-- 西安市 (city_id=21)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(21, '新城区',  '610102', 'district'),
(21, '碑林区',  '610103', 'district'),
(21, '莲湖区',  '610104', 'district'),
(21, '灞桥区',  '610111', 'district'),
(21, '未央区',  '610112', 'district'),
(21, '雁塔区',  '610113', 'district'),
(21, '阎良区',  '610114', 'district'),
(21, '临潼区',  '610115', 'district'),
(21, '长安区',  '610116', 'district'),
(21, '高陵区',  '610117', 'district'),
(21, '鄠邑区',  '610118', 'district'),
(21, '蓝田县',  '610122', 'county'),
(21, '周至县',  '610124', 'county'),
(21, '西咸新区','610125', 'new_area');

-- 沈阳市 (city_id=22)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(22, '和平区',  '210102', 'district'),
(22, '沈河区',  '210103', 'district'),
(22, '大东区',  '210104', 'district'),
(22, '皇姑区',  '210105', 'district'),
(22, '铁西区',  '210106', 'district'),
(22, '苏家屯区','210111', 'district'),
(22, '浑南区',  '210112', 'district'),
(22, '沈北新区','210113', 'new_area'),
(22, '于洪区',  '210114', 'district'),
(22, '辽中区',  '210115', 'district'),
(22, '康平县',  '210123', 'county'),
(22, '法库县',  '210124', 'county'),
(22, '新民市',  '210181', 'county');

-- 大连市 (city_id=23)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(23, '中山区',  '210202', 'district'),
(23, '西岗区',  '210203', 'district'),
(23, '沙河口区','210204', 'district'),
(23, '甘井子区','210211', 'district'),
(23, '旅顺口区','210212', 'district'),
(23, '金州区',  '210213', 'district'),
(23, '普兰店区','210214', 'district'),
(23, '长海县',  '210224', 'county'),
(23, '瓦房店市','210281', 'county'),
(23, '庄河市',  '210283', 'county');

-- 济南市 (city_id=24)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(24, '历下区',  '370102', 'district'),
(24, '市中区',  '370103', 'district'),
(24, '槐荫区',  '370104', 'district'),
(24, '天桥区',  '370105', 'district'),
(24, '历城区',  '370112', 'district'),
(24, '长清区',  '370113', 'district'),
(24, '章丘区',  '370114', 'district'),
(24, '济阳区',  '370115', 'district'),
(24, '莱芜区',  '370116', 'district'),
(24, '钢城区',  '370117', 'district'),
(24, '平阴县',  '370124', 'county'),
(24, '商河县',  '370126', 'county');

-- 青岛市 (city_id=25)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(25, '市南区',  '370202', 'district'),
(25, '市北区',  '370203', 'district'),
(25, '黄岛区',  '370211', 'district'),
(25, '崂山区',  '370212', 'district'),
(25, '李沧区',  '370213', 'district'),
(25, '城阳区',  '370214', 'district'),
(25, '即墨区',  '370215', 'district'),
(25, '胶州市',  '370281', 'county'),
(25, '平度市',  '370283', 'county'),
(25, '莱西市',  '370285', 'county');

-- 烟台市 (city_id=26)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(26, '芝罘区',  '370602', 'district'),
(26, '福山区',  '370611', 'district'),
(26, '牟平区',  '370612', 'district'),
(26, '莱山区',  '370613', 'district'),
(26, '蓬莱区',  '370614', 'district'),
(26, '龙口市',  '370681', 'county'),
(26, '莱阳市',  '370682', 'county'),
(26, '莱州市',  '370683', 'county'),
(26, '招远市',  '370685', 'county'),
(26, '栖霞市',  '370686', 'county'),
(26, '海阳市',  '370687', 'county');

-- 福州市 (city_id=27)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(27, '鼓楼区',  '350102', 'district'),
(27, '台江区',  '350103', 'district'),
(27, '仓山区',  '350104', 'district'),
(27, '马尾区',  '350105', 'district'),
(27, '晋安区',  '350111', 'district'),
(27, '长乐区',  '350112', 'district'),
(27, '闽侯县',  '350121', 'county'),
(27, '连江县',  '350122', 'county'),
(27, '罗源县',  '350123', 'county'),
(27, '闽清县',  '350124', 'county'),
(27, '永泰县',  '350125', 'county'),
(27, '平潭县',  '350128', 'county'),
(27, '福清市',  '350181', 'county');

-- 厦门市 (city_id=28)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(28, '思明区',  '350203', 'district'),
(28, '海沧区',  '350205', 'district'),
(28, '湖里区',  '350206', 'district'),
(28, '集美区',  '350211', 'district'),
(28, '同安区',  '350212', 'district'),
(28, '翔安区',  '350213', 'district');

-- 合肥市 (city_id=29)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(29, '瑶海区',  '340102', 'district'),
(29, '庐阳区',  '340103', 'district'),
(29, '蜀山区',  '340104', 'district'),
(29, '包河区',  '340111', 'district'),
(29, '长丰县',  '340121', 'county'),
(29, '肥东县',  '340122', 'county'),
(29, '肥西县',  '340123', 'county'),
(29, '庐江县',  '340124', 'county'),
(29, '巢湖市',  '340181', 'county'),
(29, '滨湖新区','340182', 'new_area');

-- 南昌市 (city_id=30)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(30, '东湖区',  '360102', 'district'),
(30, '西湖区',  '360103', 'district'),
(30, '青云谱区','360104', 'district'),
(30, '青山湖区','360111', 'district'),
(30, '新建区',  '360112', 'district'),
(30, '红谷滩区','360113', 'new_area'),
(30, '南昌县',  '360121', 'county'),
(30, '安义县',  '360123', 'county'),
(30, '进贤县',  '360124', 'county');

-- 郑州市 (city_id=31)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(31, '中原区',  '410102', 'district'),
(31, '二七区',  '410103', 'district'),
(31, '管城回族区','410104', 'district'),
(31, '金水区',  '410105', 'district'),
(31, '上街区',  '410106', 'district'),
(31, '惠济区',  '410108', 'district'),
(31, '中牟县',  '410122', 'county'),
(31, '巩义市',  '410181', 'county'),
(31, '荥阳市',  '410182', 'county'),
(31, '新密市',  '410183', 'county'),
(31, '新郑市',  '410184', 'county'),
(31, '登封市',  '410185', 'county'),
(31, '郑东新区','410186', 'new_area');

-- 石家庄市 (city_id=32)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(32, '长安区',  '130102', 'district'),
(32, '桥西区',  '130104', 'district'),
(32, '新华区',  '130105', 'district'),
(32, '井陉矿区','130107', 'district'),
(32, '裕华区',  '130108', 'district'),
(32, '藁城区',  '130109', 'district'),
(32, '鹿泉区',  '130110', 'district'),
(32, '栾城区',  '130111', 'district'),
(32, '井陉县',  '130121', 'county'),
(32, '正定县',  '130123', 'county'),
(32, '行唐县',  '130125', 'county'),
(32, '灵寿县',  '130126', 'county'),
(32, '高邑县',  '130127', 'county'),
(32, '深泽县',  '130128', 'county'),
(32, '赞皇县',  '130129', 'county'),
(32, '无极县',  '130130', 'county'),
(32, '平山县',  '130131', 'county'),
(32, '元氏县',  '130132', 'county'),
(32, '赵县',    '130133', 'county'),
(32, '辛集市',  '130181', 'county'),
(32, '晋州市',  '130183', 'county'),
(32, '新乐市',  '130184', 'county');

-- 太原市 (city_id=33)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(33, '小店区',  '140105', 'district'),
(33, '迎泽区',  '140106', 'district'),
(33, '杏花岭区','140107', 'district'),
(33, '尖草坪区','140108', 'district'),
(33, '万柏林区','140109', 'district'),
(33, '晋源区',  '140110', 'district'),
(33, '清徐县',  '140121', 'county'),
(33, '阳曲县',  '140122', 'county'),
(33, '娄烦县',  '140123', 'county'),
(33, '古交市',  '140181', 'county');

-- 哈尔滨市 (city_id=34)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(34, '道里区',  '230102', 'district'),
(34, '南岗区',  '230103', 'district'),
(34, '道外区',  '230104', 'district'),
(34, '平房区',  '230108', 'district'),
(34, '松北区',  '230109', 'district'),
(34, '香坊区',  '230110', 'district'),
(34, '呼兰区',  '230111', 'district'),
(34, '阿城区',  '230112', 'district'),
(34, '双城区',  '230113', 'district'),
(34, '依兰县',  '230123', 'county'),
(34, '方正县',  '230124', 'county'),
(34, '宾县',    '230125', 'county'),
(34, '巴彦县',  '230126', 'county'),
(34, '木兰县',  '230127', 'county'),
(34, '通河县',  '230128', 'county'),
(34, '延寿县',  '230129', 'county'),
(34, '尚志市',  '230183', 'county'),
(34, '五常市',  '230184', 'county');

-- 长春市 (city_id=35)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(35, '南关区',  '220102', 'district'),
(35, '宽城区',  '220103', 'district'),
(35, '朝阳区',  '220104', 'district'),
(35, '二道区',  '220105', 'district'),
(35, '绿园区',  '220106', 'district'),
(35, '双阳区',  '220112', 'district'),
(35, '九台区',  '220113', 'district'),
(35, '农安县',  '220122', 'county'),
(35, '榆树市',  '220182', 'county'),
(35, '德惠市',  '220183', 'county'),
(35, '公主岭市','220184', 'county');

-- 南宁市 (city_id=36)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(36, '兴宁区',  '450102', 'district'),
(36, '青秀区',  '450103', 'district'),
(36, '江南区',  '450105', 'district'),
(36, '西乡塘区','450107', 'district'),
(36, '良庆区',  '450108', 'district'),
(36, '邕宁区',  '450109', 'district'),
(36, '武鸣区',  '450110', 'district'),
(36, '隆安县',  '450123', 'county'),
(36, '马山县',  '450124', 'county'),
(36, '上林县',  '450125', 'county'),
(36, '宾阳县',  '450126', 'county'),
(36, '横州市',  '450181', 'county');

-- 昆明市 (city_id=37)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(37, '五华区',  '530102', 'district'),
(37, '盘龙区',  '530103', 'district'),
(37, '官渡区',  '530111', 'district'),
(37, '西山区',  '530112', 'district'),
(37, '东川区',  '530113', 'district'),
(37, '呈贡区',  '530114', 'district'),
(37, '晋宁区',  '530115', 'district'),
(37, '富民县',  '530124', 'county'),
(37, '宜良县',  '530125', 'county'),
(37, '石林彝族自治县','530126', 'county'),
(37, '嵩明县',  '530127', 'county'),
(37, '禄劝彝族苗族自治县','530128', 'county'),
(37, '寻甸回族彝族自治县','530129', 'county'),
(37, '安宁市',  '530181', 'county');

-- 贵阳市 (city_id=38)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(38, '南明区',  '520102', 'district'),
(38, '云岩区',  '520103', 'district'),
(38, '花溪区',  '520111', 'district'),
(38, '乌当区',  '520112', 'district'),
(38, '白云区',  '520113', 'district'),
(38, '观山湖区','520115', 'new_area'),
(38, '开阳县',  '520121', 'county'),
(38, '息烽县',  '520122', 'county'),
(38, '修文县',  '520123', 'county'),
(38, '清镇市',  '520181', 'county');

-- 海口市 (city_id=39)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(39, '秀英区',  '460105', 'district'),
(39, '龙华区',  '460106', 'district'),
(39, '琼山区',  '460107', 'district'),
(39, '美兰区',  '460108', 'district');

-- 呼和浩特市 (city_id=40)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(40, '回民区',  '150102', 'district'),
(40, '玉泉区',  '150103', 'district'),
(40, '赛罕区',  '150104', 'district'),
(40, '新城区',  '150105', 'district'),
(40, '土默特左旗','150121', 'county'),
(40, '托克托县','150122', 'county'),
(40, '和林格尔县','150123', 'county'),
(40, '清水河县','150124', 'county'),
(40, '武川县',  '150125', 'county');

-- 乌鲁木齐市 (city_id=41)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(41, '天山区',  '650102', 'district'),
(41, '沙依巴克区','650103', 'district'),
(41, '新市区',  '650104', 'district'),
(41, '水磨沟区','650105', 'district'),
(41, '头屯河区','650106', 'district'),
(41, '达坂城区','650107', 'district'),
(41, '米东区',  '650109', 'district'),
(41, '乌鲁木齐县','650121', 'county');

-- 兰州市 (city_id=42)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(42, '城关区',  '620102', 'district'),
(42, '七里河区','620103', 'district'),
(42, '西固区',  '620104', 'district'),
(42, '安宁区',  '620105', 'district'),
(42, '红古区',  '620111', 'district'),
(42, '永登县',  '620121', 'county'),
(42, '皋兰县',  '620122', 'county'),
(42, '榆中县',  '620123', 'county');

-- 银川市 (city_id=43)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(43, '兴庆区',  '640104', 'district'),
(43, '西夏区',  '640105', 'district'),
(43, '金凤区',  '640106', 'district'),
(43, '永宁县',  '640121', 'county'),
(43, '贺兰县',  '640122', 'county'),
(43, '灵武市',  '640181', 'county');

-- 西宁市 (city_id=44)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(44, '城东区',  '630102', 'district'),
(44, '城中区',  '630103', 'district'),
(44, '城西区',  '630104', 'district'),
(44, '城北区',  '630105', 'district'),
(44, '湟中区',  '630106', 'district'),
(44, '大通回族土族自治县','630121', 'county'),
(44, '湟源县',  '630123', 'county');

-- 拉萨市 (city_id=45)
INSERT INTO `districts` (`city_id`, `name`, `code`, `type`) VALUES
(45, '城关区',  '540102', 'district'),
(45, '堆龙德庆区','540103', 'district'),
(45, '达孜区',  '540104', 'district'),
(45, '林周县',  '540121', 'county'),
(45, '当雄县',  '540122', 'county'),
(45, '尼木县',  '540123', 'county'),
(45, '曲水县',  '540124', 'county'),
(45, '墨竹工卡县','540127', 'county');

SET FOREIGN_KEY_CHECKS = 1;
