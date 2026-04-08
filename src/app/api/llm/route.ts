import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import https from 'https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const GIGACHAT_CREDENTIALS = process.env.GIGACHAT_CREDENTIALS || 'MDE5ZDY4ZTctMGZhMy03YjM5LWE3NDgtNzdhYzM4NjVkZjE3OjUxNDc1YmRiLWU5NmUtNGRjYi04ZDAwLWQ5NWM5NmQzNzg5Ng==';

let gigaChatAccessToken: string | null = null;
let tokenExpiry = 0;

async function getGigaChatToken() {
  if (gigaChatAccessToken && Date.now() < tokenExpiry) {
    return gigaChatAccessToken;
  }

  try {
    const response = await fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${GIGACHAT_CREDENTIALS}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'RqUID': crypto.randomUUID(),
      },
      body: new URLSearchParams({ scope: 'GIGACHAT_API_PERS' }).toString(),
      agent: httpsAgent,
    });

    if (!response.ok) {
      console.error('OAuth error:', response.status);
      return null;
    }

    const data = await response.json() as { access_token: string; expires_at: number };
    gigaChatAccessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_at - Math.floor(Date.now() / 1000) - 60) * 1000;
    return gigaChatAccessToken;
  } catch (error) {
    console.error('GigaChat OAuth failed:', error);
    return null;
  }
}

async function callLLM(system: string, prompt: string) {
  try {
    const token = await getGigaChatToken();
    if (!token) {
      return null;
    }

    const response = await fetch('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: 'GigaChat',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
      agent: httpsAgent,
    });

    if (!response.ok) {
      console.error('GigaChat API error:', response.status);
      return null;
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('LLM error:', error);
    return null;
  }
}

const prompts = {
  categorize: {
    system: `Ты - помощник для категоризации задач. Твоя задача - определить категорию задачи на основе её названия и описания.

Доступные категории:
- bug: ошибки, баги, проблемы в работе
- feature: новые функции, улучшения
- improvement: оптимизация, рефакторинг
- documentation: документация, README
- research: исследование, анализ

Ответ должен быть в формате JSON:
{"category": "название_категории", "confidence": 0.85}

Примеры:
Вход: "Fix login bug"
Выход: {"category": "bug", "confidence": 0.95}

Вход: "Add new payment method"
Выход: {"category": "feature", "confidence": 0.90}`,
    buildPrompt: (title: string, description?: string) => 
      `Определи категорию задачи:\nНазвание: ${title}\nОписание: ${description || 'не указано'}\n\nВерни только JSON.`
  },

  priority: {
    system: `Ты - помощник для определения приоритета задач. Анализируй название, описание и срок выполнения.

Приоритеты:
- high: срочно, критично, блокер, срок сегодня/завтра
- medium: обычная задача, средний срок
- low: низкий приоритет, можно отложить

Ответ в JSON:
{"priority": "high|medium|low", "confidence": 0.85}`,
    buildPrompt: (title: string, description?: string, dueDate?: string) =>
      `Определи приоритет задачи:\nНазвание: ${title}\nОписание: ${description || 'не указано'}\nСрок: ${dueDate || 'не указан'}\n\nВерни только JSON.`
  },

  decompose: {
    system: `Ты - помощник для декомпозиции задач. Разбей сложную задачу на подзадачи.

Ответ в JSON:
{"subtasks": [{"title": "название", "priority": "high|medium|low"}]}

Правила:
- 3-5 подзадач
- Каждая подзадача конкретная и выполнимая
- Порядок логичный: планирование -> реализация -> тестирование
- Пиши на русском языке`,
    buildPrompt: (title: string, description?: string) =>
      `Разбей задачу на подзадачи:\nНазвание: ${title}\nОписание: ${description || 'не указано'}\n\nВерни только JSON.`
  },

  summary: {
    system: `Ты — персональный помощник для анализа задач. Твоя задача — смотреть на список задач и писать краткую, живую сводку по смыслу.

Формат ответа — JSON:
{"summary": "текст сводки (1–3 предложения)"}`,
    buildPrompt: (stats: { total: number; pending: number; inProgress: number; completed: number; highPriority: number }) =>
      `Сгенерируй краткую сводку:\nВсего: ${stats.total}, Ожидают: ${stats.pending}, В работе: ${stats.inProgress}, Готово: ${stats.completed}\nВысокий приоритет: ${stats.highPriority}\n\nВерни только JSON.`
  }
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, title, description, dueDate, stats } = body;

  let system = '';
  let prompt = '';
  let fallback: () => object = () => ({});

  switch (action) {
    case 'categorize':
      system = prompts.categorize.system;
      prompt = prompts.categorize.buildPrompt(title, description);
      fallback = () => {
        const text = (title + ' ' + (description || '')).toLowerCase();
        if (text.includes('bug') || text.includes('fix') || text.includes('ошибка')) {
          return { category: 'bug', confidence: 0.6 };
        }
        if (text.includes('feature') || text.includes('add') || text.includes('новая')) {
          return { category: 'feature', confidence: 0.6 };
        }
        if (text.includes('doc') || text.includes('readme')) {
          return { category: 'documentation', confidence: 0.6 };
        }
        return { category: 'improvement', confidence: 0.5 };
      };
      break;

    case 'priority':
      system = prompts.priority.system;
      prompt = prompts.priority.buildPrompt(title, description, dueDate);
      fallback = () => {
        if (dueDate) {
          const d = new Date(dueDate);
          const now = new Date();
          const days = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (days <= 1) return { priority: 'high', confidence: 0.7 };
          if (days <= 7) return { priority: 'medium', confidence: 0.6 };
          return { priority: 'low', confidence: 0.6 };
        }
        return { priority: 'medium', confidence: 0.5 };
      };
      break;

    case 'decompose':
      system = prompts.decompose.system;
      prompt = prompts.decompose.buildPrompt(title, description);
      fallback = () => ({
        subtasks: [
          { title: `${title} - Планирование`, priority: 'high' },
          { title: `${title} - Реализация`, priority: 'medium' },
          { title: `${title} - Тестирование`, priority: 'medium' }
        ]
      });
      break;

    case 'summary':
      system = prompts.summary.system;
      prompt = prompts.summary.buildPrompt(stats);
      fallback = () => ({ summary: 'Не удалось сгенерировать сводку' });
      break;

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const result = await callLLM(system, prompt);

  if (!result) {
    return NextResponse.json({ error: 'LLM unavailable', fallback: fallback() }, { status: 503 });
  }

  try {
    const parsed = JSON.parse(result);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: 'Parse failed', fallback: fallback() }, { status: 502 });
  }
}