import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { Task, TaskPriority, TaskCategory, RecurrenceType, TaskReminder } from '../../types';
import { TaskRow, Database } from '../../types/database';

export function mapRowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || undefined,
    date: row.date,
    time: row.time || undefined,
    isAllDay: row.is_all_day,
    category: (row.category || 'work') as TaskCategory,
    customCategoryName: row.custom_category_name || undefined,
    customColor: row.custom_color || undefined,
    priority: (row.priority || 'medium') as TaskPriority,
    recurrence: (row.recurrence || 'none') as RecurrenceType,
    estimatedMinutes: row.estimated_minutes ?? undefined,
    reminders: (Array.isArray(row.reminders) ? (row.reminders as unknown as TaskReminder[]) : []),
    notes: row.notes || undefined,
    completed: row.completed,
    completedAt: row.completed_at || undefined,
    createdAt: row.created_at,
  };
}

export function mapTaskToInsertRow(
  task: Partial<Task> & { userId: string; title: string; date: string }
): Database['public']['Tables']['tasks']['Insert'] {
  return {
    user_id: task.userId,
    title: task.title,
    description: task.description || null,
    date: task.date,
    time: task.time || null,
    is_all_day: Boolean(task.isAllDay),
    category: task.category || 'work',
    custom_category_name: task.customCategoryName || null,
    custom_color: task.customColor || null,
    priority: task.priority || 'medium',
    recurrence: task.recurrence || 'none',
    estimated_minutes: task.estimatedMinutes || null,
    reminders: (task.reminders || []) as unknown as Database['public']['Tables']['tasks']['Insert']['reminders'],
    notes: task.notes || null,
    completed: Boolean(task.completed),
    completed_at: task.completedAt || (task.completed ? new Date().toISOString() : null),
  };
}

export async function fetchUserTasks(userId: string): Promise<Task[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await (supabase as any)
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })
    .order('time', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Error fetching tasks from Supabase:', error);
    throw error;
  }

  return ((data || []) as TaskRow[]).map(mapRowToTask);
}

export async function createTask(
  taskData: Partial<Task> & { userId: string; title: string; date: string }
): Promise<Task> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase credentials not configured in environment variables');
  }

  const insertData = mapTaskToInsertRow(taskData);

  const { data, error } = await (supabase as any)
    .from('tasks')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating task in Supabase:', error);
    throw error;
  }

  const created = mapRowToTask(data as TaskRow);

  // Log history
  await logTaskHistory(taskData.userId, created.id, 'created', { title: created.title });

  return created;
}

export async function updateTask(
  taskId: string,
  updates: Partial<Task>
): Promise<Task> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase credentials not configured in environment variables');
  }

  const updatePayload: Database['public']['Tables']['tasks']['Update'] = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) updatePayload.title = updates.title;
  if (updates.description !== undefined) updatePayload.description = updates.description || null;
  if (updates.date !== undefined) updatePayload.date = updates.date;
  if (updates.time !== undefined) updatePayload.time = updates.time || null;
  if (updates.isAllDay !== undefined) updatePayload.is_all_day = updates.isAllDay;
  if (updates.category !== undefined) updatePayload.category = updates.category;
  if (updates.customCategoryName !== undefined) updatePayload.custom_category_name = updates.customCategoryName || null;
  if (updates.customColor !== undefined) updatePayload.custom_color = updates.customColor || null;
  if (updates.priority !== undefined) updatePayload.priority = updates.priority;
  if (updates.recurrence !== undefined) updatePayload.recurrence = updates.recurrence;
  if (updates.estimatedMinutes !== undefined) updatePayload.estimated_minutes = updates.estimatedMinutes ?? null;
  if (updates.reminders !== undefined) updatePayload.reminders = updates.reminders as unknown as Database['public']['Tables']['tasks']['Update']['reminders'];
  if (updates.notes !== undefined) updatePayload.notes = updates.notes || null;
  if (updates.completed !== undefined) {
    updatePayload.completed = updates.completed;
    updatePayload.completed_at = updates.completed ? (updates.completedAt || new Date().toISOString()) : null;
  }

  const { data, error } = await (supabase as any)
    .from('tasks')
    .update(updatePayload)
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('Error updating task in Supabase:', error);
    throw error;
  }

  const updated = mapRowToTask(data as TaskRow);

  if (updates.completed !== undefined) {
    await logTaskHistory(
      updated.userId,
      taskId,
      updates.completed ? 'completed' : 'reopened',
      { title: updated.title }
    );
  } else {
    await logTaskHistory(updated.userId, taskId, 'updated', { title: updated.title });
  }

  return updated;
}

export async function deleteTask(taskId: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase credentials not configured in environment variables');
  }

  const { error } = await (supabase as any)
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Error deleting task in Supabase:', error);
    throw error;
  }

  await logTaskHistory(userId, taskId, 'deleted');
}

export async function logTaskHistory(
  userId: string,
  taskId: string | null,
  action: string,
  details?: Record<string, unknown>
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await (supabase as any).from('task_history').insert({
      user_id: userId,
      task_id: taskId,
      action,
      details: details || null,
    });
  } catch (err) {
    console.warn('Failed to log task history:', err);
  }
}
