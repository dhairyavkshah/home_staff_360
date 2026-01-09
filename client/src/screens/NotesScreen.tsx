import { useState, useMemo } from "react";
import { Plus, Pin, Pencil, Trash2, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useActiveContext } from "@/hooks/use-active-context";
import type { Note, NoteColor } from "@shared/schema";
import { noteColors } from "@shared/schema";

const colorClasses: Record<NoteColor, string> = {
  yellow: "bg-yellow-100 dark:bg-yellow-900/30",
  blue: "bg-blue-100 dark:bg-blue-900/30",
  green: "bg-green-100 dark:bg-green-900/30",
  pink: "bg-pink-100 dark:bg-pink-900/30",
  purple: "bg-purple-100 dark:bg-purple-900/30",
  orange: "bg-orange-100 dark:bg-orange-900/30",
};

const colorPickerClasses: Record<NoteColor, string> = {
  yellow: "bg-yellow-400",
  blue: "bg-blue-400",
  green: "bg-green-400",
  pink: "bg-pink-400",
  purple: "bg-purple-400",
  orange: "bg-orange-400",
};

export function NotesScreen() {
  const { navigate, goBack } = useNavigation();
  const { toast } = useToast();
  const { contextLabel, contextMode } = useActiveContext();
  
  const accountId = storage.getActiveAccountId();
  const showAllContexts = storage.getShowAllContexts();
  const userType = storage.getProfile()?.type || "HOME";

  const [notes, setNotes] = useState<Note[]>(() => {
    if (showAllContexts || !accountId) {
      return storage.getNotes().filter(n => n.userType === userType);
    }
    return storage.getNotesByAccount(accountId, userType);
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formColor, setFormColor] = useState<NoteColor>("yellow");
  const [formPinned, setFormPinned] = useState(false);

  const refreshNotes = () => {
    if (showAllContexts || !accountId) {
      setNotes(storage.getNotes().filter(n => n.userType === userType));
    } else {
      setNotes(storage.getNotesByAccount(accountId, userType));
    }
  };

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes]);

  const openAddDialog = () => {
    setEditingNote(null);
    setFormTitle("");
    setFormContent("");
    setFormColor("yellow");
    setFormPinned(false);
    setDialogOpen(true);
  };

  const openEditDialog = (note: Note) => {
    setEditingNote(note);
    setFormTitle(note.title || "");
    setFormContent(note.content);
    setFormColor(note.color);
    setFormPinned(note.isPinned);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formContent.trim()) {
      toast({ title: "Content is required", variant: "destructive" });
      return;
    }

    const targetAccountId = accountId || (() => {
      const accounts = storage.getAccounts().filter(a => 
        a.ownerType === (userType === "STAFF" ? "STAFF" : "HOME")
      );
      return accounts[0]?.id;
    })();

    if (!targetAccountId) {
      toast({ 
        title: userType === "STAFF" ? "Add a business first" : "Add a household first", 
        variant: "destructive" 
      });
      return;
    }

    if (editingNote) {
      storage.updateNote(editingNote.id, {
        title: formTitle.trim() || undefined,
        content: formContent.trim(),
        color: formColor,
        isPinned: formPinned,
      });
      toast({ title: "Note updated" });
    } else {
      storage.addNote({
        accountId: targetAccountId,
        userType,
        title: formTitle.trim() || undefined,
        content: formContent.trim(),
        color: formColor,
        isPinned: formPinned,
      });
      toast({ title: "Note added" });
    }

    setDialogOpen(false);
    refreshNotes();
  };

  const handleDelete = () => {
    if (deleteId) {
      storage.deleteNote(deleteId);
      toast({ title: "Note deleted" });
      setDeleteId(null);
      refreshNotes();
    }
  };

  const truncateContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  const homeScreen = contextMode === "staff" ? "staff-home" : "home";

  return (
    <AppLayout>
      <Header
        title="Notes"
        subtitle="Quick sticky notes"
        onBack={() => navigate(homeScreen)}
        contextLabel={contextLabel}
        contextMode={contextMode}
        rightAction={
          <Button size="icon" onClick={openAddDialog} data-testid="button-add-note">
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      <ScrollContent>
        {sortedNotes.length === 0 ? (
          <Card className="p-6 flex flex-col items-center gap-3" data-testid="empty-state">
            <div className="icon-halo-muted w-12 h-12">
              <StickyNote className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm text-center">
              No notes yet. Tap the + button to add your first note.
            </p>
            <Button onClick={openAddDialog} data-testid="button-add-first-note">
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3" data-testid="notes-grid">
            {sortedNotes.map((note) => (
              <div
                key={note.id}
                className={`rounded-lg p-3 ${colorClasses[note.color]} relative group`}
                data-testid={`note-card-${note.id}`}
              >
                {note.isPinned && (
                  <Pin 
                    className="absolute top-2 right-2 h-3.5 w-3.5 text-foreground/60" 
                    data-testid={`pin-icon-${note.id}`}
                  />
                )}
                
                {note.title && (
                  <h3 
                    className="font-semibold text-sm mb-1 pr-5 line-clamp-1 text-foreground"
                    data-testid={`note-title-${note.id}`}
                  >
                    {note.title}
                  </h3>
                )}
                
                <p 
                  className="text-xs text-foreground/80 mb-3 line-clamp-4"
                  data-testid={`note-content-${note.id}`}
                >
                  {truncateContent(note.content)}
                </p>
                
                <div className="flex gap-1 mt-auto">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => openEditDialog(note)}
                    data-testid={`button-edit-note-${note.id}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => setDeleteId(note.id)}
                    data-testid={`button-delete-note-${note.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm" data-testid="note-dialog">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title">
              {editingNote ? "Edit Note" : "Add Note"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editingNote ? "Edit your note details" : "Create a new sticky note"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="note-title">Title (optional)</Label>
              <Input
                id="note-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Note title..."
                maxLength={100}
                data-testid="input-note-title"
              />
            </div>

            <div>
              <Label htmlFor="note-content">Content *</Label>
              <Textarea
                id="note-content"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Write your note..."
                maxLength={1000}
                rows={5}
                data-testid="input-note-content"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formContent.length}/1000 characters
              </p>
            </div>

            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2" data-testid="color-picker">
                {noteColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormColor(color)}
                    className={`w-8 h-8 rounded-full ${colorPickerClasses[color]} ${
                      formColor === color
                        ? "ring-2 ring-offset-2 ring-foreground"
                        : ""
                    }`}
                    data-testid={`color-option-${color}`}
                    aria-label={`Select ${color} color`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="note-pinned">Pin to top</Label>
              <Switch
                id="note-pinned"
                checked={formPinned}
                onCheckedChange={setFormPinned}
                data-testid="switch-pin"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} data-testid="button-save-note">
              {editingNote ? "Save Changes" : "Add Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </AppLayout>
  );
}
