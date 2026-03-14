import { z } from "zod"
import { eq, and, ne } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { router, protectedProcedure } from "../lib/trpc"
import { db } from "../lib/db"
import { users, organizations, type InsertUser } from "../lib/schema"

export const teamRouter = router({
  // 列出本机构所有成员
  listMembers: protectedProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ ctx }) => {
      const user = ctx.user
      if (!user.orgId) throw new Error("您未关联任何机构")

      const members = await db
        .select({
          id: users.id,
          username: users.username,
          realName: users.realName,
          email: users.email,
          phone: users.phone,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.orgId, user.orgId))

      const org = await db.select().from(organizations).where(eq(organizations.id, user.orgId)).limit(1)

      return {
        members,
        org: org[0] ?? null,
      }
    }),

  // 创建子账户
  createMember: protectedProcedure
    .input(z.object({
      username: z.string().min(2),
      password: z.string().min(6),
      realName: z.string().optional(),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user
      if (!user.orgId) throw new Error("您未关联任何机构")

      // 检查用户名是否已存在
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, input.username)).limit(1)
      if (existing.length > 0) throw new Error("用户名已存在")

      const passwordHash = await bcrypt.hash(input.password, 10)

      // 获取本机构的角色
      const orgData = await db.select({ type: organizations.type }).from(organizations).where(eq(organizations.id, user.orgId)).limit(1)
      const orgType = orgData[0]?.type ?? "appraiser"
      const roleMap: Record<string, string> = {
        appraiser: "appraiser",
        bank: "bank",
        investor: "investor",
      }
      const role = roleMap[orgType] ?? "appraiser"

      const [newUser] = await db.insert(users).values({
        username: input.username,
        passwordHash,
        realName: input.realName ?? null,
        email: input.email || null,
        phone: input.phone ?? null,
        role: role as any,
        orgId: user.orgId,
        isActive: true,
      } as InsertUser).$returningId()

      return { success: true, userId: newUser.id }
    }),

  // 更新成员信息
  updateMember: protectedProcedure
    .input(z.object({
      userId: z.number(),
      username: z.string().min(2).optional(),
      realName: z.string().optional(),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().optional(),
      password: z.string().min(6).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user
      if (!user.orgId) throw new Error("您未关联任何机构")

      // 确保目标用户属于同一机构
      const target = await db.select({ id: users.id, orgId: users.orgId }).from(users).where(eq(users.id, input.userId)).limit(1)
      if (!target[0] || target[0].orgId !== user.orgId) throw new Error("无权操作此用户")

      const updateData: any = {}
      if (input.username) updateData.username = input.username
      if (input.realName !== undefined) updateData.realName = input.realName
      if (input.email !== undefined) updateData.email = input.email || null
      if (input.phone !== undefined) updateData.phone = input.phone
      if (input.password) updateData.passwordHash = await bcrypt.hash(input.password, 10)

      await db.update(users).set(updateData as Partial<InsertUser>).where(eq(users.id, input.userId))
      return { success: true }
    }),

  // 启用/禁用成员
  toggleMember: protectedProcedure
    .input(z.object({
      userId: z.number(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user
      if (!user.orgId) throw new Error("您未关联任何机构")
      if (input.userId === user.id) throw new Error("不能操作自己的账号")

      const target = await db.select({ id: users.id, orgId: users.orgId }).from(users).where(eq(users.id, input.userId)).limit(1)
      if (!target[0] || target[0].orgId !== user.orgId) throw new Error("无权操作此用户")

      await db.update(users).set({ isActive: input.isActive } as Partial<InsertUser>).where(eq(users.id, input.userId))
      return { success: true }
    }),
})
