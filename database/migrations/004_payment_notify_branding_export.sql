-- ============================================================
-- 迁移 004: 支付订单、通知增强、白标配置、导出任务
-- ============================================================

-- ============================================================
-- 1. 支付订单表（微信/支付宝）
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(64) NOT NULL UNIQUE COMMENT '平台订单号',
  out_trade_no VARCHAR(64) UNIQUE COMMENT '第三方支付流水号',
  org_id INT NOT NULL COMMENT '机构ID',
  user_id INT NOT NULL COMMENT '下单用户ID',
  plan_code VARCHAR(50) NOT NULL COMMENT '订阅套餐代码',
  billing_cycle ENUM('monthly','yearly') NOT NULL DEFAULT 'monthly',
  amount INT NOT NULL COMMENT '金额（分）',
  channel ENUM('wechat','alipay','manual') NOT NULL DEFAULT 'wechat' COMMENT '支付渠道',
  status ENUM('pending','paid','failed','refunded','cancelled') NOT NULL DEFAULT 'pending',
  pay_url TEXT COMMENT '支付二维码URL或跳转链接',
  qr_code TEXT COMMENT '微信支付二维码内容',
  paid_at TIMESTAMP NULL COMMENT '支付完成时间',
  expired_at TIMESTAMP NULL COMMENT '订单过期时间',
  notify_data JSON COMMENT '支付回调原始数据',
  remark VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_org_id (org_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_order_no (order_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付订单表';

-- ============================================================
-- 2. 通知增强：增加邮件/短信发送记录
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_sends (
  id INT PRIMARY KEY AUTO_INCREMENT,
  notification_id INT COMMENT '关联站内信ID（可为空）',
  user_id INT NOT NULL,
  channel ENUM('inapp','email','sms') NOT NULL COMMENT '发送渠道',
  to_address VARCHAR(200) COMMENT '邮箱或手机号',
  subject VARCHAR(300) COMMENT '邮件主题',
  content TEXT COMMENT '发送内容',
  status ENUM('pending','sent','failed') NOT NULL DEFAULT 'pending',
  error_msg VARCHAR(500),
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_channel (channel),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知发送记录';

-- notifications 表增加邮件/短信触发字段（兼容 MySQL 8.0）
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'send_email');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE notifications ADD COLUMN send_email BOOLEAN NOT NULL DEFAULT FALSE COMMENT \'是否发送邮件\'', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists2 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'send_sms');
SET @sql2 = IF(@col_exists2 = 0, 'ALTER TABLE notifications ADD COLUMN send_sms BOOLEAN NOT NULL DEFAULT FALSE COMMENT \'是否发送短信\'', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

SET @col_exists3 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'trigger_event');
SET @sql3 = IF(@col_exists3 = 0, 'ALTER TABLE notifications ADD COLUMN trigger_event VARCHAR(100) COMMENT \'触发事件类型\'', 'SELECT 1');
PREPARE stmt3 FROM @sql3; EXECUTE stmt3; DEALLOCATE PREPARE stmt3;

SET @col_exists4 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'extra_data');
SET @sql4 = IF(@col_exists4 = 0, 'ALTER TABLE notifications ADD COLUMN extra_data JSON COMMENT \'附加数据\'', 'SELECT 1');
PREPARE stmt4 FROM @sql4; EXECUTE stmt4; DEALLOCATE PREPARE stmt4;

-- ============================================================
-- 3. 白标配置表（机构品牌定制）
-- ============================================================
CREATE TABLE IF NOT EXISTS org_branding (
  id INT PRIMARY KEY AUTO_INCREMENT,
  org_id INT NOT NULL UNIQUE COMMENT '机构ID',
  brand_name VARCHAR(200) COMMENT '品牌名称（覆盖机构名）',
  logo_url VARCHAR(500) COMMENT '品牌Logo URL',
  favicon_url VARCHAR(500) COMMENT 'Favicon URL',
  primary_color VARCHAR(20) DEFAULT '#2563eb' COMMENT '主题色',
  secondary_color VARCHAR(20) DEFAULT '#64748b' COMMENT '辅助色',
  custom_domain VARCHAR(200) COMMENT '自定义域名',
  domain_verified BOOLEAN NOT NULL DEFAULT FALSE COMMENT '域名是否已验证',
  domain_verify_token VARCHAR(100) COMMENT '域名验证Token',
  report_header TEXT COMMENT '报告页眉HTML（支持变量）',
  report_footer TEXT COMMENT '报告页脚HTML（支持变量）',
  report_watermark VARCHAR(200) COMMENT '报告水印文字',
  report_logo_url VARCHAR(500) COMMENT '报告专用Logo',
  email_from_name VARCHAR(100) COMMENT '邮件发件人名称',
  email_from_addr VARCHAR(200) COMMENT '邮件发件人地址',
  email_smtp_host VARCHAR(200) COMMENT 'SMTP服务器',
  email_smtp_port INT DEFAULT 465,
  email_smtp_user VARCHAR(200),
  email_smtp_pass VARCHAR(500) COMMENT '加密存储',
  sms_sign VARCHAR(50) COMMENT '短信签名',
  sms_provider ENUM('aliyun','tencent','mock') DEFAULT 'mock',
  sms_access_key VARCHAR(200),
  sms_secret_key VARCHAR(500),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_org_id (org_id),
  INDEX idx_custom_domain (custom_domain)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='机构白标配置';

-- ============================================================
-- 4. 数据导出任务表
-- ============================================================
CREATE TABLE IF NOT EXISTS export_tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_no VARCHAR(64) NOT NULL UNIQUE COMMENT '任务编号',
  org_id INT COMMENT '机构ID（NULL表示管理员导出）',
  user_id INT NOT NULL COMMENT '发起用户ID',
  type ENUM('projects','reports','cases','billing','full') NOT NULL COMMENT '导出类型',
  format ENUM('excel','pdf','csv') NOT NULL DEFAULT 'excel' COMMENT '导出格式',
  filters JSON COMMENT '筛选条件',
  status ENUM('pending','processing','done','failed') NOT NULL DEFAULT 'pending',
  total_rows INT DEFAULT 0 COMMENT '总行数',
  processed_rows INT DEFAULT 0 COMMENT '已处理行数',
  file_url VARCHAR(500) COMMENT '导出文件下载URL',
  file_size INT COMMENT '文件大小（字节）',
  error_msg VARCHAR(500),
  expires_at TIMESTAMP NULL COMMENT '文件过期时间（24小时后删除）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_org_id (org_id),
  INDEX idx_status (status),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据导出任务';

-- ============================================================
-- 5. 通知配置表（用户个人通知偏好）
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  inapp_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  events JSON COMMENT '各事件的通知开关，如 {"report.submitted": {"email": true, "sms": false}}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户通知偏好';
