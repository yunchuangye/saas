import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  variant?: "default" | "light" | "dark"
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

export function Logo({ 
  className, 
  variant = "default", 
  showText = true,
  size = "md" 
}: LogoProps) {
  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-12 w-12",
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }

  const colorClasses = {
    default: "text-primary",
    light: "text-white",
    dark: "text-foreground",
  }

  // 渐变色配置
  const gradientId = `logo-gradient-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* Logo Icon - 现代化抽象建筑+价值符号 */}
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(sizeClasses[size])}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={variant === "light" ? "#fff" : "#0EA5E9"} />
            <stop offset="50%" stopColor={variant === "light" ? "#fff" : "#0A2540"} />
            <stop offset="100%" stopColor={variant === "light" ? "#e2e8f0" : "#0F172A"} />
          </linearGradient>
        </defs>
        
        {/* 外框 - 圆角正方形 */}
        <rect
          x="2"
          y="2"
          width="36"
          height="36"
          rx="8"
          fill={`url(#${gradientId})`}
        />
        
        {/* 抽象建筑群 - 三栋高低不同的楼 */}
        <rect x="8" y="18" width="6" height="14" rx="1" fill="white" fillOpacity="0.95" />
        <rect x="17" y="12" width="6" height="20" rx="1" fill="white" fillOpacity="0.95" />
        <rect x="26" y="15" width="6" height="17" rx="1" fill="white" fillOpacity="0.95" />
        
        {/* 建筑窗户点缀 */}
        <rect x="9.5" y="20" width="3" height="2" rx="0.5" fill={variant === "light" ? "#0A2540" : "#0EA5E9"} fillOpacity="0.6" />
        <rect x="9.5" y="24" width="3" height="2" rx="0.5" fill={variant === "light" ? "#0A2540" : "#0EA5E9"} fillOpacity="0.6" />
        <rect x="9.5" y="28" width="3" height="2" rx="0.5" fill={variant === "light" ? "#0A2540" : "#0EA5E9"} fillOpacity="0.6" />
        
        <rect x="18.5" y="14" width="3" height="2" rx="0.5" fill={variant === "light" ? "#0A2540" : "#0EA5E9"} fillOpacity="0.6" />
        <rect x="18.5" y="18" width="3" height="2" rx="0.5" fill={variant === "light" ? "#0A2540" : "#0EA5E9"} fillOpacity="0.6" />
        <rect x="18.5" y="22" width="3" height="2" rx="0.5" fill={variant === "light" ? "#0A2540" : "#0EA5E9"} fillOpacity="0.6" />
        <rect x="18.5" y="26" width="3" height="2" rx="0.5" fill={variant === "light" ? "#0A2540" : "#0EA5E9"} fillOpacity="0.6" />
        
        <rect x="27.5" y="17" width="3" height="2" rx="0.5" fill={variant === "light" ? "#0A2540" : "#0EA5E9"} fillOpacity="0.6" />
        <rect x="27.5" y="21" width="3" height="2" rx="0.5" fill={variant === "light" ? "#0A2540" : "#0EA5E9"} fillOpacity="0.6" />
        <rect x="27.5" y="25" width="3" height="2" rx="0.5" fill={variant === "light" ? "#0A2540" : "#0EA5E9"} fillOpacity="0.6" />
        
        {/* 价值上升曲线 */}
        <path
          d="M6 10 Q12 11, 16 8 T28 6 L34 5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          strokeOpacity="0.8"
        />
        {/* 箭头 */}
        <path
          d="M31 3 L34.5 5 L32 8"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeOpacity="0.8"
        />
      </svg>
      
      {showText && (
        <span className={cn(
          "font-bold tracking-tight",
          textSizeClasses[size],
          colorClasses[variant]
        )}>
          gujia<span className={cn(
            "font-medium",
            variant === "light" ? "text-white/70" : "text-muted-foreground"
          )}>.app</span>
        </span>
      )}
    </div>
  )
}
