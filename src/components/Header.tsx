'use client';

import { AppBar, Toolbar, Typography, IconButton, Tooltip } from '@mui/material';
import { Assignment as TaskIcon, Summarize as SummaryIcon } from '@mui/icons-material';

interface HeaderProps {
  onSummaryClick: () => void;
}

export function Header({ onSummaryClick }: HeaderProps) {
  return (
    <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
      <Toolbar sx={{ gap: 2 }}>
        <TaskIcon color="primary" />
        <Typography variant="h6" fontWeight={700} color="primary" sx={{ flexGrow: 1 }}>
          Task Manager
        </Typography>
        <Tooltip title="Сводка по задачам">
          <IconButton onClick={onSummaryClick}>
            <SummaryIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}