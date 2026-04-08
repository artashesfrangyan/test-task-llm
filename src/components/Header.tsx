'use client';

import { AppBar, Toolbar, Typography, IconButton, Tooltip } from '@mui/material';
import { Article as ArticleIcon } from '@mui/icons-material';

interface HeaderProps {
  onSummaryClick: () => void;
}

export function Header({ onSummaryClick }: HeaderProps) {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Task Manager
        </Typography>
        <Tooltip title="Сводка по задачам">
          <IconButton color="inherit" onClick={onSummaryClick}>
            <ArticleIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}