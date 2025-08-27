import React, { useState } from 'react';
import { Box, Grid, useMediaQuery, useTheme, Snackbar, Alert, AlertTitle } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import EmailSidebar from '@/components/EmailSidebar';
import EmailViewer from '@/components/EmailViewer';
import ComposeButton from '@/components/ComposeButton';
import ComposeEmailModal from '@/components/ComposeEmailModal';

export default function Home() {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showEmailViewer, setShowEmailViewer] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    severity: 'success',
    title: '',
    message: '',
    details: []
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();

  const showNotification = (severity, title, message, details = []) => {
    setNotification({
      open: true,
      severity,
      title,
      message,
      details
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Mutation for deleting emails
  const deleteEmailMutation = useMutation({
    mutationFn: async (emailId) => {
      const response = await fetch(`http://localhost:3001/api/emails/${emailId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.error || 'Failed to delete email');
        error.status = response.status;
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch emails
      queryClient.invalidateQueries({ queryKey: ['emails'] });

      showNotification(
        'success',
        'Email Deleted',
        'Email has been successfully deleted'
      );

      // If we're viewing the deleted email, clear the selection
      if (selectedEmail && selectedEmail.id === data.id) {
        setSelectedEmail(null);
        if (isMobile) {
          setShowEmailViewer(false);
        }
      }
    },
    onError: (error) => {
      console.error('Error deleting email:', error);

      if (error.status === 404) {
        showNotification(
          'error',
          'Email Not Found',
          'The email you tried to delete could not be found'
        );
      } else {
        showNotification(
          'error',
          'Delete Failed',
          error.message || 'Failed to delete email. Please try again.'
        );
      }
    }
  });

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

  const handleSendEmail = () => {
    setShowComposeModal(false)
  };

  const handleDeleteEmail = (emailId) => {
    if (window.confirm('Are you sure you want to delete this email? This action cannot be undone.')) {
      deleteEmailMutation.mutate(emailId);
    }
  };

  return (
    <Box sx={{
      height: '100vh',
      overflow: 'hidden',
	    // Account for fixed left nav on desktop
	    marginLeft: '90px',
	    width: 'calc(100% - 90px)',
    }}>
      {isMobile ? (
        // Mobile view: show either sidebar or email viewer
        <>
          {showEmailViewer ? (
            <EmailViewer
              email={selectedEmail}
              onBack={handleBackToSidebar}
              showBackButton={true}
              onDelete={handleDeleteEmail}
              isDeleting={deleteEmailMutation.isPending}
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
            <EmailViewer
              email={selectedEmail}
              onDelete={handleDeleteEmail}
              isDeleting={deleteEmailMutation.isPending}
            />
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
        showNotification={showNotification}
      />

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={notification.severity === 'success' ? 4000 : 8000}
        onClose={hideNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={hideNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%', maxWidth: 500 }}
        >
          {notification.title && <AlertTitle>{notification.title}</AlertTitle>}
          {notification.message}
          {notification.details.length > 0 && (
            <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
              {notification.details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </Box>
          )}
        </Alert>
      </Snackbar>
    </Box>
  );
}
