import React from 'react';
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
  Stack
} from '@mui/material';
import { Close, Send } from '@mui/icons-material';

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
    .max(10000, 'Message must be less than 10,000 characters')
});

const ComposeEmailModal = ({ open, onClose, onSend }) => {
  const {
    control,
    handleSubmit,
    reset,
    watch,
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

  // Watch field values for character counting
  const watchedSubject = watch('subject', '');
  const watchedBody = watch('body', '');

  const onSubmit = (data) => {
    if (onSend) {
      onSend(data);
    }
    handleClose();
  };

  const handleClose = () => {
    reset(); // Reset form using React Hook Form
    onClose();
  };

  return (
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
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
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
                  placeholder="Type your message here... (max 10,000 characters)"
                  variant="outlined"
                  multiline
                  rows={12}
                  required
                  error={!!errors.body}
                  helperText={errors.body?.message || `Required field - ${watchedBody.length}/10,000 characters`}
                  inputProps={{ maxLength: 10000 }}
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
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!isValid}
            startIcon={<Send />}
          >
            Send Email
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ComposeEmailModal;
