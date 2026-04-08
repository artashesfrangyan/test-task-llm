// OCP: handlers для каждого action - легко добавлять новые
// SRP: каждый handler отвечает за свой action

import type { ActionHandler } from './interfaces';

function parseJSONSafely<T>(text: string, fallback: T): T {
  try {
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

export const categorizeHandler: ActionHandler = {
  action: 'categorize',

  buildPrompt(params) {
    const system = `Ты - помощник для категоризации задач. Твоя задача - определить категорию задачи на основе её названия и описания.

Доступные категории:
- bug: ошибки, баги, проблемы в работе
- feature: новые функции, улучшения
- improvement: оптимизация, рефакторинг
- documentation: документация, README
- research: исследование, анализ

Ответ должен быть ТОЛЬКО в формате JSON (без markdown, без объяснений):
{"category": "название_категории", "confidence": 0.85}

Примеры:
Вход: "Fix login bug"
Выход: {"category": "bug", "confidence": 0.95}
Вход: "Add new payment method"
Выход: {"category": "feature", "confidence": 0.90}`;

    const prompt = `Определи категорию задачи:\nНазвание: ${params.title}\nОписание: ${params.description || 'не указано'}\n\nВерни ТОЛЬКО JSON без markdown.`;
    return { system, prompt };
  },

  getFallback(params) {
    const text = ((params.title as string) + ' ' + (params.description || '')).toLowerCase();
    if (text.includes('bug') || text.includes('fix') || text.includes('ошибка') || text.includes('исправить')) {
      return { category: 'bug', confidence: 0.6 };
    }
    if (text.includes('feature') || text.includes('add') || text.includes('новая') || text.includes('добавить')) {
      return { category: 'feature', confidence: 0.6 };
    }
    if (text.includes('doc') || text.includes('readme') || text.includes('документаци')) {
      return { category: 'documentation', confidence: 0.6 };
    }
    if (text.includes('оптимиз') || text.includes('рефактор') || text.includes('улучшить')) {
      return { category: 'improvement', confidence: 0.6 };
    }
    return { category: 'research', confidence: 0.5 };
  },

  parseResult(text) {
    return parseJSONSafely<Record<string, unknown> | null>(text, null);
  }
};

export const priorityHandler: ActionHandler = {
  action: 'priority',

  buildPrompt(params) {
    const system = `Ты - помощник для определения приоритета задач. Анализируй название, описание и срок выполнения.

Приоритеты:
- high: срочно, критично, блокер, срок сегодня/завтра
- medium: обычная задача, средний срок
- low: низкий приоритет, можно отложить

Ответ ТОЛЬКО в формате JSON:
{"priority": "high|medium|low", "confidence": 0.85}`;

    const prompt = `Определи приоритет задачи:\nНазвание: ${params.title}\nОписание: ${params.description || 'не указано'}\nСрок: ${params.dueDate || 'не указан'}\n\nВерни ТОЛЬКО JSON без markdown.`;
    return { system, prompt };
  },

  getFallback(params) {
    if (params.dueDate) {
      const d = new Date(params.dueDate as string);
      const now = new Date();
      const days = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (days <= 1) return { priority: 'high', confidence: 0.7 };
      if (days <= 7) return { priority: 'medium', confidence: 0.6 };
      return { priority: 'low', confidence: 0.6 };
    }
    return { priority: 'medium', confidence: 0.5 };
  },

  parseResult(text) {
    return parseJSONSafely<Record<string, unknown> | null>(text, null);
  }
};

export const decomposeHandler: ActionHandler = {
  action: 'decompose',

  buildPrompt(params) {
    const system = `Ты - помощник для декомпозиции задач. Разбей сложную задачу на конкретные подзадачи.

Ответ ТОЛЬКО в формате JSON:
{"subtasks": [{"title": "название подзадачи", "priority": "high|medium|low"}]}

Правила:
- 3-5 подзадач
- Каждая подзадача конкретная и выполнимая
- Пиши на русском языке`;

    const prompt = `Разбей задачу на подзадачи:\nНазвание: ${params.title}\nОписание: ${params.description || 'не указано'}\n\nВерни ТОЛЬКО JSON без markdown.`;
    return { system, prompt };
  },

  getFallback(params) {
    return {
      subtasks: [
        { title: `${params.title} - Анализ и планирование`, priority: 'high' },
        { title: `${params.title} - Реализация`, priority: 'medium' },
        { title: `${params.title} - Тестирование`, priority: 'low' }
      ]
    };
  },

  parseResult(text) {
    return parseJSONSafely<Record<string, unknown> | null>(text, null);
  }
};

export const summaryHandler: ActionHandler = {
  action: 'summary',

  buildPrompt(params) {
    const tasks = params.tasks as Array<{ title: string; status: string; priority: string; dueDate?: string }>;
    const stats = params.stats as { total: number; pending: number; inProgress: number; completed: number; highPriority: number };
    
    const system = `Ты — персональный помощник для анализа задач. Проанализируй список задач и напиши полезную сводку.

Твоя задача:
1. Выдели ключевые задачи и их статус
2. Обрати внимание на срочные задачи (высокий приоритет или близкий срок)
3. Дай рекомендации по планированию

Формат ответа — ТОЛЬКО JSON (без markdown):
{"summary": "текст сводки (2-4 предложения)"}`;

    // Формируем список задач для промпта
    const tasksList = tasks?.map((t, i) => 
      `${i + 1}. "${t.title}" [${t.status === 'pending' ? 'Ожидает' : t.status === 'in_progress' ? 'В работе' : 'Готово'}, ${t.priority === 'high' ? 'Срочно' : t.priority === 'medium' ? 'Средний' : 'Низкий'}]${t.dueDate ? ` до ${t.dueDate}` : ''}`
    ).join('\n') || 'Нет задач';

    const prompt = `Проанализируй задачи и напиши сводку:

Статистика: всего ${stats?.total || 0}, ожидают ${stats?.pending || 0}, в работе ${stats?.inProgress || 0}, готово ${stats?.completed || 0}, срочных ${stats?.highPriority || 0}

Список задач:
${tasksList}

Напиши краткую сводку с анализом и рекомендациями. Верни ТОЛЬКО JSON без markdown.`;
    
    return { system, prompt };
  },

  getFallback(params) {
    const stats = params.stats as { total: number; pending: number; inProgress: number; completed: number; highPriority: number } | undefined;
    if (!stats) {
      return { summary: 'Не удалось сгенерировать сводку. Попробуйте позже.' };
    }
    
    let summary = `У вас ${stats.total} задач. `;
    if (stats.pending > 0) summary += `${stats.pending} ожидают начала. `;
    if (stats.inProgress > 0) summary += `${stats.inProgress} в работе. `;
    if (stats.completed > 0) summary += `${stats.completed} выполнено. `;
    if (stats.highPriority > 0) summary += `${stats.highPriority} срочных задач требуют внимания.`;
    
    return { summary: summary.trim() };
  },

  parseResult(text) {
    return parseJSONSafely<Record<string, unknown> | null>(text, null);
  }
};

// Registry для OCP - легко добавлять новые handlers
export const actionHandlers: Record<string, ActionHandler> = {
  categorize: categorizeHandler,
  priority: priorityHandler,
  decompose: decomposeHandler,
  summary: summaryHandler,
};

export function getHandler(action: string): ActionHandler | null {
  return actionHandlers[action] ?? null;
}