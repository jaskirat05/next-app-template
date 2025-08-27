'use client';

import { Anchor, Group } from '@mantine/core';
import Spline from '@splinetool/react-spline';
import { CallToAction } from '../CallToAction/CallToAction';
import classes from './SplineHero.module.css';

export function SplineHero() {
  return (
    <div className={classes.hero}>
      <nav className={classes.navbar}>
        <Group justify="space-between" className={classes.navContainer}>
          <div className={classes.logo}>MinEru</div>
          <Group gap="xl" className={classes.navLinks}>
            <Anchor href="#home" className={classes.navLink}>Home</Anchor>
            <Anchor href="#about" className={classes.navLink}>About</Anchor>
            <Anchor href="#services" className={classes.navLink}>Services</Anchor>
            <Anchor href="#contact" className={classes.navLink}>Contact</Anchor>
          </Group>
        </Group>
      </nav>
      
      <div className={classes.splineSection}>
        <Spline
          scene="/scene.splinecode"
          className={classes.splineCanvas}
        />
      </div>
      
      <CallToAction />
    </div>
  );
}