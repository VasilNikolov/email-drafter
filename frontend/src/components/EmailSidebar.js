import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';

// Mock data for demonstration
const mockEmails = [
  {
    id: 1,
    to: 'john@example.com',
    cc: '',
    bcc: '',
    subject: 'Project Update - Q4 Progress',
    body: 'Hi John,\n\nI wanted to give you a quick update on our Q4 progress. We\'ve completed 75% of the milestones and are on track to finish by the deadline.\n\nBest regards,\nTeam Lead',
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    to: 'sarah@company.com',
    cc: 'manager@company.com',
    bcc: '',
    subject: 'Meeting Request - Weekly Sync',
    body: 'Hi Sarah,\n\nCould we schedule our weekly sync for Thursday at 2 PM? Let me know if this works for your schedule.\n\nThanks,\nAlex',
    created_at: '2024-01-14T14:20:00Z'
  },
  {
    id: 3,
    to: 'client@business.com',
    cc: '',
    bcc: '',
    subject: 'Follow-up: Proposal Discussion',
    body: 'Dear Client,\n\nI hope this email finds you well. I wanted to follow up on our proposal discussion from last week. Do you have any questions or need additional information?\n\nLooking forward to your response.\n\nBest regards,\nSales Team',
    created_at: '2024-01-13T16:45:00Z'
  },
  {
    id: 4,
    to: 'team@startup.com',
    cc: '',
    bcc: '',
    subject: 'Product Launch Timeline',
    body: 'Team,\n\nI\'m excited to share our updated product launch timeline. We\'re targeting mid-February for the beta release.\n\nKey milestones:\n- Feature freeze: Jan 25\n- QA testing: Jan 30 - Feb 10\n- Beta launch: Feb 15\n\nLet me know if you have any concerns.\n\nBest,\nProduct Manager',
    created_at: '2024-01-12T09:15:00Z'
  },
  {
    id: 5,
    to: 'support@service.com',
    cc: '',
    bcc: '',
    subject: 'Customer Feedback Summary',
    body: 'Hi Support Team,\n\nHere\'s this week\'s customer feedback summary:\n\n- 95% satisfaction rate\n- Common requests: dark mode, mobile app\n- Issue resolution time: improved by 20%\n\nGreat work everyone!\n\nRegards,\nCustomer Success',
    created_at: '2024-01-11T11:00:00Z'
  }
];

const EmailSidebar = ({ onEmailSelect, selectedEmailId }) => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate API call with mock data
    const loadEmails = async () => {
      setLoading(true);
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setEmails(mockEmails);
        setError(null);
      } catch (err) {
        setError('Failed to load emails');
      } finally {
        setLoading(false);
      }
    };

    loadEmails();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Paper sx={{ height: '100vh', overflow: 'auto' }}>
      <Box sx={{ p: 2, backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="h6">
          Emails ({emails.length})
        </Typography>
      </Box>
      <Divider />
      <List sx={{ p: 0 }}>
        {emails.map((email) => (
          <React.Fragment key={email.id}>
            <ListItem disablePadding>
              <ListItemButton
                selected={selectedEmailId === email.id}
                onClick={() => onEmailSelect(email)}
                sx={{
                  py: 2,
                  px: 2,
                  '&.Mui-selected': {
                    backgroundColor: 'action.selected',
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                      {truncateText(email.subject || 'No Subject')}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        To: {truncateText(email.to)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(email.created_at)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>
      {emails.length === 0 && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No emails found
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default EmailSidebar;
