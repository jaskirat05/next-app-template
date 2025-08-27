'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Modal,
  Button,
  Text,
  Stack,
  FileInput,
  rem,
  Alert,
  Progress,
  Group,
  Loader
} from '@mantine/core';
import { IconUpload, IconFile, IconX, IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface UploadModalProps {
  opened: boolean;
  onClose: () => void;
  projectId: string;
  onUploadSuccess?: (taskId: string, filename: string) => void;
  accept?: string;
  maxSize?: number;
}

type UploadState = 'idle' | 'uploading' | 'uploaded' | 'processing' | 'completed' | 'error';

export default function UploadModal({
  opened,
  onClose,
  projectId,
  onUploadSuccess,
  accept = '.pdf,.doc,.docx,.txt',
  maxSize = 50 * 1024 * 1024 // 50MB
}: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = accept.split(',').map(ext => ext.trim());
    
    if (!allowedExtensions.includes(fileExtension)) {
      return `Invalid file type. Allowed: ${allowedExtensions.join(', ')}`;
    }
    
    if (file.size > maxSize) {
      return `File too large. Maximum size: ${Math.round(maxSize / (1024 * 1024))}MB`;
    }
    
    return null;
  };

  const resetModal = () => {
    setSelectedFile(null);
    setUploadState('idle');
    setProgress(0);
    setError(null);
    setTaskId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (uploadState === 'uploading' || uploadState === 'processing') {
      return; // Don't allow closing during upload/processing
    }
    resetModal();
    onClose();
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setError(null);
    
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
      }
    }
  };

  const uploadFile = async () => {
    if (!selectedFile || error) return;

    setUploadState('uploading');
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('projectId', projectId);

      const response = await fetch('/api/proposals/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            
            switch (data.type) {
              case 'uploading':
                setUploadState('uploading');
                setProgress(data.progress || 0);
                break;
                
              case 'uploaded':
                setUploadState('uploaded');
                setProgress(100);
                break;
                
              case 'processing':
                setUploadState('processing');
                if (data.taskId) {
                  setTaskId(data.taskId);
                  if (onUploadSuccess) {
                    onUploadSuccess(data.taskId, selectedFile.name);
                  }
                }
                break;
            }
          } catch (parseError) {
            console.error('Error parsing SSE data:', parseError);
          }
        }
      }

      // Mark as completed
      setUploadState('completed');
      
      notifications.show({
        title: 'Upload Successful',
        message: `File "${selectedFile.name}" uploaded and processing started`,
        color: 'green',
        icon: <IconCheck size={18} />
      });

      // Auto-close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      setUploadState('error');
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed');

      notifications.show({
        title: 'Upload Failed',
        message: uploadError instanceof Error ? uploadError.message : 'An error occurred',
        color: 'red',
        icon: <IconX size={18} />
      });
    }
  };

  const getStatusMessage = () => {
    switch (uploadState) {
      case 'uploading':
        return `Uploading ${selectedFile?.name}... ${progress}%`;
      case 'uploaded':
        return `File uploaded successfully!`;
      case 'processing':
        return `Processing document...`;
      case 'completed':
        return `Upload completed! Processing started.`;
      case 'error':
        return error || 'Upload failed';
      default:
        return null;
    }
  };

  const isUploading = uploadState === 'uploading' || uploadState === 'processing';
  const canUpload = selectedFile && !error && uploadState === 'idle';
  const isCompleted = uploadState === 'completed';

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Upload Document"
      size="md"
      closeOnClickOutside={!isUploading}
      closeOnEscape={!isUploading}
      withCloseButton={!isUploading}
    >
      <Stack gap="md">
        <FileInput
          label="Select Document"
          placeholder="Choose a file..."
          accept={accept}
          value={selectedFile}
          onChange={handleFileSelect}
          disabled={isUploading}
          leftSection={<IconFile size={rem(16)} />}
          description={`Max size: ${Math.round(maxSize / (1024 * 1024))}MB`}
          error={error}
        />

        {uploadState === 'uploading' && (
          <Stack gap="xs">
            <Progress value={progress} />
            <Text size="sm" c="dimmed" ta="center">
              {getStatusMessage()}
            </Text>
          </Stack>
        )}

        {uploadState === 'processing' && (
          <Stack gap="xs" align="center">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              {getStatusMessage()}
            </Text>
            {taskId && (
              <Text size="xs" c="dimmed">
                Task ID: {taskId}
              </Text>
            )}
          </Stack>
        )}

        {(uploadState === 'uploaded' || isCompleted) && (
          <Alert color="green" icon={<IconCheck size={rem(16)} />}>
            {getStatusMessage()}
          </Alert>
        )}

        {uploadState === 'error' && (
          <Alert color="red" icon={<IconX size={rem(16)} />}>
            {getStatusMessage()}
          </Alert>
        )}

        <Group justify="flex-end" gap="sm">
          {!isUploading && !isCompleted && (
            <Button variant="subtle" onClick={handleClose}>
              Cancel
            </Button>
          )}
          
          {canUpload && (
            <Button
              onClick={uploadFile}
              leftSection={<IconUpload size={rem(16)} />}
            >
              Upload File
            </Button>
          )}

          {uploadState === 'error' && (
            <Button
              onClick={() => {
                setUploadState('idle');
                setError(null);
                setProgress(0);
              }}
            >
              Try Again
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
}