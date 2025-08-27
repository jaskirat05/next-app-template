'use client';

import { useState } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Stack,
  Group,
  Title,
  Text,
  Alert,
  TagsInput,
  SimpleGrid
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconPlus, IconFileText, IconUser, IconMail } from '@tabler/icons-react';
import classes from './CreateProjectModal.module.css';

interface CreateProjectFormData {
  name: string;
  description: string;
  schemaFields: string[];
}

interface CreateProjectModalProps {
  opened: boolean;
  onClose: () => void;
  onProjectCreated?: (project: any) => void;
}

const sampleSchemas = [
  {
    name: 'Document Processing',
    icon: IconFileText,
    fields: ['title', 'content', 'author', 'date_created', 'document_type', 'category']
  },
  {
    name: 'User Profile',
    icon: IconUser,
    fields: ['first_name', 'last_name', 'email', 'phone', 'address', 'date_of_birth']
  },
  {
    name: 'Contact Form',
    icon: IconMail,
    fields: ['name', 'email', 'subject', 'message', 'company', 'phone']
  }
];

export function CreateProjectModal({ opened, onClose, onProjectCreated }: CreateProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateProjectFormData>({
    initialValues: {
      name: '',
      description: '',
      schemaFields: []
    },
    validate: {
      name: (value) => (value.length < 1 ? 'Project name is required' : null),
      schemaFields: (value) => (value.length < 1 ? 'At least one schema field is required' : null)
    }
  });

  const handleSampleSchema = (schema: typeof sampleSchemas[0]) => {
    form.setFieldValue('schemaFields', schema.fields);
  };

  const handleSubmit = async (values: CreateProjectFormData) => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: values.name,
        description: values.description,
        schema: JSON.stringify(values.schemaFields.reduce((acc, field) => {
          acc[field] = 'string';
          return acc;
        }, {} as Record<string, string>))
      };

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      const data = await response.json();
      
      notifications.show({
        title: 'Success',
        message: 'Project created successfully!',
        color: 'green'
      });

      form.reset();
      onProjectCreated?.(data.project);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      form.reset();
      setError(null);
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <IconPlus size={20} />
          <Title order={3}>Create New Project</Title>
        </Group>
      }
      size="lg"
      centered
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
      className={classes.modal}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Error"
              color="red"
              variant="light"
            >
              {error}
            </Alert>
          )}

          <TextInput
            label="Project Name"
            placeholder="Enter project name"
            required
            {...form.getInputProps('name')}
            disabled={loading}
          />

          <Textarea
            label="Description"
            placeholder="Enter project description (optional)"
            minRows={3}
            maxRows={5}
            {...form.getInputProps('description')}
            disabled={loading}
          />

          <Stack gap="sm">
            <Text size="sm" fw={500} className={classes.label}>
              Sample Schema Templates
            </Text>
            <SimpleGrid cols={3} spacing="sm">
              {sampleSchemas.map((schema, index) => (
                <Button
                  key={index}
                  variant="light"
                  size="sm"
                  leftSection={<schema.icon size={16} />}
                  onClick={() => handleSampleSchema(schema)}
                  disabled={loading}
                  className={classes.sampleButton}
                >
                  {schema.name}
                </Button>
              ))}
            </SimpleGrid>
          </Stack>

          <TagsInput
            label="Schema Fields"
            placeholder="Type field name and press Enter"
            description="All fields will be treated as string type. Press Enter after typing each field name."
            required
            {...form.getInputProps('schemaFields')}
            disabled={loading}
          />

          <Text size="sm" c="dimmed" className={classes.note}>
            💡 Type a field name (e.g., "title", "email", "date") and press Enter to add it as a tag. All fields will be stored as string type.
          </Text>

          <Group justify="flex-end" gap="md" mt="lg">
            <Button
              variant="subtle"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              leftSection={<IconPlus size={16} />}
            >
              Create Project
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}