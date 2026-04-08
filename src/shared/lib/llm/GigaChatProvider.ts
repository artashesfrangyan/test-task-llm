// SRP: GigaChat API - одна ответственность
// OCP: Можно добавить других провайдеров без изменения

import type { LLMProvider } from './interfaces';
import fetch from 'node-fetch';
import https from 'https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export class GigaChatProvider implements LLMProvider {
  private credentials: string;
  private accessToken: string | null = null;
  private tokenExpiry = 0;
  private apiEndpoint: string;
  private oauthEndpoint: string;

  constructor(config?: {
    credentials?: string;
    apiEndpoint?: string;
    oauthEndpoint?: string;
  }) {
    this.credentials = config?.credentials ?? 
      process.env.GIGACHAT_CREDENTIALS ?? 
      'MDE5ZDY4ZTctMGZhMy03YjM5LWE3NDgtNzdhYzM4NjVkZjE3OjUxNDc1YmRiLWU5NmUtNGRjYi04ZDAwLWQ5NWM5NmQzNzg5Ng==';
    this.apiEndpoint = config?.apiEndpoint ?? 
      'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';
    this.oauthEndpoint = config?.oauthEndpoint ?? 
      'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
  }

  private async getToken(): Promise<string | null> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch(this.oauthEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.credentials}`,
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
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_at - Math.floor(Date.now() / 1000) - 60) * 1000;
      return this.accessToken;
    } catch (error) {
      console.error('GigaChat OAuth failed:', error);
      return null;
    }
  }

  async complete(system: string, prompt: string): Promise<string | null> {
    try {
      const token = await this.getToken();
      if (!token) return null;

      const response = await fetch(this.apiEndpoint, {
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
          stream: false,
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

  async stream(system: string, prompt: string): Promise<ReadableStream | null> {
    try {
      const token = await this.getToken();
      if (!token) return null;

      const response = await fetch(this.apiEndpoint, {
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
          stream: true,
        }),
        agent: httpsAgent,
      });

      if (!response.ok) {
        console.error('GigaChat API error:', response.status);
        return null;
      }

      return response.body as unknown as ReadableStream;
    } catch (error) {
      console.error('LLM stream error:', error);
      return null;
    }
  }
}

// Singleton для совместимости
export const gigaChatProvider = new GigaChatProvider();