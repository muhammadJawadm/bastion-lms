/**
 * @file ChapterManager.tsx
 * @description Sidebar panel for managing lesson chapters (named sections).
 *
 * Instructors use this panel to:
 *  - View all chapters in the current lesson
 *  - Add new chapters with a name
 *  - Rename existing chapters inline
 *  - Delete chapters (blocks remain in the lesson, just lose their section label)
 *  - Reorder chapters by dragging (drag-and-drop via mouse events)
 *
 * This component is rendered inside the LMS builder's left sidebar when the
 * "Chapters" tab is active.  It communicates with the backend via tRPC
 * `chapters.*` procedures.
 */

import { useState, useRef } from "react";
import { Plus, Trash2, GripVertical, Check, X, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single chapter row as returned by the `chapters.list` tRPC query. */
interface Chapter {
  /** Auto-incremented primary key. */
  id: number;
  /** Foreign key to the parent lesson. */
  lessonId: number;
  /** Display title shown in the learner's progress bar and outline. */
  title: string;
  /** Display order within the lesson (lower = earlier). */
  sortOrder: number;
}

/** Props accepted by the ChapterManager component. */
interface ChapterManagerProps {
  /** The lesson whose chapters are being managed. */
  lessonId: number;
  /** Lesson title shown in the panel header for context. */
  lessonTitle: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ChapterManager
 *
 * Renders a full chapter management panel for a single lesson.
 * Fetches chapters from the server, then provides inline editing,
 * creation, deletion, and drag-to-reorder functionality.
 *
 * @param lessonId    - ID of the lesson to manage chapters for.
 * @param lessonTitle - Display name shown in the panel header.
 */
export function ChapterManager({ lessonId, lessonTitle }: ChapterManagerProps) {
  // ── Server state ────────────────────────────────────────────────────────────

  /** Fetch all chapters for this lesson, ordered by sortOrder. */
  const { data: chapters = [], refetch } = trpc.chapters.list.useQuery(
    { lessonId },
    { enabled: !!lessonId }
  );

  const createMutation = trpc.chapters.create.useMutation({
    onSuccess: () => { void refetch(); setNewTitle(""); setIsAdding(false); },
    onError: () => toast.error("Failed to create chapter"),
  });

  const updateMutation = trpc.chapters.update.useMutation({
    onSuccess: () => { void refetch(); setEditingId(null); },
    onError: () => toast.error("Failed to update chapter"),
  });

  const deleteMutation = trpc.chapters.delete.useMutation({
    onSuccess: () => { void refetch(); },
    onError: () => toast.error("Failed to delete chapter"),
  });

  const reorderMutation = trpc.chapters.reorder.useMutation({
    onError: () => toast.error("Failed to reorder chapters"),
  });

  // ── Local UI state ──────────────────────────────────────────────────────────

  /** Whether the "add new chapter" input row is visible. */
  const [isAdding, setIsAdding] = useState<boolean>(false);

  /** Title text for the new chapter being created. */
  const [newTitle, setNewTitle] = useState<string>("");

  /** ID of the chapter currently being renamed inline (null = none). */
  const [editingId, setEditingId] = useState<number | null>(null);

  /** Draft title text while renaming a chapter. */
  const [editTitle, setEditTitle] = useState<string>("");

  /** Index of the chapter row currently being dragged (null = no drag). */
  const dragIndexRef = useRef<number | null>(null);

  // ── Handlers ────────────────────────────────────────────────────────────────

  /**
   * Submits the new chapter creation form.
   * Validates that the title is non-empty before calling the mutation.
   */
  function handleCreate(): void {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    createMutation.mutate({
      lessonId,
      title: trimmed,
      sortOrder: chapters.length,
    });
  }

  /**
   * Begins inline editing for a chapter row.
   * Pre-fills the edit input with the chapter's current title.
   *
   * @param chapter - The chapter row to edit.
   */
  function handleStartEdit(chapter: Chapter): void {
    setEditingId(chapter.id);
    setEditTitle(chapter.title);
  }

  /**
   * Saves the renamed chapter title.
   * No-ops if the title is empty or unchanged.
   */
  function handleSaveEdit(): void {
    if (editingId === null) return;
    const trimmed = editTitle.trim();
    if (!trimmed) return;
    updateMutation.mutate({ id: editingId, title: trimmed });
  }

  /**
   * Cancels inline editing without saving.
   */
  function handleCancelEdit(): void {
    setEditingId(null);
    setEditTitle("");
  }

  /**
   * Deletes a chapter after a confirmation prompt.
   *
   * @param id    - The chapter's primary key.
   * @param title - The chapter's title (used in the confirmation message).
   */
  function handleDelete(id: number, title: string): void {
    if (!confirm(`Delete chapter "${title}"? Slides in this chapter will remain in the lesson.`)) return;
    deleteMutation.mutate({ id });
  }

  /**
   * Drag-start handler — records which row is being dragged.
   *
   * @param index - The index of the dragged row in the `chapters` array.
   */
  function handleDragStart(index: number): void {
    dragIndexRef.current = index;
  }

  /**
   * Drop handler — reorders chapters when a row is dropped onto another row.
   * Computes the new sort order array and sends it to the server.
   *
   * @param targetIndex - The index of the row the dragged item was dropped onto.
   */
  function handleDrop(targetIndex: number): void {
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === targetIndex) return;

    // Build a reordered copy of the chapters array.
    const reordered: Chapter[] = [...chapters];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    // Map to `{ id, sortOrder }` pairs with sequential sort orders.
    const items = reordered.map((ch, i) => ({ id: ch.id, sortOrder: i }));
    reorderMutation.mutate(items);

    dragIndexRef.current = null;
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-[#0F1C2E]">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-[#1E90FF]" />
          <span className="text-white font-display font-bold text-xs uppercase tracking-widest">
            Chapters
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsAdding(true)}
          className="text-[#1E90FF] hover:text-white hover:bg-white/10 h-7 px-2 text-xs font-display font-bold"
        >
          <Plus size={12} className="mr-1" />
          Add
        </Button>
      </div>

      {/* Lesson context label */}
      <div className="px-4 py-2 border-b border-white/5">
        <p className="text-white/40 text-xs font-body truncate">{lessonTitle}</p>
      </div>

      {/* Chapter list */}
      <div className="flex-1 overflow-y-auto py-2">
        {chapters.length === 0 && !isAdding ? (
          <div className="px-4 py-8 text-center">
            <BookOpen size={24} className="text-white/20 mx-auto mb-2" />
            <p className="text-white/40 text-xs font-body">No chapters yet.</p>
            <p className="text-white/30 text-xs font-body mt-1">
              Add chapters to organize your lesson into sections.
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 px-2">
            {chapters.map((chapter, index) => (
              <div
                key={chapter.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                className={cn(
                  "group flex items-center gap-2 px-2 py-2 rounded-lg transition-colors cursor-grab active:cursor-grabbing",
                  "hover:bg-white/5"
                )}
              >
                {/* Drag handle */}
                <GripVertical size={14} className="text-white/20 group-hover:text-white/40 shrink-0" />

                {/* Chapter number badge */}
                <span className="text-[#1E90FF] font-display font-bold text-xs w-5 shrink-0">
                  {index + 1}
                </span>

                {/* Title — inline edit or display */}
                {editingId === chapter.id ? (
                  <div className="flex-1 flex items-center gap-1">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      autoFocus
                      className="h-6 text-xs bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#1E90FF] px-2 py-0"
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="text-green-400 hover:text-green-300 shrink-0"
                      title="Save"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="text-white/40 hover:text-white/70 shrink-0"
                      title="Cancel"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      className="flex-1 text-left text-white/80 text-xs font-body hover:text-white truncate"
                      onClick={() => handleStartEdit(chapter)}
                      title="Click to rename"
                    >
                      {chapter.title}
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <ChevronRight size={10} className="text-white/30" />
                      <button
                        onClick={() => handleDelete(chapter.id, chapter.title)}
                        className="text-white/30 hover:text-red-400 transition-colors"
                        title="Delete chapter"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* New chapter input row */}
        {isAdding && (
          <div className="px-2 mt-1">
            <div className="flex items-center gap-1 px-2 py-1.5 bg-white/5 rounded-lg border border-[#1E90FF]/30">
              <span className="text-[#1E90FF] font-display font-bold text-xs w-5 shrink-0">
                {chapters.length + 1}
              </span>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") { setIsAdding(false); setNewTitle(""); }
                }}
                placeholder="Chapter title…"
                autoFocus
                className="h-6 text-xs bg-transparent border-none text-white placeholder:text-white/30 focus:ring-0 px-1 py-0"
              />
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || createMutation.isPending}
                className="text-green-400 hover:text-green-300 disabled:opacity-40 shrink-0"
                title="Create chapter"
              >
                <Check size={12} />
              </button>
              <button
                onClick={() => { setIsAdding(false); setNewTitle(""); }}
                className="text-white/40 hover:text-white/70 shrink-0"
                title="Cancel"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-3 border-t border-white/5">
        <p className="text-white/25 text-xs font-body leading-relaxed">
          Drag to reorder. Click a chapter name to rename it. Deleting a chapter does not delete its slides.
        </p>
      </div>
    </div>
  );
}
