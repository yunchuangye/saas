/**
 * 城市映射表（前端版本，与 middleware.ts 保持同步）
 * 供 CitySelector 组件和 useCity hook 使用
 */
export const CITY_CODE_MAP: Record<string, { id: number; name: string; region: string }> = {
  // 华南区
  sz:  { id: 1,  name: "深圳", region: "south" },
  gz:  { id: 2,  name: "广州", region: "south" },
  dg:  { id: 3,  name: "东莞", region: "south" },
  fs:  { id: 4,  name: "佛山", region: "south" },
  zh:  { id: 5,  name: "珠海", region: "south" },
  hz2: { id: 6,  name: "惠州", region: "south" },
  zs:  { id: 7,  name: "中山", region: "south" },
  st:  { id: 8,  name: "汕头", region: "south" },
  zj:  { id: 9,  name: "湛江", region: "south" },
  hk:  { id: 10, name: "海口", region: "south" },
  // 华东区
  sh:  { id: 11, name: "上海", region: "east" },
  hz:  { id: 12, name: "杭州", region: "east" },
  nj:  { id: 13, name: "南京", region: "east" },
  su:  { id: 14, name: "苏州", region: "east" },
  nb:  { id: 15, name: "宁波", region: "east" },
  hf:  { id: 16, name: "合肥", region: "east" },
  fz:  { id: 17, name: "福州", region: "east" },
  xm:  { id: 18, name: "厦门", region: "east" },
  nc:  { id: 19, name: "南昌", region: "east" },
  jn:  { id: 20, name: "济南", region: "east" },
  // 华北区
  bj:  { id: 21, name: "北京", region: "north" },
  tj:  { id: 22, name: "天津", region: "north" },
  sjz: { id: 23, name: "石家庄", region: "north" },
  ty:  { id: 24, name: "太原", region: "north" },
  sy:  { id: 26, name: "沈阳", region: "north" },
  dl:  { id: 27, name: "大连", region: "north" },
  cc:  { id: 28, name: "长春", region: "north" },
  hrb: { id: 29, name: "哈尔滨", region: "north" },
  qd:  { id: 30, name: "青岛", region: "north" },
  // 华中区
  wh:  { id: 31, name: "武汉", region: "central" },
  cs:  { id: 32, name: "长沙", region: "central" },
  zz:  { id: 33, name: "郑州", region: "central" },
  nn:  { id: 34, name: "南宁", region: "central" },
  // 西部区
  cd:  { id: 41, name: "成都", region: "west" },
  cq:  { id: 42, name: "重庆", region: "west" },
  xa:  { id: 43, name: "西安", region: "west" },
  lz:  { id: 44, name: "兰州", region: "west" },
  km:  { id: 50, name: "昆明", region: "west" },
};

export type CityCode = keyof typeof CITY_CODE_MAP;
