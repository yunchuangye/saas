# 通用网页采集软件

基于 **Scrapling + Playwright + Flask** 的可视化网页数据采集工具，支持浏览网页时配置字段提取规则，并将数据存入 MySQL 数据库。

## 快速启动

```bash
# 方式一：直接运行
python3 app.py

# 方式二：使用启动脚本
bash start.sh
```

启动后访问：**http://localhost:9000**

## 功能介绍

### 1. 采集目标配置
- 填写目标网页 URL（支持多个）
- 选择采集模式：
  - **单页模式**：每个 URL 提取一条数据（适合详情页）
  - **列表模式**：每页提取多条数据，支持自动翻页（适合列表页）
- 配置等待元素选择器（等待动态内容加载完成后再提取）

### 2. 选择器测试
在配置字段前，可以先测试 CSS 选择器是否正确：
- 填写目标 URL 和 CSS 选择器
- 点击"测试"查看提取结果
- 支持提取文本、href、src 等属性

### 3. 字段提取配置
配置每个字段的提取规则：

| 配置项 | 说明 | 示例 |
|--------|------|------|
| 字段标签 | 字段显示名称 | 楼盘名称 |
| CSS 选择器 | 元素定位 | `.estate-name` |
| 提取属性 | text/href/src/自定义 | text |
| 正则提取 | 从文本中提取特定内容 | `(\d+)` |
| 映射数据库字段 | 对应数据库表的字段名 | `name` |

**内置字段预设**（一键填入）：
- 🏘 楼盘字段预设 → 对应 `estates` 表
- 🏢 楼栋字段预设 → 对应 `buildings` 表  
- 🏠 房屋字段预设 → 对应 `units` 表

### 4. 数据库设置
- 配置 MySQL 连接信息
- 选择目标写入表（estates / buildings / units）
- 点击字段标签可快速填入字段配置

### 5. 运行采集
- 点击"开始采集"启动任务
- 实时日志显示采集进度
- 支持随时停止
- 采集完成后可下载 JSON 或 CSV 文件

## 数据库表结构

### estates（楼盘表）
| 字段 | 类型 | 说明 |
|------|------|------|
| name | varchar(200) | 楼盘名称（必填）|
| city_id | int | 城市ID（必填）|
| district_id | int | 区域ID |
| address | varchar(500) | 详细地址 |
| developer | varchar(200) | 开发商 |
| build_year | int | 建造年份 |
| property_type | varchar(100) | 物业类型 |
| total_units | int | 总套数 |

### buildings（楼栋表）
| 字段 | 类型 | 说明 |
|------|------|------|
| estate_id | int | 所属楼盘ID（必填）|
| name | varchar(100) | 楼栋名称（必填）|
| floors | int | 总楼层 |
| build_type | varchar(50) | 建筑类型 |
| build_structure | varchar(50) | 建筑结构 |
| avg_price | decimal(10,2) | 均价 |
| completion_date | varchar(50) | 竣工日期 |

### units（房屋单元表）
| 字段 | 类型 | 说明 |
|------|------|------|
| building_id | int | 所属楼栋ID（必填）|
| estate_id | int | 所属楼盘ID（必填）|
| unit_number | varchar(50) | 房号（必填）|
| floor | int | 楼层 |
| build_area | decimal(10,2) | 建筑面积 |
| rooms | int | 室数 |
| unit_price | decimal(12,2) | 单价 |
| total_price | decimal(14,2) | 总价 |

## 使用示例

### 采集链家二手房列表

1. **采集目标**：
   - URL：`https://bj.lianjia.com/ershoufang/`
   - 模式：列表模式
   - 列表项选择器：`.sellListContent li`
   - 下一页选择器：`.house-lst-page-box .aNxt`
   - 最大页数：5

2. **字段配置**：
   ```
   楼盘名称  .positionInfo a:first-child  text  name
   地址      .positionInfo a:last-child   text  address
   总价      .totalPrice span             text  total_price  (\d+)
   单价      .unitPrice span              text  unit_price   (\d+)
   面积      .houseInfo                   text  build_area   (\d+\.?\d*)㎡
   ```

3. **数据库**：选择 `units` 表

4. 点击"开始采集"

## 注意事项

- 请遵守目标网站的 robots.txt 和使用条款
- 建议设置合理的采集延迟（1-3秒），避免对目标网站造成压力
- 部分网站有反爬机制，可能需要配置代理
- 数据库字段类型需要与提取内容匹配（如数字字段不能写入文字）
