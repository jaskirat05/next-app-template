'use client';

import { useState } from 'react';
import {
  Text,
  Group,
  ActionIcon,
  Menu,
  Progress,
  Overlay,
  Loader,
  Stack,
  rem,
  Box
} from '@mantine/core';
import {
  IconDots,
  IconFileText,
  IconDatabase,
  IconTrash,
  IconCheck
} from '@tabler/icons-react';

export type DocumentStatus = 'idle' | 'uploading' | 'uploaded' | 'processing' | 'completed';

interface DocumentCardProps {
  filename: string;
  status?: DocumentStatus;
  progress?: number;
  onSummary?: () => void;
  onData?: () => void;
  onDelete?: () => void;
}

export default function DocumentCard({
  filename,
  status = 'idle',
  progress = 0,
  onSummary,
  onData,
  onDelete
}: DocumentCardProps) {
  const [menuOpened, setMenuOpened] = useState(false);

  const getStatusIcon = () => {
    switch (status) {
      case 'uploaded':
      case 'completed':
        return <IconCheck size={rem(12)} color="var(--mantine-color-green-6)" />;
      case 'uploading':
      case 'processing':
        return null;
      default:
        return null;
    }
  };

  const showProgressBar = status === 'uploading' && progress > 0;
  const showProcessingOverlay = status === 'processing';
  const isInteractive = status === 'completed';

  return (
    <Box
      style={{
        position: 'relative',
        width: '80px',
        cursor: 'pointer',
        userSelect: 'none'
      }}
    >
      {showProcessingOverlay && (
        <Overlay color="#fff" backgroundOpacity={0.7} blur={1} radius="md">
          <Stack align="center" justify="center" h="100%">
            <Loader size="xs" />
          </Stack>
        </Overlay>
      )}

      <Stack gap={4} align="center">
        {/* Mac-style folder icon */}
        <Box
          style={{
            position: 'relative',
            width: '64px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Folder back */}
          <Box
            style={{
              position: 'absolute',
              width: '56px',
              height: '40px',
              backgroundColor: '#4A90E2',
              borderRadius: '4px 4px 6px 6px',
              top: '4px',
              left: '4px'
            }}
          />
          
          {/* Folder tab */}
          <Box
            style={{
              position: 'absolute',
              width: '20px',
              height: '8px',
              backgroundColor: '#5BA0F2',
              borderRadius: '4px 4px 0 0',
              top: '0px',
              left: '8px'
            }}
          />
          
          {/* Folder front */}
          <Box
            style={{
              position: 'absolute',
              width: '56px',
              height: '32px',
              backgroundColor: '#5BA0F2',
              borderRadius: '2px 2px 6px 6px',
              top: '8px',
              left: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />

          {/* Status indicator */}
          {getStatusIcon() && (
            <Box
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                backgroundColor: 'white',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}
            >
              {getStatusIcon()}
            </Box>
          )}

          {/* Three dots menu */}
          {isInteractive && (
            <Menu
              opened={menuOpened}
              onChange={setMenuOpened}
              position="bottom-start"
            >
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  color="white"
                  size="xs"
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: '2px',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    borderRadius: '50%'
                  }}
                >
                  <IconDots size={rem(12)} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconFileText size={rem(12)} />}
                  onClick={onSummary}
                >
                  Summary
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconDatabase size={rem(12)} />}
                  onClick={onData}
                >
                  Data
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconTrash size={rem(12)} />}
                  color="red"
                  onClick={onDelete}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Box>

        {/* Filename */}
        <Text
          size="xs"
          ta="center"
          lineClamp={2}
          style={{
            width: '80px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={filename}
        >
          {filename}
        </Text>

        {/* Progress bar */}
        {showProgressBar && (
          <Box style={{ width: '64px' }}>
            <Progress value={progress} size="xs" radius="xl" />
          </Box>
        )}
      </Stack>
    </Box>
  );
}