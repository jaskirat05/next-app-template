import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { S3Service } from '@/lib/s3'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')

    let query = supabaseAdmin
      .from('proposals')
      .select('*')
      .order('uploaded_at', { ascending: false })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data: proposals, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ proposals })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('project_id') as string

    if (!file || !projectId) {
      return NextResponse.json(
        { error: 'File and project_id are required' },
        { status: 400 }
      )
    }

    // Verify project exists
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Generate unique proposal ID
    const proposalId = crypto.randomUUID()

    // Upload original file to S3
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const s3Key = S3Service.generateFileKey(projectId, proposalId, file.name, 'original')
    await S3Service.uploadFile(s3Key, fileBuffer, file.type)

    // Create proposal record
    const { data: proposal, error } = await supabaseAdmin
      .from('proposals')
      .insert([
        {
          id: proposalId,
          project_id: projectId,
          filename: file.name,
          original_file_key: s3Key,
          processed_files_path: '', // Will be updated after processing
          processed_files: {},
          status: 'uploaded',
          file_size: file.size,
        }
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Trigger processing via gateway
    const processingFormData = new FormData()
    processingFormData.append('file', file)

    const processingResponse = await fetch(
      `${process.env.PROCESSING_GATEWAY_URL}/process?project_id=${projectId}`,
      {
        method: 'POST',
        body: processingFormData,
      }
    )

    if (processingResponse.ok) {
      const { task_id } = await processingResponse.json()
      
      // Update proposal with task ID
      await supabaseAdmin
        .from('proposals')
        .update({
          processing_task_id: task_id,
          status: 'processing'
        })
        .eq('id', proposalId)
    }

    return NextResponse.json({ proposal }, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload proposal' },
      { status: 500 }
    )
  }
}