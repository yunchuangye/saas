"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const NOTIFICATION_TYPES = [
  { key: "project_assigned", label: "项目分配", desc: "有新项目分配给您时通知" },
  { key: "bid_received", label: "收到报价", desc: "委托方收到评估师报价时通知" },
  { key: "bid_awarded", label: "中标通知", desc: "您的报价被选中时通知" },
  { key: "report_submitted", label: "报告提交", desc: "评估师提交报告时通知" },
  { key: "report_approved", label: "报告审核通过", desc: "报告审核通过时通知" },
  { key: "report_rejected", label: "报告被驳回", desc: "报告审核被驳回时通知" },
  { key: "review_requested", label: "审核请求", desc: "需要您进行三级审核时通知" },
  { key: "seal_applied", label: "签章申请", desc: "有新的签章申请需要审批" },
  { key: "payment_success", label: "支付成功", desc: "订阅支付成功时通知" },
  { key: "subscription_expiring", label: "订阅即将到期", desc: "订阅到期前 7 天提醒" },
  { key: "valuation_alert", label: "偏离度预警", desc: "估价偏离度超出阈值时通知" },
  { key: "system_announcement", label: "系统公告", desc: "平台重要公告和更新通知" },
];

type ChannelPrefs = { inApp: boolean; email: boolean; sms: boolean };
type Prefs = Record<string, ChannelPrefs>;

const DEFAULT_PREFS: Prefs = Object.fromEntries(
  NOTIFICATION_TYPES.map(t => [t.key, { inApp: true, email: true, sms: false }])
);

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [emailAddr, setEmailAddr] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [testType, setTestType] = useState<"email" | "sms" | null>(null);

  const { data: prefData, isLoading } = trpc.notifyEnhanced.getPreferences.useQuery();
  const savePrefs = trpc.notifyEnhanced.savePreferences.useMutation({
    onSuccess: () => toast.success("通知偏好已保存"),
    onError: (e) => toast.error(e.message),
  });
  const testEmail = trpc.notifyEnhanced.testEmail.useMutation({
    onSuccess: () => { toast.success("测试邮件已发送，请检查收件箱"); setTestType(null); },
    onError: (e) => toast.error(e.message),
  });
  const testSms = trpc.notifyEnhanced.testSms.useMutation({
    onSuccess: () => { toast.success("测试短信已发送"); setTestType(null); },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (prefData) {
      try {
        const parsed = typeof prefData.preferences === "string"
          ? JSON.parse(prefData.preferences)
          : prefData.preferences;
        if (parsed) setPrefs({ ...DEFAULT_PREFS, ...parsed });
      } catch { /* 使用默认值 */ }
      setEmailAddr(prefData.emailAddress || "");
      setPhoneNo(prefData.phoneNumber || "");
    }
  }, [prefData]);

  const toggle = (typeKey: string, channel: keyof ChannelPrefs) => {
    setPrefs(prev => ({
      ...prev,
      [typeKey]: { ...prev[typeKey], [channel]: !prev[typeKey][channel] },
    }));
  };

  const setAll = (channel: keyof ChannelPrefs, value: boolean) => {
    setPrefs(prev => Object.fromEntries(
      Object.entries(prev).map(([k, v]) => [k, { ...v, [channel]: value }])
    ));
  };

  const handleSave = () => {
    savePrefs.mutate({ preferences: prefs, emailAddress: emailAddr, phoneNumber: phoneNo });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">通知偏好设置</h1>
        <p className="text-gray-500 mt-1">管理您希望接收通知的方式和类型</p>
      </div>

      {/* 联系方式配置 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">联系方式</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱地址</label>
            <input
              type="email"
              value={emailAddr}
              onChange={e => setEmailAddr(e.target.value)}
              placeholder="用于接收邮件通知"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => { setTestType("email"); testEmail.mutate({ email: emailAddr }); }}
              disabled={!emailAddr || testEmail.isPending}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              {testEmail.isPending && testType === "email" ? "发送中..." : "发送测试邮件"}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号码</label>
            <input
              type="tel"
              value={phoneNo}
              onChange={e => setPhoneNo(e.target.value)}
              placeholder="用于接收短信通知"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => { setTestType("sms"); testSms.mutate({ phone: phoneNo }); }}
              disabled={!phoneNo || testSms.isPending}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              {testSms.isPending && testType === "sms" ? "发送中..." : "发送测试短信"}
            </button>
          </div>
        </div>
      </div>

      {/* 通知类型矩阵 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">通知类型</h2>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>全选：</span>
            {(["inApp", "email", "sms"] as const).map(ch => (
              <button key={ch} onClick={() => setAll(ch, true)}
                className="text-blue-600 hover:text-blue-700">
                {ch === "inApp" ? "站内信" : ch === "email" ? "邮件" : "短信"}全开
              </button>
            ))}
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500">
              <th className="text-left px-4 py-3 font-medium">通知类型</th>
              <th className="text-center px-4 py-3 font-medium w-24">
                <div className="flex items-center justify-center gap-1">
                  <span>🔔</span> 站内信
                </div>
              </th>
              <th className="text-center px-4 py-3 font-medium w-24">
                <div className="flex items-center justify-center gap-1">
                  <span>📧</span> 邮件
                </div>
              </th>
              <th className="text-center px-4 py-3 font-medium w-24">
                <div className="flex items-center justify-center gap-1">
                  <span>📱</span> 短信
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {NOTIFICATION_TYPES.map((type) => (
              <tr key={type.key} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-sm text-gray-900">{type.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{type.desc}</div>
                </td>
                {(["inApp", "email", "sms"] as const).map(ch => (
                  <td key={ch} className="text-center px-4 py-3">
                    <button
                      onClick={() => toggle(type.key, ch)}
                      className={`w-10 h-6 rounded-full transition-all relative ${
                        prefs[type.key]?.[ch] ? "bg-blue-500" : "bg-gray-200"
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                        prefs[type.key]?.[ch] ? "left-5" : "left-1"
                      }`} />
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={savePrefs.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {savePrefs.isPending ? "保存中..." : "保存设置"}
        </button>
      </div>
    </div>
  );
}
