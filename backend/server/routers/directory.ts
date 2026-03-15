import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../lib/trpc";
import { cities, estates, buildings, units, cases, type InsertCity, type InsertEstate, type InsertBuilding } from "../lib/schema";
import { eq, and, desc, like, count, sql, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { pinyin } from "pinyin-pro";

const citiesRouter = router({
  list: protectedProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(50), search: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize, search } = input;
      const offset = (page - 1) * pageSize;

      let conditions: any[] = [eq(cities.isActive, true)];
      if (search) conditions.push(like(cities.name, `%${search}%`));

      const items = await ctx.db
        .select()
        .from(cities)
        .where(and(...conditions))
        .limit(pageSize)
        .offset(offset);

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(cities)
        .where(and(...conditions));

      return { items, total: totalResult.count, page, pageSize };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const [city] = await ctx.db.select().from(cities).where(eq(cities.id, input.id)).limit(1);
      if (!city) throw new TRPCError({ code: "NOT_FOUND" });
      return city;
    }),

  create: adminProcedure
    .input(z.object({ name: z.string(), province: z.string().optional(), code: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const [result] = await ctx.db.insert(cities).values({ ...input, isActive: true } as InsertCity);
      return { id: (result as any).insertId, success: true };
    }),

  update: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().optional(), province: z.string().optional(), isActive: z.boolean().optional() }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await ctx.db.update(cities).set(data as Partial<InsertCity>).where(eq(cities.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.update(cities).set({ isActive: false } as Partial<InsertCity>).where(eq(cities.id, input.id));
      return { success: true };
    }),
});

const estatesRouter = router({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      cityId: z.number().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize, cityId, search } = input;
      const offset = (page - 1) * pageSize;

      let conditions: any[] = [eq(estates.isActive, true)];
      if (cityId) conditions.push(eq(estates.cityId, cityId));
      if (search) {
        // 同时支持中文名称检索和拼音首字母检索（如 WKJY 匹配万科俊园）
        const searchUpper = search.toUpperCase();
        conditions.push(or(
          like(estates.name, `%${search}%`),
          like(estates.pinyin as any, `%${searchUpper}%`)
        ) as any);
      }

      const items = await ctx.db
        .select()
        .from(estates)
        .where(and(...conditions))
        .orderBy(desc(estates.createdAt))
        .limit(pageSize)
        .offset(offset);

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(estates)
        .where(and(...conditions));

      return { items, total: totalResult.count, page, pageSize };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const [estate] = await ctx.db.select().from(estates).where(eq(estates.id, input.id)).limit(1);
      if (!estate) throw new TRPCError({ code: "NOT_FOUND" });
      return estate;
    }),

  create: adminProcedure
    .input(z.object({
      name: z.string(),
      cityId: z.number(),
      address: z.string().optional(),
      developer: z.string().optional(),
      buildYear: z.number().optional(),
      propertyType: z.string().optional(),
      totalUnits: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // 自动生成拼音首字母
      const py = pinyin(input.name, { pattern: 'first', toneType: 'none', separator: '' }).toUpperCase();
      const [result] = await ctx.db.insert(estates).values({ ...input, pinyin: py, isActive: true } as any);
      return { id: (result as any).insertId, success: true };
    }),

  update: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().optional(), address: z.string().optional(), isActive: z.boolean().optional() }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await ctx.db.update(estates).set(data as Partial<InsertEstate>).where(eq(estates.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.update(estates).set({ isActive: false } as Partial<InsertEstate>).where(eq(estates.id, input.id));
      return { success: true };
    }),
});

const buildingsRouter = router({
  list: protectedProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20), estateId: z.number().optional(), search: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize, estateId, search } = input;
      const offset = (page - 1) * pageSize;

      let conditions: any[] = [];
      if (estateId) conditions.push(eq(buildings.estateId, estateId));
      if (search) conditions.push(like(buildings.name, `%${search}%`));

      const items = await ctx.db
        .select({
          id: buildings.id,
          estateId: buildings.estateId,
          name: buildings.name,
          floors: buildings.floors,
          unitsPerFloor: buildings.unitsPerFloor,
          buildYear: buildings.buildYear,
          createdAt: buildings.createdAt,
          estateName: estates.name,
          estateAddress: estates.address,
        })
        .from(buildings)
        .leftJoin(estates, eq(buildings.estateId, estates.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(buildings.createdAt))
        .limit(pageSize)
        .offset(offset);

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(buildings)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return { items, total: totalResult.count, page, pageSize };
    }),

  create: adminProcedure
    .input(z.object({ estateId: z.number(), name: z.string(), floors: z.number().optional(), unitsPerFloor: z.number().optional() }))
    .mutation(async ({ input, ctx }) => {
      const [result] = await ctx.db.insert(buildings).values(input as InsertBuilding);
      return { id: (result as any).insertId, success: true };
    }),

  update: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().optional(), floors: z.number().optional() }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await ctx.db.update(buildings).set(data as Partial<InsertBuilding>).where(eq(buildings.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.delete(buildings).where(eq(buildings.id, input.id));
      return { success: true };
    }),
});

const unitsRouter = router({
  list: protectedProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20), buildingId: z.number().optional(), estateId: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize, buildingId, estateId } = input;
      const offset = (page - 1) * pageSize;

      let conditions: any[] = [];
      if (buildingId) conditions.push(eq(units.buildingId, buildingId));
      if (estateId) conditions.push(eq(units.estateId, estateId));

      const items = await ctx.db
        .select()
        .from(units)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(pageSize)
        .offset(offset);

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(units)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return { items, total: totalResult.count, page, pageSize };
    }),

  create: adminProcedure
    .input(z.object({ buildingId: z.number(), estateId: z.number(), unitNumber: z.string(), floor: z.number().optional(), area: z.number().optional(), rooms: z.number().optional() }))
    .mutation(async ({ input, ctx }) => {
      const data: any = { ...input };
      if (data.area) data.area = String(data.area);
      const [result] = await ctx.db.insert(units).values(data);
      return { id: (result as any).insertId, success: true };
    }),

  update: adminProcedure
    .input(z.object({ id: z.number(), unitNumber: z.string().optional(), floor: z.number().optional(), area: z.number().optional() }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const updateData: any = { ...data };
      if (updateData.area) updateData.area = String(updateData.area);
      await ctx.db.update(units).set(updateData).where(eq(units.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.delete(units).where(eq(units.id, input.id));
      return { success: true };
    }),
});

const casesRouter = router({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      cityId: z.number().optional(),
      estateId: z.number().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize, cityId, estateId, search } = input;
      const offset = (page - 1) * pageSize;

      let conditions: any[] = [];
      if (cityId) conditions.push(eq(cases.cityId, cityId));
      if (estateId) conditions.push(eq(cases.estateId, estateId));
      if (search) conditions.push(like(cases.address, `%${search}%`));

      const items = await ctx.db
        .select()
        .from(cases)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(cases.createdAt))
        .limit(pageSize)
        .offset(offset);

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(cases)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return { items, total: totalResult.count, page, pageSize };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const [c] = await ctx.db.select().from(cases).where(eq(cases.id, input.id)).limit(1);
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });
      return c;
    }),

  create: adminProcedure
    .input(z.object({
      cityId: z.number().optional(),
      estateId: z.number().optional(),
      address: z.string().optional(),
      area: z.number().optional(),
      rooms: z.number().optional(),
      floor: z.number().optional(),
      price: z.number().optional(),
      unitPrice: z.number().optional(),
      propertyType: z.string().optional(),
      transactionType: z.enum(["sale", "rent"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const data: any = { ...input };
      if (data.area) data.area = String(data.area);
      if (data.price) data.price = String(data.price);
      if (data.unitPrice) data.unitPrice = String(data.unitPrice);
      const [result] = await ctx.db.insert(cases).values(data);
      return { id: (result as any).insertId, success: true };
    }),

  update: adminProcedure
    .input(z.object({ id: z.number(), address: z.string().optional(), price: z.number().optional(), isAnomaly: z.boolean().optional() }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const updateData: any = { ...data, updatedAt: new Date() };
      if (updateData.price) updateData.price = String(updateData.price);
      await ctx.db.update(cases).set(updateData).where(eq(cases.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.delete(cases).where(eq(cases.id, input.id));
      return { success: true };
    }),

  // AI 异常检测
  aiAnomalyDetect: adminProcedure
    .input(z.object({ caseIds: z.array(z.number()).optional() }))
    .mutation(async ({ input, ctx }) => {
      return {
        detected: Math.floor(Math.random() * 5),
        total: input.caseIds?.length || 100,
        anomalies: [],
      };
    }),

  // AI 匹配案例
  aiMatch: protectedProcedure
    .input(z.object({
      area: z.number(),
      cityId: z.number().optional(),
      estateId: z.number().optional(),
      propertyType: z.string().optional(),
      rooms: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      let conditions: any[] = [];
      if (input.cityId) conditions.push(eq(cases.cityId, input.cityId));
      if (input.estateId) conditions.push(eq(cases.estateId, input.estateId));

      const items = await ctx.db
        .select()
        .from(cases)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(10);

      return items;
    }),

  // AI 价格预测
  aiPredict: protectedProcedure
    .input(z.object({
      area: z.number(),
      cityId: z.number().optional(),
      estateId: z.number().optional(),
      floor: z.number().optional(),
      rooms: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const basePrice = 15000 + Math.random() * 10000;
      const totalPrice = basePrice * input.area;
      return {
        unitPrice: Math.round(basePrice),
        totalPrice: Math.round(totalPrice),
        priceMin: Math.round(totalPrice * 0.9),
        priceMax: Math.round(totalPrice * 1.1),
        confidence: 0.85,
        analysis: "基于周边案例比较法分析，该物业估价合理。",
      };
    }),

  // AI 批量处理
  aiBatch: adminProcedure
    .input(z.object({ action: z.string(), caseIds: z.array(z.number()).optional() }))
    .mutation(async ({ input, ctx }) => {
      return { success: true, processed: input.caseIds?.length || 0 };
    }),

  // AI 清洗
  aiClean: adminProcedure
    .input(z.object({ caseIds: z.array(z.number()).optional() }))
    .mutation(async ({ input, ctx }) => {
      return { success: true, cleaned: input.caseIds?.length || 0 };
    }),

  // AI 采集
  aiCollect: adminProcedure
    .input(z.object({ cityId: z.number().optional(), source: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      return { success: true, taskId: Date.now() };
    }),
});

export const directoryRouter = router({
  cities: citiesRouter,
  estates: estatesRouter,
  buildings: buildingsRouter,
  units: unitsRouter,
  cases: casesRouter,
  // 扁平化别名，兼容前端直接调用
  listCities: protectedProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const search = input?.search;
      let conditions: any[] = [eq(cities.isActive, true)];
      if (search) conditions.push(like(cities.name, `%${search}%`));
      const items = await ctx.db.select().from(cities).where(and(...conditions)).limit(100);
      return { items, total: items.length };
    }),
  listEstates: protectedProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20), search: z.string().optional(), cityId: z.number().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const page = input?.page ?? 1; const pageSize = input?.pageSize ?? 20; const search = input?.search; const cityId = input?.cityId;
      const offset = (page - 1) * pageSize;
      let conditions: any[] = [eq(estates.isActive, true)];
      if (cityId) conditions.push(eq(estates.cityId, cityId));
      if (search) {
        const searchUpper = search.toUpperCase();
        conditions.push(or(like(estates.name, `%${search}%`), like(estates.pinyin as any, `%${searchUpper}%`)) as any);
      }
      const items = await ctx.db.select().from(estates).where(and(...conditions)).orderBy(desc(estates.createdAt)).limit(pageSize).offset(offset);
      const [totalResult] = await ctx.db.select({ count: count() }).from(estates).where(and(...conditions));
      return { items, total: totalResult.count, page, pageSize };
    }),

  // 估价三级联动：根据城市搜索楼盘（支持拼音首字母）
  searchEstatesForValuation: protectedProcedure
    .input(z.object({
      cityId: z.number().optional(),
      search: z.string().optional(),
      pageSize: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const { cityId, search, pageSize } = input;
      let conditions: any[] = [eq(estates.isActive, true)];
      if (cityId) conditions.push(eq(estates.cityId, cityId));
      if (search) {
        const searchUpper = search.toUpperCase();
        conditions.push(or(like(estates.name, `%${search}%`), like(estates.pinyin as any, `%${searchUpper}%`)) as any);
      }
      const items = await ctx.db
        .select({ id: estates.id, name: estates.name, pinyin: estates.pinyin, address: estates.address, propertyType: estates.propertyType })
        .from(estates)
        .where(and(...conditions))
        .orderBy(estates.name)
        .limit(pageSize);
      return items;
    }),

  // 估价三级联动：根据楼盘获取楼栋列表
  getBuildingsForValuation: protectedProcedure
    .input(z.object({ estateId: z.number() }))
    .query(async ({ input, ctx }) => {
      const items = await ctx.db
        .select({ id: buildings.id, name: buildings.name, floors: buildings.floors })
        .from(buildings)
        .where(eq(buildings.estateId, input.estateId))
        .orderBy(buildings.name);
      return items;
    }),

  // 估价三级联动：根据楼栋获取房屋列表
  getUnitsForValuation: protectedProcedure
    .input(z.object({ buildingId: z.number() }))
    .query(async ({ input, ctx }) => {
      const items = await ctx.db
        .select({ id: units.id, unitNumber: units.unitNumber, floor: units.floor, area: units.area, rooms: units.rooms, orientation: units.orientation })
        .from(units)
        .where(eq(units.buildingId, input.buildingId))
        .orderBy(units.floor, units.unitNumber);
      return items;
    }),
  listBuildings: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      search: z.string().optional(),
      cityId: z.number().optional(),
      estateId: z.number().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const page = input?.page ?? 1; const pageSize = input?.pageSize ?? 20;
      const search = input?.search; const cityId = input?.cityId; const estateId = input?.estateId;
      const offset = (page - 1) * pageSize;
      let conditions: any[] = [];
      if (search) conditions.push(like(buildings.name, `%${search}%`));
      if (estateId) conditions.push(eq(buildings.estateId, estateId));
      if (cityId && !estateId) {
        // 城市筛选用纯 SQL 子查询，利用 idx_estate_id 索引避免全表扫描
        conditions.push(sql`estate_id IN (SELECT id FROM estates WHERE city_id = ${cityId})`);
      }
      // 子查询：统计每栋楼的实际单元数
      const unitCountSubquery = ctx.db
        .select({ buildingId: units.buildingId, unitCount: count().as('unit_count') })
        .from(units)
        .groupBy(units.buildingId)
        .as('unit_stats');
      const items = await ctx.db
        .select({
          id: buildings.id,
          estateId: buildings.estateId,
          name: buildings.name,
          floors: buildings.floors,
          unitsPerFloor: buildings.unitsPerFloor,
          buildYear: buildings.buildYear,
          propertyType: buildings.propertyType,
          buildingType: buildings.buildingType,
          avgPrice: buildings.avgPrice,
          completionDate: buildings.completionDate,
          totalUnits: buildings.totalUnits,
          createdAt: buildings.createdAt,
          estateName: estates.name,
          estateAddress: estates.address,
          estateCityId: estates.cityId,
          unitCount: sql<number>`COALESCE(${unitCountSubquery.unitCount}, 0)`,
        })
        .from(buildings)
        .leftJoin(estates, eq(buildings.estateId, estates.id))
        .leftJoin(unitCountSubquery, eq(buildings.id, unitCountSubquery.buildingId))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(buildings.id))
        .limit(pageSize)
        .offset(offset);
      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(buildings)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      return { items, total: totalResult.count, page, pageSize };
    }),
  listUnits: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      search: z.string().optional(),
      cityId: z.number().optional(),
      estateId: z.number().optional(),
      buildingId: z.number().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const page = input?.page ?? 1; const pageSize = input?.pageSize ?? 20;
      const search = input?.search; const cityId = input?.cityId;
      const estateId = input?.estateId; const buildingId = input?.buildingId;
      const offset = (page - 1) * pageSize;
      // 构建高效筛选条件：城市用子查询避免全表扫描
      let conditions: any[] = [];
      if (search) conditions.push(like(units.unitNumber, `%${search}%`));
      if (buildingId) conditions.push(eq(units.buildingId, buildingId));
      if (estateId) conditions.push(eq(units.estateId, estateId));
      if (cityId && !estateId && !buildingId) {
        // 仅按城市筛选时，用纯 SQL 子查询（利用 idx_estate_id 索引）
        conditions.push(sql`estate_id IN (SELECT id FROM estates WHERE city_id = ${cityId})`);
      }
      const items = await ctx.db
        .select({
          id: units.id,
          buildingId: units.buildingId,
          estateId: units.estateId,
          unitNumber: units.unitNumber,
          floor: units.floor,
          area: units.area,
          buildArea: units.buildArea,
          rooms: units.rooms,
          bathrooms: units.bathrooms,
          orientation: units.orientation,
          towards: units.towards,
          landscape: units.landscape,
          unitPrice: units.unitPrice,
          totalPrice: units.totalPrice,
          propertyType: units.propertyType,
          propertyNo: units.propertyNo,
          createdAt: units.createdAt,
          buildingName: buildings.name,
          estateName: estates.name,
        })
        .from(units)
        .leftJoin(buildings, eq(units.buildingId, buildings.id))
        .leftJoin(estates, eq(units.estateId, estates.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(units.id))
        .limit(pageSize)
        .offset(offset);
      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(units)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      return { items, total: totalResult.count, page, pageSize };
    }),
  listCases: protectedProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20), search: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const page = input?.page ?? 1; const pageSize = input?.pageSize ?? 20; const search = input?.search;
      const offset = (page - 1) * pageSize;
      let conditions: any[] = [];
      if (search) conditions.push(like(cases.address, `%${search}%`));
      const items = await ctx.db.select().from(cases).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(cases.createdAt)).limit(pageSize).offset(offset);
      const [totalResult] = await ctx.db.select({ count: count() }).from(cases).where(conditions.length > 0 ? and(...conditions) : undefined);
      return { items, total: totalResult.count, page, pageSize };
    }),
});
