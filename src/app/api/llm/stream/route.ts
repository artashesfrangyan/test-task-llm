import { NextRequest } from 'next/server';
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

    if (!response.ok) return null;

    const data = await response.json() as { access_token: string; expires_at: number };
    gigaChatAccessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_at - Math.floor(Date.now() / 1000) - 60) * 1000;
    return gigaChatAccessToken;
  } catch {
    return null;
  }
}

const prompts = {
  summary: {
    system: `Ты — персональный помощник для анализа задач. Проанализируй список задач и напиши полезную сводку.

Твоя задача:
1. Выдели ключевые задачи и их статус
2. Обрати внимание на срочные задачи (высокий приоритет или близкий срок)
3. Дай рекомендации по планированию

Формат ответа — ТОЛЬКО JSON (без markdown):
{"summary": "текст сводки (2-4 предложения)"}`,
    buildPrompt: (
      stats: { total: number; pending: number; inProgress: number; completed: number; highPriority: number },
      tasks?: Array<{ title: string; status: string; priority: string; dueDate?: string }>
    ) => {
      const tasksList = tasks?.map((t, i) => 
        `${i + 1}. "${t.title}" [${t.status === 'pending' ? 'Ожидает' : t.status === 'in_progress' ? 'В работе' : 'Готово'}, ${t.priority === 'high' ? 'Срочно' : t.priority === 'medium' ? 'Средний' : 'Низкий'}]${t.dueDate ? ` до ${t.dueDate}` : ''}`
      ).join('\n') || 'Нет задач';

      return `Проанализируй задачи и напиши сводку:

Статистика: всего ${stats?.total || 0}, ожидают ${stats?.pending || 0}, в работе ${stats?.inProgress || 0}, готово ${stats?.completed || 0}, срочных ${stats?.highPriority || 0}

Список задач:
${tasksList}

Напиши краткую сводку с анализом и рекомендациями. Верни ТОЛЬКО JSON без markdown.`;
    }
  },
  decompose: {
    system: `Ты — помощник для декомпозиции задач. Разбей задачу на подзадачи.
Формат: {"subtasks": [{"title": "название", "priority": "high|medium|low"}]}`,
    buildPrompt: (title: string, description?: string) =>
      `Разбей задачу на 3-5 подзадач:\nНазвание: ${title}\nОписание: ${description || 'не указано'}`
  }
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, title, description, stats, tasks } = body;

  const token = await getGigaChatToken();
  if (!token) {
    return new Response(JSON.stringify({ error: 'Auth failed' }), { status: 503 });
  }

  let prompt = '';
  let system = '';

  if (action === 'summary' && stats) {
    system = prompts.summary.system;
    prompt = prompts.summary.buildPrompt(stats, tasks);
  } else if (action === 'decompose') {
    system = prompts.decompose.system;
    prompt = prompts.decompose.buildPrompt(title, description);
  } else {
    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  }

  const response = await fetch('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'GigaChat',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    }),
    agent: httpsAgent,
  });

  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'LLM error' }), { status: 502 });
  }

  const encoder = new TextEncoder();
  const reader = response.body;

  if (!reader) {
    return new Response(JSON.stringify({ error: 'No stream' }), { status: 502 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = '';
      
      try {
        for await (const chunk of reader as AsyncIterable<Buffer>) {
          const text = chunk.toString();
          buffer += text;
          
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                continue;
              }
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch {
                // skip invalid JSON
              }
            }
          }
        }
        
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}