/* eslint-disable */
"use client";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit, Trash2, FileText, Play, ChevronRight, ChevronLeft, Globe, List, Link2, Columns, CheckCircle } from "lucide-react";
import { format } from "date-fns";

// ─── 数据库表和字段定义 ────────────────────────────────────────────────────────
const DB_TABLES: Record<string, { label: string; columns: { name: string; label: string; type: string }[] }> = {
  estates: {
    label: "楼盘表 (estates)",
    columns: [
      { name: "name", label: "楼盘名称", type: "varchar" },
      { name: "address", label: "地址", type: "varchar" },
      { name: "developer", label: "开发商", type: "varchar" },
      { name: "property_type", label: "物业类型", type: "varchar" },
      { name: "build_year", label: "建成年份", type: "int" },
      { name: "total_units", label: "总套数", type: "int" },
      { name: "land_area", label: "占地面积(㎡)", type: "decimal" },
      { name: "building_area", label: "建筑面积(㎡)", type: "decimal" },
      { name: "greening_rate", label: "绿化率(%)", type: "decimal" },
      { name: "far", label: "容积率", type: "decimal" },
      { name: "parking_amount", label: "停车位", type: "int" },
      { name: "overview", label: "楼盘概况", type: "text" },
      { name: "sale_date", label: "开盘日期", type: "date" },
      { name: "completion_date", label: "竣工日期", type: "date" },
      { name: "source_id", label: "来源ID", type: "int" },
    ],
  },
  buildings: {
    label: "楼栋表 (buildings)",
    columns: [
      { name: "name", label: "楼栋名称", type: "varchar" },
      { name: "property_type", label: "物业类型", type: "varchar" },
      { name: "build_structure", label: "建筑结构", type: "varchar" },
      { name: "build_type", label: "楼型", type: "varchar" },
      { name: "floors", label: "楼层数", type: "int" },
      { name: "floor_height", label: "层高(m)", type: "decimal" },
      { name: "unit_amount", label: "单元数", type: "int" },
      { name: "total_units", label: "总套数", type: "int" },
      { name: "building_area", label: "建筑面积(㎡)", type: "decimal" },
      { name: "avg_price", label: "均价(元/㎡)", type: "decimal" },
      { name: "sale_licence", label: "预售许可证", type: "varchar" },
      { name: "completion_date", label: "竣工日期", type: "date" },
      { name: "sale_date", label: "开售日期", type: "date" },
      { name: "elevator_rate", label: "梯户比", type: "varchar" },
      { name: "source_id", label: "来源ID", type: "int" },
    ],
  },
  cases: {
    label: "成交案例表 (cases)",
    columns: [
      { name: "address", label: "地址", type: "varchar" },
      { name: "area", label: "面积(㎡)", type: "decimal" },
      { name: "rooms", label: "房间数", type: "int" },
      { name: "floor", label: "楼层", type: "int" },
      { name: "total_floors", label: "总楼层", type: "int" },
      { name: "orientation", label: "朝向", type: "varchar" },
      { name: "property_type", label: "物业类型", type: "varchar" },
      { name: "price", label: "成交总价(元)", type: "decimal" },
      { name: "unit_price", label: "单价(元/㎡)", type: "decimal" },
      { name: "transaction_date", label: "成交日期", type: "timestamp" },
      { name: "source", label: "数据来源", type: "varchar" },
    ],
  },
  units: {
    label: "房屋单元表 (units)",
    columns: [
      { name: "unit_number", label: "房号", type: "varchar" },
      { name: "property_type", label: "物业类型", type: "varchar" },
      { name: "property_structure", label: "房屋结构", type: "varchar" },
      { name: "floor", label: "楼层", type: "int" },
      { name: "area", label: "套内面积(㎡)", type: "decimal" },
      { name: "build_area", label: "建筑面积(㎡)", type: "decimal" },
      { name: "rooms", label: "房间数", type: "int" },
      { name: "bathrooms", label: "卫生间数", type: "int" },
      { name: "orientation", label: "朝向", type: "varchar" },
      { name: "unit_price", label: "单价(元/㎡)", type: "decimal" },
      { name: "total_price", label: "总价(元)", type: "decimal" },
      { name: "remark", label: "备注", type: "varchar" },
    ],
  },
};

// ─── 默认配置 ─────────────────────────────────────────────────────────────────
const defaultConfig = {
  start_url: "",
  list_item_selector: "",
  detail_page_link_selector: "",
  pagination_selector: "",
  max_pages: 10,
  use_proxy: false,
  delay: 2,
  fields: [] as Array<{
    name: string;
    selector: string;
    target_table: string;
    target_column: string;
  }>,
};

const defaultForm = {
  name: "",
  description: "",
  configJson: defaultConfig,
};

// ─── 步骤定义 ─────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, title: "基本信息", icon: FileText },
  { id: 2, title: "URL 配置", icon: Globe },
  { id: 3, title: "列表选择器", icon: List },
  { id: 4, title: "详情页配置", icon: Link2 },
  { id: 5, title: "字段映射", icon: Columns },
  { id: 6, title: "确认创建", icon: CheckCircle },
];

// ─── 主页面 ───────────────────────────────────────────────────────────────────
export default function CrawlTemplatesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  const [form, setForm] = useState<any>(defaultForm);
  const [step, setStep] = useState(1);

  const templatesQuery = trpc.crawlTemplates.list.useQuery({ page: 1, pageSize: 50 });
  const createMutation = trpc.crawlTemplates.create.useMutation();
  const updateMutation = trpc.crawlTemplates.update.useMutation();
  const deleteMutation = trpc.crawlTemplates.delete.useMutation();

  const handleOpenDialog = (template: any = null) => {
    if (template) {
      setIsEditing(true);
      setCurrentTemplate(template);
      const config = typeof template.configJson === "string"
        ? JSON.parse(template.configJson)
        : template.configJson;
      setForm({ name: template.name, description: template.description || "", configJson: { ...defaultConfig, ...config } });
    } else {
      setIsEditing(false);
      setCurrentTemplate(null);
      setForm(defaultForm);
    }
    setStep(1);
    setIsOpen(true);
  };

  const updateConfig = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, configJson: { ...prev.configJson, [key]: value } }));
  };

  const addField = () => {
    setForm((prev: any) => ({
      ...prev,
      configJson: {
        ...prev.configJson,
        fields: [...prev.configJson.fields, { name: "", selector: "", target_table: "estates", target_column: "" }],
      },
    }));
  };

  const updateField = (index: number, key: string, value: string) => {
    setForm((prev: any) => {
      const fields = [...prev.configJson.fields];
      fields[index] = { ...fields[index], [key]: value };
      return { ...prev, configJson: { ...prev.configJson, fields } };
    });
  };

  const removeField = (index: number) => {
    setForm((prev: any) => ({
      ...prev,
      configJson: { ...prev.configJson, fields: prev.configJson.fields.filter((_: any, i: number) => i !== index) },
    }));
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, configJson: form.configJson };
      if (isEditing) {
        await updateMutation.mutateAsync({ id: currentTemplate.id, ...payload });
        toast.success("模板已更新");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("模板已创建");
      }
      setIsOpen(false);
      templatesQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "操作失败");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("确定要删除这个模板吗？")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("模板已删除");
      templatesQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "删除失败");
    }
  };

  // ─── 渲染步骤内容 ───────────────────────────────────────────────────────────
  const renderStep = () => {
    const cfg = form.configJson;
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label>模板名称 *</Label>
              <Input
                className="mt-1"
                placeholder="例：深圳住建局楼盘采集"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>模板描述</Label>
              <Textarea
                className="mt-1"
                placeholder="描述此模板的用途和采集目标..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label>起始 URL *</Label>
              <Input
                className="mt-1 font-mono text-sm"
                placeholder="https://example.com/list"
                value={cfg.start_url}
                onChange={(e) => updateConfig("start_url", e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">输入要采集的列表页面 URL，支持 http/https</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>最大采集页数</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min={1}
                  max={200}
                  value={cfg.max_pages}
                  onChange={(e) => updateConfig("max_pages", parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label>请求延迟（秒）</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min={0}
                  step={0.5}
                  value={cfg.delay}
                  onChange={(e) => updateConfig("delay", parseFloat(e.target.value) || 1)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={cfg.use_proxy}
                onCheckedChange={(v) => updateConfig("use_proxy", v)}
              />
              <Label>使用代理 IP</Label>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label>列表项选择器 *</Label>
              <Input
                className="mt-1 font-mono text-sm"
                placeholder=".list-item, .estate-card, tr.data-row"
                value={cfg.list_item_selector}
                onChange={(e) => updateConfig("list_item_selector", e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">CSS 选择器，用于定位列表中每一条数据项</p>
            </div>
            <div>
              <Label>翻页按钮选择器</Label>
              <Input
                className="mt-1 font-mono text-sm"
                placeholder=".pagination .next, a[rel=next]"
                value={cfg.pagination_selector}
                onChange={(e) => updateConfig("pagination_selector", e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">CSS 选择器，用于定位"下一页"按钮（留空则只采集第一页）</p>
            </div>
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm font-medium mb-2">选择器示例</p>
                <div className="space-y-1 text-xs font-mono text-muted-foreground">
                  <p>.item-list li — 列表中的每个 li 元素</p>
                  <p>table tbody tr — 表格中的每行</p>
                  <p>.card-container .card — 卡片容器中的每个卡片</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label>详情页链接选择器</Label>
              <Input
                className="mt-1 font-mono text-sm"
                placeholder="a.detail-link, .item-title a"
                value={cfg.detail_page_link_selector}
                onChange={(e) => updateConfig("detail_page_link_selector", e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                CSS 选择器，用于从列表项中提取详情页链接（留空则直接从列表页提取数据）
              </p>
            </div>
            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">多级采集说明</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  如果数据分布在列表页和详情页两级，请填写此选择器。系统将先采集列表页中的链接，
                  再逐一访问详情页提取完整数据。如果所有数据都在列表页，可留空。
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>字段映射配置</Label>
              <Button size="sm" variant="outline" onClick={addField}>
                <Plus className="h-3 w-3 mr-1" /> 添加字段
              </Button>
            </div>
            {cfg.fields.length === 0 && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4 text-center text-sm text-muted-foreground">
                  点击"添加字段"来配置要采集的数据字段
                </CardContent>
              </Card>
            )}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {cfg.fields.map((field: any, idx: number) => (
                <Card key={idx} className="p-3">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <Label className="text-xs">字段名称（标识符）</Label>
                      <Input
                        className="mt-1 text-xs"
                        placeholder="estate_name"
                        value={field.name}
                        onChange={(e) => updateField(idx, "name", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">CSS 选择器</Label>
                      <Input
                        className="mt-1 text-xs font-mono"
                        placeholder=".name, td:nth-child(2)"
                        value={field.selector}
                        onChange={(e) => updateField(idx, "selector", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">目标数据库表</Label>
                      <Select
                        value={field.target_table}
                        onValueChange={(v) => updateField(idx, "target_table", v)}
                      >
                        <SelectTrigger className="mt-1 text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(DB_TABLES).map(([key, val]) => (
                            <SelectItem key={key} value={key}>{val.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">目标字段</Label>
                      <Select
                        value={field.target_column}
                        onValueChange={(v) => updateField(idx, "target_column", v)}
                      >
                        <SelectTrigger className="mt-1 text-xs h-8">
                          <SelectValue placeholder="选择字段" />
                        </SelectTrigger>
                        <SelectContent>
                          {(DB_TABLES[field.target_table]?.columns || []).map((col) => (
                            <SelectItem key={col.name} value={col.name}>
                              {col.label} ({col.name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button size="sm" variant="ghost" className="h-6 text-xs text-red-500" onClick={() => removeField(idx)}>
                      <Trash2 className="h-3 w-3 mr-1" /> 删除
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">配置摘要</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">模板名称</span>
                  <span className="font-medium">{form.name || "（未填写）"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">起始 URL</span>
                  <span className="font-mono text-xs max-w-[60%] truncate">{cfg.start_url || "（未填写）"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">列表项选择器</span>
                  <span className="font-mono text-xs">{cfg.list_item_selector || "（未填写）"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">详情页链接选择器</span>
                  <span className="font-mono text-xs">{cfg.detail_page_link_selector || "（不采集详情页）"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">最大采集页数</span>
                  <span>{cfg.max_pages} 页</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">字段映射数量</span>
                  <span>{cfg.fields.length} 个字段</span>
                </div>
                {cfg.fields.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-2">字段映射详情</p>
                    <div className="space-y-1">
                      {cfg.fields.map((f: any, i: number) => (
                        <div key={i} className="flex items-center text-xs bg-muted/50 rounded px-2 py-1">
                          <code className="text-blue-600 dark:text-blue-400">{f.selector}</code>
                          <ChevronRight className="h-3 w-3 mx-1 text-muted-foreground" />
                          <span>{DB_TABLES[f.target_table]?.label?.split(" ")[0]}.{f.target_column}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  // ─── 渲染 ─────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>可视化爬虫模板管理</CardTitle>
            <CardDescription>配置自定义数据采集规则，将任意网页数据映射到数据库</CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> 新建模板
          </Button>
        </CardHeader>
        <CardContent>
          {templatesQuery.isLoading && <p className="text-muted-foreground text-sm">加载中...</p>}
          {!templatesQuery.isLoading && (!templatesQuery.data?.items || templatesQuery.data.items.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>暂无采集模板</p>
              <p className="text-sm mt-1">点击"新建模板"开始配置您的第一个自定义采集规则</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templatesQuery.data?.items.map((template: any) => {
              const cfg = typeof template.configJson === "string"
                ? JSON.parse(template.configJson)
                : template.configJson;
              return (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      {template.name}
                    </CardTitle>
                    {template.description && (
                      <CardDescription className="text-xs line-clamp-2">{template.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p className="truncate">
                        <span className="font-medium">URL：</span>
                        <span className="font-mono">{cfg?.start_url || "未配置"}</span>
                      </p>
                      <p>
                        <span className="font-medium">字段：</span>
                        {cfg?.fields?.length || 0} 个映射
                      </p>
                      <p>
                        <span className="font-medium">最大页数：</span>
                        {cfg?.max_pages || 1} 页
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {cfg?.detail_page_link_selector && (
                        <Badge variant="secondary" className="text-xs">多级采集</Badge>
                      )}
                      {cfg?.use_proxy && (
                        <Badge variant="outline" className="text-xs">代理</Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-3">
                      创建于 {format(new Date(template.createdAt), "yyyy-MM-dd HH:mm")}
                    </div>
                    <div className="flex justify-between mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleOpenDialog(template)}
                      >
                        <Edit className="h-3 w-3 mr-1" /> 编辑
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> 删除
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ─── 向导弹窗 ─────────────────────────────────────────────────────── */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "编辑" : "新建"}爬虫模板</DialogTitle>
          </DialogHeader>

          {/* 步骤指示器 */}
          <div className="flex items-center justify-between mb-4 overflow-x-auto pb-2">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <div key={s.id} className="flex items-center flex-shrink-0">
                  <div
                    className={`flex flex-col items-center cursor-pointer`}
                    onClick={() => setStep(s.id)}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isDone
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isDone ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className={`text-xs mt-1 whitespace-nowrap ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>
                      {s.title}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`h-px w-8 mx-1 mt-[-12px] ${step > s.id ? "bg-green-500" : "bg-muted"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* 步骤内容 */}
          <div className="min-h-[300px]">
            {renderStep()}
          </div>

          {/* 操作按钮 */}
          <DialogFooter className="flex justify-between mt-4">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> 上一步
            </Button>
            <div className="flex gap-2">
              {step < STEPS.length ? (
                <Button onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}>
                  下一步 <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                  {isEditing ? "保存更新" : "创建模板"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
