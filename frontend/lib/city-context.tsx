"use client";
/**
 * 城市上下文 Provider
 * ============================================================
 * 从 Cookie 读取城市信息，注入到 React Context 中
 * 所有 tRPC 请求自动携带 cityId，实现数据隔离
 */

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CityInfo {
  cityCode: string;
  cityId: number;
  cityName: string;
  cityRegion: string;
}

const DEFAULT_CITY: CityInfo = {
  cityCode: "sz",
  cityId: 1,
  cityName: "深圳",
  cityRegion: "south",
};

const CityContext = createContext<{
  city: CityInfo;
  setCity: (city: CityInfo) => void;
  isMultiCity: boolean;
}>({
  city: DEFAULT_CITY,
  setCity: () => {},
  isMultiCity: false,
});

// 从 Cookie 读取城市信息
function getCityFromCookie(): CityInfo | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";").reduce((acc, c) => {
    const [k, v] = c.trim().split("=");
    acc[k] = v;
    return acc;
  }, {} as Record<string, string>);

  const cityCode = cookies["city_code"];
  const cityId = parseInt(cookies["city_id"] || "0");
  const cityName = decodeURIComponent(cookies["city_name"] || "");

  if (cityCode && cityId) {
    return { cityCode, cityId, cityName, cityRegion: "" };
  }
  return null;
}

// 将城市信息写入 Cookie
function setCityToCookie(city: CityInfo) {
  const maxAge = 60 * 60 * 24 * 30; // 30天
  document.cookie = `city_code=${city.cityCode}; path=/; max-age=${maxAge}; samesite=lax`;
  document.cookie = `city_id=${city.cityId}; path=/; max-age=${maxAge}; samesite=lax`;
  document.cookie = `city_name=${encodeURIComponent(city.cityName)}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [city, setCityState] = useState<CityInfo>(DEFAULT_CITY);
  const [isMultiCity, setIsMultiCity] = useState(false);

  useEffect(() => {
    const cookieCity = getCityFromCookie();
    if (cookieCity) {
      setCityState(cookieCity);
      setIsMultiCity(true);
    }
  }, []);

  const setCity = (newCity: CityInfo) => {
    setCityState(newCity);
    setCityToCookie(newCity);
    setIsMultiCity(true);
  };

  return (
    <CityContext.Provider value={{ city, setCity, isMultiCity }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  return useContext(CityContext);
}

// ─── 城市选择器组件 ────────────────────────────────────────────
import { CITY_CODE_MAP } from "./city-map";

export function CitySelector({ className }: { className?: string }) {
  const { city, setCity } = useCity();
  const [open, setOpen] = useState(false);

  const cities = Object.entries(CITY_CODE_MAP).map(([code, info]) => ({
    code,
    ...info,
  }));

  const regions: Record<string, typeof cities> = {};
  for (const c of cities) {
    if (!regions[c.region]) regions[c.region] = [];
    regions[c.region].push(c);
  }

  const regionNames: Record<string, string> = {
    south: "华南区", east: "华东区", north: "华北区",
    central: "华中区", west: "西部区",
  };

  return (
    <div className={`relative ${className ?? ""}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background hover:bg-accent text-sm font-medium transition-colors"
      >
        <span className="text-muted-foreground">📍</span>
        <span>{city.cityName}</span>
        <span className="text-muted-foreground text-xs">▼</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 z-50 w-80 bg-background border border-border rounded-lg shadow-lg p-3">
            <p className="text-xs text-muted-foreground mb-2 px-1">选择城市（切换后数据自动隔离）</p>
            {Object.entries(regions).map(([region, regionCities]) => (
              <div key={region} className="mb-3">
                <p className="text-xs font-medium text-muted-foreground px-1 mb-1">
                  {regionNames[region] ?? region}
                </p>
                <div className="flex flex-wrap gap-1">
                  {regionCities.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setCity({ cityCode: c.code, cityId: c.id, cityName: c.name, cityRegion: c.region });
                        setOpen(false);
                      }}
                      className={`px-2.5 py-1 rounded text-sm transition-colors ${
                        city.cityCode === c.code
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-accent"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
