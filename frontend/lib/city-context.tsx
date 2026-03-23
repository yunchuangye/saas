"use client";

/**
 * 城市上下文 Provider
 * ============================================================
 * 功能：
 * 1. 从 Cookie / 请求头读取当前城市（SSR 友好）
 * 2. 提供 useCity() Hook 供全局使用
 * 3. 提供 setCity() 方法切换城市（写入 Cookie + 刷新页面）
 * 4. 内置 CitySelector 选城市面板（按大区 + 城市等级分组）
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ALL_CITIES,
  CITY_BY_ID,
  CITY_BY_PINYIN,
  CITIES_BY_REGION,
  MAJOR_CITIES,
  DEFAULT_CITY,
  REGION_NAMES,
  REGION_ORDER,
  type CityData,
} from "@/lib/city-map";

// ─── 上下文类型 ───────────────────────────────────────────────
interface CityContextValue {
  city: CityData;
  setCity: (pinyin: string, reload?: boolean) => void;
  allCities: CityData[];
  majorCities: CityData[];
  citiesByRegion: Record<string, CityData[]>;
  regionNames: Record<string, string>;
  regionOrder: string[];
  initialized: boolean;
}

const CityContext = createContext<CityContextValue | null>(null);

// ─── Cookie 工具 ──────────────────────────────────────────────
function readCityFromCookie(): CityData | null {
  if (typeof document === "undefined") return null;
  try {
    const cookies = document.cookie.split(";").reduce<Record<string, string>>((acc, c) => {
      const [k, v] = c.trim().split("=");
      if (k && v) acc[k] = decodeURIComponent(v);
      return acc;
    }, {});
    if (cookies.city_pinyin && CITY_BY_PINYIN[cookies.city_pinyin]) {
      return CITY_BY_PINYIN[cookies.city_pinyin];
    }
    if (cookies.city_id) {
      const id = parseInt(cookies.city_id, 10);
      if (!isNaN(id) && CITY_BY_ID[id]) return CITY_BY_ID[id];
    }
  } catch { /* ignore */ }
  return null;
}

function writeCityToCookie(city: CityData) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 30;
  const opts = `; path=/; max-age=${maxAge}; samesite=lax`;
  document.cookie = `city_pinyin=${city.pinyin}${opts}`;
  document.cookie = `city_id=${city.id}${opts}`;
  document.cookie = `city_name=${encodeURIComponent(city.name)}${opts}`;
  document.cookie = `city_region=${city.region}${opts}`;
  document.cookie = `city_tier=${city.tier}${opts}`;
}

// ─── Provider ─────────────────────────────────────────────────
interface CityProviderProps {
  children: React.ReactNode;
  initialCityId?: number;
  initialCityPinyin?: string;
}

export function CityProvider({ children, initialCityId, initialCityPinyin }: CityProviderProps) {
  const router = useRouter();

  const resolveInitialCity = (): CityData => {
    if (initialCityPinyin && CITY_BY_PINYIN[initialCityPinyin]) return CITY_BY_PINYIN[initialCityPinyin];
    if (initialCityId && CITY_BY_ID[initialCityId]) return CITY_BY_ID[initialCityId];
    return DEFAULT_CITY;
  };

  const [city, setCityState] = useState<CityData>(resolveInitialCity);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const cookieCity = readCityFromCookie();
    if (cookieCity && !initialCityPinyin && !initialCityId) {
      setCityState(cookieCity);
    }
    setInitialized(true);
  }, [initialCityPinyin, initialCityId]);

  const setCity = useCallback((pinyin: string, reload = false) => {
    const newCity = CITY_BY_PINYIN[pinyin];
    if (!newCity) return;
    setCityState(newCity);
    writeCityToCookie(newCity);
    if (reload) router.refresh();
  }, [router]);

  return (
    <CityContext.Provider value={{
      city, setCity,
      allCities: ALL_CITIES,
      majorCities: MAJOR_CITIES,
      citiesByRegion: CITIES_BY_REGION,
      regionNames: REGION_NAMES,
      regionOrder: REGION_ORDER,
      initialized,
    }}>
      {children}
    </CityContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────
export function useCity(): CityContextValue {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error("useCity() must be used within <CityProvider>");
  return ctx;
}

export function useCityId(): number {
  return useCity().city.id;
}

export function useCityPinyin(): string {
  return useCity().city.pinyin;
}

// ─── 城市选择器组件（按大区 + 等级展示）─────────────────────────
export function CitySelector({ className }: { className?: string }) {
  const { city, setCity, citiesByRegion, regionNames, regionOrder, majorCities } = useCity();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // 搜索过滤
  const filteredByRegion: Record<string, CityData[]> = {};
  if (search.trim()) {
    const kw = search.trim().toLowerCase();
    for (const c of majorCities) {
      if (c.name.includes(kw) || c.pinyin.includes(kw) || c.province.includes(kw)) {
        if (!filteredByRegion[c.region]) filteredByRegion[c.region] = [];
        filteredByRegion[c.region].push(c);
      }
    }
  } else {
    for (const region of regionOrder) {
      const cities = (citiesByRegion[region] || []).filter(c => c.tier <= 3);
      if (cities.length > 0) filteredByRegion[region] = cities;
    }
  }

  const tierLabel = (tier: number) => {
    if (tier === 1) return "一线";
    if (tier === 2) return "新一线";
    return "";
  };

  return (
    <div className={`relative ${className ?? ""}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background hover:bg-accent text-sm font-medium transition-colors"
        title="切换城市"
      >
        <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="max-w-[60px] truncate">{city.name}</span>
        <svg className="h-3 w-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          {/* 遮罩层 */}
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch(""); }} />

          {/* 城市面板 */}
          <div className="absolute top-full right-0 mt-1.5 z-50 w-[480px] bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
            {/* 头部 */}
            <div className="px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">选择城市</h3>
                <span className="text-xs text-muted-foreground">当前：
                  <span className="font-medium text-foreground ml-1">{city.name}</span>
                </span>
              </div>
              {/* 搜索框 */}
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="搜索城市名称或拼音..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>
            </div>

            {/* 城市列表 */}
            <div className="max-h-[360px] overflow-y-auto p-3 space-y-3">
              {Object.keys(filteredByRegion).length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">未找到匹配城市</p>
              ) : (
                regionOrder
                  .filter(r => filteredByRegion[r]?.length > 0)
                  .map(region => (
                    <div key={region}>
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/60" />
                        {regionNames[region] ?? region}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {filteredByRegion[region].map(c => (
                          <button
                            key={c.pinyin}
                            onClick={() => {
                              setCity(c.pinyin, true);
                              setOpen(false);
                              setSearch("");
                            }}
                            className={`relative px-2.5 py-1 rounded-md text-sm transition-all ${
                              city.pinyin === c.pinyin
                                ? "bg-primary text-primary-foreground font-medium shadow-sm"
                                : "bg-muted hover:bg-accent hover:text-accent-foreground"
                            }`}
                          >
                            {c.name}
                            {tierLabel(c.tier) && (
                              <span className={`ml-1 text-[10px] ${
                                city.pinyin === c.pinyin ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}>
                                {tierLabel(c.tier)}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* 底部提示 */}
            <div className="px-4 py-2 border-t bg-muted/20 text-xs text-muted-foreground">
              切换城市后，楼盘、案例等数据将自动切换到对应城市分库
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// 重新导出类型
export type { CityData };
export { ALL_CITIES, CITY_BY_ID, CITY_BY_PINYIN, MAJOR_CITIES, DEFAULT_CITY };
