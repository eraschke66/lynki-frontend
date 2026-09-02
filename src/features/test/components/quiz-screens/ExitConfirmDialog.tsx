import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ExitConfirmDialog({
  open,
  onOpenChange,
  onConfirmExit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmExit: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Pause and leave?</AlertDialogTitle>
          <AlertDialogDescription>
            Your progress is saved and you can resume this quiz later!
            However, it's highly recommended to finish what you started to
            lock in those concepts.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Going</AlertDialogCancel>
          <AlertDialogAction
            className="bg-ghibli-amber text-primary-foreground hover:bg-ghibli-amber/90"
            onClick={onConfirmExit}
          >
            Save & Exit
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
