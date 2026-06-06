import React from 'react';
import { Button } from '@/components/ui/button';
import { AmbientBackground } from '@/components/effects/AmbientBackground';

/**
 * Reusable Empty State component for lists, tables, and boards.
 * Matches ASHBY/Linear visual quality.
 */
export function EmptyState({
  icon: Icon,
  title = "No data available",
  description = "Get started by adding or uploading new records to the system.",
  ctaText,
  onCtaClick,
}) {
  return (
    <AmbientBackground className="w-full rounded-xl border border-dashed border-border/60">
      <div className="flex min-h-[300px] w-full flex-col items-center justify-center bg-card/5 p-8 text-center animate-fade-in select-none">
        {Icon && (
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/40 text-accent border border-border/60">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <h3 className="text-sm font-semibold tracking-tight text-foreground/90">{title}</h3>
        <p className="mt-1.5 max-w-[280px] text-xs leading-normal text-muted-foreground">
          {description}
        </p>
        {ctaText && onCtaClick && (
          <Button
            onClick={onCtaClick}
            variant="outline"
            size="sm"
            className="mt-5 border-border hover:bg-secondary/40 hover:text-foreground text-xs font-semibold"
          >
            {ctaText}
          </Button>
        )}
      </div>
    </AmbientBackground>
  );
}

export default EmptyState;
