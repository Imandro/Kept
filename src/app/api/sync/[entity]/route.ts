import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

type SyncAction = 'create' | 'update' | 'delete';

interface SyncRequest {
  action: SyncAction;
  localId: string;
  serverId?: string;
  data: any;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { entity } = await params;
  const body: SyncRequest = await request.json();
  const { action, localId, serverId, data } = body;

  try {
    let result: any = { success: true };

    switch (entity) {
      case 'transaction':
        result = await syncTransaction(session.user.id, action, localId, serverId, data);
        break;
      case 'account':
        result = await syncAccount(session.user.id, action, localId, serverId, data);
        break;
      case 'goal':
        result = await syncGoal(session.user.id, action, localId, serverId, data);
        break;
      case 'category':
        result = await syncCategory(session.user.id, action, localId, serverId, data);
        break;
      default:
        return NextResponse.json({ error: 'Invalid entity' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`Sync error for ${entity}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function syncTransaction(
  userId: string,
  action: SyncAction,
  localId: string,
  serverId: string | undefined,
  data: any
) {
  // Verificar cuenta pertenece al usuario
  const account = await prisma.financialAccount.findFirst({
    where: { id: data.accountId, userId },
  });
  if (!account) throw new Error('Account not found');

  switch (action) {
    case 'create': {
      const tx = await prisma.transaction.create({
        data: {
          ...data,
          userId,
          date: new Date(data.date),
          amount: data.amount,
          localId, // Guardar referencia local
        },
      });
      return { serverId: tx.id, localId };
    }
    case 'update': {
      if (!serverId) throw new Error('ServerId required for update');
      
      const existing = await prisma.transaction.findFirst({
        where: { id: serverId, userId },
      });
      if (!existing) throw new Error('Transaction not found');

      const oldAmount = Number(existing.amount);
      const newAmount = data.amount;
      const oldType = existing.type;
      const newType = data.type;

      const oldAmountChange = oldType === 'EXPENSE' ? -oldAmount : oldAmount;
      const newAmountChange = newType === 'EXPENSE' ? -newAmount : newAmount;
      const balanceDiff = newAmountChange - oldAmountChange;

      const tx = await prisma.$transaction(async (tx) => {
        const updated = await tx.transaction.update({
          where: { id: serverId },
          data: {
            ...data,
            date: new Date(data.date),
            amount: newAmount,
          },
        });

        await tx.financialAccount.update({
          where: { id: existing.accountId },
          data: { balance: { increment: balanceDiff } },
        });

        // Actualizar meta si cambió
        if (existing.goalId && existing.goalId !== data.goalId) {
          await tx.goal.update({
            where: { id: existing.goalId },
            data: { currentAmount: { decrement: oldAmount } },
          });
        }
        if (data.goalId && data.goalId !== existing.goalId) {
          await tx.goal.update({
            where: { id: data.goalId },
            data: { currentAmount: { increment: newAmount } },
          });
        } else if (data.goalId && data.goalId === existing.goalId) {
          await tx.goal.update({
            where: { id: data.goalId },
            data: { currentAmount: { increment: newAmount - oldAmount } },
          });
        }

        return updated;
      });

      return { serverId: tx.id, localId };
    }
    case 'delete': {
      if (!serverId) throw new Error('ServerId required for delete');
      
      const existing = await prisma.transaction.findFirst({
        where: { id: serverId, userId },
        include: { account: true },
      });
      if (!existing) throw new Error('Transaction not found');

      const amountChange = existing.type === 'EXPENSE' 
        ? -Number(existing.amount) 
        : Number(existing.amount);

      await prisma.$transaction(async (tx) => {
        await tx.transaction.delete({ where: { id: serverId } });
        await tx.financialAccount.update({
          where: { id: existing.accountId },
          data: { balance: { increment: -amountChange } },
        });

        if (existing.goalId) {
          await tx.goal.update({
            where: { id: existing.goalId },
            data: { currentAmount: { decrement: Number(existing.amount) } },
          });
        }
      });

      return { success: true };
    }
  }
}

async function syncAccount(
  userId: string,
  action: SyncAction,
  localId: string,
  serverId: string | undefined,
  data: any
) {
  switch (action) {
    case 'create': {
      const acc = await prisma.financialAccount.create({
        data: {
          ...data,
          userId,
          balance: data.balance ?? 0,
          localId,
        },
      });
      return { serverId: acc.id, localId };
    }
    case 'update': {
      if (!serverId) throw new Error('ServerId required');
      const acc = await prisma.financialAccount.update({
        where: { id: serverId, userId },
        data,
      });
      return { serverId: acc.id, localId };
    }
    case 'delete': {
      if (!serverId) throw new Error('ServerId required');
      await prisma.financialAccount.delete({ where: { id: serverId, userId } });
      return { success: true };
    }
  }
}

async function syncGoal(
  userId: string,
  action: SyncAction,
  localId: string,
  serverId: string | undefined,
  data: any
) {
  switch (action) {
    case 'create': {
      const goal = await prisma.goal.create({
        data: {
          ...data,
          userId,
          startDate: new Date(data.startDate),
          targetDate: new Date(data.targetDate),
          targetAmount: data.targetAmount,
          currentAmount: data.currentAmount ?? 0,
          localId,
        },
      });
      return { serverId: goal.id, localId };
    }
    case 'update': {
      if (!serverId) throw new Error('ServerId required');
      const goal = await prisma.goal.update({
        where: { id: serverId, userId },
        data: {
          ...data,
          startDate: new Date(data.startDate),
          targetDate: new Date(data.targetDate),
          targetAmount: data.targetAmount,
        },
      });
      return { serverId: goal.id, localId };
    }
    case 'delete': {
      if (!serverId) throw new Error('ServerId required');
      await prisma.goal.delete({ where: { id: serverId, userId } });
      return { success: true };
    }
  }
}

async function syncCategory(
  userId: string,
  action: SyncAction,
  localId: string,
  serverId: string | undefined,
  data: any
) {
  switch (action) {
    case 'create': {
      const cat = await prisma.category.create({
        data: { ...data, userId, localId },
      });
      return { serverId: cat.id, localId };
    }
    case 'update': {
      if (!serverId) throw new Error('ServerId required');
      const cat = await prisma.category.update({
        where: { id: serverId, userId },
        data,
      });
      return { serverId: cat.id, localId };
    }
    case 'delete': {
      if (!serverId) throw new Error('ServerId required');
      await prisma.category.delete({ where: { id: serverId, userId } });
      return { success: true };
    }
  }
}