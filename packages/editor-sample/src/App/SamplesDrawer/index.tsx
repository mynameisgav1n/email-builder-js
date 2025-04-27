import React from 'react';

import { Box, Button, Divider, Drawer, Link, Stack, Typography } from '@mui/material';

import { useSamplesDrawerOpen } from '../../documents/editor/EditorContext';

import SidebarButton from './SidebarButton';
import logo from './waypoint.svg';

export const SAMPLES_DRAWER_WIDTH = 240;

export default function SamplesDrawer() {
  const samplesDrawerOpen = useSamplesDrawerOpen();

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={samplesDrawerOpen}
      sx={{
        width: samplesDrawerOpen ? SAMPLES_DRAWER_WIDTH : 0,
      }}
    >
      <Stack spacing={3} py={1} px={2} width={SAMPLES_DRAWER_WIDTH} justifyContent="space-between" height="100%">
        <Stack spacing={2} sx={{ '& .MuiButtonBase-root': { width: '100%', justifyContent: 'flex-start' } }}>
          <Typography variant="h6" component="h1" sx={{ p: 0.75 }}>
            EmailBuilder.js
          </Typography>

          <Stack alignItems="flex-start">
            <SidebarButton href="#sample/default">Default Template</SidebarButton>
            <SidebarButton href="#">Empty</SidebarButton>
            <SidebarButton href="#sample/welcome">[Extra] Welcome email</SidebarButton>
            <SidebarButton href="#sample/one-time-password">[Extra] One-time passcode (OTP)</SidebarButton>
            <SidebarButton href="#sample/reset-password">[Extra] Reset password</SidebarButton>
            <SidebarButton href="#sample/order-ecomerce">[Extra] E-commerce receipt</SidebarButton>
            <SidebarButton href="#sample/subscription-receipt">[Extra] Subscription receipt</SidebarButton>
            <SidebarButton href="#sample/reservation-reminder">[Extra] Reservation reminder</SidebarButton>
            <SidebarButton href="#sample/post-metrics-report">[Extra] Post metrics</SidebarButton>
            <SidebarButton href="#sample/respond-to-message">[Extra] Respond to inquiry</SidebarButton>
          </Stack>

          <Divider />

          <Stack>
            <Button size="small" href="https://www.usewaypoint.com/open-source/emailbuilderjs" target="_blank">
              Learn more
            </Button>
            <Button size="small" href="https://github.com/usewaypoint/email-builder-js" target="_blank">
              View on GitHub
            </Button>
          </Stack>
        </Stack>
        <Stack spacing={2} px={0.75} py={3}>
          <Box>
            <Typography variant="overline" gutterBottom>
              Need help?
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Contact Gavin at gavin@inspireyouthnj.org.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            sx={{ justifyContent: 'center' }}
            href="mailto:gavin@inspireyouthnj.org"
            target="_blank"
          >
            Send email
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
