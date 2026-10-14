import { auth } from '@/lib/auth'
import { DashboardLayoutClient } from '@/components/dashboard-layout-client'
import { ReactNode } from 'react'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  return <DashboardLayoutClient session={session}>{children}</DashboardLayoutClient>
}