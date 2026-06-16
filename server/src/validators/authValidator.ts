import { z } from 'zod'
import { Role } from '@prisma/client'

const passwordSchema = z.string()
  .min(6, '密码长度至少为6位')
  .max(50, '密码长度不能超过50位')

const phoneSchema = z.string()
  .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码')

const emailSchema = z.string()
  .email('请输入有效的邮箱地址')

const idCardSchema = z.string()
  .regex(/^\d{17}[\dXx]$/, '请输入有效的身份证号码')
  .optional()

export const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空')
})

export const registerSchema = z.object({
  username: z.string()
    .min(3, '用户名长度至少为3位')
    .max(20, '用户名长度不能超过20位')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  email: emailSchema,
  password: passwordSchema,
  realName: z.string().min(1, '真实姓名不能为空'),
  phone: phoneSchema,
  role: z.enum([Role.VOLUNTEER, Role.PROJECT_MANAGER, Role.ADMIN], {
    errorMap: () => ({ message: '角色必须是 VOLUNTEER、PROJECT_MANAGER 或 ADMIN' })
  }),
  idCard: idCardSchema,
  organization: z.string().optional(),
  position: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.role === Role.PROJECT_MANAGER) {
    if (!data.organization) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '项目负责人必须填写所属机构',
        path: ['organization']
      })
    }
    if (!data.position) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '项目负责人必须填写职位',
        path: ['position']
      })
    }
  }
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, '刷新令牌不能为空')
})

export function validateLogin(data: unknown) {
  return loginSchema.safeParse(data)
}

export function validateRegister(data: unknown) {
  return registerSchema.safeParse(data)
}

export function validateRefreshToken(data: unknown) {
  return refreshTokenSchema.safeParse(data)
}
