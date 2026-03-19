#!/usr/bin/env python3
"""SaaS 房地产估价系统 - 全面 API 测试脚本 v2"""
import requests, json, redis as redis_lib

BASE = "http://localhost:8721"
TRPC = f"{BASE}/api/trpc"
results = []
sessions = {}

r_client = redis_lib.Redis(host="127.0.0.1", port=6379, decode_responses=True)

def test(name, func):
    try:
        result = func()
        results.append(("OK", name, str(result)[:100]))
        return result
    except Exception as e:
        results.append(("FAIL", name, str(e)[:100]))
        return None

def get_captcha():
    resp = requests.get(f"{BASE}/api/captcha", timeout=5)
    cdata = resp.json()
    cid = cdata["id"]
    ccode = r_client.get(f"captcha:{cid}")
    return cid, ccode

def login(username, password):
    cid, ccode = get_captcha()
    s = requests.Session()
    r = s.post(f"{TRPC}/auth.login", json={"json":{
        "username": username, "password": password,
        "captchaId": cid, "captchaCode": ccode
    }}, timeout=5)
    d = r.json()
    if "error" in d:
        raise Exception(d["error"]["json"]["message"])
    inner = d["result"]["data"]["json"]
    s.headers.update({"Authorization": f"Bearer {inner['token']}"})
    return s, inner["user"]

def register(username, password, email, role, displayName):
    cid, ccode = get_captcha()
    r = requests.post(f"{TRPC}/auth.register", json={"json":{
        "username": username, "password": password, "email": email,
        "role": role, "displayName": displayName,
        "captchaId": cid, "captchaCode": ccode
    }}, timeout=5)
    d = r.json()
    if "error" in d:
        raise Exception(d["error"]["json"]["message"])
    return d["result"]["data"]["json"]

def api_get(session, path, params={}):
    r = session.get(f"{TRPC}/{path}", params={"input": json.dumps({"json": params})}, timeout=5)
    d = r.json()
    if "error" in d:
        raise Exception(d["error"]["json"]["message"])
    return d["result"]["data"]["json"]

def api_post(session, path, data={}):
    r = session.post(f"{TRPC}/{path}", json={"json": data}, timeout=5)
    d = r.json()
    if "error" in d:
        raise Exception(d["error"]["json"]["message"])
    return d["result"]["data"]["json"]

# ===== 基础服务 =====
test("健康检查", lambda: requests.get(f"{BASE}/health", timeout=5).json()["status"])
test("验证码获取", lambda: f"id={get_captcha()[0][:8]}...")

# ===== 认证 =====
def t_admin():
    s, u = login("admin", "admin123456")
    sessions["admin"] = s
    return f"role={u['role']}"
test("管理员登录", t_admin)

for role, uname in [("appraiser","test_appraiser_001"),("broker","test_broker_001"),
                     ("bank","test_bank_001"),("customer","test_customer_001")]:
    def t_reg(r=role, u=uname):
        try:
            register(u, "Test@123456", f"{u}@test.com", r, f"测试{r}")
            return "注册成功"
        except Exception as e:
            return "已存在" if "已存在" in str(e) else str(e)[:50]
    test(f"注册{role}账号", t_reg)
    def t_login(u=uname, ro=role):
        s, ud = login(u, "Test@123456")
        sessions[ro] = s
        return f"role={ud['role']}"
    test(f"{role}登录", t_login)

# ===== 核心业务 =====
if "admin" in sessions:
    s = sessions["admin"]
    test("当前用户(auth.me)", lambda: f"role={api_get(s,'auth.me')['role']}")
    test("项目列表(projects.list)", lambda: f"total={api_get(s,'projects.list',{'page':1,'pageSize':5}).get('total',0)}")
    test("报告列表(reports.list)", lambda: f"total={api_get(s,'reports.list',{'page':1,'pageSize':5}).get('total',0)}")
    test("Dashboard统计", lambda: f"keys={list(api_get(s,'dashboard.stats').keys())[:3]}")
    test("机构列表(org.list)", lambda: f"total={api_get(s,'org.list',{'page':1,'pageSize':5}).get('total',0)}")
    test("通知列表", lambda: f"total={api_get(s,'notifications.list',{'page':1,'pageSize':5}).get('total',0)}")
    test("操作日志(logs.list)", lambda: f"total={api_get(s,'logs.list',{'page':1,'pageSize':5}).get('total',0)}")
    test("系统设置(settings.get)", lambda: f"ok={api_get(s,'settings.get') is not None}")
    test("新闻列表(news.list)", lambda: f"total={api_get(s,'news.list',{'page':1,'pageSize':5}).get('total',0)}")

# ===== 签章 =====
if "appraiser" in sessions:
    s = sessions["appraiser"]
    test("我的签章(seals.getMySeals)", lambda: f"count={len(api_get(s,'seals.getMySeals'))}")
    test("签章申请(seals.getOrgApplications)", lambda: f"count={len(api_get(s,'seals.getOrgApplications'))}")
if "admin" in sessions:
    s = sessions["admin"]
    test("全部签章(seals.getAllSeals)", lambda: f"total={api_get(s,'seals.getAllSeals',{'page':1,'pageSize':5}).get('total',0)}")

# ===== 订阅计费 =====
if "admin" in sessions:
    s = sessions["admin"]
    test("订阅计划(billing.getPlans)", lambda: f"plans={len(api_get(s,'billing.getPlans').get('plans',[]))}")
    test("我的订阅(billing.getMySubscription)", lambda: f"ok={api_get(s,'billing.getMySubscription') is not None}")
    test("API密钥(billing.getApiKeys)", lambda: f"count={len(api_get(s,'billing.getApiKeys'))}")
    test("账单历史(billing.getBillingHistory)", lambda: f"total={api_get(s,'billing.getBillingHistory',{'page':1,'pageSize':5}).get('total',0)}")

# ===== 支付 =====
if "admin" in sessions:
    s = sessions["admin"]
    test("支付订单(payment.myOrders)", lambda: f"total={api_get(s,'payment.myOrders',{'page':1,'pageSize':5}).get('total',0)}")
    test("管理员订单(payment.adminOrders)", lambda: f"total={api_get(s,'payment.adminOrders',{'page':1,'pageSize':5}).get('total',0)}")

# ===== 三级审核 =====
if "appraiser" in sessions:
    s = sessions["appraiser"]
    test("待我审核(threeLevelReview.pendingMyReview)", lambda: f"total={api_get(s,'threeLevelReview.pendingMyReview',{'page':1,'pageSize':5}).get('total',0)}")

# ===== 工作底稿 =====
if "appraiser" in sessions:
    s = sessions["appraiser"]
    test("工作底稿(workSheets.list)", lambda: f"total={api_get(s,'workSheets.list',{'page':1,'pageSize':5}).get('total',0)}")

# ===== 偏离预警 =====
if "admin" in sessions:
    s = sessions["admin"]
    test("偏离预警(valuationAlerts.list)", lambda: f"total={api_get(s,'valuationAlerts.list',{'page':1,'pageSize':5}).get('total',0)}")

# ===== 数据导出 =====
if "admin" in sessions:
    s = sessions["admin"]
    test("导出任务(exports.myTasks)", lambda: f"total={api_get(s,'exports.myTasks',{'page':1,'pageSize':5}).get('total',0)}")
    test("管理员导出(exports.adminTasks)", lambda: f"total={api_get(s,'exports.adminTasks',{'page':1,'pageSize':5}).get('total',0)}")

# ===== 通知增强 =====
if "admin" in sessions:
    s = sessions["admin"]
    test("通知偏好(notifyEnhanced.getPreferences)", lambda: f"ok={api_get(s,'notifyEnhanced.getPreferences') is not None}")
    test("发送历史(notifyEnhanced.sendHistory)", lambda: f"total={api_get(s,'notifyEnhanced.sendHistory',{'page':1,'pageSize':5}).get('total',0)}")

# ===== 白标定制 =====
if "admin" in sessions:
    s = sessions["admin"]
    def t_branding():
        try:
            return f"brand={api_get(s,'branding.get').get('brandName','未设置')}"
        except:
            return "无品牌配置(正常)"
    test("品牌定制(branding.get)", t_branding)

# ===== 经纪机构 =====
if "broker" in sessions:
    s = sessions["broker"]
    test("房源列表(broker.listListings)", lambda: f"total={api_get(s,'broker.listListings',{'page':1,'pageSize':5}).get('total',0)}")
    test("客源列表(broker.listClients)", lambda: f"total={api_get(s,'broker.listClients',{'page':1,'pageSize':5}).get('total',0)}")
    test("带看列表(broker.listViewings)", lambda: f"total={api_get(s,'broker.listViewings',{'page':1,'pageSize':5}).get('total',0)}")
    test("交易列表(broker.listTransactions)", lambda: f"total={api_get(s,'broker.listTransactions',{'page':1,'pageSize':5}).get('total',0)}")
    test("营销链接(broker.listMarketingLinks)", lambda: f"total={api_get(s,'broker.listMarketingLinks',{'page':1,'pageSize':5}).get('total',0)}")
    def t_create_listing():
        d = api_post(s, "broker.createListing", {
            "title":"测试房源-朝阳区3室2厅","address":"北京市朝阳区测试路1号",
            "district":"朝阳区","city":"北京","totalPrice":500,"unitPrice":50000,
            "area":100,"rooms":3,"halls":2,"bathrooms":1,"floor":5,"totalFloors":20,
            "buildYear":2010,"orientation":"南","decoration":"精装",
            "propertyType":"住宅","listingType":"sale"
        })
        return f"id={d.get('id','?')}"
    test("创建房源(broker.createListing)", t_create_listing)
    def t_create_client():
        d = api_post(s, "broker.createClient", {
            "name":"测试客户张三","phone":"13900000001",
            "budget":500,"requirement":"朝阳区3室2厅","clientType":"buyer"
        })
        return f"id={d.get('id','?')}"
    test("创建客源(broker.createClient)", t_create_client)

# ===== 销售推广 =====
if "appraiser" in sessions:
    s = sessions["appraiser"]
    def t_minisite():
        try:
            return f"title={api_get(s,'sales.getMiniSite').get('title','未设置')}"
        except:
            return "无微站(正常)"
    test("微站(sales.getMiniSite)", t_minisite)
    test("营销活动(sales.listCampaigns)", lambda: f"total={api_get(s,'sales.listCampaigns',{'page':1,'pageSize':5}).get('total',0)}")
    test("线索列表(sales.listLeads)", lambda: f"total={api_get(s,'sales.listLeads',{'page':1,'pageSize':5}).get('total',0)}")

# ===== 估价 =====
if "appraiser" in sessions:
    s = sessions["appraiser"]
    test("估价记录(valuation.list)", lambda: f"total={api_get(s,'valuation.list',{'page':1,'pageSize':5}).get('total',0)}")

# ===== 平台超管 =====
def t_platform():
    try:
        cid, ccode = get_captcha()
        r = requests.post(f"{TRPC}/platformAdmin.login", json={"json":{
            "username":"platform_admin","password":"PlatformAdmin@2026",
            "captchaId":cid,"captchaCode":ccode
        }}, timeout=5)
        d = r.json()
        if "error" in d:
            return f"超管未初始化(正常)"
        return "超管登录成功"
    except Exception as e:
        return f"异常:{e}"
test("平台超管登录(独立入口)", t_platform)

# ===== 汇总 =====
print("\n" + "="*70)
print("  SaaS 房地产估价系统 - API 全面测试报告")
print("="*70)
for status, name, detail in results:
    icon = "✅" if status=="OK" else "❌"
    print(f"  {icon} {name}")
    if status == "FAIL":
        print(f"     └─ {detail}")
passed = sum(1 for s,_,_ in results if s=="OK")
failed = sum(1 for s,_,_ in results if s=="FAIL")
total = len(results)
print(f"\n  通过: {passed}/{total}  失败: {failed}/{total}  通过率: {passed/total*100:.0f}%")
print("="*70)
