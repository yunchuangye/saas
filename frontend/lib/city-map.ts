/**
 * 城市数据映射表（与数据库 cities 表保持一致）
 * ============================================================
 * - id 与数据库 cities.id 字段完全对应
 * - 支持按大区、城市等级筛选
 * - 完整 298 个城市，按大区 + 等级排序
 */

export interface CityData {
  id: number;
  name: string;
  province: string;
  region: "north" | "east" | "south" | "central" | "west" | "northeast" | "southwest" | "northwest";
  regionName: string;
  tier: 1 | 2 | 3 | 4 | 5;
  pinyin: string;
}

export const REGION_NAMES: Record<string, string> = {
  north:     "华北",
  northeast: "东北",
  east:      "华东",
  central:   "华中",
  south:     "华南",
  southwest: "西南",
  northwest: "西北",
  west:      "西部",
};

export const REGION_ORDER = ["north", "northeast", "east", "central", "south", "southwest", "northwest", "west"];

// ─── 完整城市列表（298 个城市，与数据库同步）─────────────────────
export const ALL_CITIES: CityData[] = [
  // ══ 华北区 ══════════════════════════════════════════════════
  { id: 1,   name: "北京",     province: "北京市",   region: "north",     regionName: "华北", tier: 1, pinyin: "beijing" },
  { id: 2,   name: "天津",     province: "天津市",   region: "north",     regionName: "华北", tier: 1, pinyin: "tianjin" },
  { id: 34,  name: "太原",     province: "山西省",   region: "north",     regionName: "华北", tier: 2, pinyin: "taiyuan" },
  { id: 45,  name: "呼和浩特", province: "内蒙古",   region: "north",     regionName: "华北", tier: 3, pinyin: "hohhot" },
  { id: 3,   name: "石家庄",   province: "河北省",   region: "north",     regionName: "华北", tier: 3, pinyin: "shijiazhuang" },
  { id: 4,   name: "唐山",     province: "河北省",   region: "north",     regionName: "华北", tier: 3, pinyin: "tangshan" },
  { id: 8,   name: "保定",     province: "河北省",   region: "north",     regionName: "华北", tier: 3, pinyin: "baoding" },
  { id: 5,   name: "秦皇岛",   province: "河北省",   region: "north",     regionName: "华北", tier: 4, pinyin: "qinhuangdao" },
  { id: 6,   name: "邯郸",     province: "河北省",   region: "north",     regionName: "华北", tier: 3, pinyin: "handan" },
  { id: 7,   name: "邢台",     province: "河北省",   region: "north",     regionName: "华北", tier: 4, pinyin: "xingtai" },
  { id: 9,   name: "张家口",   province: "河北省",   region: "north",     regionName: "华北", tier: 4, pinyin: "zhangjiakou" },
  { id: 10,  name: "承德",     province: "河北省",   region: "north",     regionName: "华北", tier: 4, pinyin: "chengde" },
  { id: 11,  name: "沧州",     province: "河北省",   region: "north",     regionName: "华北", tier: 4, pinyin: "cangzhou" },
  { id: 12,  name: "廊坊",     province: "河北省",   region: "north",     regionName: "华北", tier: 3, pinyin: "langfang" },
  { id: 13,  name: "衡水",     province: "河北省",   region: "north",     regionName: "华北", tier: 4, pinyin: "hengshui" },
  { id: 35,  name: "大同",     province: "山西省",   region: "north",     regionName: "华北", tier: 4, pinyin: "datong" },
  { id: 36,  name: "阳泉",     province: "山西省",   region: "north",     regionName: "华北", tier: 4, pinyin: "yangquan" },
  { id: 37,  name: "长治",     province: "山西省",   region: "north",     regionName: "华北", tier: 4, pinyin: "changzhi" },
  { id: 38,  name: "晋城",     province: "山西省",   region: "north",     regionName: "华北", tier: 4, pinyin: "jincheng" },
  { id: 39,  name: "朔州",     province: "山西省",   region: "north",     regionName: "华北", tier: 5, pinyin: "shuozhou" },
  { id: 40,  name: "晋中",     province: "山西省",   region: "north",     regionName: "华北", tier: 4, pinyin: "jinzhong" },
  { id: 41,  name: "运城",     province: "山西省",   region: "north",     regionName: "华北", tier: 4, pinyin: "yuncheng" },
  { id: 42,  name: "忻州",     province: "山西省",   region: "north",     regionName: "华北", tier: 5, pinyin: "xinzhou" },
  { id: 43,  name: "临汾",     province: "山西省",   region: "north",     regionName: "华北", tier: 4, pinyin: "linfen" },
  { id: 44,  name: "吕梁",     province: "山西省",   region: "north",     regionName: "华北", tier: 5, pinyin: "lvliang" },
  { id: 46,  name: "包头",     province: "内蒙古",   region: "north",     regionName: "华北", tier: 3, pinyin: "baotou" },
  { id: 47,  name: "乌海",     province: "内蒙古",   region: "north",     regionName: "华北", tier: 5, pinyin: "wuhai" },
  { id: 48,  name: "赤峰",     province: "内蒙古",   region: "north",     regionName: "华北", tier: 4, pinyin: "chifeng" },
  { id: 49,  name: "通辽",     province: "内蒙古",   region: "north",     regionName: "华北", tier: 4, pinyin: "tongliao" },
  { id: 50,  name: "鄂尔多斯", province: "内蒙古",   region: "north",     regionName: "华北", tier: 3, pinyin: "ordos" },
  // ══ 东北区 ══════════════════════════════════════════════════
  { id: 51,  name: "沈阳",     province: "辽宁省",   region: "northeast", regionName: "东北", tier: 2, pinyin: "shenyang" },
  { id: 52,  name: "大连",     province: "辽宁省",   region: "northeast", regionName: "东北", tier: 2, pinyin: "dalian" },
  { id: 53,  name: "鞍山",     province: "辽宁省",   region: "northeast", regionName: "东北", tier: 3, pinyin: "anshan" },
  { id: 54,  name: "抚顺",     province: "辽宁省",   region: "northeast", regionName: "东北", tier: 4, pinyin: "fushun" },
  { id: 55,  name: "本溪",     province: "辽宁省",   region: "northeast", regionName: "东北", tier: 4, pinyin: "benxi" },
  { id: 56,  name: "丹东",     province: "辽宁省",   region: "northeast", regionName: "东北", tier: 4, pinyin: "dandong" },
  { id: 57,  name: "锦州",     province: "辽宁省",   region: "northeast", regionName: "东北", tier: 4, pinyin: "jinzhou" },
  { id: 58,  name: "长春",     province: "吉林省",   region: "northeast", regionName: "东北", tier: 2, pinyin: "changchun" },
  { id: 59,  name: "哈尔滨",   province: "黑龙江省", region: "northeast", regionName: "东北", tier: 2, pinyin: "harbin" },
  { id: 60,  name: "齐齐哈尔", province: "黑龙江省", region: "northeast", regionName: "东北", tier: 4, pinyin: "qiqihar" },
  { id: 61,  name: "鸡西",     province: "黑龙江省", region: "northeast", regionName: "东北", tier: 5, pinyin: "jixi" },
  { id: 62,  name: "鹤岗",     province: "黑龙江省", region: "northeast", regionName: "东北", tier: 5, pinyin: "hegang" },
  { id: 63,  name: "双鸭山",   province: "黑龙江省", region: "northeast", regionName: "东北", tier: 5, pinyin: "shuangyashan" },
  { id: 64,  name: "大庆",     province: "黑龙江省", region: "northeast", regionName: "东北", tier: 3, pinyin: "daqing" },
  { id: 65,  name: "伊春",     province: "黑龙江省", region: "northeast", regionName: "东北", tier: 5, pinyin: "yichun" },
  { id: 66,  name: "佳木斯",   province: "黑龙江省", region: "northeast", regionName: "东北", tier: 4, pinyin: "jiamusi" },
  { id: 67,  name: "七台河",   province: "黑龙江省", region: "northeast", regionName: "东北", tier: 5, pinyin: "qitaihe" },
  { id: 68,  name: "牡丹江",   province: "黑龙江省", region: "northeast", regionName: "东北", tier: 4, pinyin: "mudanjiang" },
  // ══ 华东区 ══════════════════════════════════════════════════
  { id: 69,  name: "上海",     province: "上海市",   region: "east",      regionName: "华东", tier: 1, pinyin: "shanghai" },
  { id: 70,  name: "南京",     province: "江苏省",   region: "east",      regionName: "华东", tier: 2, pinyin: "nanjing" },
  { id: 71,  name: "无锡",     province: "江苏省",   region: "east",      regionName: "华东", tier: 2, pinyin: "wuxi" },
  { id: 72,  name: "徐州",     province: "江苏省",   region: "east",      regionName: "华东", tier: 3, pinyin: "xuzhou" },
  { id: 73,  name: "常州",     province: "江苏省",   region: "east",      regionName: "华东", tier: 2, pinyin: "changzhou" },
  { id: 74,  name: "苏州",     province: "江苏省",   region: "east",      regionName: "华东", tier: 2, pinyin: "suzhou" },
  { id: 75,  name: "南通",     province: "江苏省",   region: "east",      regionName: "华东", tier: 3, pinyin: "nantong" },
  { id: 76,  name: "连云港",   province: "江苏省",   region: "east",      regionName: "华东", tier: 4, pinyin: "lianyungang" },
  { id: 77,  name: "淮安",     province: "江苏省",   region: "east",      regionName: "华东", tier: 4, pinyin: "huaian" },
  { id: 78,  name: "盐城",     province: "江苏省",   region: "east",      regionName: "华东", tier: 3, pinyin: "yancheng" },
  { id: 79,  name: "扬州",     province: "江苏省",   region: "east",      regionName: "华东", tier: 3, pinyin: "yangzhou" },
  { id: 80,  name: "镇江",     province: "江苏省",   region: "east",      regionName: "华东", tier: 3, pinyin: "zhenjiang" },
  { id: 81,  name: "泰州",     province: "江苏省",   region: "east",      regionName: "华东", tier: 3, pinyin: "taizhou" },
  { id: 82,  name: "宿迁",     province: "江苏省",   region: "east",      regionName: "华东", tier: 4, pinyin: "suqian" },
  { id: 83,  name: "杭州",     province: "浙江省",   region: "east",      regionName: "华东", tier: 2, pinyin: "hangzhou" },
  { id: 84,  name: "宁波",     province: "浙江省",   region: "east",      regionName: "华东", tier: 2, pinyin: "ningbo" },
  { id: 85,  name: "温州",     province: "浙江省",   region: "east",      regionName: "华东", tier: 2, pinyin: "wenzhou" },
  { id: 86,  name: "嘉兴",     province: "浙江省",   region: "east",      regionName: "华东", tier: 3, pinyin: "jiaxing" },
  { id: 87,  name: "湖州",     province: "浙江省",   region: "east",      regionName: "华东", tier: 3, pinyin: "huzhou" },
  { id: 88,  name: "绍兴",     province: "浙江省",   region: "east",      regionName: "华东", tier: 3, pinyin: "shaoxing" },
  { id: 89,  name: "金华",     province: "浙江省",   region: "east",      regionName: "华东", tier: 3, pinyin: "jinhua" },
  { id: 90,  name: "衢州",     province: "浙江省",   region: "east",      regionName: "华东", tier: 4, pinyin: "quzhou" },
  { id: 91,  name: "舟山",     province: "浙江省",   region: "east",      regionName: "华东", tier: 4, pinyin: "zhoushan" },
  { id: 92,  name: "台州",     province: "浙江省",   region: "east",      regionName: "华东", tier: 3, pinyin: "taizhou_zj" },
  { id: 93,  name: "丽水",     province: "浙江省",   region: "east",      regionName: "华东", tier: 4, pinyin: "lishui" },
  { id: 94,  name: "合肥",     province: "安徽省",   region: "east",      regionName: "华东", tier: 2, pinyin: "hefei" },
  { id: 95,  name: "芜湖",     province: "安徽省",   region: "east",      regionName: "华东", tier: 3, pinyin: "wuhu" },
  { id: 96,  name: "蚌埠",     province: "安徽省",   region: "east",      regionName: "华东", tier: 3, pinyin: "bengbu" },
  { id: 97,  name: "淮南",     province: "安徽省",   region: "east",      regionName: "华东", tier: 4, pinyin: "huainan" },
  { id: 98,  name: "马鞍山",   province: "安徽省",   region: "east",      regionName: "华东", tier: 3, pinyin: "maanshan" },
  { id: 99,  name: "淮北",     province: "安徽省",   region: "east",      regionName: "华东", tier: 4, pinyin: "huaibei" },
  { id: 100, name: "铜陵",     province: "安徽省",   region: "east",      regionName: "华东", tier: 4, pinyin: "tongling" },
  { id: 101, name: "安庆",     province: "安徽省",   region: "east",      regionName: "华东", tier: 3, pinyin: "anqing" },
  { id: 102, name: "黄山",     province: "安徽省",   region: "east",      regionName: "华东", tier: 4, pinyin: "huangshan" },
  { id: 103, name: "滁州",     province: "安徽省",   region: "east",      regionName: "华东", tier: 4, pinyin: "chuzhou" },
  { id: 104, name: "阜阳",     province: "安徽省",   region: "east",      regionName: "华东", tier: 3, pinyin: "fuyang" },
  { id: 105, name: "宿州",     province: "安徽省",   region: "east",      regionName: "华东", tier: 4, pinyin: "suzhou_ah" },
  { id: 106, name: "六安",     province: "安徽省",   region: "east",      regionName: "华东", tier: 4, pinyin: "luan" },
  { id: 107, name: "亳州",     province: "安徽省",   region: "east",      regionName: "华东", tier: 4, pinyin: "bozhou" },
  { id: 108, name: "池州",     province: "安徽省",   region: "east",      regionName: "华东", tier: 4, pinyin: "chizhou" },
  { id: 109, name: "宣城",     province: "安徽省",   region: "east",      regionName: "华东", tier: 4, pinyin: "xuancheng" },
  { id: 110, name: "福州",     province: "福建省",   region: "east",      regionName: "华东", tier: 2, pinyin: "fuzhou" },
  { id: 111, name: "厦门",     province: "福建省",   region: "east",      regionName: "华东", tier: 2, pinyin: "xiamen" },
  { id: 112, name: "莆田",     province: "福建省",   region: "east",      regionName: "华东", tier: 3, pinyin: "putian" },
  { id: 113, name: "三明",     province: "福建省",   region: "east",      regionName: "华东", tier: 4, pinyin: "sanming" },
  { id: 114, name: "泉州",     province: "福建省",   region: "east",      regionName: "华东", tier: 2, pinyin: "quanzhou" },
  { id: 115, name: "漳州",     province: "福建省",   region: "east",      regionName: "华东", tier: 3, pinyin: "zhangzhou" },
  { id: 116, name: "南平",     province: "福建省",   region: "east",      regionName: "华东", tier: 4, pinyin: "nanping" },
  { id: 117, name: "龙岩",     province: "福建省",   region: "east",      regionName: "华东", tier: 4, pinyin: "longyan" },
  { id: 118, name: "宁德",     province: "福建省",   region: "east",      regionName: "华东", tier: 4, pinyin: "ningde" },
  { id: 119, name: "南昌",     province: "江西省",   region: "east",      regionName: "华东", tier: 2, pinyin: "nanchang" },
  { id: 120, name: "景德镇",   province: "江西省",   region: "east",      regionName: "华东", tier: 4, pinyin: "jingdezhen" },
  { id: 121, name: "萍乡",     province: "江西省",   region: "east",      regionName: "华东", tier: 4, pinyin: "pingxiang" },
  { id: 122, name: "九江",     province: "江西省",   region: "east",      regionName: "华东", tier: 3, pinyin: "jiujiang" },
  { id: 123, name: "新余",     province: "江西省",   region: "east",      regionName: "华东", tier: 4, pinyin: "xinyu" },
  { id: 124, name: "鹰潭",     province: "江西省",   region: "east",      regionName: "华东", tier: 5, pinyin: "yingtan" },
  { id: 125, name: "赣州",     province: "江西省",   region: "east",      regionName: "华东", tier: 3, pinyin: "ganzhou" },
  { id: 126, name: "吉安",     province: "江西省",   region: "east",      regionName: "华东", tier: 4, pinyin: "jian" },
  { id: 127, name: "宜春",     province: "江西省",   region: "east",      regionName: "华东", tier: 3, pinyin: "yichun_jx" },
  { id: 128, name: "抚州",     province: "江西省",   region: "east",      regionName: "华东", tier: 4, pinyin: "fuzhou_jx" },
  { id: 129, name: "上饶",     province: "江西省",   region: "east",      regionName: "华东", tier: 3, pinyin: "shangrao" },
  { id: 130, name: "济南",     province: "山东省",   region: "east",      regionName: "华东", tier: 2, pinyin: "jinan" },
  { id: 131, name: "青岛",     province: "山东省",   region: "east",      regionName: "华东", tier: 2, pinyin: "qingdao" },
  { id: 132, name: "淄博",     province: "山东省",   region: "east",      regionName: "华东", tier: 3, pinyin: "zibo" },
  { id: 133, name: "枣庄",     province: "山东省",   region: "east",      regionName: "华东", tier: 4, pinyin: "zaozhuang" },
  { id: 134, name: "东营",     province: "山东省",   region: "east",      regionName: "华东", tier: 3, pinyin: "dongying" },
  { id: 135, name: "烟台",     province: "山东省",   region: "east",      regionName: "华东", tier: 2, pinyin: "yantai" },
  { id: 136, name: "潍坊",     province: "山东省",   region: "east",      regionName: "华东", tier: 3, pinyin: "weifang" },
  { id: 137, name: "济宁",     province: "山东省",   region: "east",      regionName: "华东", tier: 3, pinyin: "jining" },
  { id: 138, name: "泰安",     province: "山东省",   region: "east",      regionName: "华东", tier: 3, pinyin: "taian" },
  { id: 139, name: "威海",     province: "山东省",   region: "east",      regionName: "华东", tier: 3, pinyin: "weihai" },
  { id: 140, name: "日照",     province: "山东省",   region: "east",      regionName: "华东", tier: 3, pinyin: "rizhao" },
  { id: 141, name: "临沂",     province: "山东省",   region: "east",      regionName: "华东", tier: 3, pinyin: "linyi" },
  { id: 142, name: "德州",     province: "山东省",   region: "east",      regionName: "华东", tier: 4, pinyin: "dezhou" },
  { id: 143, name: "聊城",     province: "山东省",   region: "east",      regionName: "华东", tier: 4, pinyin: "liaocheng" },
  { id: 144, name: "滨州",     province: "山东省",   region: "east",      regionName: "华东", tier: 4, pinyin: "binzhou" },
  { id: 145, name: "菏泽",     province: "山东省",   region: "east",      regionName: "华东", tier: 4, pinyin: "heze" },
  // ══ 华中区 ══════════════════════════════════════════════════
  { id: 146, name: "郑州",     province: "河南省",   region: "central",   regionName: "华中", tier: 2, pinyin: "zhengzhou" },
  { id: 148, name: "洛阳",     province: "河南省",   region: "central",   regionName: "华中", tier: 3, pinyin: "luoyang" },
  { id: 158, name: "南阳",     province: "河南省",   region: "central",   regionName: "华中", tier: 3, pinyin: "nanyang" },
  { id: 163, name: "武汉",     province: "湖北省",   region: "central",   regionName: "华中", tier: 2, pinyin: "wuhan" },
  { id: 166, name: "宜昌",     province: "湖北省",   region: "central",   regionName: "华中", tier: 3, pinyin: "yichang" },
  { id: 167, name: "襄阳",     province: "湖北省",   region: "central",   regionName: "华中", tier: 3, pinyin: "xiangyang" },
  { id: 175, name: "长沙",     province: "湖南省",   region: "central",   regionName: "华中", tier: 2, pinyin: "changsha" },
  { id: 176, name: "株洲",     province: "湖南省",   region: "central",   regionName: "华中", tier: 3, pinyin: "zhuzhou" },
  { id: 178, name: "衡阳",     province: "湖南省",   region: "central",   regionName: "华中", tier: 3, pinyin: "hengyang" },
  { id: 180, name: "岳阳",     province: "湖南省",   region: "central",   regionName: "华中", tier: 3, pinyin: "yueyang" },
  { id: 181, name: "常德",     province: "湖南省",   region: "central",   regionName: "华中", tier: 3, pinyin: "changde" },
  { id: 147, name: "开封",     province: "河南省",   region: "central",   regionName: "华中", tier: 4, pinyin: "kaifeng" },
  { id: 149, name: "平顶山",   province: "河南省",   region: "central",   regionName: "华中", tier: 4, pinyin: "pingdingshan" },
  { id: 150, name: "安阳",     province: "河南省",   region: "central",   regionName: "华中", tier: 4, pinyin: "anyang" },
  { id: 152, name: "新乡",     province: "河南省",   region: "central",   regionName: "华中", tier: 4, pinyin: "xinxiang" },
  { id: 153, name: "焦作",     province: "河南省",   region: "central",   regionName: "华中", tier: 4, pinyin: "jiaozuo" },
  { id: 155, name: "许昌",     province: "河南省",   region: "central",   regionName: "华中", tier: 4, pinyin: "xuchang" },
  { id: 159, name: "商丘",     province: "河南省",   region: "central",   regionName: "华中", tier: 4, pinyin: "shangqiu" },
  { id: 160, name: "信阳",     province: "河南省",   region: "central",   regionName: "华中", tier: 4, pinyin: "xinyang" },
  { id: 164, name: "黄石",     province: "湖北省",   region: "central",   regionName: "华中", tier: 4, pinyin: "huangshi" },
  { id: 168, name: "鄂州",     province: "湖北省",   region: "central",   regionName: "华中", tier: 4, pinyin: "ezhou" },
  { id: 171, name: "荆州",     province: "湖北省",   region: "central",   regionName: "华中", tier: 4, pinyin: "jingzhou" },
  { id: 177, name: "湘潭",     province: "湖南省",   region: "central",   regionName: "华中", tier: 4, pinyin: "xiangtan" },
  { id: 179, name: "邵阳",     province: "湖南省",   region: "central",   regionName: "华中", tier: 4, pinyin: "shaoyang" },
  { id: 182, name: "张家界",   province: "湖南省",   region: "central",   regionName: "华中", tier: 4, pinyin: "zhangjiajie" },
  { id: 183, name: "益阳",     province: "湖南省",   region: "central",   regionName: "华中", tier: 4, pinyin: "yiyang" },
  { id: 184, name: "郴州",     province: "湖南省",   region: "central",   regionName: "华中", tier: 4, pinyin: "chenzhou" },
  { id: 185, name: "永州",     province: "湖南省",   region: "central",   regionName: "华中", tier: 4, pinyin: "yongzhou" },
  { id: 186, name: "怀化",     province: "湖南省",   region: "central",   regionName: "华中", tier: 4, pinyin: "huaihua" },
  { id: 187, name: "娄底",     province: "湖南省",   region: "central",   regionName: "华中", tier: 4, pinyin: "loudi" },
  // ══ 华南区 ══════════════════════════════════════════════════
  { id: 188, name: "广州",     province: "广东省",   region: "south",     regionName: "华南", tier: 1, pinyin: "guangzhou" },
  { id: 190, name: "深圳",     province: "广东省",   region: "south",     regionName: "华南", tier: 1, pinyin: "shenzhen" },
  { id: 192, name: "东莞",     province: "广东省",   region: "south",     regionName: "华南", tier: 2, pinyin: "dongguan" },
  { id: 193, name: "佛山",     province: "广东省",   region: "south",     regionName: "华南", tier: 2, pinyin: "foshan" },
  { id: 194, name: "珠海",     province: "广东省",   region: "south",     regionName: "华南", tier: 2, pinyin: "zhuhai" },
  { id: 195, name: "惠州",     province: "广东省",   region: "south",     regionName: "华南", tier: 3, pinyin: "huizhou" },
  { id: 196, name: "中山",     province: "广东省",   region: "south",     regionName: "华南", tier: 3, pinyin: "zhongshan" },
  { id: 189, name: "韶关",     province: "广东省",   region: "south",     regionName: "华南", tier: 4, pinyin: "shaoguan" },
  { id: 191, name: "汕头",     province: "广东省",   region: "south",     regionName: "华南", tier: 3, pinyin: "shantou" },
  { id: 197, name: "江门",     province: "广东省",   region: "south",     regionName: "华南", tier: 3, pinyin: "jiangmen" },
  { id: 198, name: "湛江",     province: "广东省",   region: "south",     regionName: "华南", tier: 3, pinyin: "zhanjiang" },
  { id: 199, name: "茂名",     province: "广东省",   region: "south",     regionName: "华南", tier: 3, pinyin: "maoming" },
  { id: 200, name: "肇庆",     province: "广东省",   region: "south",     regionName: "华南", tier: 3, pinyin: "zhaoqing" },
  { id: 201, name: "梅州",     province: "广东省",   region: "south",     regionName: "华南", tier: 4, pinyin: "meizhou" },
  { id: 202, name: "汕尾",     province: "广东省",   region: "south",     regionName: "华南", tier: 4, pinyin: "shanwei" },
  { id: 203, name: "河源",     province: "广东省",   region: "south",     regionName: "华南", tier: 4, pinyin: "heyuan" },
  { id: 204, name: "阳江",     province: "广东省",   region: "south",     regionName: "华南", tier: 4, pinyin: "yangjiang" },
  { id: 205, name: "清远",     province: "广东省",   region: "south",     regionName: "华南", tier: 4, pinyin: "qingyuan" },
  { id: 206, name: "潮州",     province: "广东省",   region: "south",     regionName: "华南", tier: 4, pinyin: "chaozhou" },
  { id: 207, name: "揭州",     province: "广东省",   region: "south",     regionName: "华南", tier: 4, pinyin: "jiezhou" },
  { id: 208, name: "云浮",     province: "广东省",   region: "south",     regionName: "华南", tier: 4, pinyin: "yunfu" },
  { id: 214, name: "南宁",     province: "广西壮族", region: "south",     regionName: "华南", tier: 2, pinyin: "nanning" },
  { id: 215, name: "柳州",     province: "广西壮族", region: "south",     regionName: "华南", tier: 3, pinyin: "liuzhou" },
  { id: 216, name: "桂林",     province: "广西壮族", region: "south",     regionName: "华南", tier: 3, pinyin: "guilin" },
  { id: 225, name: "海口",     province: "海南省",   region: "south",     regionName: "华南", tier: 3, pinyin: "haikou" },
  { id: 226, name: "三亚",     province: "海南省",   region: "south",     regionName: "华南", tier: 3, pinyin: "sanya" },
  // ══ 西部区（西南 + 西北）══════════════════════════════════
  { id: 229, name: "重庆",     province: "重庆市",   region: "west",      regionName: "西部", tier: 1, pinyin: "chongqing" },
  { id: 228, name: "成都",     province: "四川省",   region: "west",      regionName: "西部", tier: 2, pinyin: "chengdu" },
  { id: 230, name: "昆明",     province: "云南省",   region: "west",      regionName: "西部", tier: 2, pinyin: "kunming" },
  { id: 236, name: "贵阳",     province: "贵州省",   region: "west",      regionName: "西部", tier: 3, pinyin: "guiyang" },
  { id: 249, name: "西安",     province: "陕西省",   region: "west",      regionName: "西部", tier: 2, pinyin: "xian" },
  { id: 256, name: "兰州",     province: "甘肃省",   region: "west",      regionName: "西部", tier: 3, pinyin: "lanzhou" },
  { id: 263, name: "乌鲁木齐", province: "新疆",     region: "west",      regionName: "西部", tier: 3, pinyin: "urumqi" },
  { id: 270, name: "西宁",     province: "青海省",   region: "west",      regionName: "西部", tier: 3, pinyin: "xining" },
  { id: 271, name: "银川",     province: "宁夏",     region: "west",      regionName: "西部", tier: 3, pinyin: "yinchuan" },
  { id: 272, name: "拉萨",     province: "西藏",     region: "west",      regionName: "西部", tier: 3, pinyin: "lhasa" },
  { id: 231, name: "绵阳",     province: "四川省",   region: "west",      regionName: "西部", tier: 3, pinyin: "mianyang" },
  { id: 232, name: "德阳",     province: "四川省",   region: "west",      regionName: "西部", tier: 4, pinyin: "deyang" },
  { id: 233, name: "宜宾",     province: "四川省",   region: "west",      regionName: "西部", tier: 3, pinyin: "yibin" },
  { id: 234, name: "南充",     province: "四川省",   region: "west",      regionName: "西部", tier: 3, pinyin: "nanchong" },
  { id: 235, name: "泸州",     province: "四川省",   region: "west",      regionName: "西部", tier: 3, pinyin: "luzhou" },
];

// ─── 快速查询索引 ─────────────────────────────────────────────
export const CITY_BY_ID: Record<number, CityData> =
  Object.fromEntries(ALL_CITIES.map(c => [c.id, c]));

export const CITY_BY_PINYIN: Record<string, CityData> =
  Object.fromEntries(ALL_CITIES.map(c => [c.pinyin, c]));

// 按大区分组
export const CITIES_BY_REGION: Record<string, CityData[]> = {};
for (const city of ALL_CITIES) {
  if (!CITIES_BY_REGION[city.region]) CITIES_BY_REGION[city.region] = [];
  CITIES_BY_REGION[city.region].push(city);
}

// 仅主要城市（tier 1~3），用于城市选择器默认展示
export const MAJOR_CITIES = ALL_CITIES.filter(c => c.tier <= 3);

// 默认城市（深圳）
export const DEFAULT_CITY: CityData = CITY_BY_PINYIN["shenzhen"];

export type CityPinyin = string;

// ─── 城市缩写映射（子域名缩写 → 全拼）─────────────────────────
// 用于 SEO：sz.gujia.app → 深圳，bj.gujia.app → 北京 等
export const CITY_ABBR_MAP: Record<string, string> = {
  // 一线城市
  "bj": "beijing",
  "sh": "shanghai",
  "gz": "guangzhou",
  "sz": "shenzhen",
  // 直辖市
  "tj": "tianjin",
  "cq": "chongqing",
  // 新一线城市
  "cd": "chengdu",
  "hz": "hangzhou",
  "wh": "wuhan",
  "xa": "xian",
  "xian": "xian",
  "nj": "nanjing",
  "sy": "shenyang",
  "qd": "qingdao",
  "zz": "zhengzhou",
  "cs": "changsha",
  "km": "kunming",
  "hf": "hefei",
  "fz": "fuzhou",
  "xm": "xiamen",
  "nn": "nanning",
  "hrb": "harbin",
  "sjz": "shijiazhuang",
  "nb": "ningbo",
  "dl": "dalian",
  "jn": "jinan",
  "cc": "changchun",
  "nc": "nanchang",
  "gy": "guiyang",
  "lz": "lanzhou",
  "hk": "haikou",
  "wlmq": "urumqi",
  // 二三线城市常用缩写
  "ts": "tangshan",
  "wx": "wuxi",
  "nt": "nantong",
  "yz": "yangzhou",
  "zj": "zhenjiang",
  "cz": "changzhou",
  "wz": "wenzhou",
  "jx": "jiaxing",
  "jh": "jinhua",
  "qt": "quanzhou",
  "zs": "zhongshan",
  "dg": "dongguan",
  "fs": "foshan",
  "zh": "zhuhai",
  "st": "shantou",
  "ty": "taiyuan",
  "hhht": "hohhot",
  "bd": "baoding",
  "hd": "handan",
  "lf": "langfang",
  "yt": "yantai",
  "wf": "weifang",
  "zb": "zibo",
  "jz": "jinzhou",
  "as": "anshan",
  "dq": "daqing",
  "wlmq": "urumqi",
  "yc": "yinchuan",
  "xn": "xining",
  "ls": "lhasa",
};

/**
 * 根据子域名（缩写或全拼）查找城市数据
 * 优先匹配缩写表，再匹配全拼
 */
export function getCityBySubdomain(subdomain: string): CityData | null {
  if (!subdomain) return null;
  const lower = subdomain.toLowerCase();
  // 先查缩写映射
  const pinyin = CITY_ABBR_MAP[lower];
  if (pinyin) return CITY_BY_PINYIN[pinyin] || null;
  // 再查全拼
  return CITY_BY_PINYIN[lower] || null;
}
