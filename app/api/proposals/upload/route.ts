import { NextRequest, NextResponse } from 'next/server'
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteBucketCommand,
  paginateListObjectsV2,
  GetObjectCommand,
} from "@aws-sdk/client-s3"

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'mineru-documents'

interface UploadEvent {
  type: 'uploading' | 'uploaded' | 'processing'
  message: string
  progress?: number
  taskId?: string
}

function sendSSEEvent(encoder: TextEncoder, event: UploadEvent): Uint8Array {
  const data = JSON.stringify(event)
  return encoder.encode(`data: ${data}\n\n`)
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const projectId = formData.get('projectId') as string

  if (!file || !projectId) {
    return NextResponse.json(
      { error: 'File and project ID are required' },
      { status: 400 }
    )
  }

  // Create SSE stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const processUpload = async () => {
        try {
          // Validation and uploading phase
          controller.enqueue(sendSSEEvent(encoder, {
            type: 'uploading',
            message: 'Uploading file...',
            progress: 0
          }))

          const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
          
          if (!ALLOWED_EXTENSIONS.includes(fileExtension) || file.size > MAX_FILE_SIZE) {
            controller.close()
            return
          }

          // Upload to S3
          const timestamp = Date.now()
          const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
          const s3Key = `unprocessed/${projectId}/${timestamp}_${sanitizedFilename}`
          
          const fileBuffer = await file.arrayBuffer()
          
          const uploadCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: new Uint8Array(fileBuffer),
            ContentType: file.type,
            Metadata: {
              originalName: file.name,
              projectId: projectId,
              uploadedAt: new Date().toISOString()
            }
          })

          await s3Client.send(uploadCommand)
          
          controller.enqueue(sendSSEEvent(encoder, {
            type: 'uploaded',
            message: 'File uploaded successfully!',
            progress: 100
          }))

          // Send to processing service
          controller.enqueue(sendSSEEvent(encoder, {
            type: 'processing',
            message: 'Processing document...'
          }))

          const processorUrl = process.env.MINERU_PROCESSOR_URL
          
          if (processorUrl) {
            const s3FilePath = `s3://${BUCKET_NAME}/${s3Key}`
            
            const processingResponse = await fetch(processorUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                input: {
                  project_id: projectId,
                  s3_file_path: s3FilePath,
                  filename: file.name
                }
              })
            })

            if (processingResponse.ok) {
              const processingResult = await processingResponse.json()
              controller.enqueue(sendSSEEvent(encoder, {
                type: 'processing',
                message: 'Document processing started',
                taskId: processingResult.task_id || processingResult.id
              }))
            }
          }

        } catch (error) {
          console.error('Upload error:', error)
        } finally {
          controller.close()
        }
      }

      processUpload()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}