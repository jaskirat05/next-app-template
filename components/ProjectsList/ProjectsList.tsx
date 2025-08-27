'use client';

import { Button, Card, Text, Badge, Group, Stack, Skeleton, TextInput } from '@mantine/core';
import { IconPlus, IconFolder, IconCalendar, IconCode, IconSearch, IconDownload } from '@tabler/icons-react';
import classes from './ProjectsList.module.css';

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

interface ProjectsListProps {
  projects: Project[];
  loading: boolean;
  onCreateProject: () => void;
  selectedProjectId?: string;
  onSelectProject?: (project: Project) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ProjectsList({ 
  projects, 
  loading, 
  onCreateProject,
  selectedProjectId,
  onSelectProject,
  searchQuery,
  onSearchChange
}: ProjectsListProps) {
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getSchemaFieldCount = (schemaString: string) => {
    try {
      const schema = JSON.parse(schemaString);
      return Object.keys(schema).length;
    } catch {
      return 0;
    }
  };

  const handleDownload = (project: Project, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card selection
    if (project.original_file_url) {
      window.open(project.original_file_url, '_blank');
    }
  };

  const renderSkeletons = () => {
    return Array.from({ length: 3 }).map((_, index) => (
      <Card key={index} className={classes.skeletonCard}>
        <Stack gap="sm">
          <Skeleton height={20} width="70%" />
          <Skeleton height={14} width="100%" />
          <Skeleton height={14} width="80%" />
          <Group gap="xs">
            <Skeleton height={20} width={60} radius="xl" />
            <Skeleton height={20} width={80} radius="xl" />
          </Group>
        </Stack>
      </Card>
    ));
  };

  const renderEmptyState = () => (
    <div className={classes.emptyState}>
      <IconFolder size={48} stroke={1.5} className={classes.emptyIcon} />
      <Text size="lg" fw={500} c="dimmed" mb="xs">
        No projects yet
      </Text>
      <Text size="sm" c="dimmed" ta="center" mb="lg">
        Create your first project to start processing documents
      </Text>
    </div>
  );

  return (
    <div className={classes.projectsList}>
      <Button
        fullWidth
        leftSection={<IconPlus size={16} />}
        onClick={onCreateProject}
        className={classes.createButton}
        size="md"
      >
        Create New Project
      </Button>

      <TextInput
        placeholder="Search projects..."
        leftSection={<IconSearch size={16} />}
        value={searchQuery}
        onChange={(event) => onSearchChange(event.currentTarget.value)}
        className={classes.searchInput}
        mb="md"
      />

      <div className={classes.projectsContainer}>
        {loading ? (
          renderSkeletons()
        ) : projects.length === 0 ? (
          renderEmptyState()
        ) : (
          <Stack gap="md">
            {projects.map((project) => (
              <Card
                key={project.id}
                className={`${classes.projectCard} ${
                  selectedProjectId === project.id ? classes.selectedCard : ''
                }`}
                onClick={() => onSelectProject?.(project)}
                style={{ cursor: onSelectProject ? 'pointer' : 'default' }}
              >
                <Stack gap="sm">
                  <Group justify="space-between" align="flex-start">
                    <Text fw={600} className={classes.projectName} lineClamp={1}>
                      {project.name}
                    </Text>
                    <Group gap="xs">
                      <IconCalendar size={12} />
                      <Text size="xs" c="dimmed">
                        {formatDate(project.created_at)}
                      </Text>
                    </Group>
                  </Group>

                  {project.description && (
                    <Text size="sm" c="dimmed" lineClamp={2} className={classes.description}>
                      {project.description}
                    </Text>
                  )}

                  <Group justify="space-between" align="center" mt="xs">
                    <Badge
                      variant="light"
                      color="blue"
                      size="sm"
                      leftSection={<IconCode size={12} />}
                    >
                      {getSchemaFieldCount(project.schema)} fields
                    </Badge>
                    
                    {project.original_file_url && (
                      <Button
                        variant="subtle"
                        size="xs"
                        leftSection={<IconDownload size={12} />}
                        onClick={(event) => handleDownload(project, event)}
                        className={classes.downloadButton}
                      >
                        Download
                      </Button>
                    )}
                  </Group>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </div>
    </div>
  );
}