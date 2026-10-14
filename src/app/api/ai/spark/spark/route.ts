import { auth } from '@/lib/auth'
import { SparkEngine } from '@/lib/ai/spark-engine'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const engine = new SparkEngine(session.user.id)
    const sparks = await engine.getDailySparks()
    return NextResponse.json({ sparks })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}