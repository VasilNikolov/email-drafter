import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Typography,
  Stack,
  CircularProgress,
  Box,
  Alert,
  Snackbar
} from '@mui/material';
import { Close, Send, AutoAwesome } from '@mui/icons-material';
import AIPromptModal from './AIPromptModal';
import {useMutation} from "@tanstack/react-query";
import {queryClient} from "@/lib/queryClient";

// Validation schema using Yup
const validationSchema = yup.object({
  to: yup
    .string()
    .required('Recipient email is required')
    .test('emails', 'Please enter valid email addresses separated by commas', (value) => {
      if (!value) return false;
      const emails = value.split(',').map(email => email.trim()).filter(email => email);
      return emails.every(email => yup.string().email().isValidSync(email));
    }),
  cc: yup
    .string()
    .test('emails', 'Please enter valid email addresses separated by commas', (value) => {
      if (!value?.trim()) return true; // Optional field
      const emails = value.split(',').map(email => email.trim()).filter(email => email);
      return emails.every(email => yup.string().email().isValidSync(email));
    }),
  bcc: yup
    .string()
    .test('emails', 'Please enter valid email addresses separated by commas', (value) => {
      if (!value?.trim()) return true; // Optional field
      const emails = value.split(',').map(email => email.trim()).filter(email => email);
      return emails.every(email => yup.string().email().isValidSync(email));
    }),
  subject: yup
    .string()
    .required('Subject is required')
    .max(200, 'Subject must be less than 200 characters'),
  body: yup
    .string()
    .required('Message body is required')
    .max(5000, 'Message must be less than 5,000 characters')
});

const ComposeEmailModal = ({ open, onClose, onSend, showNotification }) => {
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      body: ''
    },
    mode: 'onChange' // Validate on change for real-time feedback
  });

	// Mutation for creating emails
	const { isPending: loading, mutate: createEmail } = useMutation({
		mutationFn: async (emailData) => {
			const response = await fetch('http://localhost:3001/api/emails', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(emailData),
			});

			const data = await response.json();

			if (!response.ok) {
				const error = new Error(data.error || 'Failed to send email');
				error.details = data.details || [];
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
				'Email Sent Successfully',
				`Email sent to ${data.recipients} recipient${data.recipients > 1 ? 's' : ''}`
			);


			reset()
			// Close the compose modal
			onSend(false);
		},
		onError: (error) => {
			console.error('Error sending email:', error);

			if (error.status === 400 && error.details && error.details.length > 0) {
				// Validation errors from backend
				showNotification(
					'error',
					'Validation Error',
					'Please fix the following issues:',
					error.details
				);
			} else {
				// Network or server errors
				showNotification(
					'error',
					'Send Failed',
					error.message || 'Failed to send email. Please try again.'
				);
			}
		}
	});

  // Watch field values for character counting
  const watchedSubject = watch('subject', '');
  const watchedBody = watch('body', '');

  const onSubmit = (data) => {
	  createEmail(data);
  };

  const handleClose = () => {
    if (loading) return; // Prevent closing while sending
    reset(); // Reset form using React Hook Form
    onClose();
  };

  const handleAIGenerate = () => {
    setShowAIModal(true);
  };

  const handleAIModalClose = () => {
    setShowAIModal(false);
  };

  const handleAISubmit = async (prompt) => {
    setAiLoading(true);
    setShowAIModal(false); // close prompt immediately when starting

    try {
      const response = await fetch('http://localhost:3001/api/emails/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        // Try to read error JSON for details
        let msg = 'Failed to generate email';
        try {
          const errJson = await response.json();
          if (errJson?.error) msg = errJson.error;
          if (errJson?.details?.length) msg += `: ${errJson.details.join(' ')}`;
        } catch (_) {}
        throw new Error(msg);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'start') {
              // optional: could show which assistant is in use
            } else if (data.type === 'partial') {
              if (data.field === 'subject' && data.content) setValue('subject', data.content);
              if (data.field === 'body' && data.content) setValue('body', data.content);
            } else if (data.type === 'complete') {
              setValue('subject', data.data.subject);
              setValue('body', data.data.body);
            } else if (data.type === 'error') {
              throw new Error(data.error || 'AI generation error');
            } else if (data.type === 'done') {
              // stream finished
            }
          } catch (parseError) {
            // Ignore parse issues for keep-alive noise
          }
        }
      }

      setAiLoading(false);
    } catch (error) {
      setAiLoading(false);
      setShowAIModal(true); // reopen to let user retry or adjust prompt
      setSnackbarSeverity('error');
      setSnackbarMessage(error?.message || 'AI generation failed');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  return (
    <>
      {/* Main Compose Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '600px' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6">Compose Email</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* AI Button */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<AutoAwesome />}
              onClick={handleAIGenerate}
              disabled={loading}
              sx={{
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: 'primary.50',
                },
              }}
            >
              AI
            </Button>
            <IconButton onClick={handleClose} size="small" disabled={loading}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ px: 3, py: 2 }}>
            <Stack spacing={2}>
              {/* To Field */}
              <Controller
                name="to"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="To"
                    placeholder="recipient@example.com (separate multiple emails with commas)"
                    variant="outlined"
                    required
                    disabled={loading}
                    error={!!errors.to}
                    helperText={errors.to?.message || "Required field - separate multiple emails with commas"}
                  />
                )}
              />

              {/* CC Field */}
              <Controller
                name="cc"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="CC"
                    placeholder="cc@example.com (separate multiple emails with commas)"
                    variant="outlined"
                    disabled={loading}
                    error={!!errors.cc}
                    helperText={errors.cc?.message || "Optional - separate multiple emails with commas"}
                  />
                )}
              />

              {/* BCC Field */}
              <Controller
                name="bcc"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="BCC"
                    placeholder="bcc@example.com (separate multiple emails with commas)"
                    variant="outlined"
                    disabled={loading}
                    error={!!errors.bcc}
                    helperText={errors.bcc?.message || "Optional - separate multiple emails with commas"}
                  />
                )}
              />

              {/* Subject Field */}
              <Controller
                name="subject"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Subject"
                    placeholder="Enter email subject (max 200 characters)"
                    variant="outlined"
                    required
                    disabled={loading}
                    error={!!errors.subject}
                    helperText={errors.subject?.message || `Required field - ${watchedSubject.length}/200 characters`}
                    inputProps={{ maxLength: 200 }}
                  />
                )}
              />

              {/* Body Field */}
              <Controller
                name="body"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Message"
                    placeholder="Type your message here... (max 5,000 characters)"
                    variant="outlined"
                    multiline
                    rows={12}
                    required
                    disabled={loading}
                    error={!!errors.body}
                    helperText={errors.body?.message || `Required field - ${watchedBody.length}/5,000 characters`}
                    inputProps={{ maxLength: 5000 }}
                    sx={{
                      '& .MuiInputBase-root': {
                        alignItems: 'flex-start'
                      }
                    }}
                  />
                )}
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button
              onClick={handleClose}
              variant="outlined"
              color="inherit"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!isValid || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Send />}
            >
              {loading ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* AI Prompt Modal */}
      <AIPromptModal
        open={showAIModal}
        onClose={handleAIModalClose}
        onSubmit={handleAISubmit}
        loading={aiLoading}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} variant="filled" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ComposeEmailModal;
