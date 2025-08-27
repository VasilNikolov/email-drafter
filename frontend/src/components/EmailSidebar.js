import { useEffect, useCallback, Fragment } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
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
  Alert,
  Button
} from '@mui/material';

const EmailSidebar = ({ onEmailSelect, selectedEmailId }) => {
  const queryClient = useQueryClient();
  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  // Fetch emails with infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['emails'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(`http://localhost:3001/api/emails?page=${pageParam}&limit=20`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore ? lastPage.pagination.currentPage + 1 : undefined;
    },
    initialPageParam: 1,
  });

  // Auto-fetch next page when scrolling to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Function to refresh emails when new ones are added
  const refreshEmails = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['emails'] });
  }, [queryClient]);

  // Expose refresh function to parent component
  useEffect(() => {
    window.refreshEmailList = refreshEmails;
    return () => {
      delete window.refreshEmailList;
    };
  }, [refreshEmails]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return 'No content';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Flatten all emails from all pages
  const allEmails = data?.pages.flatMap(page => page.emails) || [];
  const totalCount = data?.pages[0]?.pagination?.totalCount || 0;

  if (isLoading) {
    return (
      <Paper sx={{ height: '100vh', overflow: 'auto' }}>
        <Box sx={{ p: 2, backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
          <Typography variant="h6">
            Emails
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (isError) {
    return (
      <Paper sx={{ height: '100vh', overflow: 'auto' }}>
        <Box sx={{ p: 2, backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
          <Typography variant="h6">
            Emails
          </Typography>
        </Box>
        <Box sx={{ p: 2 }}>
          <Alert
            severity="error"
            action={
              <Button onClick={() => refetch()} size="small">
                Retry
              </Button>
            }
          >
            {error?.message || 'Failed to load emails from server'}
          </Alert>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ height: '100vh', overflow: 'auto' }}>
      <Box sx={{ p: 2, backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="h6">
          Emails ({totalCount})
        </Typography>
      </Box>
      <Divider />
      <List sx={{ p: 0 }}>
        {allEmails.map((email, index) => (
          <Fragment key={email.id}>
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
          </Fragment>
        ))}

        {/* Infinite loading trigger */}
        {hasNextPage && (
          <ListItem ref={ref} sx={{ justifyContent: 'center', py: 2 }}>
            {isFetchingNextPage ? (
              <CircularProgress size={24} />
            ) : (
              <Button onClick={() => fetchNextPage()} disabled={!hasNextPage}>
                Load More
              </Button>
            )}
          </ListItem>
        )}

        {/* No more emails message */}
        {!hasNextPage && allEmails.length > 0 && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              No more emails to load
            </Typography>
          </Box>
        )}
      </List>

      {allEmails.length === 0 && (
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
