import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { HourglassEmpty } from '@mui/icons-material';
import Link from 'next/link';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

export default function LeadsComingSoon() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 2,
        flexDirection: 'column',
        // Account for fixed left nav on desktop
        marginLeft: '90px',
        width: 'calc(100% - 90px)',
        p: 3,
      }}
    >
      <HourglassEmpty color="primary" sx={{ fontSize: 64 }} />
      <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
        Leads — Coming Soon
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
        We're building a dedicated space to manage and track your leads. Check back soon for updates.
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Link href="/" passHref legacyBehavior>
          <Button variant="contained" color="primary">
            Back to Inbox
          </Button>
        </Link>
      </Box>
    </Box>
  );
}

