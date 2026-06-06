import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Standardized Dialog component for all modals (Confirmation, Success, Warning, Error).
 * Eliminates custom layout duplication and ensures UX consistency.
 */
export function StandardDialog({
  isOpen,
  onClose,
  type = 'confirmation', // 'confirmation' | 'success' | 'warning' | 'error'
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  isLoading = false,
  children,
}) {
  const typeConfigs = {
    success: {
      icon: CheckCircle2,
      iconClass: 'bg-success/10 text-success border-success/20',
      confirmVariant: 'default',
    },
    warning: {
      icon: AlertTriangle,
      iconClass: 'bg-warning/10 text-warning border-warning/20',
      confirmVariant: 'default',
    },
    error: {
      icon: XCircle,
      iconClass: 'bg-error/10 text-error border-error/20',
      confirmVariant: 'destructive',
    },
    confirmation: {
      icon: HelpCircle,
      iconClass: 'bg-accent/10 text-accent border-accent/20',
      confirmVariant: 'default',
    },
  };

  const config = typeConfigs[type] || typeConfigs.confirmation;
  const IconComponent = config.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-card border border-border/60 shadow-[0_20px_40px_rgba(0,0,0,0.3)] animate-fade-in" showCloseButton={!isLoading}>
        <DialogHeader className="flex flex-col items-center pt-2 text-center">
          {/* Icon Badge */}
          <div className={cn(
            "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border-2 transition-transform duration-300 scale-95",
            config.iconClass
          )}>
            <IconComponent className="h-7 w-7" />
          </div>
          
          <DialogTitle className="text-lg font-bold tracking-tight text-foreground/95">
            {title}
          </DialogTitle>
          
          <DialogDescription className="mt-2 text-xs leading-normal text-muted-foreground max-w-sm">
            {description}
          </DialogDescription>
        </DialogHeader>

        {children && <div className="py-2">{children}</div>}

        <DialogFooter className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {cancelText && !isLoading && (
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-border hover:bg-secondary/40 text-xs font-semibold sm:w-28"
            >
              {cancelText}
            </Button>
          )}
          {onConfirm && (
            <Button
              variant={config.confirmVariant}
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                "text-xs font-semibold sm:w-28",
                type === 'success' && 'bg-success text-success-foreground hover:bg-success/80',
                type === 'warning' && 'bg-warning text-warning-foreground hover:bg-warning/80'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  <span>Loading</span>
                </>
              ) : (
                <span>{confirmText}</span>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default StandardDialog;
