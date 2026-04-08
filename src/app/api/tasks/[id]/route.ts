import { NextRequest, NextResponse } from 'next/server';
import * as Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tasks.db');
const db = new Database.default(dbPath);

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  
  return NextResponse.json(task);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE tasks 
    SET title = ?, description = ?, priority = ?, status = ?, category = ?, dueDate = ?
    WHERE id = ?
  `);

  stmt.run(
    body.title,
    body.description || null,
    body.priority,
    body.status,
    body.category || null,
    body.dueDate || null,
    id
  );

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  return NextResponse.json(task);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}