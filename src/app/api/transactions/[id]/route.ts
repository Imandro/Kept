import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { transactionSchema } from '@/lib/validations'

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
    const data = transactionSchema.parse(body)

    // Verificar que la transacción pertenece al usuario
    const existingTx = await prisma.transaction.findFirst({
      where: { id, userId: session.user.id },
      include: { account: true },
    })

    if (!existingTx) {
      return NextResponse.json({ error: 'Transacción no encontrada' }, { status: 404 })
    }

    // Calcular diferencia de balance
    const oldAmount = Number(existingTx.amount)
    const newAmount = data.amount
    const oldType = existingTx.type
    const newType = data.type

    // Revertir balance anterior
    const oldAmountChange = oldType === 'EXPENSE' ? -oldAmount : oldAmount
    // Aplicar nuevo balance
    const newAmountChange = newType === 'EXPENSE' ? -newAmount : newAmount
    const balanceDiff = newAmountChange - oldAmountChange

    const transaction = await prisma.$transaction(async (tx) => {
      // Actualizar transacción
      const updated = await tx.transaction.update({
        where: { id },
        data: {
          ...data,
          date: new Date(data.date),
          amount: newAmount,
        },
        include: { category: true, account: true },
      })

      // Actualizar balance de cuenta
      await tx.financialAccount.update({
        where: { id: existingTx.accountId },
        data: { balance: { increment: balanceDiff } },
      })

      // Actualizar meta si cambió
      if (existingTx.goalId && existingTx.goalId !== data.goalId) {
        await tx.goal.update({
          where: { id: existingTx.goalId },
          data: { currentAmount: { decrement: oldAmount } },
        })
      }
      if (data.goalId && data.goalId !== existingTx.goalId) {
        await tx.goal.update({
          where: { id: data.goalId },
          data: { currentAmount: { increment: newAmount } },
        })
      } else if (data.goalId && data.goalId === existingTx.goalId) {
        await tx.goal.update({
          where: { id: data.goalId },
          data: { currentAmount: { increment: newAmount - oldAmount } },
        })
      }

      return updated
    })

    return NextResponse.json({ ...transaction, amount: Number(transaction.amount) })
  } catch (error) {
    console.error('Error updating transaction:', error)
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
    const existingTx = await prisma.transaction.findFirst({
      where: { id, userId: session.user.id },
      include: { account: true },
    })

    if (!existingTx) {
      return NextResponse.json({ error: 'Transacción no encontrada' }, { status: 404 })
    }

    // Revertir balance
    const amountChange = existingTx.type === 'EXPENSE' ? -Number(existingTx.amount) : Number(existingTx.amount)

    await prisma.$transaction(async (tx) => {
      await tx.transaction.delete({ where: { id } })
      await tx.financialAccount.update({
        where: { id: existingTx.accountId },
        data: { balance: { increment: -amountChange } },
      })

      if (existingTx.goalId) {
        await tx.goal.update({
          where: { id: existingTx.goalId },
          data: { currentAmount: { decrement: Number(existingTx.amount) } },
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}