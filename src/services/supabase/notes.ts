import { supabase, isSupabaseConfigured, isValidUUID } from '../../lib/supabaseClient';
import { Note } from '../../types';
import { NoteRow, Database } from '../../types/database';
import { loadNotesFromStorage, saveNotesToStorage } from '../../utils/storage';

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
    ...(note.id && isValidUUID(note.id) ? { id: note.id } : {}),
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
  const localNotes = loadNotesFromStorage(userId);
  if (!isSupabaseConfigured() || !isValidUUID(userId)) {
    return localNotes;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user || session.user.id !== userId) {
      return localNotes;
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) {
      // If table is missing or postgrest schema cache is not refreshed, fallback to local storage
      return localNotes;
    }

    if (data && Array.isArray(data) && data.length > 0) {
      const remoteNotes = data.map(mapRowToNote);
      saveNotesToStorage(remoteNotes);
      return remoteNotes;
    }

    return localNotes;
  } catch {
    return localNotes;
  }
}

export async function createNote(
  note: Partial<Note> & { userId: string; title: string; content?: string }
): Promise<Note | null> {
  const noteId = note.id && isValidUUID(note.id) ? note.id : crypto.randomUUID();
  const nowIso = new Date().toISOString();

  const createdFallback: Note = {
    id: noteId,
    userId: note.userId,
    title: note.title || '',
    content: note.content || '',
    isPinned: Boolean(note.isPinned),
    category: note.category,
    color: note.color,
    isArchived: Boolean(note.isArchived),
    createdAt: note.createdAt || nowIso,
    updatedAt: nowIso,
  };

  // Ensure local storage is immediately updated
  const existingNotes = loadNotesFromStorage(note.userId);
  saveNotesToStorage([createdFallback, ...existingNotes.filter(n => n.id !== noteId)]);

  if (!isSupabaseConfigured() || !isValidUUID(note.userId)) {
    return createdFallback;
  }

  try {
    const insertPayload = mapNoteToInsertRow({ ...note, id: noteId });
    const { data, error } = await (supabase as any)
      .from('notes')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error || !data) {
      return createdFallback;
    }

    const mapped = mapRowToNote(data);
    const refreshed = loadNotesFromStorage(note.userId);
    saveNotesToStorage(refreshed.map(n => n.id === noteId ? mapped : n));
    return mapped;
  } catch {
    return createdFallback;
  }
}

export async function updateNote(
  noteId: string,
  updates: Partial<Note>
): Promise<Note | null> {
  const nowIso = new Date().toISOString();

  if (!isSupabaseConfigured() || !isValidUUID(noteId)) {
    return null;
  }

  try {
    const payload: Database['public']['Tables']['notes']['Update'] = {
      updated_at: nowIso,
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
      return null;
    }

    return mapRowToNote(data);
  } catch {
    return null;
  }
}

export async function deleteNote(noteId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !isValidUUID(noteId)) {
    return true;
  }

  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

