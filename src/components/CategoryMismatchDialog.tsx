import { Category } from '@/data/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, Pencil } from 'lucide-react';

interface CategoryMismatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userCategory: Category;
  predictedCategory: Category;
  confidence: number;
  reason: string;
  onAcceptSuggestion: () => void;
  onKeepSelection: () => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  'Garbage': '🗑️',
  'Pothole': '🕳️',
  'Streetlight': '💡',
  'Water Issue': '💧',
  'Others': '📋',
};

export default function CategoryMismatchDialog({
  open,
  onOpenChange,
  userCategory,
  predictedCategory,
  confidence,
  reason,
  onAcceptSuggestion,
  onKeepSelection,
}: CategoryMismatchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Category Mismatch Detected
          </DialogTitle>
          <DialogDescription className="pt-2 space-y-3">
            <p>
              Our AI analyzed your uploaded image and detected a possible category mismatch.
            </p>
            <div className="bg-secondary rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your selection:</span>
                <span className="font-medium text-foreground">
                  {CATEGORY_EMOJI[userCategory]} {userCategory}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">AI suggestion:</span>
                <span className="font-medium text-primary">
                  {CATEGORY_EMOJI[predictedCategory]} {predictedCategory}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confidence:</span>
                <span className="font-medium text-foreground">
                  {Math.round(confidence * 100)}%
                </span>
              </div>
            </div>
            <p className="text-xs italic text-muted-foreground">
              "{reason}"
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onKeepSelection} className="flex-1">
            <Pencil className="h-4 w-4 mr-1" /> Keep My Selection
          </Button>
          <Button onClick={onAcceptSuggestion} className="flex-1">
            <Check className="h-4 w-4 mr-1" /> Use {predictedCategory}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
