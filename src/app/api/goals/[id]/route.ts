import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { goalSchema } from '@/lib/validations'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const data = goalSchema.parse(body)

    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existingGoal) {
      return NextResponse.json({ error: 'Meta no encontrada' }, { status: 404 })
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...data,
        startDate: new Date(data.startDate),
        targetDate: new Date(data.targetDate),
        targetAmount: data.targetAmount,
      },
      include: { milestones: true },
    })

    return NextResponse.json({
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
    })
  } catch (error) {
    console.error('Error updating goal:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos inválidos', details: error }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params

  try {
    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existingGoal) {
      return NextResponse.json({ error: 'Meta no encontrada' }, { status: 404 })
    }

    await prisma.goal.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}