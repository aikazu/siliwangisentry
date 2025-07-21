
"use client";

import React from 'react';
import { TopNav } from '@/components/layout/top-nav';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main className="p-4 md:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-7xl">
            {children}
        </div>
      </main>
    </div>
  );
}
