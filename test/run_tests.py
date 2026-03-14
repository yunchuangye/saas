#!/usr/bin/env python3
"""
SaaS 系统全面功能测试脚本
tRPC v11 + superjson transformer 格式
"""
import requests
import json
import time
import sys
import urllib.parse
from datetime import datetime

BASE = "http://localhost:8721/api/trpc"
RESULTS = []
TOKENS = {}

def trpc_query(procedure, params=None, token=None):
    """tRPC query 请求（GET + superjson 格式）"""
    url = f"{BASE}/{procedure}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if params:
        input_data = json.dumps({"json": params, "meta": {"values": {}}})
        url += f"?input={urllib.parse.quote(input_data)}"
    else:
        input_data = json.dumps({"json": None})
        url += f"?input={urllib.parse.quote(input_data)}"
    try:
        r = requests.get(url, headers=headers, timeout=10)
        body = r.json() if r.content else {}
        return r.status_code, body
    except Exception as e:
        return 0, {"error": str(e)}

def trpc_mutation(procedure, data, token=None):
    """tRPC mutation 请求（POST + superjson 格式）"""
    url = f"{BASE}/{procedure}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    payload = {"json": data, "meta": {"values": {}}}
    try:
        r = requests.post(url, json=payload, headers=headers, timeout=10)
        body = r.json() if r.content else {}
        return r.status_code, body
    except Exception as e:
        return 0, {"error": str(e)}

def record(category, name, passed, detail=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    RESULTS.append({"category": category, "name": name, "passed": passed, "detail": detail, "status": status})
    print(f"  {status}  {name}" + (f" — {detail}" if detail else ""))

def get_data(body):
    """提取 tRPC superjson 响应中的数据"""
    if isinstance(body, dict):
        if "result" in body:
            result = body["result"]
            if isinstance(result, dict) and "data" in result:
                data = result["data"]
                if isinstance(data, dict) and "json" in data:
                    return data["json"]
                return data
        if "error" in body:
            return None
    return None

def is_success(status, body):
    return status == 200 and "result" in body

# ─────────────────────────────────────────────
# 1. 认证模块测试
# ─────────────────────────────────────────────
def test_auth():
    print("\n【1. 认证模块】")

    # 1.1 健康检查
    try:
        r = requests.get("http://localhost:8721/health", timeout=5)
        record("认证", "健康检查接口 /health", r.status_code == 200, f"HTTP {r.status_code}")
    except Exception as e:
        record("认证", "健康检查接口 /health", False, str(e))

    # 1.2 各角色登录
    accounts = [
        ("admin", "admin123456", "admin", "管理员登录"),
        ("appraiser1", "test123456", "appraiser", "评估师登录"),
        ("bank1", "test123456", "bank", "银行用户登录"),
        ("investor1", "test123456", "investor", "投资人登录"),
        ("customer1", "test123456", "customer", "客户登录"),
    ]
    for username, password, key, label in accounts:
        status, body = trpc_mutation("auth.login", {"username": username, "password": password})
        data = get_data(body)
        passed = status == 200 and data and "token" in data
        role = data.get("user", {}).get("role") if data else "N/A"
        record("认证", f"{label} ({username})", passed, f"HTTP {status}, role={role}")
        if passed:
            TOKENS[key] = data["token"]

    # 1.3 错误密码登录（应拒绝）
    status, body = trpc_mutation("auth.login", {"username": "admin", "password": "wrongpassword"})
    passed = status != 200 or (isinstance(body, dict) and "error" in body)
    record("认证", "错误密码登录（应拒绝）", passed, f"HTTP {status}")

    # 1.4 获取当前用户信息
    if "admin" in TOKENS:
        status, body = trpc_query("auth.me", token=TOKENS["admin"])
        data = get_data(body)
        passed = status == 200 and data and data.get("role") == "admin"
        record("认证", "获取当前用户信息 auth.me", passed, f"role={data.get('role') if data else 'N/A'}")

    # 1.5 未授权访问
    status, body = trpc_query("auth.me")
    passed = status == 401 or (isinstance(body, dict) and "error" in body)
    record("认证", "未授权访问（无 token 应返回错误）", passed, f"HTTP {status}")

    # 1.6 注册新用户
    ts = int(time.time())
    status, body = trpc_mutation("auth.register", {
        "username": f"testuser_{ts}",
        "password": "Test123456!",
        "email": f"test_{ts}@example.com",
        "role": "customer",
        "displayName": "测试用户"
    })
    data = get_data(body)
    passed = status == 200 and data and "token" in data
    record("认证", "注册新用户", passed, f"HTTP {status}")

    # 1.7 更新用户资料
    if "customer" in TOKENS:
        status, body = trpc_mutation("auth.updateProfile", {
            "displayName": "测试客户更新",
        }, token=TOKENS["customer"])
        data = get_data(body)
        passed = status == 200 and data is not None
        record("认证", "更新用户资料 auth.updateProfile", passed, f"HTTP {status}")

# ─────────────────────────────────────────────
# 2. 项目模块测试
# ─────────────────────────────────────────────
def test_projects():
    print("\n【2. 项目模块】")
    bank_token = TOKENS.get("bank")
    appraiser_token = TOKENS.get("appraiser")
    admin_token = TOKENS.get("admin")

    if not bank_token:
        record("项目", "项目模块（跳过：无 token）", False, "登录失败")
        return

    # 2.1 银行获取项目列表
    status, body = trpc_query("projects.list", {"page": 1, "pageSize": 10}, token=bank_token)
    data = get_data(body)
    passed = status == 200 and data is not None
    count = len(data.get("items", [])) if data else 0
    record("项目", "银行获取项目列表 projects.list", passed, f"HTTP {status}, items={count}")

    # 2.2 创建项目
    status, body = trpc_mutation("projects.create", {
        "title": f"测试房产评估项目_{int(time.time())}",
        "propertyAddress": "北京市朝阳区建国路88号",
        "propertyType": "residential",
        "estimatedValue": 5000000,
        "purpose": "mortgage",
        "cityId": 1
    }, token=bank_token)
    data = get_data(body)
    passed = status == 200 and data and "id" in data
    record("项目", "创建项目 projects.create", passed, f"HTTP {status}, id={data.get('id') if data else 'N/A'}")
    if passed:
        TOKENS["project_id"] = data["id"]

    # 2.3 获取项目详情
    if TOKENS.get("project_id"):
        status, body = trpc_query("projects.get", {"id": TOKENS["project_id"]}, token=bank_token)
        data = get_data(body)
        passed = status == 200 and data and "id" in data
        record("项目", "获取项目详情 projects.get", passed, f"HTTP {status}")

    # 2.4 评估师获取竞标中项目
    if appraiser_token:
        status, body = trpc_query("projects.listBidding", {"page": 1, "pageSize": 10}, token=appraiser_token)
        data = get_data(body)
        passed = status == 200 and data is not None
        record("项目", "评估师获取竞标中项目 projects.listBidding", passed, f"HTTP {status}")

    # 2.5 管理员获取所有项目
    if admin_token:
        status, body = trpc_query("projects.list", {"page": 1, "pageSize": 5}, token=admin_token)
        data = get_data(body)
        passed = status == 200 and data is not None
        record("项目", "管理员获取所有项目", passed, f"HTTP {status}")

# ─────────────────────────────────────────────
# 3. 报告模块测试
# ─────────────────────────────────────────────
def test_reports():
    print("\n【3. 报告模块】")
    appraiser_token = TOKENS.get("appraiser")
    admin_token = TOKENS.get("admin")
    bank_token = TOKENS.get("bank")

    if not appraiser_token:
        record("报告", "报告模块（跳过：无 token）", False, "登录失败")
        return

    # 3.1 评估师获取报告列表
    status, body = trpc_query("reports.list", {"page": 1, "pageSize": 10}, token=appraiser_token)
    data = get_data(body)
    passed = status == 200 and data is not None
    count = len(data.get("items", [])) if data else 0
    record("报告", "评估师获取报告列表 reports.list", passed, f"HTTP {status}, items={count}")

    # 3.2 银行获取报告列表
    if bank_token:
        status, body = trpc_query("reports.list", {"page": 1, "pageSize": 5}, token=bank_token)
        data = get_data(body)
        passed = status == 200 and data is not None
        record("报告", "银行获取报告列表", passed, f"HTTP {status}")

    # 3.3 管理员获取报告列表
    if admin_token:
        status, body = trpc_query("reports.list", {"page": 1, "pageSize": 5}, token=admin_token)
        data = get_data(body)
        passed = status == 200 and data is not None
        record("报告", "管理员获取报告列表", passed, f"HTTP {status}")

# ─────────────────────────────────────────────
# 4. 自动估值模块测试
# ─────────────────────────────────────────────
def test_valuation():
    print("\n【4. 自动估值模块】")
    customer_token = TOKENS.get("customer")
    appraiser_token = TOKENS.get("appraiser")
    token = customer_token or appraiser_token

    if not token:
        record("估值", "估值模块（跳过：无 token）", False, "登录失败")
        return

    if appraiser_token:
        status, body = trpc_mutation("autoValuation.calculate", {
            "address": "北京市朝阳区建国路88号",
            "city": "北京", "cityId": 1, "district": "朝阳区",
            "propertyType": "residential",
            "buildingArea": 89.5, "floor": 12, "totalFloors": 25,
            "buildingAge": 8, "orientation": "south", "decoration": "fine",
            "hasElevator": True, "hasParking": True,
            "purpose": "mortgage", "enableLLM": False
        }, token=appraiser_token)
        data = get_data(body)
        # calculate 返回对象包含 id 和 finalValue
        passed = status == 200 and data and data.get("finalValue") is not None
        record("估值", "自动估值计算 autoValuation.calculate", passed, f"HTTP {status}, finalValue={data.get('finalValue') if data else None}")
        if passed:
            TOKENS["valuation_id"] = data.get("id")

    if appraiser_token:
        status, body = trpc_query("autoValuation.list", {"page": 1, "pageSize": 5}, token=appraiser_token)
        data = get_data(body)
        # list 可能返回列表或对象
        if isinstance(data, list):
            count = len(data)
        elif isinstance(data, dict):
            count = len(data.get("items", []))
        else:
            count = 0
        passed = status == 200 and data is not None
        record("估值", "获取估值历史 autoValuation.list", passed, f"HTTP {status}, count={count}")   # 4.3 获取估值详情
    if TOKENS.get("valuation_id"):
        status, body = trpc_query("autoValuation.getById", {"id": TOKENS["valuation_id"]}, token=token)
        data = get_data(body)
        passed = status == 200 and data is not None
        record("估值", "获取估值详情 autoValuation.getById", passed, f"HTTP {status}")

    # 4.4 获取城市列表（估值用）
    status, body = trpc_query("autoValuation.getCities", token=token)
    data = get_data(body)
    passed = status == 200 and data is not None
    record("估值", "获取估值城市列表 autoValuation.getCities", passed, f"HTTP {status}")

# ─────────────────────────────────────────────
# 5. 竞标模块测试
# ─────────────────────────────────────────────
def test_bids():
    print("\n【5. 竞标模块】")
    appraiser_token = TOKENS.get("appraiser")
    bank_token = TOKENS.get("bank")

    # 5.1 评估师获取我的竞标列表（通过 projects.listBidding 查看）
    if appraiser_token:
        status, body = trpc_query("projects.listBidding", {"page": 1, "pageSize": 10}, token=appraiser_token)
        data = get_data(body)
        passed = status == 200 and data is not None
        record("竞标", "评估师获取竞标中项目 projects.listBidding", passed, f"HTTP {status}")

    # 5.2 评估师对项目竞标（正确接口是 projects.submit）
    if appraiser_token and TOKENS.get("project_id"):
        status, body = trpc_mutation("bids.submit", {
            "projectId": TOKENS["project_id"],
            "price": 3500,
            "estimatedDays": 7,
            "message": "我们公司专业从事住宅评估，有丰富经验，请考虑我们的报价。"
        }, token=appraiser_token)
        data = get_data(body)
        passed = status == 200 and data is not None
        record("竞标", "评估师提交竞标 bids.submit", passed, f"HTTP {status}")
        if passed and data and "id" in data:
            TOKENS["bid_id"] = data["id"]

    # 5.3 银行获取项目竞标列表
    if bank_token and TOKENS.get("project_id"):
        status, body = trpc_query("bids.listByProject", {"projectId": TOKENS["project_id"]}, token=bank_token)
        data = get_data(body)
        passed = status == 200 and data is not None
        record("竞标", "银行获取项目竞标列表 bids.listByProject", passed, f"HTTP {status}")

# ─────────────────────────────────────────────
# 6. 通知模块测试
# ─────────────────────────────────────────────
def test_notifications():
    print("\n【6. 通知模块】")
    token = TOKENS.get("customer") or TOKENS.get("admin")
    if not token:
        record("通知", "通知模块（跳过）", False, "无 token")
        return

    # 6.1 获取通知列表
    status, body = trpc_query("notifications.list", {"page": 1, "pageSize": 10}, token=token)
    data = get_data(body)
    passed = status == 200 and data is not None
    record("通知", "获取通知列表 notifications.list", passed, f"HTTP {status}")

    # 6.2 获取未读数量
    status, body = trpc_query("notifications.unreadCount", token=token)
    data = get_data(body)
    passed = status == 200 and data is not None
    record("通知", "获取未读通知数 notifications.unreadCount", passed, f"HTTP {status}, count={data}")

    # 6.3 全部标记已读
    status, body = trpc_mutation("notifications.markAllRead", {}, token=token)
    data = get_data(body)
    passed = status == 200 and data is not None
    record("通知", "全部标记已读 notifications.markAllRead", passed, f"HTTP {status}")

# ─────────────────────────────────────────────
# 7. 仪表盘模块测试
# ─────────────────────────────────────────────
def test_dashboard():
    print("\n【7. 仪表盘模块】")

    # 7.1 管理员统计
    admin_token = TOKENS.get("admin")
    if admin_token:
        status, body = trpc_query("dashboard.stats", token=admin_token)
        data = get_data(body)
        passed = status == 200 and data is not None
        record("仪表盘", "管理员统计数据 dashboard.stats", passed, f"HTTP {status}")

    # 7.2 评估师统计（dashboard.stats 根据角色返回不同数据）
    appraiser_token = TOKENS.get("appraiser")
    if appraiser_token:
        status, body = trpc_query("dashboard.stats", token=appraiser_token)
        data = get_data(body)
        passed = status == 200 and data is not None
        record("仪表盘", "评估师统计数据 dashboard.stats", passed, f"HTTP {status}")

    # 7.3 银行统计
    bank_token = TOKENS.get("bank")
    if bank_token:
        status, body = trpc_query("dashboard.stats", token=bank_token)
        data = get_data(body)
        passed = status == 200 and data is not None
        record("仪表盘", "银行统计数据 dashboard.stats", passed, f"HTTP {status}")

    # 7.4 客户统计
    customer_token = TOKENS.get("customer")
    if customer_token:
        status, body = trpc_query("dashboard.stats", token=customer_token)
        data = get_data(body)
        passed = status == 200 and data is not None
        record("仪表盘", "客户统计数据 dashboard.stats", passed, f"HTTP {status}")

# ─────────────────────────────────────────────
# 8. 目录模块测试（城市/楼盘）
# ─────────────────────────────────────────────
def test_directory():
    print("\n【8. 目录模块（城市/楼盘）】")
    token = TOKENS.get("customer") or TOKENS.get("admin")

    # 8.1 获取城市列表（使用扁平化别名）
    status, body = trpc_query("directory.listCities", {"search": ""}, token=token)
    data = get_data(body)
    passed = status == 200 and data is not None
    count = len(data.get("items", [])) if isinstance(data, dict) else "N/A"
    record("目录", "获取城市列表 directory.listCities", passed, f"HTTP {status}, count={count}")

    # 8.2 获取楼盘列表
    status, body = trpc_query("directory.estates.list", {"page": 1, "pageSize": 10, "cityId": 1}, token=token)
    data = get_data(body)
    passed = status == 200 and data is not None
    record("目录", "获取楼盘列表 directory.estates.list", passed, f"HTTP {status}")

    # 8.3 获取楼盘详情（通过 listEstates）
    status, body = trpc_query("directory.listEstates", {"cityId": 1}, token=token)
    data = get_data(body)
    passed = status == 200 and data is not None
    record("目录", "获取楼盘列表 directory.listEstates", passed, f"HTTP {status}")

# ─────────────────────────────────────────────
# 9. 营销模块测试（sales）
# ─────────────────────────────────────────────
def test_sales():
    print("\n【9. 营销推广模块（sales）】")
    customer_token = TOKENS.get("customer")
    appraiser_token = TOKENS.get("appraiser")
    bank_token = TOKENS.get("bank")
    investor_token = TOKENS.get("investor")

    # 9.1 公开接口 - 获取邀请信息
    status, body = trpc_query("sales.getInviteInfo", {"code": "INVALID-CODE"})
    passed = status == 200  # 返回 null 也是正常
    record("营销", "公开接口 sales.getInviteInfo（无效code返回null）", passed, f"HTTP {status}")

    # 9.2 客户 - 获取邀请码
    if customer_token:
        status, body = trpc_query("sales.customer_getInviteCode", token=customer_token)
        data = get_data(body)
        passed = status == 200 and data and "code" in data
        record("营销", "客户获取邀请码 sales.customer_getInviteCode", passed, f"HTTP {status}, code={data.get('code') if data else 'N/A'}")
        if passed:
            TOKENS["invite_code"] = data["code"]

        # 9.3 客户 - 获取邀请统计
        status, body = trpc_query("sales.customer_getInviteStats", token=customer_token)
        data = get_data(body)
        passed = status == 200 and data is not None
        record("营销", "客户邀请统计 sales.customer_getInviteStats", passed, f"HTTP {status}")

        # 9.4 客户 - 获取拼团活动
        status, body = trpc_query("sales.customer_getGroupBuying", token=customer_token)
        data = get_data(body)
        passed = status == 200 and isinstance(data, list) and len(data) > 0
        record("营销", "客户拼团活动 sales.customer_getGroupBuying", passed, f"HTTP {status}, count={len(data) if isinstance(data, list) else 0}")

        # 9.5 客户 - 参与拼团
        status, body = trpc_mutation("sales.customer_joinGroupBuying", {
            "groupId": 1, "propertyAddress": "北京市朝阳区测试路1号"
        }, token=customer_token)
        data = get_data(body)
        passed = status == 200 and data and data.get("success")
        record("营销", "客户参与拼团 sales.customer_joinGroupBuying", passed, f"HTTP {status}")

        # 9.6 分享记录（正确名称：share_trackShare）
        status, body = trpc_mutation("sales.share_trackShare", {
            "platform": "wechat",
            "contentType": "valuation",
            "contentId": "test-001",
            "shareUrl": "https://gujia.app/share/valuation/test-001"
        }, token=customer_token)
        data = get_data(body)
        passed = status == 200 and data and data.get("success")
        record("营销", "记录分享行为 sales.share_trackShare（微信）", passed, f"HTTP {status}")

        # 9.7 多平台分享记录
        for platform in ["weibo", "qq", "douyin", "xiaohongshu"]:
            status, body = trpc_mutation("sales.share_trackShare", {
                "platform": platform,
                "contentType": "invite",
                "contentId": "test-002",
                "shareUrl": f"https://gujia.app/share/invite/test-002"
            }, token=customer_token)
            data = get_data(body)
            passed = status == 200 and data and data.get("success")
            record("营销", f"记录分享行为 sales.share_trackShare（{platform}）", passed, f"HTTP {status}")

        # 9.8 获取分享统计
        status, body = trpc_query("sales.share_getStats", token=customer_token)
        data = get_data(body)
        passed = status == 200 and data is not None
        record("营销", "获取分享统计 sales.share_getStats", passed, f"HTTP {status}")

        # 9.9 生成分享文案（share_generateCopy 是 query 不是 mutation）
        for platform in ["wechat", "weibo", "xiaohongshu"]:
            status, body = trpc_query("sales.share_generateCopy", {
                "platform": platform,
                "contentType": "valuation",
                "data": {"price": 500}
            }, token=customer_token)
            data = get_data(body)
            passed = status == 200 and data and "title" in data
            record("营销", f"生成分享文案 sales.share_generateCopy（{platform}）", passed, f"HTTP {status}")

    # 9.10 评估师营销功能
    if appraiser_token:
        status, body = trpc_query("sales.appraiser_getMicrosite", token=appraiser_token)
        data = get_data(body)
        passed = status == 200 and data is not None
        record("营销", "评估师微官网 sales.appraiser_getMicrosite", passed, f"HTTP {status}")

        status, body = trpc_query("sales.appraiser_getPosterTemplates", token=appraiser_token)
        data = get_data(body)
        passed = status == 200 and isinstance(data, list) and len(data) > 0
        record("营销", "评估师海报模板 sales.appraiser_getPosterTemplates", passed, f"HTTP {status}, count={len(data) if isinstance(data, list) else 0}")

        status, body = trpc_query("sales.appraiser_getLeads", {"page": 1, "pageSize": 10}, token=appraiser_token)
        data = get_data(body)
        passed = status == 200 and data is not None
        record("营销", "评估师客户线索 sales.appraiser_getLeads", passed, f"HTTP {status}")

        status, body = trpc_mutation("sales.appraiser_issueCoupon", {
            "type": "discount", "discount": 0.8, "quantity": 50, "expireDays": 30
        }, token=appraiser_token)
        data = get_data(body)
        passed = status == 200 and data and data.get("success")
        record("营销", "评估师发放优惠券 sales.appraiser_issueCoupon", passed, f"HTTP {status}")

        status, body = trpc_query("sales.appraiser_getCampaigns", token=appraiser_token)
        data = get_data(body)
        passed = status == 200 and data is not None
        record("营销", "评估师获取营销活动 sales.appraiser_getCampaigns", passed, f"HTTP {status}")

    # 9.11 银行营销功能
    if bank_token:
        status, body = trpc_query("sales.bank_getLoanCalculatorConfig", token=bank_token)
        data = get_data(body)
        passed = status == 200 and data is not None
        record("营销", "银行贷款计算器配置 sales.bank_getLoanCalculatorConfig", passed, f"HTTP {status}")

        status, body = trpc_mutation("sales.bank_generateMarketReport", {
            "cityId": 1, "reportType": "monthly", "propertyTypes": ["住宅"]
        }, token=bank_token)
        data = get_data(body)
        passed = status == 200 and data is not None
        record("营销", "银行生成市场报告 sales.bank_generateMarketReport", passed, f"HTTP {status}")

        status, body = trpc_query("sales.bank_getCoMarketingCampaigns", token=bank_token)
        data = get_data(body)
        passed = status == 200 and data is not None
        record("营销", "银行联名营销活动 sales.bank_getCoMarketingCampaigns", passed, f"HTTP {status}")

        status, body = trpc_query("sales.bank_getDashboard", token=bank_token)
        data = get_data(body)
        passed = status == 200 and data is not None
        record("营销", "银行营销数据看板 sales.bank_getDashboard", passed, f"HTTP {status}")

    # 9.12 投资机构营销功能
    if investor_token:
        status, body = trpc_query("sales.investor_getPitchbooks", token=investor_token)
        data = get_data(body)
        passed = status == 200 and data is not None
        record("营销", "投资机构推介册列表 sales.investor_getPitchbooks", passed, f"HTTP {status}")

        status, body = trpc_mutation("sales.investor_generatePitchbook", {
            "title": "2026年Q1住宅资产推介",
            "assetType": "real_estate",
            "assets": [{"name": "北京朝阳区住宅资产", "area": 1200, "estimatedValue": 50000000}],
            "contactInfo": {"name": "张三", "phone": "13800138000", "email": "test@gujia.app"}
        }, token=investor_token)
        data = get_data(body)
        passed = status == 200 and data and (data.get("id") or data.get("success"))
        record("营销", "投资机构生成推介册 sales.investor_generatePitchbook", passed, f"HTTP {status}")

        status, body = trpc_mutation("sales.investor_generateInsightNewsletter", {
            "period": "weekly", "cityIds": [1, 2]
        }, token=investor_token)
        data = get_data(body)
        passed = status == 200 and data and (data.get("id") or data.get("success"))
        record("营销", "投资机构生成简报 sales.investor_generateInsightNewsletter", passed, f"HTTP {status}")

        status, body = trpc_query("sales.investor_getDashboard", token=investor_token)
        data = get_data(body)
        passed = status == 200 and data is not None
        record("营销", "投资机构营销看板 sales.investor_getDashboard", passed, f"HTTP {status}")

    # 9.13 线索追踪（公开接口）
    status, body = trpc_mutation("sales.trackLead", {
        "campaignId": "TEST-001", "source": "wechat", "action": "click"
    })
    data = get_data(body)
    passed = status == 200 and data and data.get("success")
    record("营销", "线索追踪 sales.trackLead（公开接口）", passed, f"HTTP {status}")

    # 9.14 通过邀请码获取邀请人信息（有效 code）
    if TOKENS.get("invite_code"):
        status, body = trpc_query("sales.getInviteInfo", {"code": TOKENS["invite_code"]})
        data = get_data(body)
        passed = status == 200  # 有效 code 应返回邀请人信息
        record("营销", "通过有效邀请码获取邀请人信息", passed, f"HTTP {status}")

# ─────────────────────────────────────────────
# 10. 管理后台模块测试
# ─────────────────────────────────────────────
def test_admin():
    print("\n【10. 管理后台模块】")
    admin_token = TOKENS.get("admin")
    if not admin_token:
        record("管理", "管理后台（跳过：无 admin token）", False, "登录失败")
        return

    # 10.1 用户列表（各角色）
    for role in ["appraiser", "bank", "investor", "customer"]:
        status, body = trpc_query("adminUsers.list", {"page": 1, "pageSize": 10, "role": role}, token=admin_token)
        data = get_data(body)
        passed = status == 200 and data is not None
        count = data.get("total") if isinstance(data, dict) else "N/A"
        record("管理", f"管理员获取{role}用户列表", passed, f"HTTP {status}, total={count}")

    # 10.2 操作日志
    status, body = trpc_query("logs.list", {"page": 1, "pageSize": 10}, token=admin_token)
    data = get_data(body)
    passed = status == 200 and data is not None
    record("管理", "操作日志 logs.list", passed, f"HTTP {status}")

    # 10.3 组织管理
    status, body = trpc_query("org.list", {"page": 1, "pageSize": 10}, token=admin_token)
    data = get_data(body)
    passed = status == 200 and data is not None
    record("管理", "组织列表 org.list", passed, f"HTTP {status}")

    # 10.4 管理员统计
    status, body = trpc_query("dashboard.stats", token=admin_token)
    data = get_data(body)
    passed = status == 200 and data is not None
    record("管理", "管理员仪表盘统计 dashboard.stats", passed, f"HTTP {status}")

# ─────────────────────────────────────────────
# 11. 前端页面可访问性测试
# ─────────────────────────────────────────────
def test_frontend_pages():
    print("\n【11. 前端页面可访问性】")
    FE = "http://localhost:8720"
    pages = [
        ("/", "首页"),
        ("/login", "登录页"),
        ("/register", "注册页"),
        ("/dashboard", "仪表盘（重定向）"),
        ("/dashboard/admin", "管理员仪表盘"),
        ("/dashboard/admin/users/appraisers", "管理员-评估师管理"),
        ("/dashboard/admin/users/banks", "管理员-银行用户管理"),
        ("/dashboard/admin/users/investors", "管理员-投资人管理"),
        ("/dashboard/admin/users/customers", "管理员-客户管理"),
        ("/dashboard/admin/analytics", "管理员-数据分析"),
        ("/dashboard/admin/logs", "管理员-操作日志"),
        ("/dashboard/admin/directory/cities", "管理员-城市管理"),
        ("/dashboard/admin/directory/estates", "管理员-楼盘管理"),
        ("/dashboard/appraiser", "评估师仪表盘"),
        ("/dashboard/appraiser/projects", "评估师-项目列表"),
        ("/dashboard/appraiser/reports", "评估师-报告列表"),
        ("/dashboard/appraiser/bidding", "评估师-竞标"),
        ("/dashboard/appraiser/valuation", "评估师-估值"),
        ("/dashboard/appraiser/sales", "评估师-营销中心"),
        ("/dashboard/bank", "银行仪表盘"),
        ("/dashboard/bank/projects", "银行-项目管理"),
        ("/dashboard/bank/bidding", "银行-竞标管理"),
        ("/dashboard/bank/sales", "银行-营销中心"),
        ("/dashboard/investor", "投资人仪表盘"),
        ("/dashboard/investor/sales", "投资机构-营销中心"),
        ("/dashboard/customer", "客户仪表盘"),
        ("/dashboard/customer/sales", "客户-营销中心"),
    ]
    for path, name in pages:
        try:
            r = requests.get(f"{FE}{path}", timeout=8, allow_redirects=True)
            passed = r.status_code in [200, 307, 308]
            record("前端", f"{name} ({path})", passed, f"HTTP {r.status_code}")
        except Exception as e:
            record("前端", f"{name} ({path})", False, str(e))

# ─────────────────────────────────────────────
# 主函数
# ─────────────────────────────────────────────
def main():
    print("=" * 65)
    print(f"  SaaS 系统全面功能测试")
    print(f"  时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  后端：http://localhost:8721")
    print(f"  前端：http://localhost:8720")
    print("=" * 65)

    test_auth()
    test_projects()
    test_reports()
    test_valuation()
    test_bids()
    test_notifications()
    test_dashboard()
    test_directory()
    test_sales()
    test_admin()
    test_frontend_pages()

    # 汇总
    total = len(RESULTS)
    passed_count = sum(1 for r in RESULTS if r["passed"])
    failed_count = total - passed_count

    print("\n" + "=" * 65)
    print(f"  测试汇总：{passed_count}/{total} 通过，{failed_count} 失败")
    print(f"  通过率：{passed_count/total*100:.1f}%")
    print("=" * 65)

    if failed_count > 0:
        print("\n【失败项明细】")
        for r in RESULTS:
            if not r["passed"]:
                print(f"  ❌ [{r['category']}] {r['name']} — {r['detail']}")

    # 按分类统计
    print("\n【分类统计】")
    categories = {}
    for r in RESULTS:
        cat = r["category"]
        if cat not in categories:
            categories[cat] = {"pass": 0, "fail": 0}
        if r["passed"]:
            categories[cat]["pass"] += 1
        else:
            categories[cat]["fail"] += 1
    for cat, stats in categories.items():
        total_cat = stats["pass"] + stats["fail"]
        print(f"  {cat}: {stats['pass']}/{total_cat} {'✅' if stats['fail'] == 0 else '⚠️'}")

    # 保存 JSON 结果
    with open("/tmp/test_results.json", "w", encoding="utf-8") as f:
        json.dump({
            "summary": {
                "total": total,
                "passed": passed_count,
                "failed": failed_count,
                "pass_rate": f"{passed_count/total*100:.1f}%",
                "time": datetime.now().isoformat()
            },
            "categories": categories,
            "results": RESULTS
        }, f, ensure_ascii=False, indent=2)

    print(f"\n详细结果已保存到 /tmp/test_results.json")
    return 0 if failed_count == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
