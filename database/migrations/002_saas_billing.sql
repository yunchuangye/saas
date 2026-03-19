-- SaaS 订阅计费模型迁移
-- 建议书商业化第一阶段

-- 1. 订阅计划表
CREATE TABLE IF NOT EXISTS subscription_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '计划名称',
  code VARCHAR(50) NOT NULL UNIQUE COMMENT '计划代码：free/starter/professional/enterprise',
  description TEXT COMMENT '计划描述',
  price_monthly DECIMAL(10,2) DEFAULT 0 COMMENT '月费（元）',
  price_yearly DECIMAL(10,2) DEFAULT 0 COMMENT '年费（元）',
  -- 配额限制
  quota_projects INT DEFAULT 5 COMMENT '每月项目数量限制，-1=无限',
  quota_reports INT DEFAULT 10 COMMENT '每月报告数量限制，-1=无限',
  quota_avm_calls INT DEFAULT 50 COMMENT '每月 AVM 调用次数，-1=无限',
  quota_api_calls INT DEFAULT 0 COMMENT '每月 API 调用次数，-1=无限',
  quota_users INT DEFAULT 3 COMMENT '团队成员数量限制，-1=无限',
  quota_storage_gb INT DEFAULT 5 COMMENT '存储空间（GB），-1=无限',
  -- 功能开关
  feature_three_level_review TINYINT(1) DEFAULT 0 COMMENT '三级审核功能',
  feature_work_sheets TINYINT(1) DEFAULT 0 COMMENT '工作底稿功能',
  feature_batch_valuation TINYINT(1) DEFAULT 0 COMMENT '批量估价功能',
  feature_api_access TINYINT(1) DEFAULT 0 COMMENT 'API 访问功能',
  feature_white_label TINYINT(1) DEFAULT 0 COMMENT '白标定制功能',
  feature_priority_support TINYINT(1) DEFAULT 0 COMMENT '优先支持',
  is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  sort_order INT DEFAULT 0 COMMENT '排序',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订阅计划表';

-- 2. 机构订阅表
CREATE TABLE IF NOT EXISTS org_subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  org_id INT NOT NULL COMMENT '机构ID',
  plan_id INT NOT NULL COMMENT '计划ID',
  status ENUM('active','expired','cancelled','trial') DEFAULT 'trial' COMMENT '订阅状态',
  billing_cycle ENUM('monthly','yearly') DEFAULT 'monthly' COMMENT '计费周期',
  started_at TIMESTAMP NOT NULL COMMENT '开始时间',
  expires_at TIMESTAMP NOT NULL COMMENT '到期时间',
  trial_ends_at TIMESTAMP DEFAULT NULL COMMENT '试用到期时间',
  auto_renew TINYINT(1) DEFAULT 1 COMMENT '自动续费',
  -- 当前用量（每月重置）
  used_projects INT DEFAULT 0 COMMENT '本月已用项目数',
  used_reports INT DEFAULT 0 COMMENT '本月已用报告数',
  used_avm_calls INT DEFAULT 0 COMMENT '本月已用 AVM 调用数',
  used_api_calls INT DEFAULT 0 COMMENT '本月已用 API 调用数',
  usage_reset_at TIMESTAMP DEFAULT NULL COMMENT '用量重置时间',
  -- 支付信息
  amount_paid DECIMAL(10,2) DEFAULT 0 COMMENT '实付金额',
  payment_method VARCHAR(50) DEFAULT NULL COMMENT '支付方式',
  external_order_id VARCHAR(200) DEFAULT NULL COMMENT '外部订单号',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_org_id (org_id),
  INDEX idx_status (status),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='机构订阅表';

-- 3. API 密钥表
CREATE TABLE IF NOT EXISTS api_keys (
  id INT PRIMARY KEY AUTO_INCREMENT,
  org_id INT NOT NULL COMMENT '机构ID',
  user_id INT NOT NULL COMMENT '创建人ID',
  name VARCHAR(100) NOT NULL COMMENT '密钥名称',
  key_prefix VARCHAR(10) NOT NULL COMMENT '密钥前缀（显示用）',
  key_hash VARCHAR(64) NOT NULL UNIQUE COMMENT '密钥哈希（SHA256）',
  scopes TEXT DEFAULT NULL COMMENT '权限范围 JSON',
  rate_limit_per_min INT DEFAULT 60 COMMENT '每分钟调用限制',
  is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  last_used_at TIMESTAMP DEFAULT NULL COMMENT '最后使用时间',
  expires_at TIMESTAMP DEFAULT NULL COMMENT '过期时间（NULL=永不过期）',
  total_calls INT DEFAULT 0 COMMENT '累计调用次数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_org_id (org_id),
  INDEX idx_key_hash (key_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='API 密钥表';

-- 4. API 调用记录表
CREATE TABLE IF NOT EXISTS api_call_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  api_key_id INT NOT NULL COMMENT 'API 密钥ID',
  org_id INT NOT NULL COMMENT '机构ID',
  endpoint VARCHAR(200) NOT NULL COMMENT '调用端点',
  method VARCHAR(10) DEFAULT 'POST' COMMENT 'HTTP 方法',
  status_code INT DEFAULT 200 COMMENT '响应状态码',
  response_time_ms INT DEFAULT 0 COMMENT '响应时间（毫秒）',
  ip_address VARCHAR(50) DEFAULT NULL COMMENT '调用 IP',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_api_key_id (api_key_id),
  INDEX idx_org_id (org_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='API 调用记录表';

-- 5. 账单记录表
CREATE TABLE IF NOT EXISTS billing_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  org_id INT NOT NULL COMMENT '机构ID',
  subscription_id INT DEFAULT NULL COMMENT '关联订阅ID',
  type ENUM('subscription','addon','refund','credit') DEFAULT 'subscription' COMMENT '账单类型',
  description VARCHAR(500) NOT NULL COMMENT '账单描述',
  amount DECIMAL(10,2) NOT NULL COMMENT '金额（正=收入，负=退款）',
  currency VARCHAR(10) DEFAULT 'CNY' COMMENT '货币',
  status ENUM('pending','paid','failed','refunded') DEFAULT 'pending' COMMENT '状态',
  payment_method VARCHAR(50) DEFAULT NULL COMMENT '支付方式',
  external_order_id VARCHAR(200) DEFAULT NULL COMMENT '外部订单号',
  paid_at TIMESTAMP DEFAULT NULL COMMENT '支付时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_org_id (org_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账单记录表';

-- 插入默认订阅计划
INSERT INTO subscription_plans (name, code, description, price_monthly, price_yearly, quota_projects, quota_reports, quota_avm_calls, quota_api_calls, quota_users, quota_storage_gb, feature_three_level_review, feature_work_sheets, feature_batch_valuation, feature_api_access, feature_white_label, feature_priority_support, sort_order) VALUES
('免费版', 'free', '适合个人评估师试用，基础功能免费使用', 0, 0, 3, 5, 20, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1),
('入门版', 'starter', '适合小型评估机构，包含核心业务功能', 299, 2990, 20, 50, 200, 0, 5, 10, 1, 1, 0, 0, 0, 0, 2),
('专业版', 'professional', '适合中型评估机构，包含全部专业功能', 999, 9990, 100, 200, 1000, 1000, 20, 50, 1, 1, 1, 1, 0, 1, 3),
('企业版', 'enterprise', '适合大型评估机构和金融机构，无限制使用', 3999, 39990, -1, -1, -1, -1, -1, -1, 1, 1, 1, 1, 1, 1, 4);

SELECT 'Billing schema created successfully' AS result;
