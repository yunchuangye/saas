-- ================================================================
-- units 表去重脚本
-- 执行前数据：5,522,121 条
-- 目标：清理孤立记录和重复记录，保留有效唯一数据
-- 策略：
--   1. 删除 units 中 estate_id 不存在于 estates 表的孤立记录（3,185,754 条）
--   2. 删除 buildings 中 estate_id 不存在于 estates 表的孤立记录（118,104 条）
--   3. 删除有效 units 中 building_id+unit_number 重复的记录，保留 MIN(id)（162,093 条）
-- ================================================================

SET SESSION group_concat_max_len = 1000000;
SET SESSION wait_timeout = 28800;
SET SESSION interactive_timeout = 28800;
SET SESSION innodb_lock_wait_timeout = 3600;

-- 关闭外键检查加速删除
SET FOREIGN_KEY_CHECKS = 0;

-- ── 步骤1：记录清理前的数量 ──────────────────────────────────────
SELECT '=== 清理前统计 ===' AS step;
SELECT COUNT(*) AS units_before FROM units;
SELECT COUNT(*) AS buildings_before FROM buildings;

-- ── 步骤2：删除孤立 units（分批删除，避免锁表超时）──────────────
SELECT '=== 步骤2: 删除孤立 units ===' AS step;

-- 创建临时表存储需要保留的有效 unit id
CREATE TEMPORARY TABLE IF NOT EXISTS valid_unit_ids AS
SELECT u.id
FROM units u
WHERE EXISTS (SELECT 1 FROM estates e WHERE e.id = u.estate_id);

SELECT COUNT(*) AS valid_units_count FROM valid_unit_ids;

-- 删除不在有效列表中的 units
DELETE FROM units
WHERE id NOT IN (SELECT id FROM valid_unit_ids);

SELECT ROW_COUNT() AS orphan_units_deleted;
DROP TEMPORARY TABLE IF EXISTS valid_unit_ids;

-- ── 步骤3：删除孤立 buildings ────────────────────────────────────
SELECT '=== 步骤3: 删除孤立 buildings ===' AS step;

DELETE FROM buildings
WHERE NOT EXISTS (SELECT 1 FROM estates e WHERE e.id = buildings.estate_id);

SELECT ROW_COUNT() AS orphan_buildings_deleted;

-- ── 步骤4：删除有效 units 中 building_id+unit_number 重复的记录 ──
SELECT '=== 步骤4: 删除有效 units 内部重复 ===' AS step;

-- 创建临时表：每组 building_id+unit_number 保留 MIN(id)
CREATE TEMPORARY TABLE IF NOT EXISTS keep_unit_ids AS
SELECT MIN(id) AS keep_id
FROM units
GROUP BY building_id, unit_number;

SELECT COUNT(*) AS unique_units_to_keep FROM keep_unit_ids;

-- 删除不在保留列表中的重复记录
DELETE FROM units
WHERE id NOT IN (SELECT keep_id FROM keep_unit_ids);

SELECT ROW_COUNT() AS dup_units_deleted;
DROP TEMPORARY TABLE IF EXISTS keep_unit_ids;

-- ── 步骤5：删除 buildings 中同楼盘同名的重复楼栋（保留 MIN id）──
SELECT '=== 步骤5: 删除重复楼栋 ===' AS step;

CREATE TEMPORARY TABLE IF NOT EXISTS keep_building_ids AS
SELECT MIN(id) AS keep_id
FROM buildings
GROUP BY estate_id, name;

DELETE FROM buildings
WHERE id NOT IN (SELECT keep_id FROM keep_building_ids);

SELECT ROW_COUNT() AS dup_buildings_deleted;
DROP TEMPORARY TABLE IF EXISTS keep_building_ids;

-- ── 步骤6：恢复外键检查 ──────────────────────────────────────────
SET FOREIGN_KEY_CHECKS = 1;

-- ── 步骤7：记录清理后的数量 ──────────────────────────────────────
SELECT '=== 清理后统计 ===' AS step;
SELECT COUNT(*) AS units_after FROM units;
SELECT COUNT(*) AS buildings_after FROM buildings;
SELECT COUNT(*) AS estates_unchanged FROM estates;

-- ── 步骤8：验证去重效果 ──────────────────────────────────────────
SELECT '=== 验证去重效果 ===' AS step;

-- 验证 units 中不再有孤立记录
SELECT COUNT(*) AS remaining_orphan_units
FROM units u
WHERE NOT EXISTS (SELECT 1 FROM estates e WHERE e.id = u.estate_id);

-- 验证 units 中不再有 building_id+unit_number 重复
SELECT COUNT(*) AS remaining_dup_units
FROM (
  SELECT building_id, unit_number, COUNT(*) AS cnt
  FROM units
  GROUP BY building_id, unit_number
  HAVING COUNT(*) > 1
) t;

-- 验证 buildings 中不再有孤立记录
SELECT COUNT(*) AS remaining_orphan_buildings
FROM buildings b
WHERE NOT EXISTS (SELECT 1 FROM estates e WHERE e.id = b.estate_id);

SELECT '=== 去重完成 ===' AS step;
