const { PrismaClient, TransactionType, SavingMethodType, GoalStatus } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  const passwordHash = await bcrypt.hash('password123', 12)
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@kept.app' },
    update: {},
    create: {
      email: 'demo@kept.app',
      name: 'Usuario Demo',
      passwordHash,
      currency: 'MXN',
      locale: 'es',
      timezone: 'America/Mexico_City',
    },
  })

  console.log('✅ Usuario creado:', user.email)

  const systemCategories = [
    { name: 'Salario', icon: 'briefcase', color: '#22c55e', type: TransactionType.INCOME, isSystem: true, sortOrder: 1 },
    { name: 'Freelance', icon: 'laptop', color: '#16a34a', type: TransactionType.INCOME, isSystem: true, sortOrder: 2 },
    { name: 'Inversiones', icon: 'trending-up', color: '#15803d', type: TransactionType.INCOME, isSystem: true, sortOrder: 3 },
    { name: 'Regalos', icon: 'gift', color: '#86efac', type: TransactionType.INCOME, isSystem: true, sortOrder: 4 },
    { name: 'Otros ingresos', icon: 'plus-circle', color: '#4ade80', type: TransactionType.INCOME, isSystem: true, sortOrder: 5 },
    { name: 'Comida', icon: 'utensils', color: '#ef4444', type: TransactionType.EXPENSE, isSystem: true, sortOrder: 10 },
    { name: 'Transporte', icon: 'car', color: '#f97316', type: TransactionType.EXPENSE, isSystem: true, sortOrder: 11 },
    { name: 'Vivienda', icon: 'home', color: '#eab308', type: TransactionType.EXPENSE, isSystem: true, sortOrder: 12 },
    { name: 'Servicios', icon: 'zap', color: '#f59e0b', type: TransactionType.EXPENSE, isSystem: true, sortOrder: 13 },
    { name: 'Entretenimiento', icon: 'gamepad-2', color: '#8b5cf6', type: TransactionType.EXPENSE, isSystem: true, sortOrder: 14 },
    { name: 'Salud', icon: 'heart-pulse', color: '#ec4899', type: TransactionType.EXPENSE, isSystem: true, sortOrder: 15 },
    { name: 'Educación', icon: 'graduation-cap', color: '#06b6d4', type: TransactionType.EXPENSE, isSystem: true, sortOrder: 16 },
    { name: 'Compras', icon: 'shopping-bag', color: '#f43f5e', type: TransactionType.EXPENSE, isSystem: true, sortOrder: 17 },
    { name: 'Suscripciones', icon: 'credit-card', color: '#6366f1', type: TransactionType.EXPENSE, isSystem: true, sortOrder: 18 },
    { name: 'Otros gastos', icon: 'minus-circle', color: '#f87171', type: TransactionType.EXPENSE, isSystem: true, sortOrder: 19 },
    { name: 'Fondo de emergencia', icon: 'shield', color: '#10b981', type: TransactionType.SAVING, isSystem: true, sortOrder: 20 },
    { name: 'Metas', icon: 'target', color: '#3b82f6', type: TransactionType.SAVING, isSystem: true, sortOrder: 21 },
    { name: 'Inversiones', icon: 'trending-up', color: '#8b5cf6', type: TransactionType.SAVING, isSystem: true, sortOrder: 22 },
  ]

  for (const cat of systemCategories) {
    await prisma.category.upsert({
      where: { name_userId: { name: cat.name, userId: user.id } },
      update: {},
      create: { ...cat, userId: user.id },
    })
  }
  console.log('✅ Categorías del sistema creadas')

  // Crear cuentas financieras
  const cashAccount = await prisma.financialAccount.create({
    data: {
      userId: user.id,
      name: 'Efectivo',
      type: 'cash',
      balance: 5000,
      currency: 'MXN',
      icon: 'wallet',
      color: '#22c55e',
      isDefault: true,
    },
  })

  const checkingAccount = await prisma.financialAccount.create({
    data: {
      userId: user.id,
      name: 'Cuenta Bancaria',
      type: 'checking',
      balance: 25000,
      currency: 'MXN',
      icon: 'credit-card',
      color: '#3b82f6',
      isDefault: false,
    },
  })

  const savingsAccount = await prisma.financialAccount.create({
    data: {
      userId: user.id,
      name: 'Cuenta de Ahorro',
      type: 'savings',
      balance: 15000,
      currency: 'MXN',
      icon: 'piggy-bank',
      color: '#8b5cf6',
      isDefault: false,
    },
  })

  console.log('✅ Cuentas financieras creadas')

  const savingMethod = await prisma.savingMethod.create({
    data: {
      userId: user.id,
      name: 'Regla 50/30/20',
      type: SavingMethodType.PERCENTAGE_50_30_20,
      configuration: {
        needs: 50,
        wants: 30,
        savings: 20,
        autoAllocate: true,
        needsAccountId: checkingAccount.id,
        wantsAccountId: cashAccount.id,
        savingsAccountId: savingsAccount.id,
      },
      isActive: true,
      allocations: {
        create: [
          { percentage: 50, targetAccountId: checkingAccount.id, priority: 1 },
          { percentage: 30, targetAccountId: cashAccount.id, priority: 2 },
          { percentage: 20, targetAccountId: savingsAccount.id, priority: 3 },
        ],
      },
    },
  })
  console.log('✅ Método de ahorro 50/30/20 creado')

  const emergencyGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      name: 'Fondo de Emergencia',
      description: '3-6 meses de gastos básicos',
      targetAmount: 50000,
      currentAmount: 15000,
      currency: 'MXN',
      startDate: new Date('2024-01-01'),
      targetDate: new Date('2025-12-31'),
      status: GoalStatus.ACTIVE,
      icon: 'shield',
      color: '#10b981',
      milestones: {
        create: [
          { name: 'Primer mes', amount: 8000, targetDate: new Date('2024-01-31') },
          { name: 'Tres meses', amount: 25000, targetDate: new Date('2024-03-31') },
          { name: 'Seis meses', amount: 50000, targetDate: new Date('2024-06-30') },
        ],
      },
    },
  })

  const vacationGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      name: 'Vacaciones a la Playa',
      description: 'Viaje a Cancún con amigos',
      targetAmount: 30000,
      currentAmount: 5000,
      currency: 'MXN',
      startDate: new Date('2024-03-01'),
      targetDate: new Date('2024-12-15'),
      status: GoalStatus.ACTIVE,
      icon: 'plane',
      color: '#06b6d4',
      milestones: {
        create: [
          { name: 'Vuelos', amount: 12000, targetDate: new Date('2024-09-01') },
          { name: 'Hotel', amount: 18000, targetDate: new Date('2024-11-01') },
          { name: 'Completo', amount: 30000, targetDate: new Date('2024-12-15') },
        ],
      },
    },
  })
  console.log('✅ Metas creadas')

  const categories = await prisma.category.findMany({ where: { userId: user.id } })
  const catMap = new Map(categories.map(c => [c.name, c.id]))
  
  const sampleTransactions = [
    { amount: 25000, type: TransactionType.INCOME, description: 'Salario enero', category: 'Salario', account: checkingAccount.id, daysAgo: 30 },
    { amount: 1500, type: TransactionType.EXPENSE, description: 'Supermercado semanal', category: 'Comida', account: cashAccount.id, daysAgo: 28 },
    { amount: 800, type: TransactionType.EXPENSE, description: 'Gasolina', category: 'Transporte', account: cashAccount.id, daysAgo: 27 },
    { amount: 3500, type: TransactionType.EXPENSE, description: 'Renta', category: 'Vivienda', account: checkingAccount.id, daysAgo: 25 },
    { amount: 1200, type: TransactionType.EXPENSE, description: 'Luz e internet', category: 'Servicios', account: checkingAccount.id, daysAgo: 24 },
    { amount: 500, type: TransactionType.EXPENSE, description: 'Cine con amigos', category: 'Entretenimiento', account: cashAccount.id, daysAgo: 22 },
    { amount: 3000, type: TransactionType.INCOME, description: 'Proyecto freelance', category: 'Freelance', account: checkingAccount.id, daysAgo: 20 },
    { amount: 200, type: TransactionType.EXPENSE, description: 'Farmacia', category: 'Salud', account: cashAccount.id, daysAgo: 18 },
    { amount: 4500, type: TransactionType.SAVING, description: 'Aporte fondo emergencia', category: 'Fondo de emergencia', account: savingsAccount.id, daysAgo: 15, goalId: emergencyGoal.id },
    { amount: 800, type: TransactionType.EXPENSE, description: 'Netflix + Spotify', category: 'Suscripciones', account: checkingAccount.id, daysAgo: 14 },
    { amount: 1200, type: TransactionType.EXPENSE, description: 'Ropa', category: 'Compras', account: cashAccount.id, daysAgo: 12 },
    { amount: 5000, type: TransactionType.INCOME, description: 'Bono trimestral', category: 'Salario', account: checkingAccount.id, daysAgo: 10 },
    { amount: 2000, type: TransactionType.SAVING, description: 'Ahorro vacaciones', category: 'Metas', account: savingsAccount.id, daysAgo: 8, goalId: vacationGoal.id },
    { amount: 600, type: TransactionType.EXPENSE, description: 'Cena fuera', category: 'Comida', account: cashAccount.id, daysAgo: 5 },
    { amount: 300, type: TransactionType.EXPENSE, description: 'Uber', category: 'Transporte', account: cashAccount.id, daysAgo: 3 },
    { amount: 1500, type: TransactionType.EXPENSE, description: 'Mantenimiento auto', category: 'Transporte', account: checkingAccount.id, daysAgo: 1 },
  ]

  for (const tx of sampleTransactions) {
    const date = new Date()
    date.setDate(date.getDate() - tx.daysAgo)
    
    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: tx.amount,
        type: tx.type,
        description: tx.description,
        date,
        accountId: tx.account,
        categoryId: catMap.get(tx.category),
        goalId: tx.goalId,
        tags: [],
      },
    })
  }
  console.log('✅ Transacciones de ejemplo creadas')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const budgets = [
    { category: 'Comida', amount: 6000 },
    { category: 'Transporte', amount: 3000 },
    { category: 'Entretenimiento', amount: 2000 },
    { category: 'Servicios', amount: 2500 },
    { category: 'Salud', amount: 1000 },
    { category: 'Compras', amount: 2000 },
    { category: 'Suscripciones', amount: 1000 },
  ]

  for (const b of budgets) {
    const catId = catMap.get(b.category)
    if (catId) {
      await prisma.budget.upsert({
        where: {
          categoryId_periodStart_periodEnd: {
            categoryId: catId,
            periodStart: startOfMonth,
            periodEnd: endOfMonth,
          },
        },
        update: {},
        create: {
          userId: user.id,
          name: `Presupuesto ${b.category} - ${now.toLocaleString('es-MX', { month: 'long' })}`,
          amount: b.amount,
          spent: 0,
          periodStart: startOfMonth,
          periodEnd: endOfMonth,
          categoryId: catId,
          alerts: {
            create: [
              { threshold: 80, type: 'in_app', isActive: true },
              { threshold: 100, type: 'push', isActive: true },
            ],
          },
        },
      })
    }
  }
  console.log('✅ Presupuestos creados')

  await prisma.userPreferences.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      theme: 'system',
      defaultView: 'dashboard',
      autoCategorize: true,
      smartNotifications: true,
      weeklyReport: true,
      monthlyReport: true,
      aiPersonality: 'coach',
      currencyFormat: { locale: 'es-MX', currency: 'MXN' },
      dateFormat: 'DD/MM/YYYY',
      firstDayOfWeek: 1,
    },
  })
  console.log('✅ Preferencias de usuario creadas')

  const welcomeChat = await prisma.aIChat.create({
    data: {
      userId: user.id,
      title: 'Bienvenido a Kept 👋',
      context: { type: 'welcome' },
    },
  })
  console.log('Chat creado:', welcomeChat.id)

  // AIMessage se creará después cuando el usuario interactúe
  console.log('✅ Chat de bienvenida creado (mensajes se añaden dinámicamente)')

  console.log('\n🎉 Seed completado exitosamente!')
  console.log('\n📧 Usuario demo: demo@kept.app')
  console.log('🔑 Contraseña: password123')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })