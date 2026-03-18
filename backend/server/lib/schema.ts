import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
  boolean,
  decimal,
  json,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

// 用户表
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 200 }).unique(),
  phone: varchar("phone", { length: 20 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["appraiser", "bank", "investor", "customer", "admin"]).notNull().default("customer"),
  orgId: int("org_id"),
  displayName: varchar("display_name", { length: 100 }),
  realName: varchar("real_name", { length: 100 }),
  avatar: varchar("avatar", { length: 500 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// 组织表
export const organizations = mysqlTable("organizations", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 200 }).notNull(),
  type: mysqlEnum("type", ["appraiser", "bank", "investor"]).notNull(),
  license: varchar("license", { length: 100 }),
  address: varchar("address", { length: 500 }),
  contactName: varchar("contact_name", { length: 100 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  rating: decimal("rating", { precision: 3, scale: 1 }),
  description: text("description"),
  logo: varchar("logo", { length: 500 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// 组织成员表
export const orgMembers = mysqlTable("org_members", {
  id: int("id").primaryKey().autoincrement(),
  orgId: int("org_id").notNull(),
  userId: int("user_id").notNull(),
  role: varchar("role", { length: 50 }).default("member"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// 项目表
export const projects = mysqlTable("projects", {
  id: int("id").primaryKey().autoincrement(),
  projectNo: varchar("project_no", { length: 50 }).unique(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["bidding", "active", "completed", "cancelled"]).notNull().default("bidding"),
  clientId: int("client_id").notNull(),
  clientOrgId: int("client_org_id"),
  bankOrgId: int("bank_org_id"),
  bankUserId: int("bank_user_id"),
  assignedOrgId: int("assigned_org_id"),
  assignedUserId: int("assigned_user_id"),
  propertyAddress: varchar("property_address", { length: 500 }),
  propertyType: varchar("property_type", { length: 100 }),
  area: decimal("area", { precision: 10, scale: 2 }),
  estimatedValue: decimal("estimated_value", { precision: 15, scale: 2 }),
  deadline: timestamp("deadline"),
  cityId: int("city_id"),
  estateId: int("estate_id"),
  buildingId: int("building_id"),
  unitId: int("unit_id"),
  floor: varchar("floor", { length: 50 }),
  buildYear: int("build_year"),
  purpose: varchar("purpose", { length: 100 }),
  contactName: varchar("contact_name", { length: 100 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  attachments: json("attachments"),
  manualEstateName: varchar("manual_estate_name", { length: 300 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// 竞价表
export const bids = mysqlTable("bids", {
  id: int("id").primaryKey().autoincrement(),
  projectId: int("project_id").notNull(),
  orgId: int("org_id").notNull(),
  userId: int("user_id").notNull(),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  days: int("days").notNull(),
  estimatedDays: int("estimated_days"),
  message: text("message"),
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "awarded"]).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 报告表
export const reports = mysqlTable("reports", {
  id: int("id").primaryKey().autoincrement(),
  reportNo: varchar("report_no", { length: 50 }).unique(),
  projectId: int("project_id").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  status: mysqlEnum("status", ["draft", "submitted", "reviewing", "approved", "rejected", "archived"]).notNull().default("draft"),
  authorId: int("author_id").notNull(),
  reviewerId: int("reviewer_id"),
  content: text("content"),
  propertyAddress: varchar("property_address", { length: 500 }),
  propertyType: varchar("property_type", { length: 100 }),
  propertyArea: decimal("property_area", { precision: 10, scale: 2 }),
  valuationResult: decimal("valuation_result", { precision: 15, scale: 2 }),
  valuationMin: decimal("valuation_min", { precision: 15, scale: 2 }),
  valuationMax: decimal("valuation_max", { precision: 15, scale: 2 }),
  finalValue: decimal("final_value", { precision: 15, scale: 2 }),
  aiReviewResult: text("ai_review_result"),
  aiScore: int("ai_score"),
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
  completedAt: timestamp("completed_at"),
  rating: int("rating"),
  ratingComment: text("rating_comment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// 报告文件表
export const reportFiles = mysqlTable("report_files", {
  id: int("id").primaryKey().autoincrement(),
  reportId: int("report_id").notNull(),
  fileName: varchar("file_name", { length: 300 }).notNull(),
  fileUrl: varchar("file_url", { length: 1000 }).notNull(),
  fileType: varchar("file_type", { length: 50 }),
  fileSize: int("file_size"),
  uploadedBy: int("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 通知表
export const notifications = mysqlTable("notifications", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content"),
  type: varchar("type", { length: 50 }).default("system"),
  isRead: boolean("is_read").notNull().default(false),
  relatedId: int("related_id"),
  relatedType: varchar("related_type", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// 消息表
export const messages = mysqlTable("messages", {
  id: int("id").primaryKey().autoincrement(),
  fromUserId: int("from_user_id").notNull(),
  toUserId: int("to_user_id").notNull(),
  projectId: int("project_id"),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// 城市表
export const cities = mysqlTable("cities", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  province: varchar("province", { length: 100 }),
  code: varchar("code", { length: 20 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// 区/县表
export const districts = mysqlTable("districts", {
  id: int("id").primaryKey().autoincrement(),
  cityId: int("city_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }),
  type: varchar("type", { length: 20 }).default("district"), // district=市辖区 county=县/县级市 new_area=新区
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// 楼盘表
export const estates = mysqlTable("estates", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 200 }).notNull(),
  pinyin: varchar("pinyin", { length: 200 }),  // 拼音首字母，如 WKJY
  cityId: int("city_id").notNull(),
  districtId: int("district_id"),  // 所属地区
  address: varchar("address", { length: 500 }),
  developer: varchar("developer", { length: 200 }),
  buildYear: int("build_year"),
  propertyType: varchar("property_type", { length: 100 }),
  totalUnits: int("total_units"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// 楼栋表
export const buildings = mysqlTable("buildings", {
  id: int("id").primaryKey().autoincrement(),
  estateId: int("estate_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  floors: int("floors"),
  unitsPerFloor: int("units_per_floor"),
  buildYear: int("build_year"),
  propertyType: varchar("property_type", { length: 100 }),
  alias: varchar("alias", { length: 200 }),
  buildingType: varchar("build_type", { length: 50 }),
  buildStructure: varchar("build_structure", { length: 50 }),
  floorHeight: decimal("floor_height", { precision: 5, scale: 2 }),
  unitAmount: int("unit_amount"),
  totalUnits: int("total_units"),
  buildingArea: decimal("building_area", { precision: 12, scale: 2 }),
  completionDate: varchar("completion_date", { length: 50 }),
  saleDate: varchar("sale_date", { length: 50 }),
  avgPrice: decimal("avg_price", { precision: 10, scale: 2 }),
  elevatorRate: varchar("elevator_rate", { length: 50 }),
  saleLicence: varchar("sale_licence", { length: 200 }),
  sourceId: int("source_id"),
  sourceEstateId: int("source_estate_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 房屋单元表
export const units = mysqlTable("units", {
  id: int("id").primaryKey().autoincrement(),
  buildingId: int("building_id").notNull(),
  estateId: int("estate_id").notNull(),
  unitNumber: varchar("unit_number", { length: 50 }).notNull(),
  floor: int("floor"),
  area: decimal("area", { precision: 10, scale: 2 }),
  buildArea: decimal("build_area", { precision: 10, scale: 2 }),
  rooms: int("rooms"),
  bathrooms: int("bathrooms"),
  orientation: varchar("orientation", { length: 50 }),
  towards: varchar("towards", { length: 50 }),
  landscape: varchar("landscape", { length: 100 }),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 14, scale: 2 }),
  propertyType: varchar("property_type", { length: 100 }),
  propertyStructure: varchar("property_structure", { length: 100 }),
  propertyNo: varchar("property_no", { length: 50 }),
  remark: varchar("remark", { length: 500 }),
  sourceId: int("source_id"),
  sourceBuildingId: int("source_building_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 案例表
export const cases = mysqlTable("cases", {
  id: int("id").primaryKey().autoincrement(),
  cityId: int("city_id"),
  estateId: int("estate_id"),
  buildingId: int("building_id"),
  unitId: int("unit_id"),
  address: varchar("address", { length: 500 }),
  area: decimal("area", { precision: 10, scale: 2 }),
  floor: int("floor"),
  totalFloors: int("total_floors"),
  orientation: varchar("orientation", { length: 50 }),
  propertyType: varchar("property_type", { length: 100 }),
  transactionType: mysqlEnum("transaction_type", ["sale", "rent"]).default("sale"),
  price: decimal("price", { precision: 15, scale: 2 }),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  transactionDate: timestamp("transaction_date"),
  source: varchar("source", { length: 100 }),
  sourceId: varchar("source_id", { length: 200 }),       // 来源网站的案例 ID
  sourceUrl: varchar("source_url", { length: 1000 }),    // 来源网页 URL
  community: varchar("community", { length: 200 }),      // 小区/楼盘名
  totalPrice: int("total_price"), // 总价（元）
  rooms: varchar("rooms_str", { length: 50 }),           // 户型字符串，如 '3室2厅'
  decoration: varchar("decoration", { length: 50 }),     // 装修情况
  buildYear: int("build_year"),                          // 建成年份
  dealDate: timestamp("deal_date"),                      // 成交日期
  listingPrice: int("listing_price"), // 挂牌价
  dealCycle: int("deal_cycle"),                          // 成交周期（天）
  isVerified: boolean("is_verified").default(false),     // 是否已核验
  isAnomaly: boolean("is_anomaly").default(false),
  anomalyReason: text("anomaly_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// 自动估价表
export const autoValuations = mysqlTable("auto_valuations", {
  id: int("id").primaryKey().autoincrement(),
  projectId: int("project_id"),
  userId: int("user_id").notNull(),
  address: varchar("address", { length: 500 }),
  cityId: int("city_id"),
  estateId: int("estate_id"),
  area: decimal("area", { precision: 10, scale: 2 }),
  rooms: int("rooms"),
  floor: int("floor"),
  propertyType: varchar("property_type", { length: 100 }),
  valuationResult: decimal("valuation_result", { precision: 15, scale: 2 }),
  valuationMin: decimal("valuation_min", { precision: 15, scale: 2 }),
  valuationMax: decimal("valuation_max", { precision: 15, scale: 2 }),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  method: varchar("method", { length: 100 }),
  comparableCases: json("comparable_cases"),
  aiAnalysis: text("ai_analysis"),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  // 扩展字段（二次开发新增）
  orgId: int("org_id"),
  propertyAddress: varchar("property_address", { length: 500 }),
  buildingArea: decimal("building_area", { precision: 10, scale: 2 }),
  totalFloors: int("total_floors"),
  buildingAge: int("building_age"),
  orientation: varchar("orientation", { length: 50 }),
  decoration: varchar("decoration", { length: 50 }),
  hasElevator: int("has_elevator").default(0),
  hasParking: int("has_parking").default(0),
  purpose: varchar("purpose", { length: 50 }),
  district: varchar("district", { length: 100 }),
  cityName: varchar("city_name", { length: 100 }),
  estimatedValue: decimal("estimated_value", { precision: 15, scale: 2 }),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  confidenceLevel: varchar("confidence_level", { length: 20 }),
  reportData: json("report_data"),
  llmAnalysis: json("llm_analysis"),
  comparableCount: int("comparable_count").default(0),
  // 楼盘/楼栋/房屋关联
  buildingId: int("building_id"),
  unitId: int("unit_id"),
});

// OpenClaw 配置表
export const openclawConfigs = mysqlTable("openclaw_configs", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 200 }).notNull(),
  apiUrl: varchar("api_url", { length: 500 }),
  apiKey: varchar("api_key", { length: 200 }),
  targetCityIds: json("target_city_ids"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// OpenClaw 任务表
export const openclawTasks = mysqlTable("openclaw_tasks", {
  id: int("id").primaryKey().autoincrement(),
  configId: int("config_id").notNull(),
  cityId: int("city_id"),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending"),
  totalCount: int("total_count").default(0),
  successCount: int("success_count").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 操作日志表
export const operationLogs = mysqlTable("operation_logs", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id"),
  username: varchar("username", { length: 100 }),
  action: varchar("action", { length: 200 }).notNull(),
  resource: varchar("resource", { length: 100 }),
  resourceId: int("resource_id"),
  details: text("details"),
  detail: text("detail"),
  ip: varchar("ip", { length: 50 }),
  ipAddress: varchar("ip_address", { length: 50 }),
  status: varchar("status", { length: 20 }).default("success"),
  userAgent: varchar("user_agent", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// 数据采集模块
// ============================================================

// 采集任务表
export const crawlTemplates = mysqlTable("crawl_templates", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 200 }).notNull().unique(),
  description: text("description"),
  configJson: json("config_json").notNull(),
  createdBy: int("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const crawlJobs = mysqlTable("crawl_jobs", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 200 }).notNull(),
  source: varchar("source", { length: 50 }).notNull(), // lianjia | anjuke | fang58 | beike | custom
  dataType: varchar("data_type", { length: 50 }).notNull(), // sold_cases | listing | estate_info
  cityId: int("city_id"),
  cityName: varchar("city_name", { length: 100 }),
  districtName: varchar("district_name", { length: 100 }),
  keyword: varchar("keyword", { length: 200 }), // 搜索关键词/楼盘名
  maxPages: int("max_pages").default(10),
  concurrency: int("concurrency").default(2), // 并发数
  delayMin: int("delay_min").default(2000), // 最小延迟(ms)
  delayMax: int("delay_max").default(5000), // 最大延迟(ms)
  useProxy: boolean("use_proxy").default(false),
  proxyConfig: text("proxy_config"), // JSON 代理配置
  status: mysqlEnum("status", ["pending", "running", "paused", "completed", "failed"]).default("pending"),
  progress: int("progress").default(0), // 0-100
  totalCount: int("total_count").default(0), // 预计总条数
  successCount: int("success_count").default(0), // 成功采集数
  failCount: int("fail_count").default(0), // 失败数
  duplicateCount: int("duplicate_count").default(0), // 重复数
  errorMessage: text("error_message"),
  scheduleType: varchar("schedule_type", { length: 20 }).default("manual"), // manual | cron
  cronExpression: varchar("cron_expression", { length: 100 }),
  customConfigJson: json("custom_config_json"),
  createdBy: int("created_by"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// 采集日志表（每条采集记录）
export const crawlLogs = mysqlTable("crawl_logs", {
  id: int("id").primaryKey().autoincrement(),
  jobId: int("job_id").notNull(),
  level: mysqlEnum("level", ["info", "warn", "error", "success"]).default("info"),
  message: text("message").notNull(),
  url: varchar("url", { length: 1000 }),
  dataCount: int("data_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// 采集到的原始数据暂存表（清洗前）
export const crawlRawData = mysqlTable("crawl_raw_data", {
  id: int("id").primaryKey().autoincrement(),
  jobId: int("job_id").notNull(),
  source: varchar("source", { length: 50 }).notNull(),
  dataType: varchar("data_type", { length: 50 }).notNull(),
  rawData: text("raw_data").notNull(), // JSON 原始数据
  parsedData: text("parsed_data"), // JSON 清洗后数据
  status: mysqlEnum("status", ["raw", "parsed", "imported", "error"]).default("raw"),
  errorMsg: text("error_msg"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// 采集系统扩展表
// ============================================================

// 代理 IP 池
export const crawlProxies = mysqlTable("crawl_proxies", {
  id: int("id").primaryKey().autoincrement(),
  host: varchar("host", { length: 200 }).notNull(),
  port: int("port").notNull(),
  protocol: mysqlEnum("protocol", ["http", "https", "socks5"]).default("http"),
  username: varchar("username", { length: 100 }),
  password: varchar("password", { length: 100 }),
  region: varchar("region", { length: 100 }), // 地区（如：上海、北京）
  provider: varchar("provider", { length: 100 }), // 服务商（如：芝麻代理）
  status: mysqlEnum("status", ["active", "inactive", "testing", "banned"]).default("active"),
  successCount: int("success_count").default(0),
  failCount: int("fail_count").default(0),
  avgResponseMs: int("avg_response_ms"),
  lastTestedAt: timestamp("last_tested_at"),
  lastUsedAt: timestamp("last_used_at"),
  expireAt: timestamp("expire_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// 采集告警记录
export const crawlAlerts = mysqlTable("crawl_alerts", {
  id: int("id").primaryKey().autoincrement(),
  jobId: int("job_id"),
  level: mysqlEnum("level", ["info", "warn", "error", "critical"]).default("warn"),
  type: varchar("type", { length: 50 }).notNull(), // job_failed | low_success_rate | proxy_banned | schedule_missed
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 定时任务执行历史
export const crawlScheduleHistory = mysqlTable("crawl_schedule_history", {
  id: int("id").primaryKey().autoincrement(),
  jobId: int("job_id").notNull(),
  triggeredBy: mysqlEnum("triggered_by", ["cron", "manual", "api"]).default("cron"),
  status: mysqlEnum("status", ["success", "failed", "skipped"]).default("success"),
  successCount: int("success_count").default(0),
  failCount: int("fail_count").default(0),
  durationMs: int("duration_ms"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// 采集系统全局配置
export const crawlConfig = mysqlTable("crawl_config", {
  id: int("id").primaryKey().autoincrement(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  description: varchar("description", { length: 300 }),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ============================================================
// 类型导出（解决 Drizzle ORM v0.38 严格类型推断问题）
// 使用 $inferInsert 导出完整 insert 类型，包含所有有默认值的字段
// ============================================================
export type InsertUser = typeof users.$inferInsert
export type SelectUser = typeof users.$inferSelect

export type InsertOrganization = typeof organizations.$inferInsert
export type SelectOrganization = typeof organizations.$inferSelect

export type InsertOrgMember = typeof orgMembers.$inferInsert
export type SelectOrgMember = typeof orgMembers.$inferSelect

export type InsertProject = typeof projects.$inferInsert
export type SelectProject = typeof projects.$inferSelect

export type InsertBid = typeof bids.$inferInsert
export type SelectBid = typeof bids.$inferSelect

export type InsertReport = typeof reports.$inferInsert
export type SelectReport = typeof reports.$inferSelect

export type InsertReportFile = typeof reportFiles.$inferInsert
export type SelectReportFile = typeof reportFiles.$inferSelect

export type InsertNotification = typeof notifications.$inferInsert
export type SelectNotification = typeof notifications.$inferSelect

export type InsertMessage = typeof messages.$inferInsert
export type SelectMessage = typeof messages.$inferSelect

export type InsertCity = typeof cities.$inferInsert
export type SelectCity = typeof cities.$inferSelect

export type InsertDistrict = typeof districts.$inferInsert
export type SelectDistrict = typeof districts.$inferSelect

export type InsertEstate = typeof estates.$inferInsert
export type SelectEstate = typeof estates.$inferSelect

export type InsertBuilding = typeof buildings.$inferInsert
export type SelectBuilding = typeof buildings.$inferSelect

export type InsertUnit = typeof units.$inferInsert
export type SelectUnit = typeof units.$inferSelect

export type InsertCase = typeof cases.$inferInsert
export type SelectCase = typeof cases.$inferSelect

export type InsertAutoValuation = typeof autoValuations.$inferInsert
export type SelectAutoValuation = typeof autoValuations.$inferSelect

export type InsertOpenclawConfig = typeof openclawConfigs.$inferInsert
export type SelectOpenclawConfig = typeof openclawConfigs.$inferSelect

export type InsertOpenclawTask = typeof openclawTasks.$inferInsert
export type SelectOpenclawTask = typeof openclawTasks.$inferSelect

export type InsertOperationLog = typeof operationLogs.$inferInsert
export type SelectOperationLog = typeof operationLogs.$inferSelect

export type InsertCrawlJob = typeof crawlJobs.$inferInsert
export type SelectCrawlJob = typeof crawlJobs.$inferSelect

export type InsertCrawlLog = typeof crawlLogs.$inferInsert
export type SelectCrawlLog = typeof crawlLogs.$inferSelect

export type InsertCrawlRawData = typeof crawlRawData.$inferInsert
export type SelectCrawlRawData = typeof crawlRawData.$inferSelect

export type InsertCrawlProxy = typeof crawlProxies.$inferInsert
export type SelectCrawlProxy = typeof crawlProxies.$inferSelect

export type InsertCrawlAlert = typeof crawlAlerts.$inferInsert
export type SelectCrawlAlert = typeof crawlAlerts.$inferSelect

export type InsertCrawlScheduleHistory = typeof crawlScheduleHistory.$inferInsert
export type SelectCrawlScheduleHistory = typeof crawlScheduleHistory.$inferSelect

export type InsertCrawlConfig = typeof crawlConfig.$inferInsert
export type SelectCrawlConfig = typeof crawlConfig.$inferSelect

export type InsertCrawlTemplate = typeof crawlTemplates.$inferInsert;
export type SelectCrawlTemplate = typeof crawlTemplates.$inferSelect;

// 新闻表
export const news = mysqlTable("news", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 300 }).notNull(),
  summary: varchar("summary", { length: 500 }),
  content: text("content"),
  coverImage: varchar("cover_image", { length: 500 }),
  category: varchar("category", { length: 50 }).default("industry"), // industry/policy/company
  status: varchar("status", { length: 20 }).default("draft"), // draft/published/archived
  isPinned: boolean("is_pinned").notNull().default(false),
  viewCount: int("view_count").notNull().default(0),
  authorId: int("author_id").notNull(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type InsertNews = typeof news.$inferInsert;
export type SelectNews = typeof news.$inferSelect;
