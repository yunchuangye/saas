-- ============================================================
-- 电子签章模块数据库迁移
-- 建议书第二阶段：合法合规的电子签章
-- ============================================================

-- 1. 签章表（存储机构公章和个人执业章）
CREATE TABLE IF NOT EXISTS seals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  org_id INT NOT NULL COMMENT '所属机构ID',
  user_id INT DEFAULT NULL COMMENT '所属用户ID（个人章时填写，机构章为NULL）',
  name VARCHAR(200) NOT NULL COMMENT '签章名称，如"XX评估机构公章"',
  type ENUM('org_seal','personal_seal') NOT NULL COMMENT '签章类型：机构公章/个人执业章',
  image_url VARCHAR(1000) NOT NULL COMMENT '签章图片URL（PNG透明背景）',
  image_width INT DEFAULT 200 COMMENT '签章图片宽度（像素）',
  image_height INT DEFAULT 200 COMMENT '签章图片高度（像素）',
  -- 审核状态
  status ENUM('pending','approved','rejected','disabled') NOT NULL DEFAULT 'pending' COMMENT '审核状态',
  reviewed_by INT DEFAULT NULL COMMENT '审核人ID',
  reviewed_at TIMESTAMP DEFAULT NULL COMMENT '审核时间',
  review_comment TEXT DEFAULT NULL COMMENT '审核意见',
  -- 证书信息（可选，用于增强法律效力）
  certificate_no VARCHAR(100) DEFAULT NULL COMMENT '执业证书编号',
  valid_from DATE DEFAULT NULL COMMENT '有效期开始',
  valid_until DATE DEFAULT NULL COMMENT '有效期结束',
  -- 使用统计
  use_count INT DEFAULT 0 COMMENT '使用次数',
  last_used_at TIMESTAMP DEFAULT NULL COMMENT '最后使用时间',
  is_default TINYINT(1) DEFAULT 0 COMMENT '是否为默认签章',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_org_id (org_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='电子签章表';

-- 2. 签章申请表（报告签章流程）
CREATE TABLE IF NOT EXISTS seal_applications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_id INT NOT NULL COMMENT '报告ID',
  applicant_id INT NOT NULL COMMENT '申请人ID（评估师）',
  org_id INT NOT NULL COMMENT '机构ID',
  -- 签章配置
  org_seal_id INT DEFAULT NULL COMMENT '机构公章ID',
  personal_seal_id INT DEFAULT NULL COMMENT '个人执业章ID',
  seal_position ENUM('bottom_right','bottom_center','bottom_left','custom') DEFAULT 'bottom_right' COMMENT '签章位置',
  seal_page ENUM('last','all','first_and_last') DEFAULT 'last' COMMENT '签章页面',
  -- 申请状态
  status ENUM('pending','approved','rejected','signed','failed') NOT NULL DEFAULT 'pending' COMMENT '申请状态',
  apply_reason TEXT DEFAULT NULL COMMENT '申请说明',
  -- 审核信息
  reviewed_by INT DEFAULT NULL COMMENT '审核人ID',
  reviewed_at TIMESTAMP DEFAULT NULL COMMENT '审核时间',
  review_comment TEXT DEFAULT NULL COMMENT '审核意见',
  -- 签章结果
  signed_pdf_url VARCHAR(1000) DEFAULT NULL COMMENT '已签章PDF的URL',
  signed_at TIMESTAMP DEFAULT NULL COMMENT '签章完成时间',
  sign_hash VARCHAR(64) DEFAULT NULL COMMENT '签章后PDF的SHA256哈希（防篡改）',
  verify_code VARCHAR(32) DEFAULT NULL COMMENT '验证码（6位，用于扫码验证）',
  -- 时间戳服务
  timestamp_token TEXT DEFAULT NULL COMMENT '可信时间戳令牌（RFC3161）',
  timestamp_at TIMESTAMP DEFAULT NULL COMMENT '时间戳时间',
  -- 错误信息
  error_message TEXT DEFAULT NULL COMMENT '签章失败原因',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_report_id (report_id),
  INDEX idx_applicant_id (applicant_id),
  INDEX idx_status (status),
  INDEX idx_verify_code (verify_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='签章申请表';

-- 3. 签章操作日志表（审计追踪）
CREATE TABLE IF NOT EXISTS seal_audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  seal_application_id INT NOT NULL COMMENT '签章申请ID',
  report_id INT NOT NULL COMMENT '报告ID',
  operator_id INT NOT NULL COMMENT '操作人ID',
  action ENUM(
    'apply',          -- 提交申请
    'approve',        -- 审核通过
    'reject',         -- 审核拒绝
    'sign_start',     -- 开始签章
    'sign_success',   -- 签章成功
    'sign_failed',    -- 签章失败
    'verify',         -- 验证签章
    'download',       -- 下载签章PDF
    'revoke'          -- 撤销签章
  ) NOT NULL COMMENT '操作类型',
  description TEXT DEFAULT NULL COMMENT '操作描述',
  ip_address VARCHAR(50) DEFAULT NULL COMMENT '操作IP',
  user_agent VARCHAR(500) DEFAULT NULL COMMENT '浏览器UA',
  metadata JSON DEFAULT NULL COMMENT '附加元数据',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_application_id (seal_application_id),
  INDEX idx_report_id (report_id),
  INDEX idx_operator_id (operator_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='签章审计日志表';

-- 4. 为 reports 表添加签章相关字段（先检查再添加）
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='reports' AND COLUMN_NAME='seal_status');
SET @sql = IF(@col_exists=0, "ALTER TABLE reports ADD COLUMN seal_status ENUM('none','pending','approved','signed') DEFAULT 'none' COMMENT '签章状态'", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='reports' AND COLUMN_NAME='seal_application_id');
SET @sql = IF(@col_exists=0, 'ALTER TABLE reports ADD COLUMN seal_application_id INT DEFAULT NULL COMMENT \'关联签章申请ID\'', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='reports' AND COLUMN_NAME='signed_pdf_url');
SET @sql = IF(@col_exists=0, 'ALTER TABLE reports ADD COLUMN signed_pdf_url VARCHAR(1000) DEFAULT NULL COMMENT \'已签章PDF的URL\'', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='reports' AND COLUMN_NAME='sign_verify_code');
SET @sql = IF(@col_exists=0, 'ALTER TABLE reports ADD COLUMN sign_verify_code VARCHAR(32) DEFAULT NULL COMMENT \'签章验证码\'', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='reports' AND COLUMN_NAME='signed_at');
SET @sql = IF(@col_exists=0, 'ALTER TABLE reports ADD COLUMN signed_at TIMESTAMP DEFAULT NULL COMMENT \'签章完成时间\'', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5. 为 users 表添加执业证书字段
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='certificate_no');
SET @sql = IF(@col_exists=0, 'ALTER TABLE users ADD COLUMN certificate_no VARCHAR(100) DEFAULT NULL COMMENT \'执业证书编号\'', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='certificate_name');
SET @sql = IF(@col_exists=0, 'ALTER TABLE users ADD COLUMN certificate_name VARCHAR(200) DEFAULT NULL COMMENT \'执业证书名称\'', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='certificate_valid_until');
SET @sql = IF(@col_exists=0, 'ALTER TABLE users ADD COLUMN certificate_valid_until DATE DEFAULT NULL COMMENT \'证书有效期\'', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'Electronic seal schema created successfully' AS result;
