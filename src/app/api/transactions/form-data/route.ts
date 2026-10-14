import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const [accounts, categories, goals, savingMethods] = await Promise.all([
      prisma.financialAccount.findMany({
        where: { userId },
        orderBy: { isDefault: 'desc' },
        select: { id: true, name: true, type: true, balance: true },
      }),
      prisma.category.findMany({
        where: { userId },
        orderBy: [{ isSystem: 'desc' }, { sortOrder: 'asc' }],
        select: { id: true, name: true, icon: true, color: true, type: true },
      }),
      prisma.goal.findMany({
        where: { userId, status: 'ACTIVE' },
        orderBy: { targetDate: 'asc' },
        select: { id: true, name: true },
      }),
      prisma.savingMethod.findMany({
        where: { userId, isActive: true },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true },
      }),
    ])

    return NextResponse.json({
      accounts,
      categories,
      goals,
      savingMethods,
    })
  } catch (error) {
    console.error('Error fetching form data:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}