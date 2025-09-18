'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type OwnedItemSummary = {
  id: string;
  title: string;
  type: 'course' | 'bundle';
  slug?: string | null;
  thumbnailUrl?: string | null;
  variantLabel?: string | null;
  note?: string | null;
};

interface OwnedItemsDialogProps {
  open: boolean;
  items: OwnedItemSummary[];
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  isConfirming?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  description?: string;
}

export function OwnedItemsDialog({
  open,
  items,
  onCancel,
  onConfirm,
  isConfirming = false,
  confirmLabel = 'Remove and continue',
  cancelLabel = 'Keep items',
  description = 'We found items you already own. Confirm to remove them before continuing checkout.',
}: OwnedItemsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-lg bg-white" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>You already own these items</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3"
            >
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="h-14 w-14 flex-shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="h-14 w-14 flex-shrink-0 rounded-md bg-amber-100" />
              )}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <Badge variant="outline" className="text-xs capitalize text-amber-700 border-amber-300">
                    {item.type}
                  </Badge>
                </div>
                {item.variantLabel && (
                  <p className="mt-1 text-sm text-gray-600">
                    Access plan: {item.variantLabel}
                  </p>
                )}
                {item.note && (
                  <p className="mt-1 text-sm text-gray-500">
                    {item.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isConfirming}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            {isConfirming ? 'Removing…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
