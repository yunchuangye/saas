-- =====================================================
-- 补全所有缺失的数据库表
-- =====================================================

-- 1. work_sheets（工作底稿）
CREATE TABLE IF NOT EXISTS work_sheets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  project_id INT NOT NULL,
  author_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  category ENUM('field_survey','comparable_analysis','valuation_calc','compliance_check','other') DEFAULT 'other',
  content TEXT,
  attachments JSON,
  status ENUM('draft','submitted','approved','rejected') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);

-- 2. seals（签章）
CREATE TABLE IF NOT EXISTS seals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  org_id INT,
  user_id INT,
  name VARCHAR(100) NOT NULL,
  type ENUM('org','personal','qualification') DEFAULT 'personal',
  image_url VARCHAR(500),
  image_width INT DEFAULT 200,
  image_height INT DEFAULT 200,
  certificate_no VARCHAR(100),
  valid_from DATE,
  valid_until DATE,
  status ENUM('pending','approved','rejected','disabled') DEFAULT 'pending',
  review_comment TEXT,
  reviewed_by INT,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);

-- 3. seal_applications（签章申请）
CREATE TABLE IF NOT EXISTS seal_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  applicant_id INT NOT NULL,
  org_id INT,
  org_seal_id INT,
  personal_seal_id INT,
  seal_position VARCHAR(100),
  seal_page INT DEFAULT 1,
  apply_reason TEXT,
  status ENUM('pending','approved','rejected','applied') DEFAULT 'pending',
  reviewer_id INT,
  review_comment TEXT,
  reviewed_at TIMESTAMP NULL,
  applied_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);

-- 4. seal_audit_logs（签章审计日志）
CREATE TABLE IF NOT EXISTS seal_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seal_application_id INT,
  report_id INT,
  operator_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  ip_address VARCHAR(50),
  metadata JSON,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. valuation_alerts（估价预警）
CREATE TABLE IF NOT EXISTS valuation_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT,
  report_id INT,
  auto_valuation_id INT,
  alert_type VARCHAR(50) NOT NULL,
  severity ENUM('low','medium','high','critical') DEFAULT 'medium',
  avm_value DECIMAL(15,2),
  manual_value DECIMAL(15,2),
  deviation_pct DECIMAL(8,2),
  threshold_pct DECIMAL(8,2),
  message TEXT,
  is_resolved TINYINT(1) DEFAULT 0,
  resolved_by INT,
  resolved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. broker_listings（经纪房源）
CREATE TABLE IF NOT EXISTS broker_listings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  org_id INT NOT NULL,
  broker_id INT NOT NULL,
  listing_no VARCHAR(50) UNIQUE,
  title VARCHAR(200) NOT NULL,
  estate_name VARCHAR(200),
  building_name VARCHAR(100),
  unit_no VARCHAR(50),
  floor INT,
  total_floors INT,
  area DECIMAL(10,2),
  rooms INT,
  orientation VARCHAR(50),
  decoration VARCHAR(50),
  city VARCHAR(100),
  district VARCHAR(100),
  address VARCHAR(500),
  listing_price DECIMAL(15,2),
  unit_price DECIMAL(10,2),
  ownership_type VARCHAR(50),
  ownership_years INT,
  is_only_house TINYINT(1) DEFAULT 0,
  has_mortgage TINYINT(1) DEFAULT 0,
  mortgage_amount DECIMAL(15,2),
  cover_image VARCHAR(500),
  images JSON,
  vr_url VARCHAR(500),
  status ENUM('draft','active','reserved','sold','offline') DEFAULT 'draft',
  view_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);

-- 7. broker_clients（经纪客源）
CREATE TABLE IF NOT EXISTS broker_clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  org_id INT NOT NULL,
  broker_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  wechat VARCHAR(100),
  client_type ENUM('buyer','seller','both') DEFAULT 'buyer',
  budget_min DECIMAL(15,2),
  budget_max DECIMAL(15,2),
  area_min DECIMAL(10,2),
  area_max DECIMAL(10,2),
  preferred_rooms VARCHAR(100),
  preferred_districts VARCHAR(500),
  intention_level ENUM('high','medium','low') DEFAULT 'medium',
  source VARCHAR(100),
  ai_score INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);

-- 8. viewings（带看记录）
CREATE TABLE IF NOT EXISTS viewings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  org_id INT NOT NULL,
  broker_id INT NOT NULL,
  listing_id INT,
  client_id INT,
  scheduled_at TIMESTAMP,
  actual_at TIMESTAMP NULL,
  status ENUM('scheduled','completed','cancelled') DEFAULT 'scheduled',
  feedback TEXT,
  client_rating INT,
  follow_up TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);

-- 9. transactions（成交记录）
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  org_id INT NOT NULL,
  transaction_no VARCHAR(50) UNIQUE,
  listing_id INT,
  seller_client_id INT,
  buyer_client_id INT,
  seller_broker_id INT,
  buyer_broker_id INT,
  transaction_type ENUM('sale','rental') DEFAULT 'sale',
  agreed_price DECIMAL(15,2),
  deposit_amount DECIMAL(15,2),
  down_payment DECIMAL(15,2),
  loan_amount DECIMAL(15,2),
  commission_rate DECIMAL(5,2),
  total_commission DECIMAL(15,2),
  seller_commission DECIMAL(15,2),
  buyer_commission DECIMAL(15,2),
  status ENUM('pending','deposit_paid','signed','completed','cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);

-- 10. marketing_links（营销链接）
CREATE TABLE IF NOT EXISTS marketing_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  org_id INT NOT NULL,
  broker_id INT NOT NULL,
  link_code VARCHAR(50) UNIQUE NOT NULL,
  link_type ENUM('listing','report','profile') DEFAULT 'listing',
  listing_id INT,
  report_id INT,
  title VARCHAR(200),
  description TEXT,
  cover_image VARCHAR(500),
  has_watermark TINYINT(1) DEFAULT 0,
  require_phone TINYINT(1) DEFAULT 0,
  view_count INT DEFAULT 0,
  unique_view_count INT DEFAULT 0,
  lead_count INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);

-- 11. marketing_link_visits（营销链接访问记录）
CREATE TABLE IF NOT EXISTS marketing_link_visits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  link_id INT NOT NULL,
  visitor_phone VARCHAR(20),
  visitor_name VARCHAR(100),
  duration_seconds INT DEFAULT 0,
  is_lead TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 12. export_tasks（导出任务）
CREATE TABLE IF NOT EXISTS export_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_no VARCHAR(50) UNIQUE NOT NULL,
  org_id INT,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  format VARCHAR(20) NOT NULL,
  filters JSON,
  status ENUM('processing','completed','failed') DEFAULT 'processing',
  file_url VARCHAR(500),
  file_size INT,
  row_count INT,
  error_msg TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);

-- 13. platform_admins（平台管理员）
CREATE TABLE IF NOT EXISTS platform_admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(200) NOT NULL,
  display_name VARCHAR(100),
  role ENUM('super_admin','admin','operator') DEFAULT 'admin',
  is_active TINYINT(1) DEFAULT 1,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);

-- 14. platform_operation_logs（平台操作日志）
CREATE TABLE IF NOT EXISTS platform_operation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id INT,
  details JSON,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 15. org_branding（机构品牌配置）
CREATE TABLE IF NOT EXISTS org_branding (
  id INT AUTO_INCREMENT PRIMARY KEY,
  org_id INT UNIQUE NOT NULL,
  brand_name VARCHAR(100),
  logo_url VARCHAR(500),
  favicon_url VARCHAR(500),
  primary_color VARCHAR(20) DEFAULT '#2563eb',
  secondary_color VARCHAR(20) DEFAULT '#64748b',
  custom_domain VARCHAR(200),
  domain_verified TINYINT(1) DEFAULT 0,
  domain_verify_token VARCHAR(100),
  report_header TEXT,
  report_footer TEXT,
  report_watermark VARCHAR(200),
  report_logo_url VARCHAR(500),
  email_from_name VARCHAR(100),
  email_from_addr VARCHAR(100),
  email_smtp_host VARCHAR(200),
  email_smtp_port INT,
  email_smtp_user VARCHAR(100),
  email_smtp_pass VARCHAR(200),
  sms_sign VARCHAR(50),
  sms_provider VARCHAR(50),
  sms_access_key VARCHAR(200),
  sms_secret_key VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);

-- 16. notification_preferences（通知偏好）
CREATE TABLE IF NOT EXISTS notification_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  inapp_enabled TINYINT(1) DEFAULT 1,
  email_enabled TINYINT(1) DEFAULT 0,
  sms_enabled TINYINT(1) DEFAULT 0,
  events JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);

-- 17. notification_sends（通知发送记录）
CREATE TABLE IF NOT EXISTS notification_sends (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  notification_id INT,
  channel ENUM('inapp','email','sms') DEFAULT 'inapp',
  status ENUM('pending','sent','failed') DEFAULT 'pending',
  sent_at TIMESTAMP NULL,
  error_msg TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 18. payment_orders（支付订单）
CREATE TABLE IF NOT EXISTS payment_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(50) UNIQUE NOT NULL,
  org_id INT,
  user_id INT NOT NULL,
  plan_code VARCHAR(50),
  billing_cycle ENUM('monthly','yearly') DEFAULT 'monthly',
  amount DECIMAL(10,2) NOT NULL,
  channel ENUM('alipay','wechat','bank_transfer') DEFAULT 'alipay',
  status ENUM('pending','paid','failed','refunded','cancelled') DEFAULT 'pending',
  pay_url VARCHAR(500),
  qr_code TEXT,
  paid_at TIMESTAMP NULL,
  expired_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);

-- 初始化 platform_admins 超级管理员账号（密码：Admin@2026）
INSERT IGNORE INTO platform_admins (username, email, password_hash, display_name, role, is_active)
VALUES ('superadmin', 'superadmin@gujia.app', '$2b$10$.6Bm8D/g2xQtAvl9H/5HS.WpODTbAwAv8rJm2DFbdBMKSHGOvnVEi', '超级管理员', 'super_admin', 1);
