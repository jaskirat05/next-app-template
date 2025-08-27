'use client';

import { useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import {
  Button,
  Text,
  Stack,
  rem,
  SimpleGrid
} from '@mantine/core';
import { IconUpload, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import DocumentCard, { DocumentStatus } from '../DocumentCard/DocumentCard';

interface FileUploadProps {
  projectId: string;
  onUploadSuccess?: (taskId: string, filename: string) => void;
}

export interface FileUploadRef {
  triggerFileSelect: () => void;
}

interface UploadedFile {
  id: string;
  filename: string;
  status: DocumentStatus;
  progress: number;
  taskId?: string;
}

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const FileUpload = forwardRef<FileUploadRef, FileUploadProps>(({
  projectId,
  onUploadSuccess
}, ref) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    triggerFileSelect: () => {
      fileInputRef.current?.click();
    }
  }));

  const validateFile = (file: File): string | null => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size: ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`;
    }
    
    return null;
  };

  const updateFileStatus = useCallback((fileId: string, updates: Partial<UploadedFile>) => {
    setUploadedFiles(prev => 
      prev.map(f => f.id === fileId ? { ...f, ...updates } : f)
    );
  }, []);

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      notifications.show({
        title: 'Invalid File',
        message: validationError,
        color: 'red',
        icon: <IconX size={18} />
      });
      return;
    }

    const fileId = `${Date.now()}_${file.name}`;
    
    // Add file to uploading list
    setUploadedFiles(prev => [...prev, {
      id: fileId,
      filename: file.name,
      status: 'uploading',
      progress: 0
    }]);

    try {
      const formData = new FormData();
      formData.append('file', file);
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
                updateFileStatus(fileId, {
                  status: 'uploading',
                  progress: data.progress || 0
                });
                break;
                
              case 'uploaded':
                updateFileStatus(fileId, {
                  status: 'uploaded',
                  progress: 100
                });
                break;
                
              case 'processing':
                updateFileStatus(fileId, {
                  status: 'processing',
                  taskId: data.taskId
                });
                
                if (data.taskId && onUploadSuccess) {
                  onUploadSuccess(data.taskId, file.name);
                }
                break;
            }
          } catch (parseError) {
            console.error('Error parsing SSE data:', parseError);
          }
        }
      }

      // Mark as completed after processing starts
      setTimeout(() => {
        updateFileStatus(fileId, { status: 'completed' });
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      updateFileStatus(fileId, {
        status: 'idle',
        progress: 0
      });

      notifications.show({
        title: 'Upload Failed',
        message: error instanceof Error ? error.message : 'An error occurred',
        color: 'red',
        icon: <IconX size={18} />
      });
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    // Clear the input so the same file can be selected again
    event.target.value = '';
  };

  const handleDelete = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  return (
    <Stack gap="md" style={{ flex: 1, overflow: 'hidden' }}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept={ALLOWED_EXTENSIONS.join(',')}
        onChange={handleFileChange}
      />

      {uploadedFiles.length > 0 && (
        <>
          <Text size="sm" fw={500}>Documents</Text>
          <SimpleGrid
            cols={{ base: 2, sm: 3, md: 4, lg: 5 }}
            spacing={{ base: 'xs', sm: 'sm', md: 'md' }}
            style={{ 
              flex: 1,
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 200px)'
            }}
          >
            {uploadedFiles.map((file) => (
              <DocumentCard
                key={file.id}
                filename={file.filename}
                status={file.status}
                progress={file.progress}
                onDelete={() => handleDelete(file.id)}
                onSummary={() => console.log('Summary clicked for', file.filename)}
                onData={() => console.log('Data clicked for', file.filename)}
              />
            ))}
          </SimpleGrid>
        </>
      )}
    </Stack>
  );

});

FileUpload.displayName = 'FileUpload';

export default FileUpload;