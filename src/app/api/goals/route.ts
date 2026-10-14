import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { goalSchema } from '@/lib/validations'

export async function GET() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const goals = await prisma.goal.findMany({
      where: { userId },
      include: {
        milestones: { orderBy: { targetDate: 'asc' } },
        contributions: { orderBy: { date: 'desc' }, take: 5 },
      },
      orderBy: [{ status: 'asc' }, { targetDate: 'asc' }],
    })

    return NextResponse.json(goals.map(g => ({
      ...g,
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount),
      milestones: g.milestones.map(m => ({
        ...m,
        amount: Number(m.amount),
      })),
      contributions: g.contributions.map(c => ({
        ...c,
        amount: Number(c.amount),
      })),
    })))
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const data = goalSchema.parse(body)

    const goal = await prisma.goal.create({
      data: {
        ...data,
        userId: session.user.id,
        startDate: new Date(data.startDate),
        targetDate: new Date(data.targetDate),
        targetAmount: data.targetAmount,
        currentAmount: 0,
      },
      include: { milestones: true },
    })

    return NextResponse.json({
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating goal:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos inválidos', details: error }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}