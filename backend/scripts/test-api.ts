/**
 * 后端 API 全面测试脚本
 * 测试所有 tRPC 路由接口
 */

const BASE_URL = "http://localhost:3001/api/trpc";
let token = "";
let adminToken = "";
let cookie = "";
let adminCookie = "";

// 颜色输出
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;

let passed = 0;
let failed = 0;
const errors: string[] = [];

async function callTRPC(
  path: string,
  type: "query" | "mutation",
  input?: any,
  useAdmin = false
): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const cookieStr = useAdmin ? adminCookie : cookie;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (cookieStr) headers["Cookie"] = cookieStr;

    let url = `${BASE_URL}/${path}`;
    let body: string | undefined;
    let method = "GET";

    if (type === "query") {
      if (input !== undefined) {
        url += `?input=${encodeURIComponent(JSON.stringify({ json: input }))}`;
      }
    } else {
      method = "POST";
      body = JSON.stringify({ json: input ?? null });
    }

    const res = await fetch(url, { method, headers, body });
    const text = await res.text();

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, error: `Invalid JSON: ${text.substring(0, 100)}` };
    }

    if (data?.error) {
      return { ok: false, error: data.error.message || JSON.stringify(data.error) };
    }
    if (data?.result?.data?.json !== undefined) {
      return { ok: true, data: data.result.data.json };
    }
    if (data?.result?.data !== undefined) {
      return { ok: true, data: data.result.data };
    }
    return { ok: true, data };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ${green("✓")} ${name}`);
    passed++;
  } catch (err: any) {
    console.log(`  ${red("✗")} ${name}: ${red(err.message)}`);
    failed++;
    errors.push(`${name}: ${err.message}`);
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

// 登录并获取 cookie
async function login(username: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/auth.login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ json: { username, password } }),
  });
  const setCookie = res.headers.get("set-cookie");
  const data = await res.json();
  if (data?.error) throw new Error(`Login failed: ${data.error.message}`);
  const tokenMatch = setCookie?.match(/token=([^;]+)/);
  return tokenMatch ? `token=${tokenMatch[1]}` : "";
}

async function runTests() {
  console.log(bold(cyan("\n🧪 开始后端 API 全面测试\n")));

  // ============ 认证测试 ============
  console.log(bold("📌 认证模块 (auth)"));

  await test("登录 - 管理员", async () => {
    adminCookie = await login("admin", "admin123456");
    assert(adminCookie.length > 0, "未获取到 cookie");
  });

  await test("登录 - 评估师", async () => {
    cookie = await login("appraiser1", "test123456");
    assert(cookie.length > 0, "未获取到 cookie");
  });

  await test("获取当前用户信息 (auth.me)", async () => {
    const r = await callTRPC("auth.me", "query");
    assert(r.ok, r.error || "failed");
    assert(r.data?.username === "appraiser1", `Expected appraiser1, got ${r.data?.username}`);
  });

  await test("获取用户详细资料 (auth.profile)", async () => {
    const r = await callTRPC("auth.profile", "query");
    assert(r.ok, r.error || "failed");
    assert(r.data?.id > 0, "Invalid user id");
  });

  await test("登录失败 - 错误密码", async () => {
    const res = await fetch(`${BASE_URL}/auth.login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { username: "admin", password: "wrongpassword" } }),
    });
    const data = await res.json();
    assert(data?.error != null, "应该返回错误");
  });

  // ============ 仪表盘测试 ============
  console.log(bold("\n📌 仪表盘模块 (dashboard)"));

  await test("仪表盘统计 (dashboard.stats)", async () => {
    const r = await callTRPC("dashboard.stats", "query");
    assert(r.ok, r.error || "failed");
    assert(typeof r.data === "object", "应返回对象");
  });

  await test("仪表盘统计 - 管理员", async () => {
    const r = await callTRPC("dashboard.stats", "query", undefined, true);
    assert(r.ok, r.error || "failed");
    assert(r.data?.totalUsers > 0, "管理员应看到用户总数");
  });

  await test("活动图表 (dashboard.activityChart)", async () => {
    const r = await callTRPC("dashboard.activityChart", "query", { days: 30 });
    assert(r.ok, r.error || "failed");
    assert(Array.isArray(r.data), "应返回数组");
    assert(r.data.length === 30, `应返回30条数据，实际${r.data.length}`);
  });

  await test("最近项目 (dashboard.recentProjects)", async () => {
    const r = await callTRPC("dashboard.recentProjects", "query", { limit: 5 });
    assert(r.ok, r.error || "failed");
    assert(Array.isArray(r.data), "应返回数组");
  });

  // ============ 项目测试 ============
  console.log(bold("\n📌 项目模块 (projects)"));

  let newProjectId: number;

  await test("创建项目 (projects.create)", async () => {
    const r = await callTRPC("projects.create", "mutation", {
      title: "测试项目-API自动创建",
      description: "这是一个自动化测试创建的项目",
      propertyAddress: "北京市朝阳区测试路1号",
      propertyType: "住宅",
      area: 120.5,
    });
    assert(r.ok, r.error || "failed");
    assert(r.data?.id > 0, "应返回项目ID");
    newProjectId = r.data.id;
  });

  await test("项目列表 (projects.list)", async () => {
    const r = await callTRPC("projects.list", "query", { page: 1, pageSize: 10 });
    assert(r.ok, r.error || "failed");
    assert(Array.isArray(r.data?.items), "应返回items数组");
    assert(r.data?.total > 0, "应有项目数据");
  });

  await test("竞价项目列表 (projects.listBidding)", async () => {
    const r = await callTRPC("projects.listBidding", "query", { page: 1, pageSize: 10 });
    assert(r.ok, r.error || "failed");
    assert(Array.isArray(r.data?.items), "应返回items数组");
  });

  await test("进行中项目 (projects.listActive)", async () => {
    const r = await callTRPC("projects.listActive", "query", { page: 1, pageSize: 10 });
    assert(r.ok, r.error || "failed");
    assert(Array.isArray(r.data?.items), "应返回items数组");
  });

  await test("已完成项目 (projects.listCompleted)", async () => {
    const r = await callTRPC("projects.listCompleted", "query", { page: 1, pageSize: 10 });
    assert(r.ok, r.error || "failed");
    assert(Array.isArray(r.data?.items), "应返回items数组");
  });

  await test("获取单个项目 (projects.get)", async () => {
    const r = await callTRPC("projects.get", "query", { id: newProjectId });
    assert(r.ok, r.error || "failed");
    assert(r.data?.id === newProjectId, "项目ID不匹配");
  });

  await test("搜索项目 (projects.list with search)", async () => {
    const r = await callTRPC("projects.list", "query", { page: 1, pageSize: 10, search: "测试" });
    assert(r.ok, r.error || "failed");
    assert(r.data?.total >= 1, "应找到测试项目");
  });

  // ============ 竞价测试 ============
  console.log(bold("\n📌 竞价模块 (bids)"));

  await test("按项目查询竞价 (bids.listByProject)", async () => {
    const r = await callTRPC("bids.listByProject", "query", { projectId: 1 });
    assert(r.ok, r.error || "failed");
    assert(Array.isArray(r.data), "应返回数组");
  });

  await test("按组织查询竞价 (bids.listByOrg)", async () => {
    const r = await callTRPC("bids.listByOrg", "query", { page: 1, pageSize: 10 });
    assert(r.ok, r.error || "failed");
    assert(Array.isArray(r.data?.items), "应返回items数组");
  });

  // ============ 报告测试 ============
  console.log(bold("\n📌 报告模块 (reports)"));

  let newReportId: number;

  await test("报告列表 (reports.list)", async () => {
    const r = await callTRPC("reports.list", "query", { page: 1, pageSize: 10 });
    assert(r.ok, r.error || "failed");
    assert(Array.isArray(r.data?.items), "应返回items数组");
  });

  await test("创建报告 (reports.create)", async () => {
    // 找一个 active 项目
    const projects = await callTRPC("projects.listActive", "query", { page: 1, pageSize: 5 });
    const projectId = projects.data?.items?.[0]?.id || 1;

    const r = await callTRPC("reports.create", "mutation", {
      projectId,
      title: "测试评估报告-API自动创建",
      content: "## 测试报告内容\n这是自动化测试创建的报告。",
      valuationResult: 5000000,
      valuationMin: 4500000,
      valuationMax: 5500000,
    });
    assert(r.ok, r.error || "failed");
    assert(r.data?.id > 0, "应返回报告ID");
    newReportId = r.data.id;
  });

  await test("获取单个报告 (reports.get)", async () => {
    const r = await callTRPC("reports.get", "query", { id: newReportId });
    assert(r.ok, r.error || "failed");
    assert(r.data?.id === newReportId, "报告ID不匹配");
  });

  await test("更新报告 (reports.update)", async () => {
    const r = await callTRPC("reports.update", "mutation", {
      id: newReportId,
      title: "测试评估报告-已更新",
    });
    assert(r.ok, r.error || "failed");
    assert(r.data?.success, "应返回success");
  });

  await test("提交报告 (reports.submit)", async () => {
    const r = await callTRPC("reports.submit", "mutation", { id: newReportId });
    assert(r.ok, r.error || "failed");
    assert(r.data?.success, "应返回success");
  });

  await test("AI 辅助审核 (reports.aiAssist)", async () => {
    const r = await callTRPC("reports.aiAssist", "mutation", { reportId: newReportId });
    assert(r.ok, r.error || "failed");
    assert(r.data?.score > 0, "应返回评分");
  });

  await test("已归档报告列表 (reports.listArchived)", async () => {
    const r = await callTRPC("reports.listArchived", "query", { page: 1, pageSize: 10 });
    assert(r.ok, r.error || "failed");
    assert(Array.isArray(r.data?.items), "应返回items数组");
  });

  // ============ 通知测试 ============
  console.log(bold("\n📌 通知模块 (notifications)"));

  await test("通知列表 (notifications.list)", async () => {
    const r = await callTRPC("notifications.list", "query", { page: 1, pageSize: 10 });
    assert(r.ok, r.error || "failed");
    assert(Array.isArray(r.data?.items), "应返回items数组");
  });

  await test("未读通知数量 (notifications.unreadCount)", async () => {
    const r = await callTRPC("notifications.unreadCount", "query");
    assert(r.ok, r.error || "failed");
    assert(typeof r.data?.count === "number", "应返回数字");
  });

  await test("全部标记已读 (notifications.markAllRead)", async () => {
    const r = await callTRPC("notifications.markAllRead", "mutation");
    assert(r.ok, r.error || "failed");
    assert(r.data?.success, "应返回success");
  });

  // ============ 消息测试 ============
  console.log(bold("\n📌 消息模块 (messages)"));

  await test("消息列表 (messages.list)", async () => {
    const r = await callTRPC("messages.list", "query", { page: 1, pageSize: 10 });
    assert(r.ok, r.error || "failed");
    assert(Array.isArray(r.data?.items), "应返回items数组");
  });

  // ============ 数据目录测试 ============
  console.log(bold("\n📌 数据目录模块 (directory)"));

  await test("城市列表 (directory.cities.list)", async () => {
    const r = await callTRPC("directory.cities.list", "query", { page: 1, pageSize: 20 });
    assert(r.ok, r.error || "failed");
    assert(r.data?.total >= 10, `应有10个城市，实际${r.data?.total}`);
  });

  await test("楼盘列表 (directory.estates.list)", async () => {
    const r = await callTRPC("directory.estates.list", "query", { page: 1, pageSize: 20 });
    assert(r.ok, r.error || "failed");
    assert(r.data?.total >= 10, `应有楼盘数据，实际${r.data?.total}`);
  });

  await test("按城市筛选楼盘", async () => {
    const cities = await callTRPC("directory.cities.list", "query", { page: 1, pageSize: 5 });
    const cityId = cities.data?.items?.[0]?.id;
    const r = await callTRPC("directory.estates.list", "query", { page: 1, pageSize: 10, cityId });
    assert(r.ok, r.error || "failed");
    assert(Array.isArray(r.data?.items), "应返回items数组");
  });

  await test("楼栋列表 (directory.buildings.list)", async () => {
    const r = await callTRPC("directory.buildings.list", "query", { page: 1, pageSize: 20 });
    assert(r.ok, r.error || "failed");
    assert(r.data?.total >= 10, `应有楼栋数据，实际${r.data?.total}`);
  });

  await test("房屋单元列表 (directory.units.list)", async () => {
    const r = await callTRPC("directory.units.list", "query", { page: 1, pageSize: 20 });
    assert(r.ok, r.error || "failed");
    assert(Array.isArray(r.data?.items), "应返回items数组");
  });

  await test("案例列表 (directory.cases.list)", async () => {
    const r = await callTRPC("directory.cases.list", "query", { page: 1, pageSize: 20 });
    assert(r.ok, r.error || "failed");
    assert(r.data?.total >= 100, `应有案例数据，实际${r.data?.total}`);
  });

  await test("案例搜索", async () => {
    const r = await callTRPC("directory.cases.list", "query", { page: 1, pageSize: 10, search: "北京" });
    assert(r.ok, r.error || "failed");
    assert(Array.isArray(r.data?.items), "应返回items数组");
  });

  await test("AI 匹配案例 (directory.cases.aiMatch)", async () => {
    const r = await callTRPC("directory.cases.aiMatch", "query", { area: 100, propertyType: "住宅" });
    assert(r.ok, r.error || "failed");
    assert(Array.isArray(r.data), "应返回数组");
  });

  await test("AI 价格预测 (directory.cases.aiPredict)", async () => {
    const r = await callTRPC("directory.cases.aiPredict", "mutation", { area: 100, floor: 10 });
    assert(r.ok, r.error || "failed");
    assert(r.data?.unitPrice > 0, "应返回单价");
    assert(r.data?.totalPrice > 0, "应返回总价");
  });

  await test("AI 异常检测 (directory.cases.aiAnomalyDetect) - 管理员", async () => {
    const r = await callTRPC("directory.cases.aiAnomalyDetect", "mutation", {}, true);
    assert(r.ok, r.error || "failed");
    assert(typeof r.data?.detected === "number", "应返回检测数量");
  });

  // ============ 估价测试 ============
  console.log(bold("\n📌 估价模块 (valuation)"));

  let newValuationId: number;

  await test("估价列表 (valuation.list)", async () => {
    const r = await callTRPC("valuation.list", "query", { page: 1, pageSize: 10 });
    assert(r.ok, r.error || "failed");
    assert(Array.isArray(r.data?.items), "应返回items数组");
  });

  await test("创建估价 (valuation.create)", async () => {
    const r = await callTRPC("valuation.create", "mutation", {
      address: "北京市朝阳区测试路1号",
      area: 120.5,
      rooms: 3,
      floor: 10,
      propertyType: "住宅",
    });
    assert(r.ok, r.error || "failed");
    assert(r.data?.id > 0, "应返回估价ID");
    assert(r.data?.valuationResult > 0, "应返回估价结果");
    newValuationId = r.data.id;
  });

  await test("获取单个估价 (valuation.get)", async () => {
    const r = await callTRPC("valuation.get", "query", { id: newValuationId });
    assert(r.ok, r.error || "failed");
    assert(r.data?.id === newValuationId, "估价ID不匹配");
  });

  await test("市场分析 (valuation.marketAnalysis)", async () => {
    const r = await callTRPC("valuation.marketAnalysis", "mutation", { propertyType: "住宅" });
    assert(r.ok, r.error || "failed");
    assert(r.data?.avgUnitPrice > 0, "应返回平均单价");
    assert(r.data?.marketTrend, "应返回市场趋势");
  });

  // ============ 组织测试 ============
  console.log(bold("\n📌 组织模块 (org)"));

  await test("获取当前用户组织 (org.mine)", async () => {
    const r = await callTRPC("org.mine", "query");
    assert(r.ok, r.error || "failed");
    // 可能为 null（无组织）
  });

  await test("组织列表 - 管理员 (org.list)", async () => {
    const r = await callTRPC("org.list", "query", { page: 1, pageSize: 10 }, true);
    assert(r.ok, r.error || "failed");
    assert(r.data?.total >= 8, `应有8个组织，实际${r.data?.total}`);
  });

  // ============ OpenClaw 测试 ============
  console.log(bold("\n📌 OpenClaw 模块 (openclaw)"));

  await test("OpenClaw 配置列表 (openclaw.listConfigs) - 管理员", async () => {
    const r = await callTRPC("openclaw.listConfigs", "query", { page: 1, pageSize: 10 }, true);
    assert(r.ok, r.error || "failed");
    assert(r.data?.total >= 1, "应有配置数据");
  });

  await test("OpenClaw 任务列表 (openclaw.listTasks) - 管理员", async () => {
    const r = await callTRPC("openclaw.listTasks", "query", { page: 1, pageSize: 10 }, true);
    assert(r.ok, r.error || "failed");
    assert(r.data?.total >= 5, `应有任务数据，实际${r.data?.total}`);
  });

  // ============ 操作日志测试 ============
  console.log(bold("\n📌 日志模块 (logs)"));

  await test("操作日志列表 (logs.list) - 管理员", async () => {
    const r = await callTRPC("logs.list", "query", { page: 1, pageSize: 20 }, true);
    assert(r.ok, r.error || "failed");
    assert(r.data?.total >= 30, `应有日志数据，实际${r.data?.total}`);
  });

  // ============ 管理员用户管理测试 ============
  console.log(bold("\n📌 用户管理模块 (adminUsers)"));

  await test("用户列表 (adminUsers.list) - 管理员", async () => {
    const r = await callTRPC("adminUsers.list", "query", { page: 1, pageSize: 20 }, true);
    assert(r.ok, r.error || "failed");
    assert(r.data?.total >= 10, `应有用户数据，实际${r.data?.total}`);
  });

  await test("按角色筛选用户 - 评估师", async () => {
    const r = await callTRPC("adminUsers.list", "query", { page: 1, pageSize: 20, role: "appraiser" }, true);
    assert(r.ok, r.error || "failed");
    assert(r.data?.total >= 1, "应有评估师用户");
  });

  // ============ 权限测试 ============
  console.log(bold("\n📌 权限控制测试"));

  await test("未登录访问受保护接口 - 应返回 UNAUTHORIZED", async () => {
    const res = await fetch(`${BASE_URL}/auth.me`, {
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    assert(data?.error != null, "应返回错误");
  });

  await test("普通用户访问管理员接口 - 应返回 FORBIDDEN", async () => {
    const res = await fetch(`${BASE_URL}/adminUsers.list?input=${encodeURIComponent(JSON.stringify({ json: { page: 1, pageSize: 10 } }))}`, {
      headers: { "Content-Type": "application/json", Cookie: cookie },
    });
    const data = await res.json();
    assert(data?.error != null, "应返回错误");
  });

  // ============ 汇总 ============
  console.log(bold(cyan("\n=========================================")));
  console.log(bold(`测试结果: ${green(`${passed} 通过`)} / ${failed > 0 ? red(`${failed} 失败`) : "0 失败"} / 共 ${passed + failed} 个`));

  if (errors.length > 0) {
    console.log(bold(red("\n❌ 失败的测试：")));
    errors.forEach((e) => console.log(`  - ${red(e)}`));
  } else {
    console.log(bold(green("\n✅ 所有测试通过！")));
  }
  console.log(bold(cyan("=========================================\n")));

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("测试运行失败:", err);
  process.exit(1);
});
