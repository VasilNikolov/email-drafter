import React, { useState } from 'react';
import { Box, Grid, useMediaQuery, useTheme } from '@mui/material';
import EmailSidebar from '@/components/EmailSidebar';
import EmailViewer from '@/components/EmailViewer';
import ComposeButton from '@/components/ComposeButton';
import ComposeEmailModal from '@/components/ComposeEmailModal';

export default function Home() {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showEmailViewer, setShowEmailViewer] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleEmailSelect = (email) => {
    setSelectedEmail(email);
    if (isMobile) {
      setShowEmailViewer(true);
    }
  };

  const handleBackToSidebar = () => {
    setShowEmailViewer(false);
  };

  const handleComposeClick = () => {
    setShowComposeModal(true);
  };

  const handleCloseCompose = () => {
    setShowComposeModal(false);
  };

  const handleSendEmail = (emailData) => {
    console.log('Email to send:', emailData);
    // TODO: Implement actual email sending logic
  };

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      {isMobile ? (
        // Mobile view: show either sidebar or email viewer
        <>
          {showEmailViewer ? (
            <EmailViewer
              email={selectedEmail}
              onBack={handleBackToSidebar}
              showBackButton={true}
            />
          ) : (
            <EmailSidebar
              onEmailSelect={handleEmailSelect}
              selectedEmailId={selectedEmail?.id}
            />
          )}
        </>
      ) : (
        // Desktop view: show both sidebar and email viewer
        <Grid container sx={{ height: '100%' }}>
          <Grid item md={4} lg={3}>
            <EmailSidebar
              onEmailSelect={handleEmailSelect}
              selectedEmailId={selectedEmail?.id}
            />
          </Grid>
          <Grid item md={8} lg={9}>
            <EmailViewer email={selectedEmail} />
          </Grid>
        </Grid>
      )}

      {/* Floating Compose Button - always visible */}
      <ComposeButton onClick={handleComposeClick} />

      {/* Compose Email Modal */}
      <ComposeEmailModal
        open={showComposeModal}
        onClose={handleCloseCompose}
        onSend={handleSendEmail}
      />
    </Box>
  );
}
