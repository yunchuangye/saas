/**
 * 经纪机构（中介）路由
 * 功能：房源管理、客源管理、带看记录、二手房交易、佣金管理、专属营销接口
 */
import { z } from "zod";
import { router, protectedProcedure } from "../lib/trpc";
import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import crypto from "crypto";

// 权限检查：仅经纪机构用户可访问
const brokerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["broker", "admin"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "仅经纪机构用户可访问" });
  }
  return next({ ctx });
});

export const brokerRouter = router({
  // ============================================================
  // 房源管理
  // ============================================================

  /** 获取房源列表 */
  listListings: brokerProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      status: z.enum(["draft", "active", "reserved", "sold", "offline", "all"]).default("all"),
      keyword: z.string().optional(),
      district: z.string().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, pageSize, status, keyword, district, minPrice, maxPrice } = input;
      const offset = (page - 1) * pageSize;
      let where = "WHERE l.org_id = ?";
      const params: any[] = [ctx.user.orgId || 0];
      if (status !== "all") { where += " AND l.status = ?"; params.push(status); }
      if (keyword) { where += " AND (l.title LIKE ? OR l.estate_name LIKE ? OR l.address LIKE ?)"; params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
      if (district) { where += " AND l.district = ?"; params.push(district); }
      if (minPrice) { where += " AND l.listing_price >= ?"; params.push(minPrice); }
      if (maxPrice) { where += " AND l.listing_price <= ?"; params.push(maxPrice); }

      const [rows] = await ctx.db.execute(sql.raw(
        `SELECT l.*, u.name as broker_name FROM listings l LEFT JOIN users u ON l.broker_id = u.id ${where} ORDER BY l.created_at DESC LIMIT ${pageSize} OFFSET ${offset}`,
        params
      )) as any;
      const [countRows] = await ctx.db.execute(sql.raw(
        `SELECT COUNT(*) as total FROM listings l ${where}`, params
      )) as any;
      return { items: rows, total: (countRows as any)[0]?.total || 0, page, pageSize };
    }),

  /** 获取房源详情 */
  getListing: brokerProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [rows] = await ctx.db.execute(sql.raw(
        `SELECT l.*, u.name as broker_name FROM listings l LEFT JOIN users u ON l.broker_id = u.id WHERE l.id = ? AND l.org_id = ?`,
        [input.id, ctx.user.orgId || 0]
      )) as any;
      if (!(rows as any)[0]) throw new TRPCError({ code: "NOT_FOUND", message: "房源不存在" });
      return (rows as any)[0];
    }),

  /** 创建房源 */
  createListing: brokerProcedure
    .input(z.object({
      title: z.string().min(1),
      estateName: z.string().optional(),
      buildingName: z.string().optional(),
      unitNo: z.string().optional(),
      floor: z.number().optional(),
      totalFloors: z.number().optional(),
      area: z.number().optional(),
      rooms: z.string().optional(),
      orientation: z.string().optional(),
      decoration: z.string().optional(),
      city: z.string().optional(),
      district: z.string().optional(),
      address: z.string().optional(),
      listingPrice: z.number().optional(),
      ownershipType: z.string().optional(),
      ownershipYears: z.number().optional(),
      isOnlyHouse: z.boolean().default(false),
      hasMortgage: z.boolean().default(false),
      mortgageAmount: z.number().optional(),
      coverImage: z.string().optional(),
      images: z.array(z.string()).optional(),
      vrUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const listingNo = `LS${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const unitPrice = input.listingPrice && input.area ? input.listingPrice / input.area : null;
      await ctx.db.execute(sql.raw(
        `INSERT INTO listings (org_id, broker_id, listing_no, title, estate_name, building_name, unit_no, floor, total_floors, area, rooms, orientation, decoration, city, district, address, listing_price, unit_price, ownership_type, ownership_years, is_only_house, has_mortgage, mortgage_amount, cover_image, images, vr_url, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [ctx.user.orgId||0, ctx.user.id, listingNo, input.title, input.estateName||null, input.buildingName||null, input.unitNo||null, input.floor||null, input.totalFloors||null, input.area||null, input.rooms||null, input.orientation||null, input.decoration||null, input.city||null, input.district||null, input.address||null, input.listingPrice||null, unitPrice, input.ownershipType||null, input.ownershipYears||null, input.isOnlyHouse?1:0, input.hasMortgage?1:0, input.mortgageAmount||null, input.coverImage||null, input.images?JSON.stringify(input.images):null, input.vrUrl||null, 'draft']
      ));
      return { success: true, listingNo };
    }),

  /** 更新房源 */
  updateListing: brokerProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      listingPrice: z.number().optional(),
      status: z.enum(["draft","active","reserved","sold","offline"]).optional(),
      area: z.number().optional(),
      rooms: z.string().optional(),
      decoration: z.string().optional(),
      coverImage: z.string().optional(),
      images: z.array(z.string()).optional(),
      vrUrl: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...fields } = input;
      const sets: string[] = [];
      const vals: any[] = [];
      if (fields.title !== undefined) { sets.push("title=?"); vals.push(fields.title); }
      if (fields.listingPrice !== undefined) { sets.push("listing_price=?"); vals.push(fields.listingPrice); }
      if (fields.status !== undefined) { sets.push("status=?"); vals.push(fields.status); }
      if (fields.area !== undefined) { sets.push("area=?"); vals.push(fields.area); }
      if (fields.rooms !== undefined) { sets.push("rooms=?"); vals.push(fields.rooms); }
      if (fields.decoration !== undefined) { sets.push("decoration=?"); vals.push(fields.decoration); }
      if (fields.coverImage !== undefined) { sets.push("cover_image=?"); vals.push(fields.coverImage); }
      if (fields.images !== undefined) { sets.push("images=?"); vals.push(JSON.stringify(fields.images)); }
      if (fields.vrUrl !== undefined) { sets.push("vr_url=?"); vals.push(fields.vrUrl); }
      if (sets.length === 0) return { success: true };
      vals.push(id, ctx.user.orgId||0);
      await ctx.db.execute(sql.raw(`UPDATE listings SET ${sets.join(",")} WHERE id=? AND org_id=?`, vals));
      return { success: true };
    }),

  /** 房源统计 */
  listingStats: brokerProcedure
    .query(async ({ ctx }) => {
      const [rows] = await ctx.db.execute(sql.raw(
        `SELECT status, COUNT(*) as count FROM listings WHERE org_id=? GROUP BY status`,
        [ctx.user.orgId||0]
      )) as any;
      const stats: Record<string, number> = { total: 0, active: 0, reserved: 0, sold: 0, draft: 0 };
      for (const r of (rows as any[])) { stats[r.status] = r.count; stats.total += r.count; }
      return stats;
    }),

  // ============================================================
  // 客源管理
  // ============================================================

  /** 获取客源列表 */
  listClients: brokerProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      status: z.string().optional(),
      intentionLevel: z.string().optional(),
      keyword: z.string().optional(),
      brokerId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, pageSize, status, intentionLevel, keyword, brokerId } = input;
      const offset = (page - 1) * pageSize;
      let where = "WHERE c.org_id = ?";
      const params: any[] = [ctx.user.orgId||0];
      if (ctx.user.role !== "admin") { where += " AND c.broker_id = ?"; params.push(ctx.user.id); }
      else if (brokerId) { where += " AND c.broker_id = ?"; params.push(brokerId); }
      if (status) { where += " AND c.status = ?"; params.push(status); }
      if (intentionLevel) { where += " AND c.intention_level = ?"; params.push(intentionLevel); }
      if (keyword) { where += " AND (c.name LIKE ? OR c.phone LIKE ?)"; params.push(`%${keyword}%`, `%${keyword}%`); }
      const [rows] = await ctx.db.execute(sql.raw(
        `SELECT c.*, u.name as broker_name FROM broker_clients c LEFT JOIN users u ON c.broker_id = u.id ${where} ORDER BY c.ai_score DESC, c.updated_at DESC LIMIT ${pageSize} OFFSET ${offset}`,
        params
      )) as any;
      const [countRows] = await ctx.db.execute(sql.raw(`SELECT COUNT(*) as total FROM broker_clients c ${where}`, params)) as any;
      return { items: rows, total: (countRows as any)[0]?.total || 0, page, pageSize };
    }),

  /** 创建客源 */
  createClient: brokerProcedure
    .input(z.object({
      name: z.string().min(1),
      phone: z.string().optional(),
      wechat: z.string().optional(),
      clientType: z.enum(["buyer","renter","seller"]).default("buyer"),
      budgetMin: z.number().optional(),
      budgetMax: z.number().optional(),
      areaMin: z.number().optional(),
      areaMax: z.number().optional(),
      preferredRooms: z.string().optional(),
      preferredDistricts: z.array(z.string()).optional(),
      intentionLevel: z.enum(["high","medium","low","invalid"]).default("medium"),
      source: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // AI意向评分（简单规则：high=80, medium=50, low=20）
      const aiScore = input.intentionLevel === "high" ? 80 : input.intentionLevel === "medium" ? 50 : 20;
      await ctx.db.execute(sql.raw(
        `INSERT INTO broker_clients (org_id, broker_id, name, phone, wechat, client_type, budget_min, budget_max, area_min, area_max, preferred_rooms, preferred_districts, intention_level, source, ai_score, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [ctx.user.orgId||0, ctx.user.id, input.name, input.phone||null, input.wechat||null, input.clientType, input.budgetMin||null, input.budgetMax||null, input.areaMin||null, input.areaMax||null, input.preferredRooms||null, input.preferredDistricts?JSON.stringify(input.preferredDistricts):null, input.intentionLevel, input.source||null, aiScore, input.notes||null]
      ));
      return { success: true };
    }),

  /** 更新客源 */
  updateClient: brokerProcedure
    .input(z.object({
      id: z.number(),
      intentionLevel: z.enum(["high","medium","low","invalid"]).optional(),
      status: z.enum(["new","following","negotiating","signed","completed","lost"]).optional(),
      notes: z.string().optional(),
      nextFollowAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...fields } = input;
      const sets: string[] = [];
      const vals: any[] = [];
      if (fields.intentionLevel !== undefined) { sets.push("intention_level=?"); vals.push(fields.intentionLevel); const s = fields.intentionLevel === "high" ? 80 : fields.intentionLevel === "medium" ? 50 : 20; sets.push("ai_score=?"); vals.push(s); }
      if (fields.status !== undefined) { sets.push("status=?"); vals.push(fields.status); }
      if (fields.notes !== undefined) { sets.push("notes=?"); vals.push(fields.notes); }
      if (fields.nextFollowAt !== undefined) { sets.push("next_follow_at=?"); vals.push(fields.nextFollowAt); }
      if (sets.length === 0) return { success: true };
      vals.push(id, ctx.user.orgId||0);
      await ctx.db.execute(sql.raw(`UPDATE broker_clients SET ${sets.join(",")} WHERE id=? AND org_id=?`, vals));
      return { success: true };
    }),

  // ============================================================
  // 带看记录
  // ============================================================

  /** 创建带看预约 */
  createViewing: brokerProcedure
    .input(z.object({
      listingId: z.number(),
      clientId: z.number(),
      scheduledAt: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.execute(sql.raw(
        `INSERT INTO viewings (org_id, broker_id, listing_id, client_id, scheduled_at) VALUES (?,?,?,?,?)`,
        [ctx.user.orgId||0, ctx.user.id, input.listingId, input.clientId, input.scheduledAt]
      ));
      return { success: true };
    }),

  /** 获取带看列表 */
  listViewings: brokerProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      status: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, pageSize, status } = input;
      const offset = (page - 1) * pageSize;
      let where = "WHERE v.org_id = ? AND v.broker_id = ?";
      const params: any[] = [ctx.user.orgId||0, ctx.user.id];
      if (status) { where += " AND v.status = ?"; params.push(status); }
      const [rows] = await ctx.db.execute(sql.raw(
        `SELECT v.*, l.title as listing_title, l.address as listing_address, c.name as client_name, c.phone as client_phone FROM viewings v LEFT JOIN listings l ON v.listing_id = l.id LEFT JOIN broker_clients c ON v.client_id = c.id ${where} ORDER BY v.scheduled_at DESC LIMIT ${pageSize} OFFSET ${offset}`,
        params
      )) as any;
      const [countRows] = await ctx.db.execute(sql.raw(`SELECT COUNT(*) as total FROM viewings v ${where}`, params)) as any;
      return { items: rows, total: (countRows as any)[0]?.total || 0, page, pageSize };
    }),

  /** 更新带看状态 */
  updateViewing: brokerProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["scheduled","completed","cancelled","no_show"]),
      feedback: z.string().optional(),
      clientRating: z.number().min(1).max(5).optional(),
      followUp: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, status, feedback, clientRating, followUp } = input;
      await ctx.db.execute(sql.raw(
        `UPDATE viewings SET status=?, feedback=?, client_rating=?, follow_up=?, actual_at=? WHERE id=? AND org_id=?`,
        [status, feedback||null, clientRating||null, followUp||null, status==="completed"?new Date():null, id, ctx.user.orgId||0]
      ));
      return { success: true };
    }),

  // ============================================================
  // 二手房交易管理
  // ============================================================

  /** 获取交易列表 */
  listTransactions: brokerProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      status: z.string().optional(),
      keyword: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, pageSize, status, keyword } = input;
      const offset = (page - 1) * pageSize;
      let where = "WHERE t.org_id = ?";
      const params: any[] = [ctx.user.orgId||0];
      if (status) { where += " AND t.status = ?"; params.push(status); }
      if (keyword) { where += " AND (t.transaction_no LIKE ? OR l.title LIKE ?)"; params.push(`%${keyword}%`, `%${keyword}%`); }
      const [rows] = await ctx.db.execute(sql.raw(
        `SELECT t.*, l.title as listing_title, l.address as listing_address, l.area as listing_area, sc.name as seller_name, bc.name as buyer_name FROM transactions t LEFT JOIN listings l ON t.listing_id = l.id LEFT JOIN broker_clients sc ON t.seller_client_id = sc.id LEFT JOIN broker_clients bc ON t.buyer_client_id = bc.id ${where} ORDER BY t.created_at DESC LIMIT ${pageSize} OFFSET ${offset}`,
        params
      )) as any;
      const [countRows] = await ctx.db.execute(sql.raw(`SELECT COUNT(*) as total FROM transactions t LEFT JOIN listings l ON t.listing_id = l.id ${where}`, params)) as any;
      return { items: rows, total: (countRows as any)[0]?.total || 0, page, pageSize };
    }),

  /** 创建交易 */
  createTransaction: brokerProcedure
    .input(z.object({
      listingId: z.number(),
      sellerClientId: z.number().optional(),
      buyerClientId: z.number().optional(),
      transactionType: z.enum(["sale","rent"]).default("sale"),
      agreedPrice: z.number().optional(),
      depositAmount: z.number().optional(),
      downPayment: z.number().optional(),
      loanAmount: z.number().optional(),
      commissionRate: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const transactionNo = `TX${Date.now()}${Math.floor(Math.random()*1000)}`;
      const totalCommission = input.agreedPrice && input.commissionRate ? input.agreedPrice * input.commissionRate : null;
      const halfComm = totalCommission ? totalCommission / 2 : null;
      await ctx.db.execute(sql.raw(
        `INSERT INTO transactions (org_id, transaction_no, listing_id, seller_client_id, buyer_client_id, seller_broker_id, buyer_broker_id, transaction_type, agreed_price, deposit_amount, down_payment, loan_amount, commission_rate, total_commission, seller_commission, buyer_commission) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [ctx.user.orgId||0, transactionNo, input.listingId, input.sellerClientId||null, input.buyerClientId||null, ctx.user.id, ctx.user.id, input.transactionType, input.agreedPrice||null, input.depositAmount||null, input.downPayment||null, input.loanAmount||null, input.commissionRate||null, totalCommission, halfComm, halfComm]
      ));
      // 更新房源状态为已预订
      await ctx.db.execute(sql.raw(`UPDATE listings SET status='reserved' WHERE id=? AND org_id=?`, [input.listingId, ctx.user.orgId||0]));
      return { success: true, transactionNo };
    }),

  /** 更新交易状态（推进交易节点） */
  advanceTransaction: brokerProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["negotiating","deposit_paid","contract_signed","loan_processing","transferring","completed","cancelled"]),
      contractFileUrl: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const timeField: Record<string, string> = {
        deposit_paid: "deposit_paid_at",
        contract_signed: "contract_signed_at",
        loan_processing: "loan_approved_at",
        transferring: "transfer_at",
        completed: "handover_at",
      };
      const sets = ["status=?"];
      const vals: any[] = [input.status];
      if (timeField[input.status]) { sets.push(`${timeField[input.status]}=NOW()`); }
      if (input.contractFileUrl) { sets.push("contract_file_url=?"); vals.push(input.contractFileUrl); }
      if (input.notes) { sets.push("notes=?"); vals.push(input.notes); }
      vals.push(input.id, ctx.user.orgId||0);
      await ctx.db.execute(sql.raw(`UPDATE transactions SET ${sets.join(",")} WHERE id=? AND org_id=?`, vals));
      // 交易完成时更新房源为已售
      if (input.status === "completed") {
        const [txRows] = await ctx.db.execute(sql.raw(`SELECT listing_id FROM transactions WHERE id=?`, [input.id])) as any;
        if ((txRows as any)[0]) {
          await ctx.db.execute(sql.raw(`UPDATE listings SET status='sold' WHERE id=?`, [(txRows as any)[0].listing_id]));
        }
      }
      return { success: true };
    }),

  /** 交易统计 */
  transactionStats: brokerProcedure
    .query(async ({ ctx }) => {
      const [rows] = await ctx.db.execute(sql.raw(
        `SELECT status, COUNT(*) as count, SUM(agreed_price) as total_amount, SUM(total_commission) as total_commission FROM transactions WHERE org_id=? GROUP BY status`,
        [ctx.user.orgId||0]
      )) as any;
      const stats: any = { total: 0, totalAmount: 0, totalCommission: 0, byStatus: {} };
      for (const r of (rows as any[])) {
        stats.byStatus[r.status] = { count: r.count, amount: r.total_amount, commission: r.total_commission };
        stats.total += r.count;
        stats.totalAmount += Number(r.total_amount || 0);
        stats.totalCommission += Number(r.total_commission || 0);
      }
      return stats;
    }),

  // ============================================================
  // 专属营销接口
  // ============================================================

  /** 创建营销链接 */
  createMarketingLink: brokerProcedure
    .input(z.object({
      linkType: z.enum(["listing","report","campaign","referral"]).default("listing"),
      listingId: z.number().optional(),
      reportId: z.number().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      coverImage: z.string().optional(),
      hasWatermark: z.boolean().default(true),
      requirePhone: z.boolean().default(false),
      expiresAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const linkCode = crypto.randomBytes(12).toString("hex");
      await ctx.db.execute(sql.raw(
        `INSERT INTO marketing_links (org_id, broker_id, link_code, link_type, listing_id, report_id, title, description, cover_image, has_watermark, require_phone, expires_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [ctx.user.orgId||0, ctx.user.id, linkCode, input.linkType, input.listingId||null, input.reportId||null, input.title||null, input.description||null, input.coverImage||null, input.hasWatermark?1:0, input.requirePhone?1:0, input.expiresAt||null]
      ));
      return { success: true, linkCode, shareUrl: `/share/${linkCode}` };
    }),

  /** 获取营销链接列表 */
  listMarketingLinks: brokerProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const { page, pageSize } = input;
      const offset = (page - 1) * pageSize;
      const [rows] = await ctx.db.execute(sql.raw(
        `SELECT ml.*, l.title as listing_title FROM marketing_links ml LEFT JOIN listings l ON ml.listing_id = l.id WHERE ml.broker_id=? ORDER BY ml.created_at DESC LIMIT ${pageSize} OFFSET ${offset}`,
        [ctx.user.id]
      )) as any;
      const [countRows] = await ctx.db.execute(sql.raw(`SELECT COUNT(*) as total FROM marketing_links WHERE broker_id=?`, [ctx.user.id])) as any;
      return { items: rows, total: (countRows as any)[0]?.total || 0, page, pageSize };
    }),

  /** 营销链接统计汇总 */
  marketingStats: brokerProcedure
    .query(async ({ ctx }) => {
      const [rows] = await ctx.db.execute(sql.raw(
        `SELECT SUM(view_count) as total_views, SUM(unique_view_count) as total_unique_views, SUM(lead_count) as total_leads, COUNT(*) as total_links FROM marketing_links WHERE broker_id=?`,
        [ctx.user.id]
      )) as any;
      const [visitRows] = await ctx.db.execute(sql.raw(
        `SELECT DATE(v.created_at) as date, COUNT(*) as visits FROM marketing_link_visits v JOIN marketing_links ml ON v.link_id = ml.id WHERE ml.broker_id=? AND v.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(v.created_at) ORDER BY date`,
        [ctx.user.id]
      )) as any;
      return { summary: (rows as any)[0], trend: visitRows };
    }),

  /** 记录营销链接访问（公开接口） */
  recordLinkVisit: protectedProcedure
    .input(z.object({
      linkCode: z.string(),
      visitorPhone: z.string().optional(),
      visitorName: z.string().optional(),
      durationSeconds: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const [linkRows] = await ctx.db.execute(sql.raw(`SELECT id FROM marketing_links WHERE link_code=? AND is_active=1`, [input.linkCode])) as any;
      if (!(linkRows as any)[0]) throw new TRPCError({ code: "NOT_FOUND", message: "链接不存在或已失效" });
      const linkId = (linkRows as any)[0].id;
      const isLead = !!input.visitorPhone;
      await ctx.db.execute(sql.raw(
        `INSERT INTO marketing_link_visits (link_id, visitor_phone, visitor_name, duration_seconds, is_lead) VALUES (?,?,?,?,?)`,
        [linkId, input.visitorPhone||null, input.visitorName||null, input.durationSeconds, isLead?1:0]
      ));
      await ctx.db.execute(sql.raw(
        `UPDATE marketing_links SET view_count=view_count+1, unique_view_count=unique_view_count+1${isLead?", lead_count=lead_count+1":""} WHERE id=?`,
        [linkId]
      ));
      return { success: true };
    }),

  /** 获取营销链接的访问线索 */
  getLinkLeads: brokerProcedure
    .input(z.object({ linkCode: z.string() }))
    .query(async ({ ctx, input }) => {
      const [rows] = await ctx.db.execute(sql.raw(
        `SELECT v.* FROM marketing_link_visits v JOIN marketing_links ml ON v.link_id = ml.id WHERE ml.link_code=? AND ml.broker_id=? AND v.is_lead=1 ORDER BY v.created_at DESC`,
        [input.linkCode, ctx.user.id]
      )) as any;
      return rows;
    }),

  // ============================================================
  // 经纪机构仪表盘统计
  // ============================================================

  /** 仪表盘统计 */
  dashboardStats: brokerProcedure
    .query(async ({ ctx }) => {
      const orgId = ctx.user.orgId || 0;
      const brokerId = ctx.user.id;
      const [listingStats] = await ctx.db.execute(sql.raw(`SELECT COUNT(*) as total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active, SUM(CASE WHEN status='sold' THEN 1 ELSE 0 END) as sold FROM listings WHERE org_id=?`, [orgId])) as any;
      const [clientStats] = await ctx.db.execute(sql.raw(`SELECT COUNT(*) as total, SUM(CASE WHEN intention_level='high' THEN 1 ELSE 0 END) as high_intention FROM broker_clients WHERE broker_id=?`, [brokerId])) as any;
      const [txStats] = await ctx.db.execute(sql.raw(`SELECT COUNT(*) as total, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed, SUM(CASE WHEN status='completed' THEN total_commission ELSE 0 END) as total_commission FROM transactions WHERE org_id=?`, [orgId])) as any;
      const [viewingStats] = await ctx.db.execute(sql.raw(`SELECT COUNT(*) as scheduled FROM viewings WHERE broker_id=? AND status='scheduled' AND scheduled_at >= NOW()`, [brokerId])) as any;
      return {
        listings: (listingStats as any)[0],
        clients: (clientStats as any)[0],
        transactions: (txStats as any)[0],
        viewings: (viewingStats as any)[0],
      };
    }),
});
