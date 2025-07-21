
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Terminal, Loader2, XOctagon, CheckCircle, Info, AlertTriangle, ChevronsRight, Server, Search, ShieldQuestion } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

const scanSchema = z.object({
  target: z.string().min(1, "Target is required"),
});

type ScanFormValues = z.infer<typeof scanSchema>;


const LogLine = ({ log }: { log: string }) => {
    let Icon = ChevronsRight;
    let color = 'text-cyan-400';
    let text = log;

    if (log.startsWith('[DONE]')) {
        Icon = CheckCircle;
        color = 'text-green-400';
        text = log.replace('[DONE]', '').trim();
    } else if (log.startsWith('[ERROR]')) {
        Icon = XOctagon;
        color = 'text-red-400';
        text = log.replace('[ERROR]', '').trim();
    } else if (log.startsWith('[WARN]')) {
        Icon = AlertTriangle;
        color = 'text-yellow-400';
        text = log.replace('[WARN]', '').trim();
    } else if (log.startsWith('[CANCELLED]')) {
        Icon = XOctagon;
        color = 'text-orange-400';
        text = log.replace('[CANCELLED]', '').trim();
    } else if (log.toLowerCase().includes('subfinder')) {
        Icon = Search;
    } else if (log.toLowerCase().includes('httpx')) {
        Icon = Server;
    } else if (log.toLowerCase().includes('nuclei')) {
        Icon = ShieldQuestion;
    } else if (log.toLowerCase().includes('initializing')) {
        Icon = Info;
    }

    return (
        <div className="flex gap-3 items-start font-mono text-sm">
            <div className='flex items-center gap-2'>
              <span className={cn("text-muted-foreground", color)}>$</span>
              <Icon className={cn("w-4 h-4 shrink-0", color)} />
            </div>
            <span className="flex-1 break-words animate-in fade-in text-gray-300">{text}</span>
        </div>
    );
};


const ScanLog = ({ logs, target }: { logs: string[], target: string }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scrollArea = scrollRef.current?.parentElement?.parentElement;
        if (scrollArea) {
           scrollArea.scrollTop = scrollArea.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="bg-black rounded-md text-white border border-gray-800 shadow-inner">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 rounded-t-md border-b border-gray-800">
                <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-500"></span>
                    <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
                    <span className="h-3 w-3 rounded-full bg-green-500"></span>
                </div>
                <p className="text-gray-400 text-xs truncate font-mono">/bin/zsh - scanning: {target}</p>
            </div>
            <ScrollArea className="h-72">
                <div ref={scrollRef} className="p-4 space-y-2">
                    {logs.map((log, index) => <LogLine key={index} log={log} />)}
                </div>
            </ScrollArea>
        </div>
    );
};


export function ScanDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [scanId, setScanId] = useState('');
  const { toast } = useToast();

  const form = useForm<ScanFormValues>({
    resolver: zodResolver(scanSchema),
    defaultValues: {
      target: "demo.siliwangisentry.dev",
    },
  });

  const isSubmitting = form.formState.isSubmitting;
  const pollingRef = useRef<NodeJS.Timeout>();

  const stopPolling = useCallback(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = undefined;
      }
  }, []);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const pollScanStatus = useCallback((currentScanId: string) => {
    stopPolling();

    pollingRef.current = setInterval(async () => {
        try {
            const response = await fetch(`/api/scan/status?scanId=${currentScanId}`);
             if (!response.ok) {
                return;
            }
            const data = await response.json();
            if (data.logs && Array.isArray(data.logs)) {
                setScanLogs(data.logs);
                
                const lastLog = data.logs[data.logs.length - 1] || '';
                const isDone = lastLog.startsWith('[DONE]') || lastLog.startsWith('[ERROR]') || lastLog.startsWith('[WARN]') || lastLog.startsWith('[CANCELLED]');
                if (isDone) {
                    stopPolling();
                    setIsFinished(true);
                     if (lastLog.startsWith('[DONE]')) {
                        window.dispatchEvent(new CustomEvent('scanComplete'));
                        toast({
                            title: "Scan Complete",
                            description: `Automated scan for ${form.getValues("target")} has finished.`,
                        });
                    } else if (!lastLog.startsWith('[CANCELLED]')) {
                         toast({
                            variant: "destructive",
                            title: "Scan Issue",
                            description: lastLog,
                        });
                    }
                }
            }
        } catch (error) {
            stopPolling();
            setIsFinished(true);
        }
    }, 2000);
  }, [stopPolling, toast, form]);

  const onSubmit = async (data: ScanFormValues) => {
    const newScanId = uuidv4();
    setScanId(newScanId);
    setScanLogs([]);
    setIsScanning(true);
    setIsFinished(false);

    toast({
        title: "Automated Scan Started",
        description: `Scanning target: ${data.target}. This may take some time.`,
    });
    
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: data.target, scanId: newScanId }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
      }
      pollScanStatus(newScanId);

    } catch (error) {
       toast({
        variant: "destructive",
        title: "Failed to Start Scan",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
       setIsScanning(false);
       setIsFinished(true);
    }
  };

  const handleStopScan = async () => {
    if (!scanId) return;
    setIsStopping(true);
    toast({
        title: "Stopping Scan",
        description: "Attempting to cancel the current scan...",
    });

    try {
        const response = await fetch('/api/scan/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scanId }),
        });
        if (!response.ok) {
            throw new Error('Failed to stop the scan.');
        }
        toast({
            title: "Scan Cancelled",
            description: "The scan has been successfully stopped.",
        });
        stopPolling();
        setIsFinished(true);
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error Stopping Scan",
            description: error instanceof Error ? error.message : "Could not stop the scan.",
        });
    } finally {
        setIsStopping(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
        setTimeout(() => {
            form.reset();
            setIsScanning(false);
            setIsFinished(false);
            setIsStopping(false);
            setScanLogs([]);
            setScanId('');
            stopPolling();
        }, 500); // Delay reset to allow dialog to animate out
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className={cn("sm:max-w-[425px] transition-all duration-300", isScanning && "sm:max-w-3xl")}>
        <DialogHeader>
          <DialogTitle>Start Automated Scan</DialogTitle>
          {!isScanning && (
            <DialogDescription>
              Enter a target to start a comprehensive, automated scan.
            </DialogDescription>
          )}
        </DialogHeader>

        {isScanning ? (
            <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">Scan in progress for <span className="font-bold text-primary">{form.getValues("target")}</span>. You can close this dialog, the scan will continue in the background.</p>
                <ScanLog logs={scanLogs} target={form.getValues("target")} />
                <DialogFooter className="sm:justify-between pt-4">
                    <div>
                        {isScanning && !isFinished && (
                            <Button variant="destructive" onClick={handleStopScan} disabled={isStopping}>
                                {isStopping ? <Loader2 className="animate-spin" /> : <XOctagon />}
                                {isStopping ? 'Stopping...' : 'Stop Scan'}
                            </Button>
                        )}
                    </div>
                    <div>
                        <DialogClose asChild>
                            <Button>Close</Button>
                        </DialogClose>
                    </div>
                </DialogFooter>
            </div>
        ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="target">Target Domain or IP</Label>
                <Input
                id="target"
                placeholder="e.g., example.com"
                {...form.register("target")}
                />
                {form.formState.errors.target && <p className="text-sm text-destructive">{form.formState.errors.target.message}</p>}
            </div>
            
            <DialogFooter>
                <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Terminal className="mr-2 h-4 w-4" />}
                    Start Scan
                </Button>
            </DialogFooter>
            </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
