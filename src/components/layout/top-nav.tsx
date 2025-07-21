
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Settings,
  PlusCircle,
  Download,
  Loader2,
  Wrench,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { ScanDialog } from '../scan-dialog';
import { VerifyToolsDialog } from '../verify-tools-dialog';
import { useToast } from '@/hooks/use-toast';
import { SettingsDialog } from '../settings-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function TopNav() {
  const { toast } = useToast();
  const [toolsReady, setToolsReady] = useState(false);
  const [isPreparingTools, setIsPreparingTools] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleRefreshComplete = () => {
        setIsRefreshing(false);
    }
    window.addEventListener('refreshComplete', handleRefreshComplete);

    return () => {
        window.removeEventListener('refreshComplete', handleRefreshComplete);
    }
  }, []);

  useEffect(() => {
    const checkToolStatus = async () => {
      try {
        const response = await fetch('/api/tools/status');
        const data = await response.json();
        setToolsReady(data.ready);
      } catch (error) {
        console.error("Failed to check tool status:", error);
        setToolsReady(false);
      }
    };
    const interval = setInterval(checkToolStatus, 5000); // Check every 5 seconds
    checkToolStatus(); // Initial check

    return () => clearInterval(interval);
  }, []);

  const handlePrepareTools = async () => {
    setIsPreparingTools(true);
    toast({
      title: "Preparing Tools",
      description: "Downloading and setting up required tools. This might take a moment...",
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
      setToolsReady(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Tool Preparation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsPreparingTools(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.dispatchEvent(new CustomEvent('refreshDashboard'));
    // Fallback timeout to prevent spinner from getting stuck
    setTimeout(() => {
        if (isRefreshing) {
            setIsRefreshing(false);
        }
    }, 10000); 
  };
  
  return (
    <header 
      className="w-full bg-background border-b h-16 flex items-center"
    >
      <div 
        className="flex items-center w-full max-w-7xl mx-auto px-4"
      >
        <div className="flex items-center gap-3">
          <Shield className="size-7 text-primary" />
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Siliwangi Sentry
          </h1>
        </div>
        <div className="flex-grow" />
        <TooltipProvider>
            <div className="flex items-center gap-2">
            {toolsReady ? (
                <>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="icon" aria-label="Refresh Dashboard">
                            {isRefreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Refresh Dashboard</p>
                    </TooltipContent>
                </Tooltip>
                
                <ScanDialog>
                    <Button>
                    <PlusCircle />
                    <span>New Scan</span>
                    </Button>
                </ScanDialog>
                </>
            ) : (
                <Button onClick={handlePrepareTools} disabled={isPreparingTools}>
                {isPreparingTools ? <Loader2 className="animate-spin" /> : <Download />}
                <span>{isPreparingTools ? 'Preparing...' : 'Prepare Tools'}</span>
                </Button>
            )}

            <Tooltip>
                <TooltipTrigger asChild>
                    <SettingsDialog>
                        <Button variant="outline" size="icon" aria-label="Settings">
                        <Settings className="size-5" />
                        </Button>
                    </SettingsDialog>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Scan Settings</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <VerifyToolsDialog>
                        <Button variant="outline" size="icon" aria-label="Verify Tools">
                        <Wrench className="size-5" />
                        </Button>
                    </VerifyToolsDialog>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Verify Tools</p>
                </TooltipContent>
            </Tooltip>
            </div>
        </TooltipProvider>
      </div>
    </header>
  );
}
