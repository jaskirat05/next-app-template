'use client';

import { Button, Title, Text } from '@mantine/core';
import { IconRocket, IconDownload, IconEye } from '@tabler/icons-react';
import classes from './CallToAction.module.css';

export function CallToAction() {
  return (
    <div className={classes.cta}>
      <div className={classes.textSection}>
        <Title order={1} className={classes.title}>
          Try it now
        </Title>
      </div>
      
      <div className={classes.buttonSection}>
        <Button 
          size="lg" 
          className={classes.primaryButton}
          leftSection={<IconRocket size={20} />}
          component="a"
          href="/dashboard"
        >
          Get Started
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          className={classes.secondaryButton}
          leftSection={<IconEye size={20} />}
        >
          Watch Demo
        </Button>
        <Button 
          variant="light" 
          size="lg" 
          className={classes.tertiaryButton}
          leftSection={<IconDownload size={20} />}
        >
          Download
        </Button>
      </div>
    </div>
  );
}