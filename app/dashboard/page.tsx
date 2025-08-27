'use client';

import { useState, useEffect, useRef } from 'react';
import { Container, Title, Text, Group, Stack, Button, rem } from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { ProjectsList } from '../../components/ProjectsList/ProjectsList';
import { CreateProjectModal } from '../../components/CreateProjectModal/CreateProjectModal';
import FileUpload, { FileUploadRef } from '../../components/FileUpload/FileUpload';
import classes from './page.module.css';

interface Project {
  id: string;
  name: string;
  description: string;
  schema: string;
  original_file_url?: string;
  demo_url?: string;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const fileUploadRef = useRef<FileUploadRef>(null);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        const projectsData = data.projects || [];
        setProjects(projectsData);
        setFilteredProjects(projectsData);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  }, [searchQuery, projects]);

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
  };

  return (
    <div className={classes.dashboard}>
      <Container fluid className={classes.container}>
        <div className={classes.content}>
          <div className={classes.leftPanel}>
            <div className={classes.header}>
              <Title order={2} className={classes.title}>
                Projects
              </Title>
              <Text className={classes.subtitle}>
                Manage your document processing projects
              </Text>
            </div>
            
            <ProjectsList 
              projects={filteredProjects}
              loading={loading}
              onCreateProject={() => setModalOpened(true)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedProjectId={selectedProject?.id}
              onSelectProject={setSelectedProject}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {selectedProject && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 20px 10px 0' }}>
                <Button
                  size="xs"
                  onClick={() => fileUploadRef.current?.triggerFileSelect()}
                  style={{
                    fontSize: rem(10),
                    padding: '4px 8px',
                    height: '24px',
                    width: '24px',
                    minWidth: '24px'
                  }}
                >
                  +
                </Button>
              </div>
            )}
            
            <div className={classes.rightPanel}>
              {selectedProject ? (
                <Stack gap="md" style={{ height: '100%', padding: '20px' }}>
                  <Title order={3}>{selectedProject.name}</Title>
                  
                  <FileUpload
                    ref={fileUploadRef}
                    projectId={selectedProject.id}
                    onUploadSuccess={(taskId, filename) => {
                      console.log('Upload successful:', { taskId, filename });
                    }}
                  />
                </Stack>
              ) : (
                <div className={classes.placeholder}>
                  <Text size="lg" c="dimmed" ta="center">
                    Select a project to upload documents
                  </Text>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <CreateProjectModal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          onProjectCreated={handleProjectCreated}
        />
      </Container>
    </div>
  );
}