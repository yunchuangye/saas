"use client";

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const COLOR_PRESETS = [
  { name: "经典蓝", primary: "#2563EB", secondary: "#1D4ED8", accent: "#3B82F6" },
  { name: "商务黑", primary: "#111827", secondary: "#374151", accent: "#6B7280" },
  { name: "活力橙", primary: "#EA580C", secondary: "#C2410C", accent: "#F97316" },
  { name: "自然绿", primary: "#16A34A", secondary: "#15803D", accent: "#22C55E" },
  { name: "优雅紫", primary: "#7C3AED", secondary: "#6D28D9", accent: "#8B5CF6" },
  { name: "玫瑰红", primary: "#E11D48", secondary: "#BE123C", accent: "#F43F5E" },
];

export default function BrandingPage() {
  const [form, setForm] = useState({
    brandName: "",
    tagline: "",
    logoUrl: "",
    faviconUrl: "",
    primaryColor: "#2563EB",
    secondaryColor: "#1D4ED8",
    accentColor: "#3B82F6",
    customDomain: "",
    reportHeaderHtml: "",
    reportFooterHtml: "",
    reportLogoUrl: "",
    contactEmail: "",
    contactPhone: "",
    icp: "",
    customCss: "",
  });
  const [uploading, setUploading] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const reportLogoInputRef = useRef<HTMLInputElement>(null);

  const { data: brandData, isLoading } = trpc.branding.get.useQuery();
  const save = trpc.branding.save.useMutation({
    onSuccess: () => toast.success("品牌配置已保存"),
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (brandData) {
      setForm(prev => ({ ...prev, ...brandData }));
    }
  }, [brandData]);

  const handleUpload = async (file: File, field: string) => {
    setUploading(field);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
      const data = await res.json();
      if (data.url) {
        setForm(prev => ({ ...prev, [field]: data.url }));
        toast.success("图片上传成功");
      }
    } catch {
      toast.error("上传失败");
    } finally {
      setUploading(null);
    }
  };

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setForm(prev => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    }));
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">品牌白标定制</h1>
          <p className="text-gray-500 mt-1">自定义平台 Logo、颜色、域名和报告模板</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {previewMode ? "退出预览" : "预览效果"}
          </button>
          <button
            onClick={() => save.mutate(form)}
            disabled={save.isPending}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {save.isPending ? "保存中..." : "保存配置"}
          </button>
        </div>
      </div>

      {/* 预览区域 */}
      {previewMode && (
        <div className="bg-white rounded-xl border-2 border-dashed border-blue-300 p-6">
          <div className="text-sm text-blue-600 font-medium mb-4">品牌预览</div>
          <div className="flex items-center gap-4 p-4 rounded-lg" style={{ backgroundColor: form.primaryColor }}>
            {form.logoUrl && (
              <img src={form.logoUrl} alt="Logo" className="h-10 object-contain" />
            )}
            <div className="text-white">
              <div className="font-bold text-lg">{form.brandName || "您的品牌名称"}</div>
              <div className="text-sm opacity-80">{form.tagline || "品牌标语"}</div>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: form.primaryColor }}>
              主色按钮
            </button>
            <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: form.secondaryColor }}>
              次色按钮
            </button>
            <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: form.accentColor }}>
              强调色按钮
            </button>
          </div>
        </div>
      )}

      {/* 基本信息 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">基本信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">品牌名称</label>
            <input
              value={form.brandName}
              onChange={e => setForm(p => ({ ...p, brandName: e.target.value }))}
              placeholder="如：XX房地产估价"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">品牌标语</label>
            <input
              value={form.tagline}
              onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))}
              placeholder="如：专业、可信、高效"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">联系邮箱</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))}
              placeholder="contact@yourcompany.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
            <input
              value={form.contactPhone}
              onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))}
              placeholder="400-xxx-xxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Logo 上传 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Logo 与图标</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "主 Logo", field: "logoUrl", ref: logoInputRef, desc: "建议尺寸 200×60px，PNG/SVG" },
            { label: "Favicon", field: "faviconUrl", ref: faviconInputRef, desc: "建议尺寸 32×32px，ICO/PNG" },
            { label: "报告 Logo", field: "reportLogoUrl", ref: reportLogoInputRef, desc: "用于 PDF 报告封面，PNG" },
          ].map(({ label, field, ref, desc }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
              <div
                onClick={() => ref.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                {(form as any)[field] ? (
                  <img src={(form as any)[field]} alt={label} className="h-12 object-contain mx-auto mb-2" />
                ) : (
                  <div className="text-gray-400 mb-2">
                    <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  {uploading === field ? "上传中..." : "点击上传"}
                </p>
                <p className="text-xs text-gray-400 mt-1">{desc}</p>
              </div>
              <input
                ref={ref}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], field)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 品牌色彩 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">品牌色彩</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {COLOR_PRESETS.map(preset => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:border-blue-400 transition-colors"
            >
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.primary }} />
              {preset.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "主色", field: "primaryColor" },
            { label: "次色", field: "secondaryColor" },
            { label: "强调色", field: "accentColor" },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(form as any)[field]}
                  onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  value={(form as any)[field]}
                  onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 自定义域名 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">自定义域名</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">域名</label>
          <div className="flex gap-2">
            <input
              value={form.customDomain}
              onChange={e => setForm(p => ({ ...p, customDomain: e.target.value }))}
              placeholder="app.yourcompany.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
              验证域名
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">请将域名 CNAME 解析到 app.gujia.com，验证后生效</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ICP 备案号</label>
          <input
            value={form.icp}
            onChange={e => setForm(p => ({ ...p, icp: e.target.value }))}
            placeholder="粤ICP备XXXXXXXX号"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 报告模板 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">报告模板定制</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">报告页眉 HTML</label>
          <textarea
            value={form.reportHeaderHtml}
            onChange={e => setForm(p => ({ ...p, reportHeaderHtml: e.target.value }))}
            rows={4}
            placeholder="<div style='text-align:center'><img src='...' height='60'/><h2>XX房地产估价有限公司</h2></div>"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">报告页脚 HTML</label>
          <textarea
            value={form.reportFooterHtml}
            onChange={e => setForm(p => ({ ...p, reportFooterHtml: e.target.value }))}
            rows={3}
            placeholder="<div>地址：XX市XX区XX路XX号 | 电话：400-xxx-xxxx</div>"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">自定义 CSS（高级）</label>
          <textarea
            value={form.customCss}
            onChange={e => setForm(p => ({ ...p, customCss: e.target.value }))}
            rows={4}
            placeholder=":root { --primary: #2563EB; } .btn-primary { background: var(--primary); }"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">自定义 CSS 将注入到所有页面，请谨慎使用</p>
        </div>
      </div>
    </div>
  );
}
