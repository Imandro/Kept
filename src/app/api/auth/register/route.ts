import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }
    const { name, email, password } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, name, passwordHash, currency: 'MXN', locale: 'es', timezone: 'America/Mexico_City' },
    })

    // Preferencias por defecto
    await prisma.userPreferences.create({
      data: { userId: user.id, theme: 'system', defaultView: 'dashboard', autoCategorize: true, smartNotifications: true, weeklyReport: true, monthlyReport: true, aiPersonality: 'coach', currencyFormat: { locale: 'es-MX', currency: 'MXN' }, dateFormat: 'DD/MM/YYYY', firstDayOfWeek: 1 } as any,
    })

    // Cuentas por defecto
    await prisma.financialAccount.createMany({
      data: [
        { userId: user.id, name: 'Efectivo', type: 'cash', balance: 0, currency: 'MXN', icon: 'wallet', color: '#22c55e', isDefault: true },
        { userId: user.id, name: 'Cuenta Bancaria', type: 'checking', balance: 0, currency: 'MXN', icon: 'credit-card', color: '#3b82f6', isDefault: false },
        { userId: user.id, name: 'Ahorros', type: 'savings', balance: 0, currency: 'MXN', icon: 'piggy-bank', color: '#8b5cf6', isDefault: false },
      ],
    })

    // Categorías del sistema
    const systemCategories = [
      { name: 'Salario', icon: 'briefcase', color: '#22c55e', type: 'INCOME', isSystem: true, sortOrder: 1 },
      { name: 'Freelance', icon: 'laptop', color: '#16a34a', type: 'INCOME', isSystem: true, sortOrder: 2 },
      { name: 'Otros ingresos', icon: 'plus-circle', color: '#4ade80', type: 'INCOME', isSystem: true, sortOrder: 4 },
      { name: 'Comida', icon: 'utensils', color: '#ef4444', type: 'EXPENSE', isSystem: true, sortOrder: 10 },
      { name: 'Transporte', icon: 'car', color: '#f97316', type: 'EXPENSE', isSystem: true, sortOrder: 11 },
      { name: 'Vivienda', icon: 'home', color: '#eab308', type: 'EXPENSE', isSystem: true, sortOrder: 12 },
      { name: 'Servicios', icon: 'zap', color: '#f59e0b', type: 'EXPENSE', isSystem: true, sortOrder: 13 },
      { name: 'Entretenimiento', icon: 'gamepad-2', color: '#8b5cf6', type: 'EXPENSE', isSystem: true, sortOrder: 14 },
      { name: 'Salud', icon: 'heart-pulse', color: '#ec4899', type: 'EXPENSE', isSystem: true, sortOrder: 15 },
      { name: 'Compras', icon: 'shopping-bag', color: '#f43f5e', type: 'EXPENSE', isSystem: true, sortOrder: 16 },
      { name: 'Otros gastos', icon: 'minus-circle', color: '#f87171', type: 'EXPENSE', isSystem: true, sortOrder: 19 },
      { name: 'Fondo de emergencia', icon: 'shield', color: '#10b981', type: 'SAVING', isSystem: true, sortOrder: 20 },
      { name: 'Metas', icon: 'target', color: '#3b82f6', type: 'SAVING', isSystem: true, sortOrder: 21 },
    ]
    for (const cat of systemCategories) {
      await prisma.category.create({ data: { ...cat, userId: user.id } as any })
    }

    return NextResponse.json({ ok: true, userId: user.id }, { status: 201 })
  } catch (err: any) {
    console.error('Register error:', err)
    return NextResponse.json({ error: err?.message || 'Error al crear la cuenta' }, { status: 500 })
  }
}