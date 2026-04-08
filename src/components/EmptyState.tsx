'use client';

import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface EmptyStateProps {
  onCreateClick: () => void;
}

export function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
      }}
    >
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Нет задач
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Создайте первую задачу для начала работы
      </Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onCreateClick}>
        Создать задачу
      </Button>
    </Box>
  );
}