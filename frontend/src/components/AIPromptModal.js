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
  Box,
  CircularProgress
} from '@mui/material';
import { Close, AutoAwesome } from '@mui/icons-material';

// Validation schema for AI prompt
const validationSchema = yup.object({
  prompt: yup
    .string()
    .required('Please describe what your email should be about')
    .min(10, 'Please provide more details (at least 10 characters)')
    .max(500, 'Please keep your description under 500 characters')
});

const AIPromptModal = ({
  open,
  onClose,
  onSubmit,
  loading = false
}) => {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid }
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      prompt: ''
    },
    mode: 'onChange' // Validate on change for real-time feedback
  });

  // Watch prompt value for character counting
  const watchedPrompt = watch('prompt', '');

  const handleClose = () => {
    reset();
    onClose();
  };

  const onFormSubmit = (data) => {
    if (loading) return;
    onSubmit(data.prompt);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && event.ctrlKey && isValid && !loading) {
      handleSubmit(onFormSubmit)();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: '350px' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome color="primary" />
          <Typography variant="h6">AI Email Assistant</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={loading}>
          <Close />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(onFormSubmit)}>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
            Describe what your email should be about, and our AI will help you craft the perfect message.
          </Typography>

          <Controller
            name="prompt"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Email Description"
                placeholder="e.g., Meeting request for Tuesday, Follow-up on proposal, Sales pitch for new product..."
                variant="outlined"
                multiline
                rows={4}
                onKeyDown={handleKeyDown}
                disabled={loading}
                error={!!errors.prompt}
                helperText={
                  errors.prompt?.message ||
                  `Be specific about the purpose, tone, and any key details. ${watchedPrompt.length}/500 characters (Ctrl+Enter to generate)`
                }
                autoFocus
                inputProps={{ maxLength: 500 }}
                sx={{ mb: 2 }}
              />
            )}
          />

          <Box sx={{
            p: 2,
            backgroundColor: 'grey.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'grey.200'
          }}>
            <Typography variant="caption" sx={{ fontWeight: 'medium', display: 'block', mb: 1 }}>
              💡 Examples:
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
              • &quot;Sales email for our new CRM software to tech startups&quot;
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
              • &quot;Follow-up email about the proposal we sent last week&quot;
            </Typography>
            <Typography variant="caption" sx={{ display: 'block' }}>
              • &quot;Professional thank you email after the interview&quot;
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!isValid || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesome />}
          >
            {loading ? 'Generating...' : 'Generate Email'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AIPromptModal;
