/**
 * 数据采集模板 tRPC 路由
 */
import { z } from 'zod';
import { router, adminProcedure } from '../lib/trpc';
import { db } from '../lib/db';
import { crawlTemplates, type InsertCrawlTemplate } from '../lib/schema';
import { eq, desc, count } from 'drizzle-orm';

// Zod 验证 schema
const TemplateConfigSchema = z.object({
  start_url: z.string().url(),
  list_item_selector: z.string(),
  detail_page_link_selector: z.string().optional(),
  pagination_selector: z.string().optional(),
  max_pages: z.number().min(1).default(1),
  use_proxy: z.boolean().default(false),
  delay: z.number().min(0).default(2),
  fields: z.array(z.object({
    name: z.string(),
    selector: z.string(),
    target_table: z.string(),
    target_column: z.string(),
  })),
});

const CreateTemplateSchema = z.object({
  name: z.string().min(1, '模板名称不能为空'),
  description: z.string().optional(),
  configJson: TemplateConfigSchema,
});

const UpdateTemplateSchema = CreateTemplateSchema.partial().extend({ id: z.number() });

export const crawlTemplatesRouter = router({
  /** 创建模板 */
  create: adminProcedure
    .input(CreateTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      const { name, description, configJson } = input;
      const [existing] = await db.select().from(crawlTemplates).where(eq(crawlTemplates.name, name)).limit(1);
      if (existing) {
        throw new Error('同名模板已存在');
      }
      const newTemplate: InsertCrawlTemplate = {
        name,
        description,
        configJson,
        createdBy: ctx.user.id,
      };
      const [result] = await db.insert(crawlTemplates).values(newTemplate);
      return { id: result.insertId, ...newTemplate };
    }),

  /** 获取模板列表 */
  list: adminProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(async ({ input }) => {
      const { page, pageSize } = input;
      const offset = (page - 1) * pageSize;
      const [templates, totalResult] = await Promise.all([
        db.select().from(crawlTemplates).orderBy(desc(crawlTemplates.createdAt)).limit(pageSize).offset(offset),
        db.select({ count: count() }).from(crawlTemplates),
      ]);
      return { items: templates, total: totalResult[0]?.count ?? 0 };
    }),

  /** 获取单个模板 */
  get: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [template] = await db.select().from(crawlTemplates).where(eq(crawlTemplates.id, input.id)).limit(1);
      if (!template) {
        throw new Error('模板不存在');
      }
      return template;
    }),

  /** 更新模板 */
  update: adminProcedure
    .input(UpdateTemplateSchema)
    .mutation(async ({ input }) => {
      const { id, ...dataToUpdate } = input;
      await db.update(crawlTemplates).set(dataToUpdate).where(eq(crawlTemplates.id, id));
      return { success: true };
    }),

  /** 删除模板 */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(crawlTemplates).where(eq(crawlTemplates.id, input.id));
      return { success: true };
    }),
});
