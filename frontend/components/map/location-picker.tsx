"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, Search, Crosshair, Navigation } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LocationPickerProps {
  value?: { lat: number; lng: number; address?: string }
  onChange?: (location: { lat: number; lng: number; address?: string }) => void
  className?: string
}

// 模拟的地址搜索结果
const mockSearchResults = [
  { name: "天河区黄埔大道西668号", lat: 23.1291, lng: 113.3285 },
  { name: "海珠区新港东路1168号", lat: 23.0894, lng: 113.3341 },
  { name: "天河区珠江新城华夏路28号", lat: 23.1225, lng: 113.3216 },
  { name: "南山区深圳湾口岸东侧", lat: 22.5024, lng: 113.9384 },
]

export function LocationPicker({ value, onChange, className }: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(value || { lat: 23.1291, lng: 113.2644, address: "" })
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  // 动态加载 Leaflet
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === "undefined") return

      // 检查是否已加载
      if (window.L) {
        initMap()
        return
      }

      // 加载 CSS
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)

      // 加载 JS
      const script = document.createElement("script")
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      script.onload = () => {
        initMap()
      }
      document.head.appendChild(script)
    }

    loadLeaflet()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  const initMap = () => {
    if (!mapContainerRef.current || mapRef.current) return

    const L = window.L
    
    // 创建地图
    const map = L.map(mapContainerRef.current, {
      center: [currentLocation.lat, currentLocation.lng],
      zoom: 14,
      zoomControl: true,
    })

    // 添加 OpenStreetMap 图层
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    // 创建自定义图标
    const customIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="
        width: 32px;
        height: 32px;
        background: hsl(var(--primary));
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "><div style="
        width: 12px;
        height: 12px;
        background: white;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    })

    // 添加标记
    const marker = L.marker([currentLocation.lat, currentLocation.lng], {
      icon: customIcon,
      draggable: true,
    }).addTo(map)

    // 标记拖拽事件
    marker.on("dragend", (e: L.DragEndEvent) => {
      const position = e.target.getLatLng()
      const newLocation = {
        lat: position.lat,
        lng: position.lng,
        address: `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`,
      }
      setCurrentLocation(newLocation)
      onChange?.(newLocation)
    })

    // 地图点击事件
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      marker.setLatLng([lat, lng])
      const newLocation = {
        lat,
        lng,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      }
      setCurrentLocation(newLocation)
      onChange?.(newLocation)
    })

    mapRef.current = map
    markerRef.current = marker
    setIsMapLoaded(true)
  }

  // 搜索地址
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setShowResults(query.length > 0)
  }

  // 选择搜索结果
  const selectLocation = (result: { name: string; lat: number; lng: number }) => {
    const newLocation = {
      lat: result.lat,
      lng: result.lng,
      address: result.name,
    }
    setCurrentLocation(newLocation)
    setSearchQuery(result.name)
    setShowResults(false)
    onChange?.(newLocation)

    // 更新地图
    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([result.lat, result.lng], 16)
      markerRef.current.setLatLng([result.lat, result.lng])
    }
  }

  // 定位到当前位置
  const locateMe = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const newLocation = {
            lat: latitude,
            lng: longitude,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          }
          setCurrentLocation(newLocation)
          onChange?.(newLocation)

          if (mapRef.current && markerRef.current) {
            mapRef.current.setView([latitude, longitude], 16)
            markerRef.current.setLatLng([latitude, longitude])
          }
        },
        (error) => {
          console.error("获取位置失败:", error)
        }
      )
    }
  }

  // 重置到中心
  const resetToCenter = () => {
    const centerLocation = { lat: 23.1291, lng: 113.2644, address: "广州市中心" }
    setCurrentLocation(centerLocation)
    onChange?.(centerLocation)

    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([centerLocation.lat, centerLocation.lng], 12)
      markerRef.current.setLatLng([centerLocation.lat, centerLocation.lng])
    }
  }

  const filteredResults = mockSearchResults.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className={cn("space-y-3", className)}>
      {/* 搜索栏 */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索地址..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchQuery && setShowResults(true)}
            className="pl-9 pr-20"
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={locateMe}
              title="定位到当前位置"
            >
              <Navigation className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={resetToCenter}
              title="重置到中心"
            >
              <Crosshair className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 搜索结果下拉 */}
        {showResults && filteredResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
            {filteredResults.map((result, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                onClick={() => selectLocation(result)}
              >
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{result.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 地图容器 */}
      <div className="relative rounded-lg border overflow-hidden">
        <div
          ref={mapContainerRef}
          className="h-[200px] w-full bg-muted"
        />
        {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-sm text-muted-foreground">加载地图中...</div>
          </div>
        )}
      </div>

      {/* 坐标显示 */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">经度:</span>
          <span className="font-mono">{currentLocation.lng.toFixed(6)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">纬度:</span>
          <span className="font-mono">{currentLocation.lat.toFixed(6)}</span>
        </div>
      </div>
    </div>
  )
}

// 声明 window.L 类型
declare global {
  interface Window {
    L: typeof import("leaflet")
  }
}
