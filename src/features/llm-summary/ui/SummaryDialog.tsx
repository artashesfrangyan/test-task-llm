'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, Typography, Box, Stack, Chip, LinearProgress, IconButton, Collapse, Alert } from '@mui/material';
import { AutoAwesome as AIIcon, Refresh as RefreshIcon, Close as CloseIcon, Check as CheckIcon } from '@mui/icons-material';

interface SummaryDialogProps {
  open: boolean;
  onClose: () => void;
}

interface LLMStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  highPriority: number;
}

type LoadState = 'idle' | 'fetching-stats' | 'streaming' | 'done' | 'error';

export function SummaryDialog({ open, onClose }: SummaryDialogProps) {
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [summary, setSummary] = useState('');
  const [stats, setStats] = useState<LLMStats | null>(null);
  const [progress, setProgress] = useState(0);
  const [fromCache, setFromCache] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const fetchSummary = useCallback(async (useStream = true) => {
    if (!mountedRef.current) return;
    
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    
    setLoadState('fetching-stats');
    setSummary('');
    setProgress(0);
    setFromCache(false);

    try {
      const res = await fetch('/api/tasks', { signal: abortRef.current.signal });
      const tasks = await res.json();

      if (!mountedRef.current) return;

      const s: LLMStats = {
        total: tasks.length,
        pending: tasks.filter((t: { status: string }) => t.status === 'pending').length,
        inProgress: tasks.filter((t: { status: string }) => t.status === 'in_progress').length,
        completed: tasks.filter((t: { status: string }) => t.status === 'done').length,
        highPriority: tasks.filter((t: { priority: string; status: string }) => t.priority === 'high' && t.status !== 'done').length,
      };
      setStats(s);
      setLoadState('streaming');

      if (useStream) {
        const streamRes = await fetch('/api/llm/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'summary', stats: s, tasks }),
          signal: abortRef.current.signal,
        });

        if (!streamRes.ok) {
          throw new Error('Stream failed');
        }

        const reader = streamRes.body?.getReader();
        if (!reader) {
          throw new Error('No reader');
        }

        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!mountedRef.current) return;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullText += parsed.content;
                  // Don't show raw JSON during streaming - only show after parsing
                  setProgress(Math.min(90, fullText.length * 2));
                }
              } catch {
                // skip
              }
            }
          }
        }

        // Parse JSON from streaming result
        try {
          const parsed = JSON.parse(fullText);
          if (parsed.summary) {
            setSummary(parsed.summary);
          } else {
            setSummary(fullText);
          }
        } catch {
          // If not valid JSON, try to extract text anyway
          setSummary(fullText);
        }
        
        setProgress(100);
        setLoadState('done');
      } else {
        const llmRes = await fetch('/api/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'summary', stats: s, tasks }),
          signal: abortRef.current.signal,
        });
        const data = await llmRes.json();
        setSummary(data.summary || 'Не удалось сгенерировать сводку');
        setFromCache(!!data.cached);
        setProgress(100);
        setLoadState('done');
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      if (!mountedRef.current) return;
      setLoadState('error');
      setSummary('Ошибка при генерации сводки. Попробуйте ещё раз.');
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    if (open) {
      fetchSummary();
    }

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, [open, fetchSummary]);

  const handleRefresh = () => {
    fetchSummary(false);
  };

  const handleStreamRefresh = () => {
    fetchSummary(true);
  };

  const isLoading = loadState === 'fetching-stats' || loadState === 'streaming';

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AIIcon color="secondary" />
        Сводка по задачам
        {loadState === 'done' && (
          <Chip 
            label={fromCache ? 'из кэша' : 'готово'} 
            size="small" 
            color={fromCache ? 'default' : 'success'}
            icon={fromCache ? undefined : <CheckIcon />}
            sx={{ ml: 'auto' }}
          />
        )}
      </DialogTitle>
      
      <DialogContent>
        {loadState === 'fetching-stats' && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Загрузка статистики...
            </Typography>
          </Box>
        )}

        {loadState === 'streaming' && (
          <Box>
            <LinearProgress variant="determinate" value={progress} sx={{ mb: 2, borderRadius: 1 }} />
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', minHeight: 60 }}>
              {summary || 'Генерация сводки...'}
            </Typography>
          </Box>
        )}

        {loadState === 'done' && (
          <>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
              {summary}
            </Typography>
            {stats && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={`Всего: ${stats.total}`} size="small" variant="outlined" />
                <Chip label={`Ожидают: ${stats.pending}`} size="small" variant="outlined" color="warning" />
                <Chip label={`В работе: ${stats.inProgress}`} size="small" variant="outlined" color="primary" />
                <Chip label={`Готово: ${stats.completed}`} size="small" variant="outlined" color="success" />
                {stats.highPriority > 0 && (
                  <Chip label={`Срочных: ${stats.highPriority}`} size="small" variant="outlined" color="error" />
                )}
              </Stack>
            )}
          </>
        )}

        {loadState === 'error' && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {summary}
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Box>
          {loadState === 'done' && (
            <IconButton onClick={handleStreamRefresh} size="small" title="Обновить">
              <RefreshIcon />
            </IconButton>
          )}
        </Box>
        <Button onClick={onClose} disabled={isLoading}>
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  );
}