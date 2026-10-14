import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { transactionSchema } from '@/lib/validations'

export async function GET(request: Request) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const type = searchParams.get('type')
  const categoryId = searchParams.get('categoryId')
  const accountId = searchParams.get('accountId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const search = searchParams.get('search')

  const userId = session.user.id

  const where: any = { userId }
  
  if (type) where.type = type
  if (categoryId) where.categoryId = categoryId
  if (accountId) where.accountId = accountId
  if (startDate || endDate) {
    where.date = {}
    if (startDate) where.date.gte = new Date(startDate)
    if (endDate) where.date.lte = new Date(endDate)
  }
  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } },
    ]
  }

  try {
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: true,
          account: true,
          goal: true,
          savingMethod: true,
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ])

    return NextResponse.json({
      transactions: transactions.map(t => ({
        ...t,
        amount: Number(t.amount),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
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
    const data = transactionSchema.parse(body)

    // Verificar que la cuenta pertenece al usuario
    const account = await prisma.financialAccount.findFirst({
      where: { id: data.accountId, userId: session.user.id },
    })

    if (!account) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })
    }

    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        userId: session.user.id,
        date: new Date(data.date),
        amount: data.amount,
      },
      include: {
        category: true,
        account: true,
      },
    })

    // Actualizar balance de la cuenta
    const amountChange = data.type === 'EXPENSE' ? -data.amount : data.amount
    await prisma.financialAccount.update({
      where: { id: data.accountId },
      data: { balance: { increment: amountChange } },
    })

    // Si está vinculado a una meta, actualizar progreso
    if (data.goalId) {
      await prisma.goal.update({
        where: { id: data.goalId },
        data: { currentAmount: { increment: data.amount } },
      })
    }

    return NextResponse.json({ ...transaction, amount: Number(transaction.amount) }, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos inválidos', details: error }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}