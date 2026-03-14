/**
 * 前端页面全面测试脚本
 * 通过 HTTP 请求检测所有页面是否能正常返回 200
 */

const BASE = "http://localhost:8720";

const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;

let passed = 0;
let failed = 0;
const errors: string[] = [];

const pages = [
  // 公共页面
  { path: "/", name: "首页" },
  { path: "/login", name: "登录页" },
  { path: "/register", name: "注册页" },
  { path: "/forgot-password", name: "忘记密码" },
  { path: "/app-download", name: "APP下载" },

  // 评估师仪表盘
  { path: "/dashboard/appraiser", name: "评估师-首页" },
  { path: "/dashboard/appraiser/bidding", name: "评估师-竞价大厅" },
  { path: "/dashboard/appraiser/projects", name: "评估师-项目列表" },
  { path: "/dashboard/appraiser/projects/active", name: "评估师-进行中项目" },
  { path: "/dashboard/appraiser/projects/completed", name: "评估师-已完成项目" },
  { path: "/dashboard/appraiser/reports/edit", name: "评估师-报告编辑" },
  { path: "/dashboard/appraiser/reports/review", name: "评估师-报告审核" },
  { path: "/dashboard/appraiser/reports/archive", name: "评估师-报告归档" },
  { path: "/dashboard/appraiser/analytics", name: "评估师-数据分析" },
  { path: "/dashboard/appraiser/notifications", name: "评估师-通知" },
  { path: "/dashboard/appraiser/messages", name: "评估师-消息" },

  // 银行仪表盘
  { path: "/dashboard/bank", name: "银行-首页" },
  { path: "/dashboard/bank/demand/new", name: "银行-发起需求" },
  { path: "/dashboard/bank/bidding", name: "银行-竞价管理" },
  { path: "/dashboard/bank/projects", name: "银行-项目列表" },
  { path: "/dashboard/bank/projects/active", name: "银行-进行中项目" },
  { path: "/dashboard/bank/projects/awarded", name: "银行-已中标项目" },
  { path: "/dashboard/bank/projects/completed", name: "银行-已完成项目" },
  { path: "/dashboard/bank/reports/review", name: "银行-报告审核" },
  { path: "/dashboard/bank/reports/auto-valuation", name: "银行-自动估价" },
  { path: "/dashboard/bank/reports/archive", name: "银行-报告归档" },
  { path: "/dashboard/bank/analytics", name: "银行-数据分析" },

  // 投资机构仪表盘
  { path: "/dashboard/investor", name: "投资-首页" },
  { path: "/dashboard/investor/demand/new", name: "投资-发起需求" },
  { path: "/dashboard/investor/bidding", name: "投资-竞价管理" },
  { path: "/dashboard/investor/projects", name: "投资-项目列表" },
  { path: "/dashboard/investor/projects/active", name: "投资-进行中项目" },
  { path: "/dashboard/investor/projects/awarded", name: "投资-已中标项目" },
  { path: "/dashboard/investor/projects/completed", name: "投资-已完成项目" },
  { path: "/dashboard/investor/reports/review", name: "投资-报告审核" },
  { path: "/dashboard/investor/reports/auto-valuation", name: "投资-自动估价" },
  { path: "/dashboard/investor/reports/archive", name: "投资-报告归档" },
  { path: "/dashboard/investor/analytics", name: "投资-数据分析" },

  // 个人客户仪表盘
  { path: "/dashboard/customer", name: "客户-首页" },
  { path: "/dashboard/customer/apply", name: "客户-申请评估" },
  { path: "/dashboard/customer/applications", name: "客户-申请记录" },
  { path: "/dashboard/customer/progress", name: "客户-进度查询" },
  { path: "/dashboard/customer/reports", name: "客户-报告查看" },
  { path: "/dashboard/customer/downloads", name: "客户-报告下载" },
  { path: "/dashboard/customer/notifications", name: "客户-通知" },

  // 管理员仪表盘
  { path: "/dashboard/admin", name: "管理员-首页" },
  { path: "/dashboard/admin/projects", name: "管理员-项目管理" },
  { path: "/dashboard/admin/bidding", name: "管理员-竞价管理" },
  { path: "/dashboard/admin/reports", name: "管理员-报告管理" },
  { path: "/dashboard/admin/auto-valuation", name: "管理员-自动估价" },
  { path: "/dashboard/admin/analytics", name: "管理员-数据分析" },
  { path: "/dashboard/admin/users/appraisers", name: "管理员-评估师管理" },
  { path: "/dashboard/admin/users/banks", name: "管理员-银行管理" },
  { path: "/dashboard/admin/users/investors", name: "管理员-投资机构管理" },
  { path: "/dashboard/admin/users/customers", name: "管理员-客户管理" },
  { path: "/dashboard/admin/directory/cities", name: "管理员-城市管理" },
  { path: "/dashboard/admin/directory/estates", name: "管理员-楼盘管理" },
  { path: "/dashboard/admin/directory/buildings", name: "管理员-楼栋管理" },
  { path: "/dashboard/admin/directory/units", name: "管理员-房屋管理" },
  { path: "/dashboard/admin/directory/cases", name: "管理员-案例管理" },
  { path: "/dashboard/admin/directory/cases/ai-match", name: "管理员-AI案例匹配" },
  { path: "/dashboard/admin/directory/cases/ai-predict", name: "管理员-AI价格预测" },
  { path: "/dashboard/admin/directory/cases/ai-anomaly", name: "管理员-AI异常检测" },
  { path: "/dashboard/admin/directory/cases/ai-batch", name: "管理员-AI批量处理" },
  { path: "/dashboard/admin/directory/cases/ai-clean", name: "管理员-AI数据清洗" },
  { path: "/dashboard/admin/directory/cases/ai-collect", name: "管理员-AI数据采集" },
  { path: "/dashboard/admin/settings", name: "管理员-系统设置" },
  { path: "/dashboard/admin/settings/openclaw", name: "管理员-OpenClaw配置" },
  { path: "/dashboard/admin/logs", name: "管理员-操作日志" },
];

async function testPage(path: string, name: string) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "Accept": "text/html" },
      redirect: "follow",
    });

    if (res.status === 200) {
      const text = await res.text();
      // 检查是否有 Next.js 错误页面
      if (text.includes("Application error") || text.includes("Build Error")) {
        throw new Error(`页面包含错误内容`);
      }
      console.log(`  ${green("✓")} ${name} (${path})`);
      passed++;
    } else if (res.status === 404) {
      throw new Error(`404 Not Found`);
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err: any) {
    const msg = err.message || String(err);
    console.log(`  ${red("✗")} ${name} (${path}): ${red(msg)}`);
    failed++;
    errors.push(`${name} [${path}]: ${msg}`);
  }
}

async function runTests() {
  console.log(bold(cyan("\n🌐 开始前端页面全面测试\n")));
  console.log(`测试目标: ${BASE}`);
  console.log(`共 ${pages.length} 个页面\n`);

  // 分组测试
  const groups = [
    { name: "公共页面", paths: pages.slice(0, 5) },
    { name: "评估师仪表盘", paths: pages.slice(5, 16) },
    { name: "银行仪表盘", paths: pages.slice(16, 27) },
    { name: "投资机构仪表盘", paths: pages.slice(27, 38) },
    { name: "个人客户仪表盘", paths: pages.slice(38, 45) },
    { name: "管理员仪表盘", paths: pages.slice(45) },
  ];

  for (const group of groups) {
    console.log(bold(`📌 ${group.name}`));
    for (const page of group.paths) {
      await testPage(page.path, page.name);
      // 避免请求过快
      await new Promise(r => setTimeout(r, 200));
    }
    console.log();
  }

  console.log(bold(cyan("=========================================")));
  console.log(bold(`测试结果: ${green(`${passed} 通过`)} / ${failed > 0 ? red(`${failed} 失败`) : "0 失败"} / 共 ${passed + failed} 个`));

  if (errors.length > 0) {
    console.log(bold(red("\n❌ 失败的页面：")));
    errors.forEach((e) => console.log(`  - ${red(e)}`));
  } else {
    console.log(bold(green("\n✅ 所有页面测试通过！")));
  }
  console.log(bold(cyan("=========================================\n")));
}

runTests().catch((err) => {
  console.error("测试运行失败:", err);
  process.exit(1);
});
