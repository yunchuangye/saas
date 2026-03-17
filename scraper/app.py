"""
通用网页采集软件 v2.0 - 基于 Scrapling + Playwright
支持：可视化配置字段 → 采集网页 → 存入 MySQL 数据库
新增：cases 案例表专项采集、数据清洗、去重入库
"""
import asyncio
import json
import os
import re
import threading
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import pymysql
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS

# ─────────────────────────────────────────────
# Flask 应用
# ─────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

BASE_DIR = Path(__file__).parent
CONFIG_DIR = BASE_DIR / "config"
DATA_DIR = BASE_DIR / "data"
CONFIG_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)

# 全局任务状态
TASKS: dict[str, dict] = {}


# ─────────────────────────────────────────────
# 数据库工具
# ─────────────────────────────────────────────
def get_db_connection(db_config: dict):
    return pymysql.connect(
        host=db_config.get("host", "localhost"),
        port=int(db_config.get("port", 3306)),
        user=db_config.get("user", "root"),
        password=db_config.get("password", ""),
        database=db_config.get("database", ""),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


def get_table_columns(db_config: dict, table: str) -> list[dict]:
    """获取指定表的字段列表"""
    try:
        conn = get_db_connection(db_config)
        with conn.cursor() as cur:
            cur.execute(f"DESCRIBE `{table}`")
            cols = cur.fetchall()
        conn.close()
        return [{"name": c["Field"], "type": c["Type"], "null": c["Null"], "key": c["Key"]} for c in cols]
    except Exception as e:
        return []


def insert_row(conn, table: str, row: dict):
    """向指定表插入一行数据"""
    if not row:
        return
    cols = ", ".join(f"`{k}`" for k in row.keys())
    placeholders = ", ".join(["%s"] * len(row))
    sql = f"INSERT INTO `{table}` ({cols}) VALUES ({placeholders})"
    with conn.cursor() as cur:
        cur.execute(sql, list(row.values()))
    conn.commit()


def resolve_estate_id(conn, community: str) -> int | None:
    """
    通过小区名称自动匹配 estates 表，返回 estate_id。
    匹配策略（优先级从高到低）：
    1. 精确匹配：name = community
    2. 包含匹配：name LIKE %community%
    3. 反包含匹配：community LIKE %name%（采集名包含数据库名）
    """
    if not community or not community.strip():
        return None
    community = community.strip()
    try:
        with conn.cursor() as cur:
            # 1. 精确匹配
            cur.execute("SELECT id FROM estates WHERE name=%s AND is_active=1 LIMIT 1", (community,))
            row = cur.fetchone()
            if row:
                return row["id"]
            # 2. 包含匹配（数据库名包含采集名）
            cur.execute("SELECT id, name FROM estates WHERE name LIKE %s AND is_active=1 LIMIT 3",
                        (f"%{community}%",))
            rows = cur.fetchall()
            if rows:
                # 选择名称最短的（最精确）
                best = min(rows, key=lambda r: len(r["name"]))
                return best["id"]
            # 3. 反包含（采集名包含在数据库名中）
            cur.execute("SELECT id, name FROM estates WHERE %s LIKE CONCAT('%%', name, '%%') AND is_active=1 LIMIT 1",
                        (community,))
            row = cur.fetchone()
            if row:
                return row["id"]
    except Exception:
        pass
    return None


def upsert_case(conn, row: dict) -> tuple[bool, str]:
    """
    案例表智能入库：
    - 按 source + source_id 去重（有 source_id 时）
    - 按 community + address + area + deal_date 去重（无 source_id 时）
    - 自动通过 community 匹配 estate_id
    返回 (是否新增, 原因)
    """
    if not row:
        return False, "空数据"

    with conn.cursor() as cur:
        # 去重检查
        if row.get("source_id") and row.get("source"):
            cur.execute(
                "SELECT id FROM cases WHERE source=%s AND source_id=%s LIMIT 1",
                (row["source"], row["source_id"])
            )
            if cur.fetchone():
                return False, f"重复(source_id={row['source_id']})"
        elif row.get("community") and row.get("area") and row.get("deal_date"):
            cur.execute(
                "SELECT id FROM cases WHERE community=%s AND area=%s AND deal_date=%s LIMIT 1",
                (row["community"], row["area"], row["deal_date"])
            )
            if cur.fetchone():
                return False, "重复(community+area+deal_date)"

        # 自动匹配 estate_id（仅当 community 有值且 estate_id 未手动指定时）
        if row.get("community") and not row.get("estate_id"):
            matched_id = resolve_estate_id(conn, row["community"])
            if matched_id:
                row["estate_id"] = matched_id

        # 过滤掉 cases 表不存在的字段
        CASES_FIELDS = {
            "city_id", "estate_id", "building_id", "unit_id", "address", "area",
            "floor", "total_floors", "orientation", "property_type", "transaction_type",
            "price", "unit_price", "transaction_date", "source", "source_id", "source_url",
            "community", "total_price", "rooms_str", "decoration", "build_year",
            "deal_date", "listing_price", "deal_cycle", "is_verified", "is_anomaly", "anomaly_reason"
        }
        clean_row = {k: v for k, v in row.items() if k in CASES_FIELDS and v not in ("", None)}
        if not clean_row:
            return False, "无有效字段"

        cols = ", ".join(f"`{k}`" for k in clean_row.keys())
        placeholders = ", ".join(["%s"] * len(clean_row))
        cur.execute(
            f"INSERT INTO `cases` ({cols}) VALUES ({placeholders})",
            list(clean_row.values())
        )
    conn.commit()
    return True, "新增成功"


def clean_case_row(row: dict, source_name: str = "", source_url: str = "") -> dict:
    """
    对案例数据进行清洗：
    - 数字字段去除单位、逗号
    - 自动填充 source / source_url
    - transaction_type 标准化
    """
    cleaned = dict(row)

    # 数字清洗
    for num_field in ["area", "price", "unit_price", "total_price", "listing_price",
                       "floor", "total_floors", "build_year", "deal_cycle", "city_id",
                       "estate_id", "building_id", "unit_id"]:
        if num_field in cleaned and cleaned[num_field]:
            val = str(cleaned[num_field])
            val = re.sub(r"[,，万元/㎡平米平方米套间室厅卫层楼]", "", val)
            val = val.strip()
            # 万元转元
            if "万" in str(cleaned[num_field]):
                try:
                    cleaned[num_field] = str(float(val) * 10000)
                except Exception:
                    cleaned[num_field] = val
            else:
                cleaned[num_field] = val

    # transaction_type 标准化
    if "transaction_type" in cleaned:
        t = str(cleaned["transaction_type"]).lower()
        if any(k in t for k in ["租", "rent", "出租"]):
            cleaned["transaction_type"] = "rent"
        else:
            cleaned["transaction_type"] = "sale"

    # 自动填充来源
    if source_name and not cleaned.get("source"):
        cleaned["source"] = source_name
    if source_url and not cleaned.get("source_url"):
        cleaned["source_url"] = source_url

    return cleaned


# ─────────────────────────────────────────────
# 采集核心（Scrapling + Playwright）
# ─────────────────────────────────────────────
def run_scrape_task(task_id: str, config: dict):
    """在独立线程中运行采集任务"""
    asyncio.run(_async_scrape(task_id, config))


async def _async_scrape(task_id: str, config: dict):
    from scrapling.fetchers import PlaywrightFetcher

    task = TASKS[task_id]
    task["status"] = "running"
    task["logs"] = []
    task["results"] = []
    task["count"] = 0

    def log(msg: str, level: str = "info"):
        entry = {"time": datetime.now().strftime("%H:%M:%S"), "level": level, "msg": msg}
        task["logs"].append(entry)

    log(f"开始采集任务：{config.get('name', '未命名')}")

    db_config = config.get("db", {})
    table = config.get("target_table", "")
    fields = config.get("fields", [])  # [{label, selector, db_field, regex}]
    urls = config.get("urls", [])
    pagination = config.get("pagination", {})  # {selector, max_pages}
    wait_selector = config.get("wait_selector", "")
    list_selector = config.get("list_selector", "")  # 列表项选择器（批量模式）
    is_case_task = config.get("is_case_task", False) or table == "cases"
    source_name = config.get("source_name", "")  # 来源网站名称
    task["total_urls"] = len(urls)

    if not urls:
        log("未配置采集 URL，任务终止", "error")
        task["status"] = "failed"
        return

    # 连接数据库
    conn = None
    use_db = bool(db_config.get("database") and table)
    if use_db:
        try:
            conn = get_db_connection(db_config)
            log(f"数据库连接成功：{db_config.get('database')}.{table}")
        except Exception as e:
            log(f"数据库连接失败：{e}，将仅保存到本地文件", "warn")
            use_db = False

    fetcher = PlaywrightFetcher(auto_match=False)

    try:
        for start_url in urls:
            if task["status"] == "stopped":
                break

            current_url = start_url
            page_num = 1
            max_pages = int(pagination.get("max_pages", 1))

            while page_num <= max_pages:
                if task["status"] == "stopped":
                    break

                log(f"正在采集第 {page_num} 页：{current_url}")

                try:
                    page = await fetcher.async_fetch(
                        current_url,
                        headless=True,
                        wait_selector=wait_selector or None,
                        timeout=30000,
                    )
                except Exception as e:
                    log(f"页面加载失败：{e}", "error")
                    break

                # 判断是列表模式还是单页模式
                if list_selector:
                    # 列表模式：找到所有列表项，逐项提取
                    items = page.css(list_selector)
                    log(f"找到 {len(items)} 个列表项")
                    for item in items:
                        raw = _extract_fields(item, fields)
                        if raw:
                            task["results"].append(raw)
                            if use_db and conn:
                                try:
                                    if is_case_task:
                                        db_row = _map_to_db(raw, fields)
                                        db_row = clean_case_row(db_row, source_name, raw.get("来源链接", ""))
                                        ok, reason = upsert_case(conn, db_row)
                                        if ok:
                                            task["count"] += 1
                                            eid = db_row.get("estate_id")
                                            estate_hint = f"，匹配楼盘 estate_id={eid}" if eid else "，未匹配楼盘"
                                            log(f"案例入库：{db_row.get('community','')}{estate_hint}")
                                        else:
                                            log(f"跳过：{reason}", "warn")
                                    else:
                                        insert_row(conn, table, _map_to_db(raw, fields))
                                        task["count"] += 1
                                except Exception as e:
                                    log(f"写入数据库失败：{e}", "warn")
                            else:
                                task["count"] += 1
                else:
                    # 单页模式：直接从整页提取
                    raw = _extract_fields(page, fields)
                    if raw:
                        task["results"].append(raw)
                        if use_db and conn:
                            try:
                                if is_case_task:
                                    db_row = _map_to_db(raw, fields)
                                    db_row = clean_case_row(db_row, source_name, raw.get("来源链接", ""))
                                    ok, reason = upsert_case(conn, db_row)
                                    if ok:
                                        task["count"] += 1
                                        eid = db_row.get("estate_id")
                                        estate_hint = f"，匹配楼盘 estate_id={eid}" if eid else "，未匹配楼盘"
                                        log(f"案例入库：{db_row.get('community','')}{estate_hint}")
                                    else:
                                        log(f"跳过：{reason}", "warn")
                                else:
                                    insert_row(conn, table, _map_to_db(raw, fields))
                                    task["count"] += 1
                            except Exception as e:
                                log(f"写入数据库失败：{e}", "warn")
                        else:
                            task["count"] += 1

                log(f"第 {page_num} 页采集完成，累计 {task['count']} 条")

                # 翻页
                if page_num >= max_pages:
                    break
                next_sel = pagination.get("selector", "")
                if not next_sel:
                    break
                next_btn = page.css_first(next_sel)
                if not next_btn:
                    log("未找到下一页按钮，采集结束")
                    break
                next_href = next_btn.attrib.get("href", "")
                if next_href:
                    if next_href.startswith("http"):
                        current_url = next_href
                    else:
                        from urllib.parse import urljoin
                        current_url = urljoin(current_url, next_href)
                else:
                    log("下一页链接为空，采集结束")
                    break
                page_num += 1
                await asyncio.sleep(float(config.get("delay", 1.0)))

    finally:
        if conn:
            conn.close()

    # 保存到本地 JSON 文件
    out_file = DATA_DIR / f"{task_id}.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(task["results"], f, ensure_ascii=False, indent=2)

    log(f"采集完成！共 {task['count']} 条数据，已保存到 {out_file.name}")
    task["status"] = "done"
    task["output_file"] = str(out_file)


def _extract_fields(node, fields: list[dict]) -> dict:
    """从节点中按字段配置提取数据"""
    row = {}
    for f in fields:
        label = f.get("label", "")
        selector = f.get("selector", "")
        attr = f.get("attr", "text")  # text / href / src / 自定义属性
        regex = f.get("regex", "")

        if not selector or not label:
            continue

        try:
            el = node.css_first(selector)
            if el is None:
                row[label] = ""
                continue

            if attr == "text":
                value = el.text(strip=True)
            elif attr == "html":
                value = el.html
            else:
                value = el.attrib.get(attr, "")

            # 正则提取
            if regex and value:
                m = re.search(regex, value)
                value = m.group(1) if m and m.lastindex else (m.group(0) if m else "")

            row[label] = value or ""
        except Exception:
            row[label] = ""

    return row


def _map_to_db(row: dict, fields: list[dict]) -> dict:
    """将提取结果按 db_field 映射，过滤空 db_field"""
    db_row = {}
    for f in fields:
        label = f.get("label", "")
        db_field = f.get("db_field", "")
        if db_field and label in row and row[label] != "":
            db_row[db_field] = row[label]
    return db_row


# ─────────────────────────────────────────────
# 页面预览（获取页面 HTML 用于选择器调试）
# ─────────────────────────────────────────────
async def _fetch_preview(url: str, wait_selector: str = "") -> dict:
    from scrapling.fetchers import PlaywrightFetcher
    fetcher = PlaywrightFetcher(auto_match=False)
    try:
        page = await fetcher.async_fetch(
            url,
            headless=True,
            wait_selector=wait_selector or None,
            timeout=20000,
        )
        # 测试所有选择器返回的文本
        return {"ok": True, "html": page.html[:50000], "url": url}
    except Exception as e:
        return {"ok": False, "error": str(e)}


async def _test_selector(url: str, selector: str, attr: str = "text", wait_selector: str = "") -> dict:
    from scrapling.fetchers import PlaywrightFetcher
    fetcher = PlaywrightFetcher(auto_match=False)
    try:
        page = await fetcher.async_fetch(
            url,
            headless=True,
            wait_selector=wait_selector or None,
            timeout=20000,
        )
        els = page.css(selector)
        results = []
        for el in els[:20]:
            if attr == "text":
                results.append(el.text(strip=True))
            elif attr == "html":
                results.append(el.html[:200])
            else:
                results.append(el.attrib.get(attr, ""))
        return {"ok": True, "count": len(els), "samples": results}
    except Exception as e:
        return {"ok": False, "error": str(e)}


# ─────────────────────────────────────────────
# API 路由
# ─────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/db/test", methods=["POST"])
def api_db_test():
    data = request.json or {}
    try:
        conn = get_db_connection(data)
        conn.close()
        return jsonify({"ok": True, "msg": "连接成功"})
    except Exception as e:
        return jsonify({"ok": False, "msg": str(e)})


@app.route("/api/db/tables", methods=["POST"])
def api_db_tables():
    data = request.json or {}
    try:
        conn = get_db_connection(data)
        with conn.cursor() as cur:
            cur.execute("SHOW TABLES")
            rows = cur.fetchall()
        conn.close()
        tables = [list(r.values())[0] for r in rows]
        return jsonify({"ok": True, "tables": tables})
    except Exception as e:
        return jsonify({"ok": False, "msg": str(e)})


@app.route("/api/db/columns", methods=["POST"])
def api_db_columns():
    data = request.json or {}
    cols = get_table_columns(data, data.get("table", ""))
    return jsonify({"ok": True, "columns": cols})


@app.route("/api/preview", methods=["POST"])
def api_preview():
    data = request.json or {}
    result = asyncio.run(_fetch_preview(data.get("url", ""), data.get("wait_selector", "")))
    return jsonify(result)


@app.route("/api/test-selector", methods=["POST"])
def api_test_selector():
    data = request.json or {}
    result = asyncio.run(_test_selector(
        data.get("url", ""),
        data.get("selector", ""),
        data.get("attr", "text"),
        data.get("wait_selector", ""),
    ))
    return jsonify(result)


@app.route("/api/config/save", methods=["POST"])
def api_config_save():
    data = request.json or {}
    name = data.get("name", f"config_{int(time.time())}")
    safe_name = re.sub(r"[^\w\-]", "_", name)
    path = CONFIG_DIR / f"{safe_name}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return jsonify({"ok": True, "file": str(path)})


@app.route("/api/config/list", methods=["GET"])
def api_config_list():
    configs = []
    for p in CONFIG_DIR.glob("*.json"):
        try:
            with open(p, encoding="utf-8") as f:
                cfg = json.load(f)
            configs.append({"file": p.name, "name": cfg.get("name", p.stem), "updated": p.stat().st_mtime})
        except Exception:
            pass
    configs.sort(key=lambda x: x["updated"], reverse=True)
    return jsonify({"ok": True, "configs": configs})


@app.route("/api/config/load/<filename>", methods=["GET"])
def api_config_load(filename):
    path = CONFIG_DIR / filename
    if not path.exists():
        return jsonify({"ok": False, "msg": "文件不存在"})
    with open(path, encoding="utf-8") as f:
        cfg = json.load(f)
    return jsonify({"ok": True, "config": cfg})


@app.route("/api/task/start", methods=["POST"])
def api_task_start():
    config = request.json or {}
    task_id = str(uuid.uuid4())[:8]
    TASKS[task_id] = {
        "id": task_id,
        "status": "pending",
        "logs": [],
        "results": [],
        "count": 0,
        "started_at": datetime.now().isoformat(),
    }
    t = threading.Thread(target=run_scrape_task, args=(task_id, config), daemon=True)
    t.start()
    return jsonify({"ok": True, "task_id": task_id})


@app.route("/api/task/status/<task_id>", methods=["GET"])
def api_task_status(task_id):
    task = TASKS.get(task_id)
    if not task:
        return jsonify({"ok": False, "msg": "任务不存在"})
    return jsonify({
        "ok": True,
        "status": task["status"],
        "count": task["count"],
        "logs": task["logs"][-50:],  # 最近50条日志
        "results": task["results"][-20:],  # 最近20条结果预览
    })


@app.route("/api/task/stop/<task_id>", methods=["POST"])
def api_task_stop(task_id):
    task = TASKS.get(task_id)
    if task:
        task["status"] = "stopped"
    return jsonify({"ok": True})


@app.route("/api/task/download/<task_id>", methods=["GET"])
def api_task_download(task_id):
    from flask import send_file
    task = TASKS.get(task_id)
    if not task or not task.get("output_file"):
        return jsonify({"ok": False, "msg": "文件不存在"})
    return send_file(task["output_file"], as_attachment=True, download_name=f"scraped_{task_id}.json")


@app.route("/api/task/export-csv/<task_id>", methods=["GET"])
def api_task_export_csv(task_id):
    import csv
    import io
    from flask import Response
    task = TASKS.get(task_id)
    if not task or not task.get("results"):
        return jsonify({"ok": False, "msg": "无数据"})
    results = task["results"]
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=results[0].keys())
    writer.writeheader()
    writer.writerows(results)
    return Response(
        "\ufeff" + output.getvalue(),  # BOM for Excel
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename=scraped_{task_id}.csv"}
    )


@app.route("/api/cases/stats", methods=["POST"])
def api_cases_stats():
    """查询 cases 表统计信息"""
    data = request.json or {}
    try:
        conn = get_db_connection(data)
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) as total FROM cases")
            total = cur.fetchone()["total"]
            cur.execute("SELECT COUNT(*) as cnt FROM cases WHERE transaction_type='sale' OR transaction_type IS NULL OR transaction_type=''")
            sale_count = cur.fetchone()["cnt"]
            cur.execute("SELECT COUNT(*) as cnt FROM cases WHERE transaction_type='rent'")
            rent_count = cur.fetchone()["cnt"]
            cur.execute("SELECT COUNT(DISTINCT source) as cnt FROM cases WHERE source IS NOT NULL AND source != ''")
            source_count = cur.fetchone()["cnt"]
            cur.execute("SELECT COUNT(DISTINCT community) as cnt FROM cases WHERE community IS NOT NULL AND community != ''")
            community_count = cur.fetchone()["cnt"]
            cur.execute("""
                SELECT source, COUNT(*) as cnt
                FROM cases WHERE source IS NOT NULL AND source != ''
                GROUP BY source ORDER BY cnt DESC LIMIT 10
            """)
            by_source = cur.fetchall()
            cur.execute("""
                SELECT DATE_FORMAT(created_at,'%Y-%m-%d') as day, COUNT(*) as cnt
                FROM cases WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY day ORDER BY day
            """)
            recent = cur.fetchall()
        conn.close()
        return jsonify({"ok": True, "total": total, "sale_count": sale_count,
                        "rent_count": rent_count, "source_count": source_count,
                        "community_count": community_count,
                        "by_source": by_source, "recent_7days": recent})
    except Exception as e:
        return jsonify({"ok": False, "msg": str(e)})


@app.route("/api/cases/list", methods=["POST"])
def api_cases_list():
    """分页查询 cases 表数据"""
    data = request.json or {}
    page = int(data.get("page", 1))
    page_size = int(data.get("page_size", 20))
    source_filter = data.get("source", "")
    keyword = data.get("keyword", "")
    offset = (page - 1) * page_size
    try:
        conn = get_db_connection(data.get("db", data))
        with conn.cursor() as cur:
            where = "WHERE 1=1"
            params = []
            if source_filter:
                where += " AND source=%s"
                params.append(source_filter)
            if keyword:
                where += " AND (community LIKE %s OR address LIKE %s)"
                params.extend([f"%{keyword}%", f"%{keyword}%"])
            cur.execute(f"SELECT COUNT(*) as total FROM cases {where}", params)
            total = cur.fetchone()["total"]
            cur.execute(
                f"""SELECT id,community,address,area,price,unit_price,total_price,
                    transaction_type,rooms_str,floor,total_floors,orientation,
                    decoration,build_year,deal_date,source,source_url,created_at
                    FROM cases {where} ORDER BY id DESC LIMIT %s OFFSET %s""",
                params + [page_size, offset]
            )
            rows = cur.fetchall()
            # 序列化 datetime
            for r in rows:
                for k, v in r.items():
                    if hasattr(v, 'isoformat'):
                        r[k] = v.isoformat()
        conn.close()
        return jsonify({"ok": True, "total": total, "rows": rows, "page": page, "page_size": page_size})
    except Exception as e:
        return jsonify({"ok": False, "msg": str(e)})


@app.route("/api/cases/delete", methods=["POST"])
def api_cases_delete():
    """删除指定 case 记录"""
    data = request.json or {}
    case_id = data.get("id")
    if not case_id:
        return jsonify({"ok": False, "msg": "缺少 id"})
    try:
        conn = get_db_connection(data.get("db", data))
        with conn.cursor() as cur:
            cur.execute("DELETE FROM cases WHERE id=%s", (case_id,))
        conn.commit()
        conn.close()
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "msg": str(e)})


@app.route("/api/cases/export-csv", methods=["GET"])
def api_cases_export_csv():
    """导出 cases 表为 CSV"""
    import csv
    import io
    db_config = {
        "host": request.args.get("host", "localhost"),
        "port": int(request.args.get("port", 3306)),
        "database": request.args.get("database", ""),
        "user": request.args.get("user", ""),
        "password": request.args.get("password", ""),
    }
    keyword = request.args.get("keyword", "")
    source = request.args.get("source", "")
    try:
        conn = get_db_connection(db_config)
        with conn.cursor() as cur:
            where = "WHERE 1=1"
            params = []
            if source:
                where += " AND source=%s"
                params.append(source)
            if keyword:
                where += " AND (community LIKE %s OR address LIKE %s)"
                params.extend([f"%{keyword}%", f"%{keyword}%"])
            cur.execute(
                f"""SELECT id,community,address,area,price,unit_price,total_price,listing_price,
                    transaction_type,rooms_str,floor,total_floors,orientation,decoration,
                    build_year,deal_date,deal_cycle,source,source_url,city,district,
                    sub_district,property_type,remark,created_at
                    FROM cases {where} ORDER BY id DESC""",
                params
            )
            rows = cur.fetchall()
        conn.close()
        output = io.StringIO()
        if rows:
            writer = csv.DictWriter(output, fieldnames=rows[0].keys())
            writer.writeheader()
            for r in rows:
                for k, v in r.items():
                    if hasattr(v, 'isoformat'):
                        r[k] = v.isoformat()
            writer.writerows(rows)
        from flask import Response
        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment; filename=cases_export.csv"}
        )
    except Exception as e:
        return jsonify({"ok": False, "msg": str(e)})


if __name__ == "__main__":
    print("\n" + "="*50)
    print("  通用网页采集软件 v2.0")
    print("  访问地址：http://localhost:9000")
    print("="*50 + "\n")
    app.run(host="0.0.0.0", port=9000, debug=False)
