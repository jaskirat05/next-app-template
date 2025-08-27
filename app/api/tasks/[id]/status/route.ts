import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Check task status from processing gateway
    const response = await fetch(
      `${process.env.PROCESSING_GATEWAY_URL}/tasks/${id}/status`
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to get task status' },
        { status: 500 }
      )
    }

    const taskStatus = await response.json()
    return NextResponse.json(taskStatus)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch task status' },
      { status: 500 }
    )
  }
}