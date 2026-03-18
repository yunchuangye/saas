import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

interface WelcomeCardProps {
  userName: string
  role: string
  greeting?: string
  quickActions?: {
    label: string
    href: string
  }[]
}

export function WelcomeCard({
  userName,
  role,
  greeting,
  quickActions,
}: WelcomeCardProps) {
  // 根据时间生成问候语
  const getGreeting = () => {
    if (greeting) return greeting
    const hour = new Date().getHours()
    if (hour < 6) return "夜深了"
    if (hour < 12) return "早上好"
    if (hour < 14) return "中午好"
    if (hour < 18) return "下午好"
    return "晚上好"
  }

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">
            {getGreeting()}，{userName}
          </h2>
          <p className="text-muted-foreground">
            欢迎回到 GuJia.App {role}工作台，祝您工作顺利！
          </p>
        </div>
        {quickActions && quickActions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button key={action.href} asChild>
                <Link href={action.href}>
                  {action.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
