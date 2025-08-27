import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  Stack,
  IconButton,
  Button,
  CircularProgress
} from '@mui/material';
import { ArrowBack, Delete } from '@mui/icons-material';

const EmailViewer = ({ email, onBack, showBackButton = false, onDelete, isDeleting = false }) => {
  if (!email) {
    return (
      <Paper sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Select an email to view its content
        </Typography>
      </Paper>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = () => {
    if (onDelete && email?.id) {
      onDelete(email.id);
    }
  };

  return (
    <Paper sx={{ height: '100vh', overflow: 'auto' }}>
      <Box sx={{ p: 3 }}>
        {/* Email Header */}
        <Box sx={{ mb: 3 }}>
          {/* Back button, title, and delete button row */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
            {showBackButton && (
              <IconButton
                onClick={onBack}
                size="large"
                sx={{ mr: 1 }}
                aria-label="Back to email list"
              >
                <ArrowBack />
              </IconButton>
            )}
            <Typography variant="h4" sx={{ fontWeight: 'bold', flex: 1 }}>
              {email.subject || 'No Subject'}
            </Typography>

            {/* Delete Button */}
            {onDelete && (
              <Button
                variant="outlined"
                color="error"
                startIcon={isDeleting ? <CircularProgress size={16} /> : <Delete />}
                onClick={handleDelete}
                disabled={isDeleting}
                sx={{ ml: 2 }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </Box>

          <Stack spacing={1} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium', minWidth: '40px' }}>
                To:
              </Typography>
              <Chip label={email.to} variant="outlined" size="small" />
            </Box>

            {email.cc && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium', minWidth: '40px' }}>
                  CC:
                </Typography>
                <Chip label={email.cc} variant="outlined" size="small" />
              </Box>
            )}

            {email.bcc && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium', minWidth: '40px' }}>
                  BCC:
                </Typography>
                <Chip label={email.bcc} variant="outlined" size="small" />
              </Box>
            )}

            <Typography variant="caption" color="text.secondary">
              Created: {formatDate(email.created_at)}
            </Typography>
          </Stack>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Email Body */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {email.body || 'No content'}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default EmailViewer;
