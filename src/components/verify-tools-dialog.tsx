
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToolStatus = Record<string, string>;

const statusIcon = (status: string) => {
    if (status === 'OK') {
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    return <XCircle className="h-5 w-5 text-destructive" />;
}

const formatToolName = (name: string) => {
    return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export function VerifyToolsDialog({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState<ToolStatus | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isPreparing, setIsPreparing] = useState(false);
    const { toast } = useToast();

    const verify = useCallback(async () => {
        setIsVerifying(true);
        setStatus(null);
        try {
            const response = await fetch('/api/tools/verify', { method: 'POST' });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Verification failed');
            }
            setStatus(data.status);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Verification Failed",
                description: error instanceof Error ? error.message : "An unknown error occurred.",
            });
        } finally {
            setIsVerifying(false);
        }
    }, [toast]);
    
    useEffect(() => {
        if (open) {
            verify();
        }
    }, [open, verify]);
    
    const handlePrepare = async () => {
        setIsPreparing(true);
        toast({
            title: "Preparing Tools",
            description: "Downloading and setting up required tools. This might take a while...",
        });
        
        try {
            const response = await fetch('/api/tools/prepare', { method: 'POST' });
             if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to prepare tools.');
            }
            toast({
                title: "Tools Ready",
                description: "All security tools are now ready to use.",
            });
            // Re-verify after preparing
            await verify();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Preparation Failed",
                description: error instanceof Error ? error.message : "An unknown error occurred.",
            });
        } finally {
            setIsPreparing(false);
        }
    };
    
    const allToolsOk = status && Object.values(status).every(s => s === 'OK');

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Tool Verification Status</DialogTitle>
                    <DialogDescription>
                        Check the status of all required security tools. Install or update them if needed.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    {isVerifying && !status ? (
                        <div className="flex items-center justify-center h-24">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p className="ml-4">Verifying tools...</p>
                        </div>
                    ) : status ? (
                         <ul className="space-y-3">
                            {Object.entries(status).map(([tool, toolStatus]) => (
                                <li key={tool} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {statusIcon(toolStatus)}
                                        <span className="font-medium">{formatToolName(tool)}</span>
                                    </div>
                                    <span className={cn("text-sm", toolStatus === 'OK' ? 'text-green-500' : 'text-destructive')}>
                                        {toolStatus}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center text-muted-foreground">Could not load tool status.</div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
                    <Button onClick={handlePrepare} disabled={isPreparing || allToolsOk}>
                        {isPreparing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        {isPreparing ? 'Preparing...' : allToolsOk ? 'All Tools Ready' : 'Prepare/Update Tools'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
