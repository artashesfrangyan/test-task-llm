import { NextRequest, NextResponse } from 'next/server';
import { defaultLLMService, defaultCache, getHandler } from '@/shared/lib/llm';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, title, description, dueDate, stats, useCache = true } = body;

  const handler = getHandler(action);
  if (!handler) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const params: Record<string, unknown> = { title, description, dueDate, stats };
  const response = await defaultLLMService.execute(handler, params, useCache);

  return NextResponse.json(
    { ...response.data, fallback: response.fallback },
    {
      status: 200,
      headers: response.cached ? { 'X-Cache': 'HIT' } : response.fallback ? { 'X-Fallback': 'true' } : {}
    }
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || '';
  const title = searchParams.get('title') || '';
  const description = searchParams.get('description') || '';
  const dueDate = searchParams.get('dueDate') || '';
  const statsParam = searchParams.get('stats');
  const stats = statsParam ? JSON.parse(statsParam) : null;

  const params: Record<string, unknown> = { title, description, dueDate, stats };
  const sorted = Object.keys(params)
    .sort()
    .map(k => `${k}=${JSON.stringify(params[k])}`)
    .join('&');
  const cacheKey = `${action}:${sorted}`;

  return NextResponse.json({
    cached: defaultCache.has(cacheKey),
    cacheSize: defaultCache.size(),
  });
}