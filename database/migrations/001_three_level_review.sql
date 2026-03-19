-- 三级审核字段迁移
-- 为 reports 表添加三级审核相关字段

ALTER TABLE reports ADD COLUMN internal_review_status ENUM('pending','approved','rejected') DEFAULT NULL COMMENT '内部复核状态';
ALTER TABLE reports ADD COLUMN internal_reviewer_id INT DEFAULT NULL COMMENT '内部复核人ID';
ALTER TABLE reports ADD COLUMN internal_review_comment TEXT DEFAULT NULL COMMENT '内部复核意见';
ALTER TABLE reports ADD COLUMN internal_reviewed_at TIMESTAMP DEFAULT NULL COMMENT '内部复核时间';
ALTER TABLE reports ADD COLUMN peer_review_status ENUM('pending','approved','rejected') DEFAULT NULL COMMENT '同行评审状态';
ALTER TABLE reports ADD COLUMN peer_reviewer_id INT DEFAULT NULL COMMENT '同行评审人ID';
ALTER TABLE reports ADD COLUMN peer_review_comment TEXT DEFAULT NULL COMMENT '同行评审意见';
ALTER TABLE reports ADD COLUMN peer_reviewed_at TIMESTAMP DEFAULT NULL COMMENT '同行评审时间';
ALTER TABLE reports ADD COLUMN chief_review_status ENUM('pending','approved','rejected') DEFAULT NULL COMMENT '主任审核状态';
ALTER TABLE reports ADD COLUMN chief_reviewer_id INT DEFAULT NULL COMMENT '主任审核人ID';
ALTER TABLE reports ADD COLUMN chief_review_comment TEXT DEFAULT NULL COMMENT '主任审核意见';
ALTER TABLE reports ADD COLUMN chief_reviewed_at TIMESTAMP DEFAULT NULL COMMENT '主任审核时间';
ALTER TABLE reports ADD COLUMN review_level TINYINT DEFAULT 0 COMMENT '当前审核级别 0=未提交 1=内部复核 2=同行评审 3=主任审核 4=完成';

-- 工作底稿表
CREATE TABLE IF NOT EXISTS work_sheets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_id INT NOT NULL COMMENT '关联报告ID',
  project_id INT NOT NULL COMMENT '关联项目ID',
  author_id INT NOT NULL COMMENT '创建人ID',
  title VARCHAR(300) NOT NULL COMMENT '工作底稿标题',
  category VARCHAR(100) DEFAULT NULL COMMENT '分类：field_survey/comparable_analysis/valuation_calc/compliance_check',
  content LONGTEXT DEFAULT NULL COMMENT '底稿内容（JSON或富文本）',
  attachments TEXT DEFAULT NULL COMMENT '附件列表JSON',
  status ENUM('draft','submitted','approved') DEFAULT 'draft' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_report_id (report_id),
  INDEX idx_project_id (project_id),
  INDEX idx_author_id (author_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工作底稿表';

-- 偏离度预警表（建议书 AVM 增强）
CREATE TABLE IF NOT EXISTS valuation_alerts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL COMMENT '关联项目ID',
  report_id INT DEFAULT NULL COMMENT '关联报告ID',
  auto_valuation_id INT DEFAULT NULL COMMENT '关联自动估价ID',
  alert_type VARCHAR(50) NOT NULL COMMENT '预警类型：deviation/outlier/trend',
  severity ENUM('low','medium','high','critical') DEFAULT 'medium' COMMENT '严重程度',
  avm_value DECIMAL(15,2) DEFAULT NULL COMMENT 'AVM估价值',
  manual_value DECIMAL(15,2) DEFAULT NULL COMMENT '人工估价值',
  deviation_pct DECIMAL(8,4) DEFAULT NULL COMMENT '偏离百分比',
  threshold_pct DECIMAL(8,4) DEFAULT NULL COMMENT '预警阈值',
  message TEXT DEFAULT NULL COMMENT '预警信息',
  is_resolved TINYINT(1) DEFAULT 0 COMMENT '是否已处理',
  resolved_by INT DEFAULT NULL COMMENT '处理人ID',
  resolved_at TIMESTAMP DEFAULT NULL COMMENT '处理时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_project_id (project_id),
  INDEX idx_severity (severity),
  INDEX idx_is_resolved (is_resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='估价偏离度预警表';

SELECT 'Migration completed' AS result;
