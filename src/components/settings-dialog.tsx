
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SettingsForm } from './settings-form';

export function SettingsDialog({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] grid-rows-[auto_1fr_auto]">
        <DialogHeader>
          <DialogTitle>Scan Settings</DialogTitle>
          <DialogDescription>
            Configure Nuclei scan settings, flags, and templates. Changes are saved automatically.
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto my-4 pr-6">
            <SettingsForm />
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
