import React from 'react';
import { Fab, Tooltip } from '@mui/material';
import { Add } from '@mui/icons-material';

const ComposeButton = ({ onClick }) => {
  return (
    <Tooltip title="Compose new email" placement="left">
      <Fab
        color="primary"
        aria-label="compose email"
        onClick={onClick}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          boxShadow: 3,
          '&:hover': {
            boxShadow: 6,
          },
        }}
      >
        <Add />
      </Fab>
    </Tooltip>
  );
};

export default ComposeButton;
