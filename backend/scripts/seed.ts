/**
 * 测试数据生成脚本
 * 生成完整的城市、楼盘、楼栋、房屋、案例、组织、项目、竞价、报告、通知等数据
 */
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const pool = mysql.createPool({
  host: "localhost",
  port: 3306,
  user: "gujia",
  password: "gujia123456",
  database: "gujia",
  waitForConnections: true,
  connectionLimit: 5,
  multipleStatements: true,
});

async function query(sql: string, params?: any[]) {
  const [rows] = await pool.execute(sql, params);
  return rows as any[];
}

async function insert(sql: string, params?: any[]) {
  const [result] = await pool.execute(sql, params);
  return (result as any).insertId as number;
}

async function seed() {
  console.log("🌱 开始生成测试数据...\n");

  // ========== 1. 城市数据 ==========
  console.log("📍 生成城市数据...");
  const cityData = [
    ["北京", "北京市", "110000"],
    ["上海", "上海市", "310000"],
    ["深圳", "广东省", "440300"],
    ["广州", "广东省", "440100"],
    ["杭州", "浙江省", "330100"],
    ["成都", "四川省", "510100"],
    ["武汉", "湖北省", "420100"],
    ["南京", "江苏省", "320100"],
    ["苏州", "江苏省", "320500"],
    ["重庆", "重庆市", "500000"],
  ];

  const cityIds: number[] = [];
  for (const [name, province, code] of cityData) {
    const existing = await query("SELECT id FROM cities WHERE name = ?", [name]);
    if (existing.length > 0) {
      cityIds.push(existing[0].id);
    } else {
      const id = await insert("INSERT INTO cities (name, province, code, is_active) VALUES (?, ?, ?, 1)", [name, province, code]);
      cityIds.push(id);
    }
  }
  console.log(`  ✓ ${cityIds.length} 个城市`);

  // ========== 2. 组织数据 ==========
  console.log("🏢 生成组织数据...");
  const orgData = [
    ["中诚信评估有限公司", "appraiser", "评估资质A级", "北京市朝阳区建国路88号"],
    ["戴德梁行评估公司", "appraiser", "评估资质A级", "上海市浦东新区陆家嘴环路1000号"],
    ["世联评估集团", "appraiser", "评估资质A级", "深圳市南山区科技园路1号"],
    ["中国银行北京分行", "bank", "金融许可证001", "北京市西城区复兴门内大街1号"],
    ["工商银行上海分行", "bank", "金融许可证002", "上海市黄浦区中山东一路24号"],
    ["建设银行深圳分行", "bank", "金融许可证003", "深圳市福田区益田路6003号"],
    ["华润置地投资基金", "investor", "基金备案号001", "北京市朝阳区CBD核心区"],
    ["万科资产管理公司", "investor", "基金备案号002", "深圳市福田区梅林路"],
  ];

  const orgIds: number[] = [];
  for (const [name, type, license, address] of orgData) {
    const existing = await query("SELECT id FROM organizations WHERE name = ?", [name]);
    if (existing.length > 0) {
      orgIds.push(existing[0].id);
    } else {
      const id = await insert(
        "INSERT INTO organizations (name, type, license, address, is_active) VALUES (?, ?, ?, ?, 1)",
        [name, type, license, address]
      );
      orgIds.push(id);
    }
  }
  console.log(`  ✓ ${orgIds.length} 个组织`);

  // ========== 3. 用户数据 ==========
  console.log("👤 生成用户数据...");
  const hash = await bcrypt.hash("test123456", 10);
  const adminHash = await bcrypt.hash("admin123456", 10);

  const usersData = [
    // 评估师（关联评估公司）
    ["appraiser2", hash, "李评估师", "appraiser", orgIds[0]],
    ["appraiser3", hash, "王评估师", "appraiser", orgIds[1]],
    ["appraiser4", hash, "赵评估师", "appraiser", orgIds[2]],
    // 银行用户
    ["bank2", hash, "陈银行员", "bank", orgIds[3]],
    ["bank3", hash, "刘银行员", "bank", orgIds[4]],
    // 投资机构用户
    ["investor2", hash, "孙投资人", "investor", orgIds[6]],
    ["investor3", hash, "周投资人", "investor", orgIds[7]],
    // 个人客户
    ["customer2", hash, "吴客户", "customer", null],
    ["customer3", hash, "郑客户", "customer", null],
    ["customer4", hash, "冯客户", "customer", null],
  ];

  const userIds: Record<string, number> = {};
  // 先获取已有用户
  const existingUsers = await query("SELECT id, username FROM users");
  for (const u of existingUsers) {
    userIds[u.username] = u.id;
  }

  for (const [username, passwordHash, displayName, role, orgId] of usersData) {
    if (!userIds[username as string]) {
      const id = await insert(
        "INSERT INTO users (username, password_hash, display_name, role, org_id, is_active) VALUES (?, ?, ?, ?, ?, 1)",
        [username, passwordHash, displayName, role, orgId]
      );
      userIds[username as string] = id;
    }
  }

  // 更新已有用户的 org_id
  if (userIds["appraiser1"]) {
    await pool.execute("UPDATE users SET org_id = ? WHERE username = 'appraiser1'", [orgIds[0]]);
  }
  if (userIds["bank1"]) {
    await pool.execute("UPDATE users SET org_id = ? WHERE username = 'bank1'", [orgIds[3]]);
  }
  if (userIds["investor1"]) {
    await pool.execute("UPDATE users SET org_id = ? WHERE username = 'investor1'", [orgIds[6]]);
  }
  // 重新获取所有用户
  const allUsers = await query("SELECT id, username FROM users");
  for (const u of allUsers) {
    userIds[u.username] = u.id;
  }
  console.log(`  ✓ ${Object.keys(userIds).length} 个用户`);

  // ========== 4. 楼盘数据 ==========
  console.log("🏘️ 生成楼盘数据...");
  const estateData = [
    ["北京朝阳SOHO", cityIds[0], "北京市朝阳区建国路88号", "SOHO中国", 2018, "商业办公", 2000],
    ["上海陆家嘴中心", cityIds[1], "上海市浦东新区陆家嘴环路1000号", "上海陆家嘴集团", 2016, "商业办公", 1500],
    ["深圳湾壹号", cityIds[2], "深圳市南山区深圳湾路", "华润置地", 2020, "住宅", 800],
    ["广州天河城", cityIds[3], "广州市天河区天河路208号", "广州天河城股份", 2015, "商业综合体", 3000],
    ["杭州西溪悦城", cityIds[4], "杭州市西湖区文二路", "万科集团", 2019, "住宅", 1200],
    ["成都天府新区", cityIds[5], "成都市天府新区科学城", "成都高投", 2021, "住宅", 2500],
    ["武汉光谷未来城", cityIds[6], "武汉市东湖高新区光谷大道", "武汉地产集团", 2020, "住宅", 1800],
    ["南京河西中央公园", cityIds[7], "南京市建邺区河西大街", "保利发展", 2018, "住宅", 2200],
    ["苏州金鸡湖壹号", cityIds[8], "苏州市工业园区金鸡湖大道", "苏州工业园区", 2017, "住宅", 900],
    ["重庆解放碑中心", cityIds[9], "重庆市渝中区解放碑步行街", "重庆地产集团", 2016, "商业综合体", 4000],
    ["北京望京SOHO", cityIds[0], "北京市朝阳区望京街道", "SOHO中国", 2014, "商业办公", 2800],
    ["上海新天地", cityIds[1], "上海市黄浦区马当路", "瑞安房地产", 2001, "商业综合体", 5000],
    ["深圳前海国际", cityIds[2], "深圳市南山区前海深港合作区", "招商蛇口", 2022, "商业办公", 1600],
    ["广州珠江新城", cityIds[3], "广州市天河区珠江新城", "富力地产", 2010, "住宅", 3500],
    ["杭州钱江新城", cityIds[4], "杭州市江干区钱江新城", "滨江集团", 2015, "住宅", 2100],
  ];

  const estateIds: number[] = [];
  for (const [name, cityId, address, developer, buildYear, propertyType, totalUnits] of estateData) {
    const existing = await query("SELECT id FROM estates WHERE name = ?", [name]);
    if (existing.length > 0) {
      estateIds.push(existing[0].id);
    } else {
      const id = await insert(
        "INSERT INTO estates (name, city_id, address, developer, build_year, property_type, total_units, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)",
        [name, cityId, address, developer, buildYear, propertyType, totalUnits]
      );
      estateIds.push(id);
    }
  }
  console.log(`  ✓ ${estateIds.length} 个楼盘`);

  // ========== 5. 楼栋数据 ==========
  console.log("🏗️ 生成楼栋数据...");
  const buildingIds: number[] = [];
  for (let i = 0; i < Math.min(8, estateIds.length); i++) {
    const estateId = estateIds[i];
    for (let b = 1; b <= 3; b++) {
      const existing = await query("SELECT id FROM buildings WHERE estate_id = ? AND name = ?", [estateId, `${b}号楼`]);
      if (existing.length > 0) {
        buildingIds.push(existing[0].id);
      } else {
        const floors = 20 + Math.floor(Math.random() * 20);
        const id = await insert(
          "INSERT INTO buildings (estate_id, name, floors, units_per_floor) VALUES (?, ?, ?, ?)",
          [estateId, `${b}号楼`, floors, 4]
        );
        buildingIds.push(id);
      }
    }
  }
  console.log(`  ✓ ${buildingIds.length} 个楼栋`);

  // ========== 6. 房屋单元数据 ==========
  console.log("🚪 生成房屋单元数据...");
  let unitCount = 0;
  const unitIds: number[] = [];
  for (let i = 0; i < Math.min(6, buildingIds.length); i++) {
    const buildingId = buildingIds[i];
    const building = await query("SELECT estate_id, floors FROM buildings WHERE id = ?", [buildingId]);
    if (!building.length) continue;
    const estateId = building[0].estate_id;
    for (let floor = 5; floor <= 15; floor += 5) {
      for (let unit = 1; unit <= 4; unit++) {
        const unitNum = `${floor}0${unit}`;
        const existing = await query("SELECT id FROM units WHERE building_id = ? AND unit_number = ?", [buildingId, unitNum]);
        if (existing.length > 0) {
          unitIds.push(existing[0].id);
        } else {
          const area = (60 + Math.random() * 100).toFixed(2);
          const rooms = Math.floor(Math.random() * 3) + 2;
          const id = await insert(
            "INSERT INTO units (building_id, estate_id, unit_number, floor, area, rooms, bathrooms, orientation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [buildingId, estateId, unitNum, floor, area, rooms, 1, ["南", "北", "东", "西"][unit - 1]]
          );
          unitIds.push(id);
          unitCount++;
        }
      }
    }
  }
  console.log(`  ✓ ${unitCount} 个房屋单元`);

  // ========== 7. 案例数据 ==========
  console.log("📊 生成案例数据...");
  const propertyTypes = ["住宅", "商业", "办公", "工业"];
  const orientations = ["南", "北", "东", "西", "东南", "西南"];
  let caseCount = 0;

  for (let i = 0; i < Math.min(10, estateIds.length); i++) {
    const estateId = estateIds[i];
    const estate = await query("SELECT city_id FROM estates WHERE id = ?", [estateId]);
    if (!estate.length) continue;
    const cityId = estate[0].city_id;

    // 每个楼盘生成 15-25 个案例
    const count = 15 + Math.floor(Math.random() * 10);
    for (let j = 0; j < count; j++) {
      const area = (50 + Math.random() * 150).toFixed(2);
      const rooms = Math.floor(Math.random() * 4) + 1;
      const floor = Math.floor(Math.random() * 30) + 1;
      const totalFloors = floor + Math.floor(Math.random() * 10);
      const unitPrice = Math.round(15000 + Math.random() * 35000);
      const price = Math.round(parseFloat(area) * unitPrice);
      const daysAgo = Math.floor(Math.random() * 365);
      const transDate = new Date();
      transDate.setDate(transDate.getDate() - daysAgo);
      const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
      const orientation = orientations[Math.floor(Math.random() * orientations.length)];

      await insert(
        `INSERT INTO cases (city_id, estate_id, address, area, rooms, floor, total_floors, orientation, property_type, transaction_type, price, unit_price, transaction_date, source, is_anomaly)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'sale', ?, ?, ?, '链家', 0)`,
        [cityId, estateId, `${["北京", "上海", "深圳", "广州", "杭州"][i % 5]}某小区${j + 1}号`, area, rooms, floor, totalFloors, orientation, propertyType, price, unitPrice, transDate]
      );
      caseCount++;
    }
  }
  console.log(`  ✓ ${caseCount} 个成交案例`);

  // ========== 8. 项目数据 ==========
  console.log("📁 生成项目数据...");
  const projectStatuses = ["bidding", "active", "completed", "completed", "active"];
  const propertyAddresses = [
    "北京市朝阳区建国路88号SOHO中国1栋2001室",
    "上海市浦东新区陆家嘴环路1000号中心大厦1501室",
    "深圳市南山区科技园南区8栋1201室",
    "广州市天河区珠江新城华夏路10号",
    "杭州市西湖区文二路西溪悦城3期2幢1802室",
    "成都市天府新区科学城天府大道北段1700号",
    "武汉市东湖高新区光谷大道光谷未来城5栋801室",
    "南京市建邺区河西大街中央公园8号楼2302室",
    "苏州市工业园区金鸡湖大道壹号3栋1501室",
    "重庆市渝中区解放碑步行街中心广场2201室",
    "北京市海淀区中关村大街1号院3号楼1001室",
    "上海市黄浦区南京东路100号",
    "深圳市福田区CBD中心区皇庭广场2801室",
    "广州市越秀区环市东路广州国际大厦1601室",
    "杭州市滨江区网商路599号阿里巴巴园区",
  ];

  const projectIds: number[] = [];
  const clientUserIds = [userIds["bank1"], userIds["bank2"], userIds["bank3"], userIds["investor1"], userIds["investor2"], userIds["customer1"], userIds["customer2"]].filter(Boolean);
  const clientOrgIds = [orgIds[3], orgIds[4], orgIds[5], orgIds[6], orgIds[7], null, null];

  for (let i = 0; i < 15; i++) {
    const status = projectStatuses[i % projectStatuses.length] as any;
    const clientIdx = i % clientUserIds.length;
    const clientId = clientUserIds[clientIdx];
    const clientOrgId = clientOrgIds[clientIdx] || null;
    const assignedOrgId = status !== "bidding" ? orgIds[i % 3] : null;
    const assignedUserId = status !== "bidding" ? (userIds["appraiser1"] || null) : null;
    const area = (80 + Math.random() * 200).toFixed(2);
    const estateId = estateIds[i % estateIds.length];
    const cityId = cityIds[i % cityIds.length];
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30 + Math.floor(Math.random() * 60));

    const id = await insert(
      `INSERT INTO projects (title, description, status, client_id, client_org_id, assigned_org_id, assigned_user_id, property_address, property_type, area, deadline, city_id, estate_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `${propertyAddresses[i].substring(0, 10)}房产评估项目`,
        `需要对${propertyAddresses[i]}进行市场价值评估，用于抵押贷款/投资决策。`,
        status,
        clientId,
        clientOrgId,
        assignedOrgId,
        assignedUserId,
        propertyAddresses[i],
        ["住宅", "商业", "办公"][i % 3],
        area,
        deadline,
        cityId,
        estateId,
      ]
    );
    projectIds.push(id);
  }
  console.log(`  ✓ ${projectIds.length} 个项目`);

  // ========== 9. 竞价数据 ==========
  console.log("💰 生成竞价数据...");
  let bidCount = 0;
  for (const projectId of projectIds) {
    const project = await query("SELECT status FROM projects WHERE id = ?", [projectId]);
    if (!project.length) continue;
    const status = project[0].status;

    // 为竞价中和进行中的项目生成竞价
    if (status === "bidding" || status === "active") {
      const bidCount2 = 2 + Math.floor(Math.random() * 4);
      for (let b = 0; b < bidCount2; b++) {
        const orgId = orgIds[b % 3];
        const userId = userIds["appraiser1"] || 1;
        const price = Math.round(3000 + Math.random() * 5000);
        const days = 7 + Math.floor(Math.random() * 14);
        const bidStatus = status === "active" && b === 0 ? "accepted" : "pending";

        await insert(
          "INSERT INTO bids (project_id, org_id, user_id, price, days, message, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [projectId, orgId, userId, price, days, `我司具有丰富的${["住宅", "商业", "办公"][b % 3]}评估经验，可在${days}个工作日内完成。`, bidStatus]
        );
        bidCount++;
      }
    }
  }
  console.log(`  ✓ ${bidCount} 条竞价记录`);

  // ========== 10. 报告数据 ==========
  console.log("📄 生成报告数据...");
  const reportStatuses = ["draft", "submitted", "reviewing", "approved", "archived"];
  let reportCount = 0;
  const reportIds: number[] = [];

  for (let i = 0; i < projectIds.length; i++) {
    const projectId = projectIds[i];
    const project = await query("SELECT status FROM projects WHERE id = ?", [projectId]);
    if (!project.length) continue;
    if (project[0].status === "bidding") continue;

    const reportStatus = reportStatuses[i % reportStatuses.length];
    const authorId = userIds["appraiser1"] || 1;
    const area = 80 + Math.random() * 200;
    const unitPrice = 15000 + Math.random() * 30000;
    const totalPrice = Math.round(area * unitPrice);

    const id = await insert(
      `INSERT INTO reports (project_id, title, status, author_id, content, valuation_result, valuation_min, valuation_max, ai_review_result, ai_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        `${propertyAddresses[i % propertyAddresses.length].substring(0, 15)}评估报告`,
        reportStatus,
        authorId,
        `## 评估报告\n\n### 一、评估目的\n本次评估目的为抵押贷款/投资决策，评估基准日为${new Date().toLocaleDateString()}。\n\n### 二、评估方法\n采用市场比较法，选取周边3-5个可比案例进行比较分析。\n\n### 三、评估结论\n经综合分析，该物业市场价值为人民币${(totalPrice / 10000).toFixed(0)}万元整。`,
        totalPrice,
        Math.round(totalPrice * 0.9),
        Math.round(totalPrice * 1.1),
        JSON.stringify({ score: 85 + Math.floor(Math.random() * 15), issues: ["估价方法合理", "案例选取充分"], suggestions: "报告质量良好" }),
        85 + Math.floor(Math.random() * 15),
      ]
    );
    reportIds.push(id);
    reportCount++;
  }
  console.log(`  ✓ ${reportCount} 份报告`);

  // ========== 11. 自动估价数据 ==========
  console.log("🤖 生成自动估价数据...");
  const valuationUserIds = [userIds["bank1"], userIds["bank2"], userIds["investor1"], userIds["appraiser1"]].filter(Boolean);
  let valuationCount = 0;

  for (let i = 0; i < 20; i++) {
    const userId = valuationUserIds[i % valuationUserIds.length];
    const area = (60 + Math.random() * 150).toFixed(2);
    const cityId = cityIds[i % cityIds.length];
    const estateId = estateIds[i % estateIds.length];
    const unitPrice = 15000 + Math.random() * 30000;
    const totalPrice = Math.round(parseFloat(area) * unitPrice);
    const confidence = (0.75 + Math.random() * 0.2).toFixed(2);

    await insert(
      `INSERT INTO auto_valuations (user_id, city_id, estate_id, area, rooms, floor, property_type, valuation_result, valuation_min, valuation_max, confidence, method, ai_analysis, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '案例比较法', ?, 'completed')`,
      [
        userId, cityId, estateId, area,
        Math.floor(Math.random() * 4) + 1,
        Math.floor(Math.random() * 30) + 1,
        ["住宅", "商业", "办公"][i % 3],
        totalPrice,
        Math.round(totalPrice * 0.9),
        Math.round(totalPrice * 1.1),
        confidence,
        `基于周边${3 + Math.floor(Math.random() * 5)}个可比案例分析，综合考虑楼层、朝向、装修等因素，该物业市场价值约为${(totalPrice / 10000).toFixed(0)}万元。`,
      ]
    );
    valuationCount++;
  }
  console.log(`  ✓ ${valuationCount} 条自动估价记录`);

  // ========== 12. 通知数据 ==========
  console.log("🔔 生成通知数据...");
  const notifTypes = ["project", "report", "bid", "system"];
  const notifTitles = [
    "您有新的项目竞价",
    "报告审核通过",
    "项目状态更新",
    "系统维护通知",
    "新项目发布",
    "竞价结果通知",
    "报告需要修改",
    "评估完成通知",
  ];
  let notifCount = 0;

  const allUserIds = Object.values(userIds).filter(Boolean);
  for (const userId of allUserIds.slice(0, 8)) {
    const count = 3 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      await insert(
        "INSERT INTO notifications (user_id, title, content, type, is_read) VALUES (?, ?, ?, ?, ?)",
        [
          userId,
          notifTitles[i % notifTitles.length],
          `这是一条${notifTitles[i % notifTitles.length]}的详细内容，请及时处理。`,
          notifTypes[i % notifTypes.length],
          i > 2 ? 1 : 0,
        ]
      );
      notifCount++;
    }
  }
  console.log(`  ✓ ${notifCount} 条通知`);

  // ========== 13. 消息数据 ==========
  console.log("💬 生成消息数据...");
  let msgCount = 0;
  const msgPairs = [
    [userIds["appraiser1"], userIds["bank1"]],
    [userIds["bank1"], userIds["appraiser1"]],
    [userIds["appraiser1"], userIds["customer1"]],
    [userIds["bank1"], userIds["customer1"]],
  ].filter(pair => pair[0] && pair[1]);

  for (const [fromId, toId] of msgPairs) {
    for (let i = 0; i < 3; i++) {
      await insert(
        "INSERT INTO messages (from_user_id, to_user_id, content, is_read) VALUES (?, ?, ?, ?)",
        [fromId, toId, `这是第${i + 1}条测试消息，请查收。项目进展顺利，预计按时完成。`, i > 0 ? 1 : 0]
      );
      msgCount++;
    }
  }
  console.log(`  ✓ ${msgCount} 条消息`);

  // ========== 14. OpenClaw 配置 ==========
  console.log("🦞 生成 OpenClaw 配置...");
  const existing = await query("SELECT id FROM openclaw_configs LIMIT 1");
  if (existing.length === 0) {
    const configId = await insert(
      "INSERT INTO openclaw_configs (name, api_url, api_key, target_city_ids, is_active) VALUES (?, ?, ?, ?, 1)",
      ["默认爬取配置", "https://api.openclaw.example.com/v1", "oc_test_key_123456", JSON.stringify([cityIds[0], cityIds[1], cityIds[2]])]
    );

    // 生成任务记录
    const taskStatuses = ["completed", "completed", "failed", "running", "pending"];
    for (let i = 0; i < 5; i++) {
      const successCount = taskStatuses[i] === "completed" ? 100 + Math.floor(Math.random() * 200) : 0;
      await insert(
        `INSERT INTO openclaw_tasks (config_id, city_id, status, total_count, success_count, error_message, started_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          configId,
          cityIds[i % cityIds.length],
          taskStatuses[i],
          taskStatuses[i] === "completed" ? successCount : 0,
          successCount,
          taskStatuses[i] === "failed" ? "连接超时，请检查网络配置" : null,
          taskStatuses[i] !== "pending" ? new Date(Date.now() - i * 3600000) : null,
          taskStatuses[i] === "completed" ? new Date(Date.now() - i * 3600000 + 1800000) : null,
        ]
      );
    }
    console.log("  ✓ 1 个 OpenClaw 配置，5 条任务记录");
  } else {
    console.log("  ✓ OpenClaw 配置已存在，跳过");
  }

  // ========== 15. 操作日志 ==========
  console.log("📋 生成操作日志...");
  const logActions = ["用户登录", "创建项目", "提交竞价", "上传报告", "审核报告", "修改配置", "查询数据", "导出报告"];
  const logResources = ["user", "project", "bid", "report", "config", "case", "valuation"];
  let logCount = 0;

  for (let i = 0; i < 30; i++) {
    const userId = allUserIds[i % allUserIds.length];
    await insert(
      "INSERT INTO operation_logs (user_id, action, resource, resource_id, details, ip) VALUES (?, ?, ?, ?, ?, ?)",
      [
        userId,
        logActions[i % logActions.length],
        logResources[i % logResources.length],
        Math.floor(Math.random() * 20) + 1,
        `执行了${logActions[i % logActions.length]}操作`,
        `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
      ]
    );
    logCount++;
  }
  console.log(`  ✓ ${logCount} 条操作日志`);

  await pool.end();
  console.log("\n✅ 测试数据生成完成！");
  console.log("\n📊 数据汇总：");
  console.log(`  城市: ${cityIds.length} | 组织: ${orgIds.length} | 楼盘: ${estateIds.length}`);
  console.log(`  楼栋: ${buildingIds.length} | 案例: ${caseCount} | 项目: ${projectIds.length}`);
  console.log(`  竞价: ${bidCount} | 报告: ${reportCount} | 估价: ${valuationCount}`);
  console.log(`  通知: ${notifCount} | 消息: ${msgCount} | 日志: ${logCount}`);
}

seed().catch((err) => {
  console.error("❌ 数据生成失败:", err);
  process.exit(1);
});
