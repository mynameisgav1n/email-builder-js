import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Drawer,
  Stack,
  Typography,
} from '@mui/material';

import {
  useSamplesDrawerOpen,
  useLoadedEmailTitle,
} from '../../documents/editor/EditorContext';

import SidebarButton from './SidebarButton';
import logo from './waypoint.svg';
import LogoutButton from './LogoutButton';

export const SAMPLES_DRAWER_WIDTH = 240;

export default function SamplesDrawer() {
  const samplesDrawerOpen = useSamplesDrawerOpen();
  const loadedEmailTitle = useLoadedEmailTitle();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/user.php')
      .then((res) => res.json())
      .then((data) => {
        setUsername(data.username || 'Guest');
      })
      .catch(() => {
        setUsername('Guest');
      });
  }, []);

  const handleSendEmailClick = () => {
    const subject = encodeURIComponent('Email Builder Help Needed');
    const body = encodeURIComponent(
      `Hi there! I'm more than happy to help with any issue you're having. Please describe your issue below the line and I'll be more than happy to help you out as soon as I can!\n------\n\n`
    );
    window.open(
      `mailto:tech@inspireyouthnj.org?subject=${subject}&body=${body}`,
      '_blank'
    );
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={samplesDrawerOpen}
      sx={{
        width: samplesDrawerOpen ? SAMPLES_DRAWER_WIDTH : 0,
      }}
    >
      <Stack
        spacing={3}
        py={1}
        px={2}
        width={SAMPLES_DRAWER_WIDTH}
        justifyContent="space-between"
        height="100%"
      >
        <Stack
          spacing={2}
          sx={{
            '& .MuiButtonBase-root': {
              width: '100%',
              justifyContent: 'flex-start',
            },
          }}
        >
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{ pt: 2 }}
          >
            <img
              src="https://static.iynj.org/fullLogo.png"
              alt="Inspire Youth NJ Logo"
              style={{ width: '80%', maxWidth: 150, marginBottom: 8 }}
            />
          </Box>

          <Box sx={{ minHeight: 24 }}>
            <Typography variant="h6" component="h1" sx={{ p: 0.75 }}>
              {loadedEmailTitle
                ? `Editing: ${loadedEmailTitle}`
                : username
                ? `Welcome, ${username}!`
                : ''}
            </Typography>
          </Box>
          <Divider />
          <Stack alignItems="flex-start">
            <Typography variant="overline" gutterBottom>
              IYNJ Templates
            </Typography>
            <SidebarButton href="/email-builder-js#sample/default-template">
              Default Template
            </SidebarButton>
            <SidebarButton href="/email-builder-js#sample/important-template">
              Important Email Template
            </SidebarButton>
            <SidebarButton href="/email-builder-js#">Empty</SidebarButton>
          </Stack>
            <Divider />
          <Stack alignItems="flex-start">
            <Typography variant="overline" gutterBottom>
              Random Templates
            </Typography>
            <SidebarButton href="/email-builder-js#sample/welcome">
              Welcome email
            </SidebarButton>
            <SidebarButton href="/email-builder-js#sample/one-time-password">
              One-time passcode (OTP)
            </SidebarButton>
            <SidebarButton href="/email-builder-js#sample/reset-password">
              Reset password
            </SidebarButton>
            <SidebarButton href="/email-builder-js#sample/order-ecomerce">
              E-commerce receipt
            </SidebarButton>
            <SidebarButton href="/email-builder-js#sample/subscription-receipt">
              Subscription receipt
            </SidebarButton>
            <SidebarButton href="/email-builder-js#sample/reservation-reminder">
              Reservation reminder
            </SidebarButton>
            <SidebarButton href="/email-builder-js#sample/post-metrics-report">
              Post metrics
            </SidebarButton>
            <SidebarButton href="/email-builder-js#sample/respond-to-message">
              Respond to inquiry
            </SidebarButton>
          </Stack>

          <Divider />

          <Stack>
            {/*<Typography variant="overline" gutterBottom>
              Pages
            </Typography>*/}
            <Button size="small" href="/email-builder-js/templates.html">
              All Templates
            </Button>
            <Button size="small" href="/email-builder-js/myemails.html">
              My Emails
            </Button>
            <Button size="small" href="/email-builder-js/filemanager.html">
              File Manager
            </Button>
            <LogoutButton />
          </Stack>
        </Stack>

        <Stack spacing={2} px={0.75} py={3}>
          <Box>
            <Typography variant="overline" gutterBottom>
              Need help?
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Contact Gavin at tech@inspireyouthnj.org.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            sx={{ justifyContent: 'center' }}
            onClick={handleSendEmailClick}
          >
            Send email for help
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
