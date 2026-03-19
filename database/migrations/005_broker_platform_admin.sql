-- ============================================================
-- 迁移 005：经纪机构角色 + 二手房交易 + 营销接口 + 平台超管
-- ============================================================

-- 1. 修改 users 表的 role 枚举，新增 broker 和 platform_admin
ALTER TABLE users MODIFY COLUMN role ENUM(
  'appraiser', 'bank', 'investor', 'customer', 'admin', 'broker', 'platform_admin'
) NOT NULL DEFAULT 'customer';

-- 2. 房源表（经纪机构发布的二手房源）
CREATE TABLE IF NOT EXISTS listings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id INT UNSIGNED NOT NULL COMMENT '所属经纪机构',
  broker_id INT UNSIGNED NOT NULL COMMENT '负责经纪人',
  listing_no VARCHAR(50) NOT NULL UNIQUE COMMENT '房源编号',
  title VARCHAR(200) NOT NULL COMMENT '房源标题',
  -- 房产基本信息
  estate_name VARCHAR(200) COMMENT '楼盘名称',
  building_name VARCHAR(100) COMMENT '楼栋',
  unit_no VARCHAR(50) COMMENT '单元/房号',
  floor INT COMMENT '楼层',
  total_floors INT COMMENT '总楼层',
  area DECIMAL(10,2) COMMENT '建筑面积(㎡)',
  rooms VARCHAR(50) COMMENT '户型(如3室2厅)',
  orientation VARCHAR(50) COMMENT '朝向',
  decoration VARCHAR(50) COMMENT '装修情况',
  -- 地址
  city VARCHAR(100) COMMENT '城市',
  district VARCHAR(100) COMMENT '区域',
  address VARCHAR(500) COMMENT '详细地址',
  lat DECIMAL(10,7) COMMENT '纬度',
  lng DECIMAL(10,7) COMMENT '经度',
  -- 价格
  listing_price DECIMAL(15,2) COMMENT '挂牌价(元)',
  unit_price DECIMAL(10,2) COMMENT '单价(元/㎡)',
  min_price DECIMAL(15,2) COMMENT '最低可接受价',
  -- 产权信息
  ownership_type VARCHAR(50) COMMENT '产权类型(商品房/经适房等)',
  ownership_years INT COMMENT '产权年限',
  deed_date DATE COMMENT '产证日期',
  is_only_house TINYINT(1) DEFAULT 0 COMMENT '是否唯一住房',
  has_mortgage TINYINT(1) DEFAULT 0 COMMENT '是否有抵押',
  mortgage_amount DECIMAL(15,2) COMMENT '抵押金额',
  -- 状态
  status ENUM('draft','active','reserved','sold','offline') DEFAULT 'draft' COMMENT '房源状态',
  is_verified TINYINT(1) DEFAULT 0 COMMENT '是否已核验产权',
  -- 估价关联
  valuation_id INT UNSIGNED COMMENT '关联估价记录ID',
  valuation_price DECIMAL(15,2) COMMENT '估价价格',
  valuation_date DATE COMMENT '估价日期',
  -- 媒体
  cover_image VARCHAR(500) COMMENT '封面图片URL',
  images JSON COMMENT '图片列表',
  vr_url VARCHAR(500) COMMENT 'VR看房链接',
  -- 统计
  view_count INT DEFAULT 0 COMMENT '浏览次数',
  favorite_count INT DEFAULT 0 COMMENT '收藏次数',
  -- 时间
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_org_id (org_id),
  INDEX idx_broker_id (broker_id),
  INDEX idx_status (status),
  INDEX idx_city_district (city, district),
  INDEX idx_listing_no (listing_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='房源表';

-- 3. 客源表（经纪机构的买方/租方客户）
CREATE TABLE IF NOT EXISTS broker_clients (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id INT UNSIGNED NOT NULL COMMENT '所属经纪机构',
  broker_id INT UNSIGNED NOT NULL COMMENT '负责经纪人',
  name VARCHAR(100) NOT NULL COMMENT '客户姓名',
  phone VARCHAR(20) COMMENT '手机号',
  wechat VARCHAR(100) COMMENT '微信号',
  -- 购房需求
  client_type ENUM('buyer','renter','seller') DEFAULT 'buyer' COMMENT '客户类型',
  budget_min DECIMAL(15,2) COMMENT '预算下限',
  budget_max DECIMAL(15,2) COMMENT '预算上限',
  area_min DECIMAL(10,2) COMMENT '面积下限',
  area_max DECIMAL(10,2) COMMENT '面积上限',
  preferred_rooms VARCHAR(200) COMMENT '偏好户型',
  preferred_districts JSON COMMENT '偏好区域',
  -- 跟进状态
  intention_level ENUM('high','medium','low','invalid') DEFAULT 'medium' COMMENT '意向等级',
  status ENUM('new','following','negotiating','signed','completed','lost') DEFAULT 'new',
  source VARCHAR(100) COMMENT '客户来源(朋友圈/链接/转介绍等)',
  -- AI意向评分
  ai_score INT DEFAULT 0 COMMENT 'AI意向评分(0-100)',
  last_contact_at TIMESTAMP COMMENT '最后联系时间',
  next_follow_at TIMESTAMP COMMENT '下次跟进时间',
  notes TEXT COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_org_id (org_id),
  INDEX idx_broker_id (broker_id),
  INDEX idx_status (status),
  INDEX idx_intention (intention_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客源表';

-- 4. 带看记录表
CREATE TABLE IF NOT EXISTS viewings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id INT UNSIGNED NOT NULL,
  broker_id INT UNSIGNED NOT NULL COMMENT '带看经纪人',
  listing_id INT UNSIGNED NOT NULL COMMENT '带看房源',
  client_id INT UNSIGNED NOT NULL COMMENT '带看客户',
  scheduled_at TIMESTAMP NOT NULL COMMENT '预约时间',
  actual_at TIMESTAMP COMMENT '实际带看时间',
  status ENUM('scheduled','completed','cancelled','no_show') DEFAULT 'scheduled',
  feedback TEXT COMMENT '带看反馈',
  client_rating INT COMMENT '客户评价(1-5)',
  follow_up TEXT COMMENT '后续跟进计划',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_listing_id (listing_id),
  INDEX idx_client_id (client_id),
  INDEX idx_broker_id (broker_id),
  INDEX idx_scheduled_at (scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='带看记录表';

-- 5. 二手房交易表
CREATE TABLE IF NOT EXISTS transactions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id INT UNSIGNED NOT NULL,
  transaction_no VARCHAR(50) NOT NULL UNIQUE COMMENT '交易编号',
  listing_id INT UNSIGNED NOT NULL COMMENT '交易房源',
  seller_client_id INT UNSIGNED COMMENT '卖方客户ID',
  buyer_client_id INT UNSIGNED COMMENT '买方客户ID',
  seller_broker_id INT UNSIGNED COMMENT '卖方经纪人',
  buyer_broker_id INT UNSIGNED COMMENT '买方经纪人',
  -- 交易信息
  transaction_type ENUM('sale','rent') DEFAULT 'sale' COMMENT '交易类型',
  agreed_price DECIMAL(15,2) COMMENT '成交价格',
  deposit_amount DECIMAL(15,2) COMMENT '定金金额',
  down_payment DECIMAL(15,2) COMMENT '首付金额',
  loan_amount DECIMAL(15,2) COMMENT '贷款金额',
  -- 佣金
  total_commission DECIMAL(15,2) COMMENT '总佣金',
  seller_commission DECIMAL(15,2) COMMENT '卖方佣金',
  buyer_commission DECIMAL(15,2) COMMENT '买方佣金',
  commission_rate DECIMAL(5,4) COMMENT '佣金比例',
  -- 关键节点
  contract_signed_at TIMESTAMP COMMENT '合同签署时间',
  deposit_paid_at TIMESTAMP COMMENT '定金支付时间',
  loan_approved_at TIMESTAMP COMMENT '贷款批准时间',
  transfer_at TIMESTAMP COMMENT '过户时间',
  handover_at TIMESTAMP COMMENT '交房时间',
  -- 状态
  status ENUM('negotiating','deposit_paid','contract_signed','loan_processing','transferring','completed','cancelled') DEFAULT 'negotiating',
  -- 估价关联
  valuation_report_id INT UNSIGNED COMMENT '关联估价报告ID',
  -- 文件
  contract_file_url VARCHAR(500) COMMENT '合同文件URL',
  deed_file_url VARCHAR(500) COMMENT '产证文件URL',
  notes TEXT COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_org_id (org_id),
  INDEX idx_listing_id (listing_id),
  INDEX idx_status (status),
  INDEX idx_transaction_no (transaction_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='二手房交易表';

-- 6. 佣金记录表
CREATE TABLE IF NOT EXISTS commissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id INT UNSIGNED NOT NULL,
  transaction_id INT UNSIGNED NOT NULL COMMENT '关联交易',
  broker_id INT UNSIGNED NOT NULL COMMENT '经纪人',
  amount DECIMAL(15,2) NOT NULL COMMENT '佣金金额',
  rate DECIMAL(5,4) COMMENT '佣金比例',
  commission_type ENUM('seller','buyer','referral') COMMENT '佣金类型',
  status ENUM('pending','approved','paid') DEFAULT 'pending',
  paid_at TIMESTAMP COMMENT '支付时间',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_transaction_id (transaction_id),
  INDEX idx_broker_id (broker_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='佣金记录表';

-- 7. 营销链接表（经纪机构专属营销接口）
CREATE TABLE IF NOT EXISTS marketing_links (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id INT UNSIGNED NOT NULL,
  broker_id INT UNSIGNED NOT NULL COMMENT '创建经纪人',
  link_code VARCHAR(32) NOT NULL UNIQUE COMMENT '链接唯一码',
  link_type ENUM('listing','report','campaign','referral') DEFAULT 'listing' COMMENT '链接类型',
  listing_id INT UNSIGNED COMMENT '关联房源',
  report_id INT UNSIGNED COMMENT '关联报告',
  -- 配置
  title VARCHAR(200) COMMENT '分享标题',
  description TEXT COMMENT '分享描述',
  cover_image VARCHAR(500) COMMENT '分享封面',
  has_watermark TINYINT(1) DEFAULT 1 COMMENT '是否加水印',
  require_phone TINYINT(1) DEFAULT 0 COMMENT '是否要求留电话',
  -- 统计
  view_count INT DEFAULT 0 COMMENT '浏览次数',
  unique_view_count INT DEFAULT 0 COMMENT '独立访客数',
  lead_count INT DEFAULT 0 COMMENT '获取线索数',
  -- 有效期
  expires_at TIMESTAMP COMMENT '过期时间',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_org_id (org_id),
  INDEX idx_broker_id (broker_id),
  INDEX idx_link_code (link_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='营销链接表';

-- 8. 营销链接访问记录表
CREATE TABLE IF NOT EXISTS marketing_link_visits (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  link_id INT UNSIGNED NOT NULL,
  visitor_ip VARCHAR(50) COMMENT '访客IP',
  visitor_phone VARCHAR(20) COMMENT '访客手机号（留资）',
  visitor_name VARCHAR(100) COMMENT '访客姓名',
  user_agent VARCHAR(500) COMMENT '浏览器信息',
  referrer VARCHAR(500) COMMENT '来源页面',
  duration_seconds INT DEFAULT 0 COMMENT '停留时长(秒)',
  is_lead TINYINT(1) DEFAULT 0 COMMENT '是否转化为线索',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_link_id (link_id),
  INDEX idx_visitor_phone (visitor_phone),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='营销链接访问记录';

-- 9. 平台超管表（独立于SaaS租户）
CREATE TABLE IF NOT EXISTS platform_admins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE COMMENT '超管用户名',
  email VARCHAR(200) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) COMMENT '姓名',
  avatar VARCHAR(500) COMMENT '头像',
  permissions JSON COMMENT '权限列表',
  last_login_at TIMESTAMP COMMENT '最后登录时间',
  last_login_ip VARCHAR(50) COMMENT '最后登录IP',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='平台超管表（独立于SaaS租户）';

-- 10. 平台运营日志表
CREATE TABLE IF NOT EXISTS platform_operation_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id INT UNSIGNED NOT NULL COMMENT '操作超管ID',
  action VARCHAR(200) NOT NULL COMMENT '操作类型',
  target_type VARCHAR(100) COMMENT '操作对象类型(tenant/user/plan等)',
  target_id VARCHAR(100) COMMENT '操作对象ID',
  details JSON COMMENT '操作详情',
  ip VARCHAR(50) COMMENT '操作IP',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_id (admin_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='平台运营操作日志';

-- 11. 插入默认平台超管账号（密码：PlatformAdmin@2026，需上线后修改）
INSERT IGNORE INTO platform_admins (username, email, password_hash, name, permissions) VALUES (
  'platform_root',
  'platform@saas.com',
  '$2b$10$placeholder_hash_change_on_first_login',
  '平台超级管理员',
  '["all"]'
);

SELECT 'Migration 005 completed successfully' AS status;
SELECT COUNT(*) AS new_tables FROM information_schema.tables 
WHERE table_schema = 'gujia' 
AND table_name IN ('listings','broker_clients','viewings','transactions','commissions','marketing_links','marketing_link_visits','platform_admins','platform_operation_logs');
