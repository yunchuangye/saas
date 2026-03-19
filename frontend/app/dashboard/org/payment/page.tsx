"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const PLAN_NAMES: Record<string, string> = {
  starter: "入门版",
  professional: "专业版",
  enterprise: "企业版",
  ultimate: "旗舰版",
};

const PLAN_FEATURES: Record<string, string[]> = {
  starter: ["5个项目/月", "2名评估师", "基础报告模板", "邮件支持"],
  professional: ["50个项目/月", "10名评估师", "高级报告模板", "三级审核", "电子签章", "优先支持"],
  enterprise: ["200个项目/月", "50名评估师", "白标定制", "API接入", "专属客服", "SLA保障"],
  ultimate: ["无限项目", "无限评估师", "完整白标", "私有部署支持", "7×24小时支持", "定制开发"],
};

const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  starter: { monthly: 299, yearly: 2990 },
  professional: { monthly: 999, yearly: 9990 },
  enterprise: { monthly: 2999, yearly: 29990 },
  ultimate: { monthly: 9999, yearly: 99990 },
};

export default function PaymentPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState("professional");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [channel, setChannel] = useState<"wechat" | "alipay">("wechat");
  const [step, setStep] = useState<"select" | "pay" | "success">("select");
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [pollingCount, setPollingCount] = useState(0);

  const createOrder = trpc.payment.createOrder.useMutation({
    onSuccess: (data) => {
      setOrderInfo(data);
      setStep("pay");
      // 开始轮询订单状态
      startPolling(data.orderNo);
    },
    onError: (e) => toast.error(e.message),
  });

  const sandboxPay = trpc.payment.sandboxPay.useMutation({
    onSuccess: () => {
      setStep("success");
      toast.success("沙箱支付成功！订阅已激活");
      setTimeout(() => router.push("/dashboard/org/billing"), 2000);
    },
    onError: (e) => toast.error(e.message),
  });

  const queryOrder = trpc.payment.queryOrder.useQuery(
    { orderNo: orderInfo?.orderNo || "" },
    { enabled: false }
  );

  let pollingTimer: NodeJS.Timeout | null = null;
  const startPolling = (orderNo: string) => {
    let count = 0;
    pollingTimer = setInterval(async () => {
      count++;
      setPollingCount(count);
      if (count > 60) {
        clearInterval(pollingTimer!);
        return;
      }
      // 实际生产环境会通过 queryOrder 轮询
    }, 3000);
  };

  const price = PLAN_PRICES[selectedPlan];
  const amount = billingCycle === "yearly" ? price.yearly : price.monthly;
  const saving = billingCycle === "yearly" ? Math.round(price.monthly * 12 - price.yearly) : 0;

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">支付成功！</h2>
          <p className="text-gray-500 mb-6">您的 {PLAN_NAMES[selectedPlan]} 订阅已激活，正在跳转...</p>
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (step === "pay" && orderInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">完成支付</h2>
            <p className="text-gray-500 text-sm mt-1">订单号：{orderInfo.orderNo}</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 mb-6 flex justify-between items-center">
            <div>
              <div className="font-medium text-gray-900">{PLAN_NAMES[selectedPlan]}</div>
              <div className="text-sm text-gray-500">{billingCycle === "yearly" ? "年付" : "月付"}</div>
            </div>
            <div className="text-2xl font-bold text-blue-600">¥{amount.toLocaleString()}</div>
          </div>

          {orderInfo.isSandbox && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-600 font-medium">🧪 沙箱测试模式</span>
              </div>
              <p className="text-sm text-yellow-700">当前为开发测试环境，点击下方按钮模拟支付成功。</p>
              <button
                onClick={() => sandboxPay.mutate({ orderNo: orderInfo.orderNo })}
                disabled={sandboxPay.isPending}
                className="mt-3 w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {sandboxPay.isPending ? "处理中..." : "🎯 模拟支付成功"}
              </button>
            </div>
          )}

          {!orderInfo.isSandbox && (
            <div className="text-center mb-6">
              <div className="bg-gray-100 rounded-xl p-6 inline-block">
                {channel === "wechat" ? (
                  <div>
                    <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <div className="text-center text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        <p className="text-sm">微信扫码支付</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">请使用微信扫描二维码完成支付</p>
                  </div>
                ) : (
                  <div>
                    <a href={orderInfo.payUrl} target="_blank" rel="noopener noreferrer"
                      className="block bg-blue-500 hover:bg-blue-600 text-white font-medium py-4 px-8 rounded-xl transition-colors text-lg">
                      跳转支付宝完成支付
                    </a>
                    <p className="text-sm text-gray-500 mt-3">点击按钮跳转到支付宝支付页面</p>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                等待支付确认...（已等待 {pollingCount * 3} 秒）
              </div>
            </div>
          )}

          <button
            onClick={() => { setStep("select"); setOrderInfo(null); }}
            className="w-full text-gray-500 hover:text-gray-700 text-sm py-2 transition-colors"
          >
            ← 返回重新选择
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">选择适合您的套餐</h1>
          <p className="text-gray-500">所有套餐均包含 7 天免费试用，随时可取消</p>

          {/* 计费周期切换 */}
          <div className="inline-flex items-center gap-3 bg-white rounded-xl p-1.5 shadow-sm border border-gray-200 mt-6">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === "monthly" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
            >
              月付
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === "yearly" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
            >
              年付
              <span className="ml-2 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full">省 17%</span>
            </button>
          </div>
        </div>

        {/* 套餐卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Object.entries(PLAN_NAMES).map(([code, name]) => {
            const p = PLAN_PRICES[code];
            const displayPrice = billingCycle === "yearly" ? Math.round(p.yearly / 12) : p.monthly;
            const isSelected = selectedPlan === code;
            const isPopular = code === "professional";

            return (
              <div
                key={code}
                onClick={() => setSelectedPlan(code)}
                className={`relative bg-white rounded-2xl border-2 p-6 cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? "border-blue-500 shadow-lg shadow-blue-100" : "border-gray-200 hover:border-blue-300"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    最受欢迎
                  </div>
                )}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                <h3 className="font-bold text-gray-900 text-lg mb-1">{name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">¥{displayPrice.toLocaleString()}</span>
                  <span className="text-gray-500 text-sm">/月</span>
                  {billingCycle === "yearly" && (
                    <div className="text-xs text-green-600 mt-1">年付 ¥{p.yearly.toLocaleString()}，省 ¥{(p.monthly * 12 - p.yearly).toLocaleString()}</div>
                  )}
                </div>

                <ul className="space-y-2">
                  {PLAN_FEATURES[code].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* 支付方式 + 确认按钮 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-lg mx-auto">
          <h3 className="font-semibold text-gray-900 mb-4">选择支付方式</h3>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(["wechat", "alipay"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setChannel(c)}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                  channel === c ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <span className="text-xl">{c === "wechat" ? "💚" : "🔵"}</span>
                <span className="font-medium text-sm">{c === "wechat" ? "微信支付" : "支付宝"}</span>
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
            <span>{PLAN_NAMES[selectedPlan]} · {billingCycle === "yearly" ? "年付" : "月付"}</span>
            <span className="font-bold text-lg text-gray-900">¥{amount.toLocaleString()}</span>
          </div>
          {billingCycle === "yearly" && saving > 0 && (
            <div className="text-xs text-green-600 text-right mb-4">相比月付节省 ¥{saving.toLocaleString()}</div>
          )}

          <button
            onClick={() => createOrder.mutate({ planCode: selectedPlan, billingCycle, channel })}
            disabled={createOrder.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors disabled:opacity-50 text-lg"
          >
            {createOrder.isPending ? "创建订单中..." : `立即支付 ¥${amount.toLocaleString()}`}
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            点击支付即表示您同意《服务协议》和《隐私政策》
          </p>
        </div>
      </div>
    </div>
  );
}
