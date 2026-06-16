import prisma from '../lib/prisma'
import { SkillData } from '../types'

export async function createSkill(data: SkillData) {
  try {
    const existingSkill = await prisma.skill.findUnique({
      where: { name: data.name }
    })

    if (existingSkill) {
      return {
        success: false,
        error: '技能名称已存在'
      }
    }

    const skill = await prisma.skill.create({
      data: {
        name: data.name,
        category: data.category,
        description: data.description
      }
    })

    return {
      success: true,
      data: skill
    }
  } catch (error) {
    return {
      success: false,
      error: '创建技能失败'
    }
  }
}

export async function listSkills(category?: string) {
  try {
    const where = category ? { category } : {}

    const skills = await prisma.skill.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    })

    return {
      success: true,
      data: skills
    }
  } catch (error) {
    return {
      success: false,
      error: '获取技能列表失败'
    }
  }
}

export async function updateSkill(id: number, data: Partial<SkillData>) {
  try {
    const skill = await prisma.skill.findUnique({ where: { id } })

    if (!skill) {
      return {
        success: false,
        error: '技能不存在'
      }
    }

    if (data.name && data.name !== skill.name) {
      const existingSkill = await prisma.skill.findUnique({
        where: { name: data.name }
      })

      if (existingSkill) {
        return {
          success: false,
          error: '技能名称已存在'
        }
      }
    }

    const updatedSkill = await prisma.skill.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        description: data.description
      }
    })

    return {
      success: true,
      data: updatedSkill
    }
  } catch (error) {
    return {
      success: false,
      error: '更新技能失败'
    }
  }
}

export async function deleteSkill(id: number) {
  try {
    const skill = await prisma.skill.findUnique({ where: { id } })

    if (!skill) {
      return {
        success: false,
        error: '技能不存在'
      }
    }

    const volunteerSkillsCount = await prisma.volunteerSkill.count({
      where: { skillId: id }
    })

    if (volunteerSkillsCount > 0) {
      return {
        success: false,
        error: '该技能已被志愿者使用，无法删除'
      }
    }

    const projectRequiredSkillsCount = await prisma.projectRequiredSkill.count({
      where: { skillId: id }
    })

    if (projectRequiredSkillsCount > 0) {
      return {
        success: false,
        error: '该技能已被项目使用，无法删除'
      }
    }

    await prisma.skill.delete({ where: { id } })

    return {
      success: true,
      data: { message: '技能已删除' }
    }
  } catch (error) {
    return {
      success: false,
      error: '删除技能失败'
    }
  }
}
