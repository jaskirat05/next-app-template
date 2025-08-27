import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getMongoDb } from '@/lib/mongodb'
import { CreateProjectRequest, Project } from '@/types'

export async function GET() {
  try {
    // First get projects from Supabase
    const { data: supabaseProjects, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Then enrich with MongoDB data
    try {
      const db = await getMongoDb()
      const projectsCollection = db.collection('projects')
      
      const enrichedProjects = await Promise.all(
        supabaseProjects.map(async (project) => {
          const mongoProject = await projectsCollection.findOne({ 
            supabase_id: project.id 
          })
          
          return {
            ...project,
            schema: mongoProject?.schema || project.schema,
            original_file_url: mongoProject?.original_file_url,
            demo_url: mongoProject?.demo_url
          }
        })
      )

      return NextResponse.json({ projects: enrichedProjects })
    } catch (mongoError) {
      console.error('MongoDB error:', mongoError)
      // Fallback to Supabase data only
      return NextResponse.json({ projects: supabaseProjects })
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateProjectRequest = await request.json()
    console.log('Received project creation request:', { name: body.name, hasSchema: !!body.schema })
    
    // Validate required fields
    if (!body.name || !body.schema) {
      console.error('Validation failed: missing name or schema')
      return NextResponse.json(
        { error: 'Name and schema are required' },
        { status: 400 }
      )
    }

    // Create project in Supabase
    console.log('Creating project in Supabase...')
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .insert([
        {
          name: body.name,
          description: body.description,
          schema: body.schema,
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Project created in Supabase:', project.id)

    // Also create project in MongoDB for processing
    try {
      console.log('Creating project in MongoDB...')
      const db = await getMongoDb()
      const projectsCollection = db.collection('projects')
      
      const mongoProject = await projectsCollection.insertOne({
        name: body.name,
        description: body.description,
        schema: body.schema,
        supabase_id: project.id,
        created_at: new Date(),
        updated_at: new Date()
      })

      console.log('Project created in MongoDB:', mongoProject.insertedId)
    } catch (mongoError) {
      console.error('Error creating project in MongoDB:', mongoError)
      // Continue anyway - we have the project in our main DB
    }

    console.log('Returning successful response')
    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/projects:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}