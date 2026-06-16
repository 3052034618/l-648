import prisma from './lib/prisma'
import bcrypt from 'bcryptjs'
import { Role, ProjectLevel, ProjectStatus } from '@prisma/client'

async function seed() {
  console.log('🌱 Starting database seed...')

  const hashedPassword = await bcrypt.hash('123456', 10)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      realName: '系统管理员',
      phone: '13800000000',
      role: Role.ADMIN
    }
  })
  console.log('✅ Admin created:', admin.username)

  const manager1 = await prisma.user.upsert({
    where: { username: 'manager1' },
    update: {},
    create: {
      username: 'manager1',
      email: 'manager1@example.com',
      passwordHash: hashedPassword,
      realName: '张经理',
      phone: '13800000001',
      role: Role.PROJECT_MANAGER,
      managerProfile: {
        create: {
          organization: '市志愿者协会',
          position: '项目主管'
        }
      }
    }
  })
  console.log('✅ Project Manager created:', manager1.username)

  const skills = [
    { name: '急救知识', category: '医疗健康', description: '具备基本急救技能' },
    { name: '心理咨询', category: '医疗健康', description: '专业心理咨询能力' },
    { name: '英语翻译', category: '语言服务', description: '英语口译笔译能力' },
    { name: '日语翻译', category: '语言服务', description: '日语口译笔译能力' },
    { name: '摄影摄像', category: '媒体传播', description: '活动摄影摄像能力' },
    { name: '文案写作', category: '媒体传播', description: '宣传文案撰写能力' },
    { name: '活动策划', category: '组织管理', description: '活动策划组织能力' },
    { name: '电脑维修', category: '技术服务', description: '电脑硬件维修能力' },
    { name: '软件开发', category: '技术服务', description: '软件系统开发能力' },
    { name: '教学辅导', category: '教育培训', description: '中小学课程辅导能力' },
    { name: '艺术表演', category: '文化艺术', description: '歌舞表演等才艺' },
    { name: '礼仪服务', category: '社会服务', description: '会务礼仪接待能力' }
  ]

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill
    })
  }
  console.log('✅ Skills created:', skills.length)

  const volunteer1 = await prisma.user.upsert({
    where: { username: 'volunteer1' },
    update: {},
    create: {
      username: 'volunteer1',
      email: 'volunteer1@example.com',
      passwordHash: hashedPassword,
      realName: '李志愿',
      phone: '13800000002',
      idCard: '110101199001011234',
      role: Role.VOLUNTEER,
      volunteerProfile: {
        create: {
          emergencyContact: '王家属',
          emergencyPhone: '13900000001',
          skills: {
            create: [
              { skillId: 1, proficiency: 3 },
              { skillId: 10, proficiency: 4 },
              { skillId: 11, proficiency: 2 }
            ]
          },
          availability: {
            create: [
              { dayOfWeek: 0, startTime: '09:00', endTime: '18:00' },
              { dayOfWeek: 6, startTime: '09:00', endTime: '18:00' },
              { dayOfWeek: 1, startTime: '18:00', endTime: '21:00' },
              { dayOfWeek: 3, startTime: '18:00', endTime: '21:00' },
              { dayOfWeek: 5, startTime: '18:00', endTime: '21:00' }
            ]
          }
        }
      }
    }
  })
  console.log('✅ Volunteer1 created:', volunteer1.username)

  const volunteer2 = await prisma.user.upsert({
    where: { username: 'volunteer2' },
    update: {},
    create: {
      username: 'volunteer2',
      email: 'volunteer2@example.com',
      passwordHash: hashedPassword,
      realName: '赵热心',
      phone: '13800000003',
      idCard: '110101199002022345',
      role: Role.VOLUNTEER,
      volunteerProfile: {
        create: {
          emergencyContact: '李家属',
          emergencyPhone: '13900000002',
          skills: {
            create: [
              { skillId: 3, proficiency: 5 },
              { skillId: 5, proficiency: 4 },
              { skillId: 6, proficiency: 3 }
            ]
          },
          availability: {
            create: [
              { dayOfWeek: 0, startTime: '08:00', endTime: '20:00' },
              { dayOfWeek: 6, startTime: '08:00', endTime: '20:00' }
            ]
          }
        }
      }
    }
  })
  console.log('✅ Volunteer2 created:', volunteer2.username)

  const volunteer3 = await prisma.user.upsert({
    where: { username: 'volunteer3' },
    update: {},
    create: {
      username: 'volunteer3',
      email: 'volunteer3@example.com',
      passwordHash: hashedPassword,
      realName: '王奉献',
      phone: '13800000004',
      idCard: '110101199003033456',
      role: Role.VOLUNTEER,
      volunteerProfile: {
        create: {
          emergencyContact: '赵家属',
          emergencyPhone: '13900000003',
          skills: {
            create: [
              { skillId: 7, proficiency: 4 },
              { skillId: 12, proficiency: 5 },
              { skillId: 8, proficiency: 3 }
            ]
          },
          availability: {
            create: [
              { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
              { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
              { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
              { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' }
            ]
          }
        }
      }
    }
  })
  console.log('✅ Volunteer3 created:', volunteer3.username)

  const managerProfile = await prisma.projectManagerProfile.findFirst({
    where: { userId: manager1.id }
  })

  if (managerProfile) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + 7)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 30)

    await prisma.project.upsert({
      where: { id: 1 },
      update: {},
      create: {
        title: '社区敬老志愿服务活动',
        description: '为社区孤寡老人提供陪伴、生活照料、心理关怀等服务，弘扬尊老爱老传统美德。',
        category: '社区服务',
        level: ProjectLevel.BASIC,
        status: ProjectStatus.PUBLISHED,
        location: '阳光社区活动中心',
        latitude: 39.9042,
        longitude: 116.4074,
        startDate,
        endDate,
        maxParticipants: 20,
        minParticipants: 5,
        requiredTrainingIds: [],
        pointsPerHour: 10,
        projectManagerId: managerProfile.id,
        requiredSkills: {
          create: [
            { skillId: 10, minProficiency: 2, requiredCount: 5 },
            { skillId: 1, minProficiency: 2, requiredCount: 3 },
            { skillId: 2, minProficiency: 1, requiredCount: 2 }
          ]
        }
      }
    })
    console.log('✅ Project 1 created: 社区敬老志愿服务活动')

    const startDate2 = new Date()
    startDate2.setDate(startDate2.getDate() + 14)
    const endDate2 = new Date(startDate2)
    endDate2.setDate(endDate2.getDate() + 7)

    await prisma.project.upsert({
      where: { id: 2 },
      update: {},
      create: {
        title: '国际会议志愿服务',
        description: '为大型国际会议提供接待、翻译、引导等志愿服务，需要具备外语能力和礼仪知识。',
        category: '大型活动',
        level: ProjectLevel.INTERMEDIATE,
        status: ProjectStatus.PUBLISHED,
        location: '国际会展中心',
        latitude: 39.9142,
        longitude: 116.4174,
        startDate: startDate2,
        endDate: endDate2,
        maxParticipants: 50,
        minParticipants: 20,
        requiredTrainingIds: [1],
        pointsPerHour: 15,
        projectManagerId: managerProfile.id,
        requiredSkills: {
          create: [
            { skillId: 3, minProficiency: 4, requiredCount: 15 },
            { skillId: 12, minProficiency: 3, requiredCount: 20 },
            { skillId: 5, minProficiency: 3, requiredCount: 5 }
          ]
        }
      }
    })
    console.log('✅ Project 2 created: 国际会议志愿服务')

    const startDate3 = new Date()
    startDate3.setDate(startDate3.getDate() + 30)
    const endDate3 = new Date(startDate3)
    endDate3.setDate(endDate3.getDate() + 60)

    await prisma.project.upsert({
      where: { id: 3 },
      update: {},
      create: {
        title: '山区支教助学项目',
        description: '赴偏远山区进行长期支教活动，为山区儿童提供优质教育资源。需要具备教学能力和奉献精神。',
        category: '教育支持',
        level: ProjectLevel.ADVANCED,
        status: ProjectStatus.PUBLISHED,
        location: '云南山区希望小学',
        latitude: 25.0389,
        longitude: 102.7183,
        startDate: startDate3,
        endDate: endDate3,
        maxParticipants: 10,
        minParticipants: 5,
        requiredTrainingIds: [1, 2],
        pointsPerHour: 25,
        projectManagerId: managerProfile.id,
        requiredSkills: {
          create: [
            { skillId: 10, minProficiency: 5, requiredCount: 8 },
            { skillId: 2, minProficiency: 3, requiredCount: 2 },
            { skillId: 11, minProficiency: 2, requiredCount: 3 }
          ]
        }
      }
    })
    console.log('✅ Project 3 created: 山区支教助学项目')
  }

  await prisma.training.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: '志愿者基础培训',
      description: '志愿者必备基础知识和技能培训，包括服务理念、礼仪规范、安全知识等。',
      content: '# 志愿者基础培训\n\n## 第一章 志愿者服务理念\n\n### 1.1 什么是志愿服务\n志愿服务是指志愿者不以物质报酬为目的，利用自己的时间、技能等资源，自愿为社会和他人提供服务和帮助的行为。\n\n### 1.2 志愿者精神\n- 奉献：不求回报，无私付出\n- 友爱：尊重他人，关爱社会\n- 互助：互相帮助，共同进步\n- 进步：在服务中成长\n\n## 第二章 志愿者礼仪规范\n\n### 2.1 仪容仪表\n- 着装整洁得体\n- 保持良好的个人卫生\n- 佩戴志愿者标识\n\n### 2.2 言行举止\n- 使用文明用语\n- 保持微笑服务\n- 尊重服务对象\n\n## 第三章 安全知识\n\n### 3.1 自身安全防护\n- 了解服务场所安全出口\n- 随身携带通讯工具\n- 遇到紧急情况及时求助\n\n### 3.2 服务对象安全\n- 关注服务对象身体状况\n- 遵守服务操作规范\n- 发现异常及时报告',
      category: '基础培训',
      level: ProjectLevel.BASIC,
      durationMinutes: 120,
      passScore: 60
    }
  })
  console.log('✅ Training 1 created: 志愿者基础培训')

  await prisma.training.upsert({
    where: { id: 2 },
    update: {},
    create: {
      title: '高级志愿服务培训',
      description: '针对高级项目的专项培训，包括心理辅导、应急处理、跨文化交流等内容。',
      content: '# 高级志愿服务培训\n\n## 第一章 心理辅导技能\n\n### 1.1 倾听技巧\n- 全神贯注地聆听\n- 不打断对方说话\n- 适当回应和反馈\n\n### 1.2 情绪疏导\n- 识别情绪状态\n- 运用共情技术\n- 提供情感支持\n\n## 第二章 应急处理\n\n### 2.1 突发状况应对\n- 保持冷静，迅速判断\n- 及时求助专业人员\n- 做好现场保护\n\n## 第三章 跨文化交流\n\n### 3.1 文化差异认知\n- 了解不同文化背景\n- 尊重文化习俗\n- 避免文化冲突',
      category: '高级培训',
      level: ProjectLevel.INTERMEDIATE,
      durationMinutes: 180,
      passScore: 70
    }
  })
  console.log('✅ Training 2 created: 高级志愿服务培训')

  await prisma.pointsRule.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '首次注册奖励',
      description: '志愿者首次完成注册并完善个人资料',
      points: 50,
      condition: { type: 'first_register' },
      isActive: true
    }
  })

  await prisma.pointsRule.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: '连续服务奖励',
      description: '连续服务满30小时额外奖励',
      points: 100,
      condition: { type: 'continuous_hours', hours: 30 },
      isActive: true
    }
  })

  await prisma.pointsRule.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: '优秀志愿者奖励',
      description: '获得5星评价额外奖励',
      points: 200,
      condition: { type: 'excellent_rating', rating: 5 },
      isActive: true
    }
  })

  await prisma.exchangeRule.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '志愿者纪念徽章',
      description: '精美志愿者纪念徽章一枚',
      pointsRequired: 100,
      reward: '志愿者纪念徽章',
      stock: 1000,
      isActive: true
    }
  })

  await prisma.exchangeRule.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: '定制保温杯',
      description: '志愿者专属定制保温杯',
      pointsRequired: 300,
      reward: '定制保温杯',
      stock: 500,
      isActive: true
    }
  })

  await prisma.exchangeRule.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: '志愿服务证书',
      description: '官方认证的志愿服务时长证书',
      pointsRequired: 500,
      reward: '志愿服务证书',
      stock: 200,
      isActive: true
    }
  })

  await prisma.creditThreshold.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '项目报名门槛',
      description: '报名参加志愿项目的最低信用分要求',
      minCreditScore: 60,
      restriction: '禁止报名新项目',
      isActive: true
    }
  })

  await prisma.creditThreshold.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: '高级项目门槛',
      description: '报名高级别项目的信用分要求',
      minCreditScore: 80,
      restriction: '禁止报名高级项目',
      isActive: true
    }
  })

  await prisma.systemSettings.upsert({
    where: { key: 'absence_penalty' },
    update: {},
    create: {
      key: 'absence_penalty',
      value: { points: -5, description: '每次缺席扣除信用分' },
      description: '缺席惩罚规则'
    }
  })

  await prisma.systemSettings.upsert({
    where: { key: 'signin_radius' },
    update: {},
    create: {
      key: 'signin_radius',
      value: { meters: 500, description: 'GPS签到允许的最大距离' },
      description: '签到半径设置'
    }
  })

  await prisma.systemSettings.upsert({
    where: { key: 'late_threshold' },
    update: {},
    create: {
      key: 'late_threshold',
      value: { minutes: 30, description: '迟到判定时间阈值' },
      description: '迟到判定阈值'
    }
  })

  console.log('🎉 Database seed completed successfully!')
  console.log('')
  console.log('📋 Default accounts:')
  console.log('   Admin:     admin / 123456')
  console.log('   Manager:   manager1 / 123456')
  console.log('   Volunteer: volunteer1 / 123456')
  console.log('   Volunteer: volunteer2 / 123456')
  console.log('   Volunteer: volunteer3 / 123456')
}

seed()
  .catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
