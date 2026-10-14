import { auth } from '@/lib/auth'
import { SparkEngine } from '@/lib/ai/spark-engine'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { actionType, params } = await request.json()
    const engine = new SparkEngine(session.user.id)
    const result = await engine.executeConfirmedAction(actionType, params)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}