'use client';

import { Container, Grid, Title, Text, Card } from '@mantine/core';
import { IconFileText, IconBrain, IconDownload, IconSearch, IconShield, IconRocket } from '@tabler/icons-react';
import classes from './Features.module.css';

const featuresData = [
  {
    icon: IconFileText,
    title: 'Document Processing',
    description: 'Advanced AI-powered document extraction and analysis for various file formats including PDFs, images, and text documents.'
  },
  {
    icon: IconBrain,
    title: 'AI Intelligence',
    description: 'Machine learning algorithms that understand context and extract meaningful information from complex documents.'
  },
  {
    icon: IconDownload,
    title: 'Multiple Formats',
    description: 'Export your processed documents in various formats including Markdown, JSON, XML, and structured data formats.'
  },
  {
    icon: IconSearch,
    title: 'Smart Search',
    description: 'Powerful search capabilities across all your processed documents with intelligent filtering and categorization.'
  },
  {
    icon: IconShield,
    title: 'Secure Processing',
    description: 'Enterprise-grade security with encrypted data transmission and secure cloud processing infrastructure.'
  },
  {
    icon: IconRocket,
    title: 'Fast Performance',
    description: 'Lightning-fast document processing with optimized algorithms and scalable cloud infrastructure.'
  }
];

export function Features() {
  return (
    <section className={classes.features}>
      <Container size="lg" className={classes.container}>
        <div className={classes.header}>
          <Title order={2} className={classes.title}>
            Powerful Features
          </Title>
          <Text className={classes.subtitle}>
            Discover the advanced capabilities that make document processing effortless and efficient
          </Text>
        </div>
        
        <Grid className={classes.grid}>
          {featuresData.map((feature, index) => (
            <Grid.Col key={index} span={{ base: 12, md: 6, lg: 4 }}>
              <Card className={classes.card}>
                <div className={classes.iconWrapper}>
                  <feature.icon size={32} className={classes.icon} />
                </div>
                <Title order={3} className={classes.cardTitle}>
                  {feature.title}
                </Title>
                <Text className={classes.cardDescription}>
                  {feature.description}
                </Text>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Container>
    </section>
  );
}