import { supabase, isSupabaseConfigured, isValidUUID } from '../../lib/supabaseClient';
import { Note } from '../../types';
import { NoteRow, Database } from '../../types/database';

export function mapRowToNote(row: NoteRow): Note {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title || '',
    content: row.content || '',
    isPinned: Boolean(row.is_pinned),
    category: row.category || undefined,
    color: row.color || undefined,
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapNoteToInsertRow(
  note: Partial<Note> & { userId: string }
): Database['public']['Tables']['notes']['Insert'] {
  return {
    user_id: note.userId,
    title: note.title || '',
    content: note.content || '',
    is_pinned: Boolean(note.isPinned),
    category: note.category || null,
    color: note.color || null,
    is_archived: Boolean(note.isArchived),
  };
}

export async function fetchUserNotes(userId: string): Promise<Note[]> {
  if (!isSupabaseConfigured() || !isValidUUID(userId)) {
    return [];
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user || session.user.id !== userId) {
      return [];
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchUserNotes error:', error.message);
      return [];
    }

    return (data || []).map(mapRowToNote);
  } catch (err) {
    console.warn('Exception during fetchUserNotes:', err);
    return [];
  }
}

export async function createNote(
  note: Partial<Note> & { userId: string; title: string; content?: string }
): Promise<Note | null> {
  if (!isSupabaseConfigured() || !isValidUUID(note.userId)) {
    return null;
  }

  try {
    const insertPayload = mapNoteToInsertRow(note);
    const { data, error } = await (supabase as any)
      .from('notes')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error || !data) {
      console.warn('Supabase createNote error:', error?.message);
      return null;
    }

    return mapRowToNote(data);
  } catch (err) {
    console.warn('Exception during createNote:', err);
    return null;
  }
}

export async function updateNote(
  noteId: string,
  updates: Partial<Note>
): Promise<Note | null> {
  if (!isSupabaseConfigured() || !isValidUUID(noteId)) {
    return null;
  }

  try {
    const payload: Database['public']['Tables']['notes']['Update'] = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.content !== undefined) payload.content = updates.content;
    if (updates.isPinned !== undefined) payload.is_pinned = updates.isPinned;
    if (updates.category !== undefined) payload.category = updates.category || null;
    if (updates.color !== undefined) payload.color = updates.color || null;
    if (updates.isArchived !== undefined) payload.is_archived = updates.isArchived;

    const { data, error } = await (supabase as any)
      .from('notes')
      .update(payload)
      .eq('id', noteId)
      .select('*')
      .single();

    if (error || !data) {
      console.warn('Supabase updateNote error:', error?.message);
      return null;
    }

    return mapRowToNote(data);
  } catch (err) {
    console.warn('Exception during updateNote:', err);
    return null;
  }
}

export async function deleteNote(noteId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !isValidUUID(noteId)) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      console.warn('Supabase deleteNote error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Exception during deleteNote:', err);
    return false;
  }
}
