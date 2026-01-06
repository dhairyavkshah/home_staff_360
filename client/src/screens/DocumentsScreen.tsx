import { useMemo, useState } from "react";
import { FolderOpen, FileText, Image, File, Trash2, Eye, Link2, Download } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { compressImage, formatBytes } from "@/lib/imageCompression";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { HOME_DOCUMENT_CATEGORIES, type Document, type HomeDocumentCategory } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { usePlanStatus } from "@/hooks/use-plan-status";
import { AttachmentChooser } from "@/components/AttachmentChooser";
import { useActiveContext } from "@/hooks/use-active-context";

export function DocumentsScreen() {
  const { navigate } = useNavigation();
  const { tLabel } = useTranslation();
  const { toast } = useToast();
  const { planType } = usePlanStatus();
  const { contextLabel, contextMode } = useActiveContext();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPreview, setShowPreview] = useState<Document | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newDocCategory, setNewDocCategory] = useState<HomeDocumentCategory>(HOME_DOCUMENT_CATEGORIES[0]);
  const [newDocDescription, setNewDocDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showAttachmentChooser, setShowAttachmentChooser] = useState(false);

  const activeAccountId = useMemo(() => storage.getActiveAccountId(), [refreshKey]);
  const showAllContexts = useMemo(() => storage.getShowAllContexts(), [refreshKey]);
  const documentLimit = useMemo(() => storage.checkDocumentLimit(), [refreshKey, planType]);

  const handleAddClick = () => {
    if (!documentLimit.allowed) {
      toast({
        title: tLabel('limitReached', 'Storage Full'),
        description: tLabel('documentLimitReached', "You've reached 1000 total records. Please delete some dormant records to add more documents."),
        variant: 'destructive',
      });
      return;
    }
    setShowAttachmentChooser(true);
  };

  const documents = useMemo(() => {
    let docs = storage.getDocumentsByOwnerType('HOME');
    if (!showAllContexts && activeAccountId) {
      docs = docs.filter(d => d.accountId === activeAccountId);
    }
    if (selectedCategory !== "all") {
      docs = docs.filter(d => d.category === selectedCategory);
    }
    return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [refreshKey, selectedCategory, activeAccountId, showAllContexts]);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setShowAddDialog(true);
  };

  const handleAddDocument = async () => {
    if (!selectedFile || !activeAccountId) return;

    try {
      const result = await compressImage(selectedFile);
      const compressedSize = result.compressedSize;
      
      storage.addDocument({
        ownerType: 'HOME',
        accountId: activeAccountId,
        category: newDocCategory,
        description: newDocDescription,
        fileName: selectedFile.name,
        fileType: result.outputType || selectedFile.type,
        fileSize: compressedSize,
        fileData: result.dataUrl,
      });

      const savedSpace = result.originalSize - compressedSize;
      toast({
        title: tLabel('success', 'Success'),
        description: savedSpace > 1024 
          ? `Document added. Saved ${formatBytes(savedSpace)} with compression.`
          : tLabel('documentAdded', 'Document added successfully'),
      });

      setShowAddDialog(false);
      setSelectedFile(null);
      setNewDocDescription("");
      setNewDocCategory(HOME_DOCUMENT_CATEGORIES[0]);
      setRefreshKey(k => k + 1);
    } catch {
      toast({
        title: tLabel('error', 'Error'),
        description: tLabel('documentAddFailed', 'Failed to add document'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (id: string) => {
    storage.deleteDocument(id);
    setDeleteConfirm(null);
    setRefreshKey(k => k + 1);
    toast({
      title: tLabel('deleted', 'Deleted'),
      description: tLabel('documentDeleted', 'Document deleted'),
    });
  };

  const handleLinkedRecordClick = (doc: Document) => {
    if (doc.linkedRecordType === 'EXPENSE' && doc.linkedRecordId) {
      const expense = storage.getExpense(doc.linkedRecordId);
      if (expense) {
        navigate('add-expense', { expenseId: doc.linkedRecordId, editMode: true });
      } else {
        toast({
          title: tLabel('error', 'Error'),
          description: tLabel('recordNotFound', 'Linked record not found'),
          variant: 'destructive',
        });
      }
    } else if (doc.linkedRecordType === 'TRANSACTION' && doc.linkedRecordId) {
      const transaction = storage.getTransaction(doc.linkedRecordId);
      if (transaction) {
        navigate('person-detail', { personId: transaction.personId });
      } else {
        toast({
          title: tLabel('error', 'Error'),
          description: tLabel('recordNotFound', 'Linked record not found'),
          variant: 'destructive',
        });
      }
    }
  };

  const getLinkedRecordLabel = (doc: Document) => {
    if (doc.linkedRecordType === 'EXPENSE' && doc.linkedRecordId) {
      const expense = storage.getExpense(doc.linkedRecordId);
      return expense ? `Expense: ${expense.title}` : 'Linked Expense';
    }
    if (doc.linkedRecordType === 'TRANSACTION' && doc.linkedRecordId) {
      const transaction = storage.getTransaction(doc.linkedRecordId);
      return transaction ? `Transaction: ${transaction.description}` : 'Linked Transaction';
    }
    return null;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType.includes('pdf')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="screen-documents">
      <div className="safe-area-top" />

      <Header
        title={tLabel('documents', 'Documents')}
        subtitle={`${documentLimit.current}/${documentLimit.max} ${tLabel('documents', 'Documents')}`}
        onBack={() => navigate("home")}
        contextLabel={contextLabel}
        contextMode={contextMode}
        onAdd={handleAddClick}
        addDisabled={!documentLimit.allowed}
        addTestId="button-add-document"
      />

      <div className="content-container pt-4 pb-2">
        <SearchableSelect
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          placeholder={tLabel('allCategories', 'All Categories')}
          searchPlaceholder="Search categories..."
          emptyMessage="No categories found"
          options={[
            { value: "all", label: tLabel('allCategories', 'All Categories') },
            ...HOME_DOCUMENT_CATEGORIES.map(cat => ({
              value: cat,
              label: cat,
            })),
          ]}
          data-testid="select-category"
        />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="content-container pb-8 flex flex-col gap-3">
          {documents.length === 0 ? (
            <Card className="p-4 flex flex-col items-center gap-2" data-testid="empty-state">
              <div className="icon-halo-muted w-10 h-10">
                <FolderOpen className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-sm">{tLabel('noDocuments', 'No documents yet')}</h3>
                <p className="text-xs text-muted-foreground">{tLabel('addYourFirstDocument', 'Add your first document to get started')}</p>
              </div>
              <Button onClick={handleAddClick} disabled={!documentLimit.allowed} data-testid="button-add-first-document">
                <span className="mr-2">+</span>
                {tLabel('addDocument', 'Add Document')}
              </Button>
            </Card>
          ) : (
            documents.map((doc) => {
              const FileIcon = getFileIcon(doc.fileType);
              const linkedLabel = getLinkedRecordLabel(doc);
              return (
                <Card
                  key={doc.id}
                  className="p-4 flex items-center gap-3"
                  data-testid={`card-document-${doc.id}`}
                >
                  <div className="icon-halo-primary w-9 h-9">
                    <FileIcon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{doc.fileName}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">{doc.category}</Badge>
                      <span className="text-xs text-muted-foreground">{formatFileSize(doc.fileSize)}</span>
                    </div>
                    {doc.description && (
                      <p className="text-xs text-muted-foreground truncate mt-1">{doc.description}</p>
                    )}
                    {linkedLabel && (
                      <button
                        className="flex items-center gap-1 text-xs text-info mt-1 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLinkedRecordClick(doc);
                        }}
                        data-testid={`button-linked-record-${doc.id}`}
                      >
                        <Link2 className="w-3 h-3" />
                        {linkedLabel}
                      </button>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {/^image\/(jpeg|jpg|png|bmp|heif|heic)$/i.test(doc.fileType) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowPreview(doc)}
                        data-testid={`button-view-${doc.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      data-testid={`button-download-${doc.id}`}
                    >
                      <a href={doc.fileData} download={doc.fileName}>
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirm(doc.id)}
                      data-testid={`button-delete-${doc.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <AttachmentChooser
        open={showAttachmentChooser}
        onOpenChange={setShowAttachmentChooser}
        onFileSelected={handleFileSelected}
      />

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tLabel('addDocument', 'Add Document')}</DialogTitle>
            <DialogDescription>
              {selectedFile?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>{tLabel('category', 'Category')}</Label>
              <SearchableSelect
                value={newDocCategory}
                onValueChange={(v) => setNewDocCategory(v as HomeDocumentCategory)}
                placeholder={tLabel('selectCategory', 'Select category')}
                searchPlaceholder="Search categories..."
                emptyMessage="No categories found"
                options={HOME_DOCUMENT_CATEGORIES.map(cat => ({
                  value: cat,
                  label: cat,
                }))}
                data-testid="select-new-category"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{tLabel('description', 'Description')} ({tLabel('optional', 'Optional')})</Label>
              <Input
                value={newDocDescription}
                onChange={(e) => setNewDocDescription(e.target.value)}
                placeholder={tLabel('enterDescription', 'Enter description...')}
                data-testid="input-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {tLabel('cancel', 'Cancel')}
            </Button>
            <Button onClick={handleAddDocument} data-testid="button-save-document">
              {tLabel('save', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{showPreview?.fileName}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {showPreview?.fileType.startsWith('image/') ? (
              <img
                src={showPreview.fileData}
                alt={showPreview.fileName}
                className="w-full max-h-96 object-contain rounded-md"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 p-8 bg-muted rounded-md">
                <FileText className="w-16 h-16 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {tLabel('previewNotAvailable', 'Preview not available for this file type')}
                </p>
                <Button asChild>
                  <a href={showPreview?.fileData} download={showPreview?.fileName}>
                    {tLabel('download', 'Download')}
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
        title={tLabel('deleteDocument', 'Delete Document')}
        description={tLabel('deleteDocumentConfirm', 'Are you sure you want to delete this document? This action cannot be undone.')}
        confirmText={tLabel('delete', 'Delete')}
        cancelText={tLabel('cancel', 'Cancel')}
        variant="destructive"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
      />
    </div>
  );
}
