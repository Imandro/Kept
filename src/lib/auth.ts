import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña son requeridos')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.passwordHash) {
          throw new Error('Credenciales inválidas')
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValid) {
          throw new Error('Credenciales inválidas')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          scope: 'openid email profile',
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) token.id = user.id
      if (account) {
        token.provider = account.provider
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.provider = token.provider as string
      }
      return session
    },
  },
  events: {
    async createUser({ user }) {
      // Crear preferencias por defecto para nuevos usuarios
      await prisma.userPreferences.create({
        data: {
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
        // Ingresos
        { name: 'Salario', icon: 'briefcase', color: '#22c55e', type: 'INCOME', isSystem: true, sortOrder: 1 },
        { name: 'Freelance', icon: 'laptop', color: '#16a34a', type: 'INCOME', isSystem: true, sortOrder: 2 },
        { name: 'Inversiones', icon: 'trending-up', color: '#15803d', type: 'INCOME', isSystem: true, sortOrder: 3 },
        { name: 'Regalos', icon: 'gift', color: '#86efac', type: 'INCOME', isSystem: true, sortOrder: 4 },
        { name: 'Otros ingresos', icon: 'plus-circle', color: '#4ade80', type: 'INCOME', isSystem: true, sortOrder: 4 },
        // Gastos
        { name: 'Comida', icon: 'utensils', color: '#ef4444', type: 'EXPENSE', isSystem: true, sortOrder: 10 },
        { name: 'Transporte', icon: 'car', color: '#f97316', type: 'EXPENSE', isSystem: true, sortOrder: 11 },
        { name: 'Vivienda', icon: 'home', color: '#eab308', type: 'EXPENSE', isSystem: true, sortOrder: 12 },
        { name: 'Servicios', icon: 'zap', color: '#f59e0b', type: 'EXPENSE', isSystem: true, sortOrder: 13 },
        { name: 'Entretenimiento', icon: 'gamepad-2', color: '#8b5cf6', type: 'EXPENSE', isSystem: true, sortOrder: 14 },
        { name: 'Salud', icon: 'heart-pulse', color: '#ec4899', type: 'EXPENSE', isSystem: true, sortOrder: 15 },
        { name: 'Educación', icon: 'graduation-cap', color: '#06b6d4', type: 'EXPENSE', isSystem: true, sortOrder: 15 },
        { name: 'Compras', icon: 'shopping-bag', color: '#f43f5e', type: 'EXPENSE', isSystem: true, sortOrder: 16 },
        { name: 'Suscripciones', icon: 'credit-card', color: '#6366f1', type: 'EXPENSE', isSystem: true, sortOrder: 18 },
        { name: 'Otros gastos', icon: 'minus-circle', color: '#f87171', type: 'EXPENSE', isSystem: true, sortOrder: 19 },
        // Ahorro
        { name: 'Fondo de emergencia', icon: 'shield', color: '#10b981', type: 'SAVING', isSystem: true, sortOrder: 20 },
        { name: 'Metas', icon: 'target', color: '#3b82f6', type: 'SAVING', isSystem: true, sortOrder: 21 },
        { name: 'Inversiones', icon: 'trending-up', color: '#8b5cf6', type: 'SAVING', isSystem: true, sortOrder: 22 },
      ]
      for (const cat of systemCategories) {
        await prisma.category.create({
          data: { ...cat, userId: user.id },
        })
      }
      // Método de ahorro 50/30/20 por defecto
      const accounts = await prisma.financialAccount.findMany({ where: { userId: user.id } })
      const checking = accounts.find(a => a.type === 'checking')
      const cash = accounts.find(a => a.type === 'cash')
      const savings = accounts.find(a => a.type === 'savings')
      if (checking && cash && savings) {
        await prisma.savingMethod.create({
          data: {
            userId: user.id,
            name: 'Regla 50/30/20',
            type: 'PERCENTAGE_50_30_20',
            configuration: { needs: 50, wants: 30, savings: 20, autoAllocate: true, needsAccountId: checking.id, wantsAccountId: cash.id, savingsAccountId: savings.id },
            isActive: true,
            allocations: {
              create: [
                { percentage: 50, targetAccountId: checking.id, priority: 1 },
                { percentage: 30, targetAccountId: cash.id, priority: 2 },
                { percentage: 20, targetAccountId: savings.id, priority: 3 },
              ],
            },
          },
        })
      }
    },
  },
})