export interface CreateProjectRequest {
  name: string
  description?: string
  schema: string
}

export interface Project {
  id: string
  name: string
  description?: string
  schema: string
  original_file_url?: string
  demo_url?: string
  created_at: string
  updated_at: string
}