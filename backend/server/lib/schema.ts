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
  cityId: int("city_id").notNull(),
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
  rooms: int("rooms"),
  bathrooms: int("bathrooms"),
  orientation: varchar("orientation", { length: 50 }),
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
  rooms: int("rooms"),
  floor: int("floor"),
  totalFloors: int("total_floors"),
  orientation: varchar("orientation", { length: 50 }),
  propertyType: varchar("property_type", { length: 100 }),
  transactionType: mysqlEnum("transaction_type", ["sale", "rent"]).default("sale"),
  price: decimal("price", { precision: 15, scale: 2 }),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  transactionDate: timestamp("transaction_date"),
  source: varchar("source", { length: 100 }),
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
  action: varchar("action", { length: 200 }).notNull(),
  resource: varchar("resource", { length: 100 }),
  resourceId: int("resource_id"),
  details: text("details"),
  detail: text("detail"),
  ip: varchar("ip", { length: 50 }),
  ipAddress: varchar("ip_address", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});
