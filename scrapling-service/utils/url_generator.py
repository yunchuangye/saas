"""
URL 生成工具 - 为各数据源生成采集 URL 列表
"""

# 城市拼音映射（链家/贝壳）
CITY_PINYIN_MAP = {
    '北京': 'bj', '上海': 'sh', '深圳': 'sz', '广州': 'gz',
    '杭州': 'hz', '南京': 'nj', '武汉': 'wh', '成都': 'cd',
    '重庆': 'cq', '西安': 'xa', '苏州': 'su', '天津': 'tj',
    '郑州': 'zz', '长沙': 'cs', '合肥': 'hf', '福州': 'fz',
    '厦门': 'xm', '青岛': 'qd', '济南': 'jn', '宁波': 'nb',
    '无锡': 'wx', '昆明': 'km', '沈阳': 'sy', '哈尔滨': 'hrb',
    '长春': 'cc', '大连': 'dl', '南宁': 'nn', '贵阳': 'gy',
    '海口': 'hk', '三亚': 'sanya', '石家庄': 'sjz', '太原': 'ty',
    '呼和浩特': 'hhht', '兰州': 'lz', '银川': 'yc', '西宁': 'xn',
    '乌鲁木齐': 'wlmq', '拉萨': 'ls',
}

# 安居客城市 ID 映射
ANJUKE_CITY_MAP = {
    '北京': 'beijing', '上海': 'shanghai', '深圳': 'shenzhen', '广州': 'guangzhou',
    '杭州': 'hangzhou', '南京': 'nanjing', '武汉': 'wuhan', '成都': 'chengdu',
    '重庆': 'chongqing', '西安': 'xian', '苏州': 'suzhou', '天津': 'tianjin',
    '郑州': 'zhengzhou', '长沙': 'changsha', '合肥': 'hefei', '福州': 'fuzhou',
    '厦门': 'xiamen', '青岛': 'qingdao', '济南': 'jinan', '宁波': 'ningbo',
}


def generate_lianjia_sold_urls(city_name: str, district_name: str = '',
                                max_pages: int = 10) -> list[str]:
    """生成链家成交案例采集 URL"""
    city_code = CITY_PINYIN_MAP.get(city_name, 'sz')
    base = f"https://{city_code}.lianjia.com/chengjiao/"
    if district_name:
        # 尝试拼音转换（简单处理）
        base = f"{base}{district_name}/"
    return [f"{base}pg{i}/" for i in range(1, max_pages + 1)]


def generate_lianjia_listing_urls(city_name: str, district_name: str = '',
                                   max_pages: int = 10) -> list[str]:
    """生成链家在售二手房采集 URL"""
    city_code = CITY_PINYIN_MAP.get(city_name, 'sz')
    base = f"https://{city_code}.lianjia.com/ershoufang/"
    return [f"{base}pg{i}/" for i in range(1, max_pages + 1)]


def generate_lianjia_estate_urls(city_name: str, district_name: str = '',
                                  max_pages: int = 10) -> list[str]:
    """生成链家楼盘采集 URL"""
    city_code = CITY_PINYIN_MAP.get(city_name, 'sz')
    base = f"https://{city_code}.lianjia.com/xiaoqu/"
    return [f"{base}pg{i}/" for i in range(1, max_pages + 1)]


def generate_beike_sold_urls(city_name: str, district_name: str = '',
                              max_pages: int = 10) -> list[str]:
    """生成贝壳成交案例采集 URL"""
    city_code = CITY_PINYIN_MAP.get(city_name, 'sz')
    base = f"https://{city_code}.ke.com/chengjiao/"
    return [f"{base}pg{i}/" for i in range(1, max_pages + 1)]


def generate_beike_listing_urls(city_name: str, district_name: str = '',
                                 max_pages: int = 10) -> list[str]:
    """生成贝壳在售二手房采集 URL"""
    city_code = CITY_PINYIN_MAP.get(city_name, 'sz')
    base = f"https://{city_code}.ke.com/ershoufang/"
    return [f"{base}pg{i}/" for i in range(1, max_pages + 1)]


def generate_anjuke_sold_urls(city_name: str, district_name: str = '',
                               max_pages: int = 10) -> list[str]:
    """生成安居客成交案例采集 URL（移动端）"""
    city_code = ANJUKE_CITY_MAP.get(city_name, 'shenzhen')
    base = f"https://m.anjuke.com/sale/chengjiao/{city_code}/"
    return [f"{base}?page={i}" for i in range(1, max_pages + 1)]


def generate_anjuke_listing_urls(city_name: str, district_name: str = '',
                                  max_pages: int = 10) -> list[str]:
    """生成安居客在售二手房采集 URL"""
    city_code = ANJUKE_CITY_MAP.get(city_name, 'shenzhen')
    base = f"https://m.anjuke.com/sale/{city_code}/"
    return [f"{base}?page={i}" for i in range(1, max_pages + 1)]


def generate_fang_sold_urls(city_name: str, district_name: str = '',
                             max_pages: int = 10) -> list[str]:
    """生成房天下成交案例采集 URL"""
    city_code = CITY_PINYIN_MAP.get(city_name, 'sz')
    base = f"https://{city_code}.fang.com/house/s/"
    return [f"{base}i3{i}/" for i in range(1, max_pages + 1)]


def generate_leyoujia_sold_urls(city_name: str, district_name: str = '',
                                 max_pages: int = 10) -> list[str]:
    """生成乐有家成交案例采集 URL"""
    base = "https://www.leyoujia.com/chengjiao/"
    return [f"{base}p{i}/" for i in range(1, max_pages + 1)]


def generate_urls(source: str, data_type: str, city_name: str,
                  district_name: str = '', max_pages: int = 10) -> list[str]:
    """
    统一 URL 生成入口
    source: lianjia | beike | anjuke | fang | leyoujia | szfdc
    data_type: sold_cases | listing | estate_info
    """
    generators = {
        ('lianjia', 'sold_cases'): generate_lianjia_sold_urls,
        ('lianjia', 'listing'): generate_lianjia_listing_urls,
        ('lianjia', 'estate_info'): generate_lianjia_estate_urls,
        ('beike', 'sold_cases'): generate_beike_sold_urls,
        ('beike', 'listing'): generate_beike_listing_urls,
        ('anjuke', 'sold_cases'): generate_anjuke_sold_urls,
        ('anjuke', 'listing'): generate_anjuke_listing_urls,
        ('fang', 'sold_cases'): generate_fang_sold_urls,
        ('leyoujia', 'sold_cases'): generate_leyoujia_sold_urls,
    }
    key = (source, data_type)
    if key in generators:
        return generators[key](city_name, district_name, max_pages)
    return []
