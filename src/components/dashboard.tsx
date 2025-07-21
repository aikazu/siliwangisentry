
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from './ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from 'date-fns';
import type { Vulnerability, ScannedTarget } from '@/types/scan';
import { AlertTriangle, Bug, Shield, ShieldAlert, ShieldCheck, ShieldX, Server, ArrowRight } from 'lucide-react';
import { SeverityBadge, severityColorClassMap } from './severity-badge';
import { cn } from '@/lib/utils';


const severityOrder: Record<Vulnerability['severity'], number> = {
  Critical: 5,
  High: 4,
  Medium: 3,
  Low: 2,
  Info: 1,
  Unknown: 0,
};

const severityIcons: Record<Vulnerability['severity'], React.ElementType> = {
  Critical: ShieldX,
  High: ShieldAlert,
  Medium: AlertTriangle,
  Low: ShieldCheck,
  Info: Shield,
  Unknown: Shield,
}

export function Dashboard() {
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/results');
      if (!response.ok) throw new Error('Failed to fetch results');
      const data = await response.json();
      setVulnerabilities(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load scan results.",
      });
      console.error(error);
    } finally {
      setLoading(false);
      window.dispatchEvent(new CustomEvent('refreshComplete'));
    }
  }, [toast]);

  useEffect(() => {
    fetchResults();
    const handleScanComplete = () => fetchResults();
    const handleRefresh = () => fetchResults();
    window.addEventListener('scanComplete', handleScanComplete);
    window.addEventListener('refreshDashboard', handleRefresh);
    return () => {
      window.removeEventListener('scanComplete', handleScanComplete);
      window.removeEventListener('refreshDashboard', handleRefresh);
    };
  }, [fetchResults]);

  const scannedTargets: ScannedTarget[] = useMemo(() => {
    const targets = new Map<string, ScannedTarget>();
    vulnerabilities.forEach(vuln => {
      if (!targets.has(vuln.target)) {
        targets.set(vuln.target, {
          name: vuln.target,
          totalVulnerabilities: 0,
          severityCounts: { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0, Unknown: 0 },
          highestSeverity: 'Unknown',
          lastSeen: '1970-01-01T00:00:00.000Z',
        });
      }
      const targetData = targets.get(vuln.target)!;
      targetData.totalVulnerabilities++;
      targetData.severityCounts[vuln.severity]++;
      if (severityOrder[vuln.severity] > severityOrder[targetData.highestSeverity]) {
        targetData.highestSeverity = vuln.severity;
      }
       if (new Date(vuln.lastSeen) > new Date(targetData.lastSeen)) {
        targetData.lastSeen = vuln.lastSeen;
      }
    });
    return Array.from(targets.values()).sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
  }, [vulnerabilities]);

  const globalSeverityCounts = useMemo(() => {
    return vulnerabilities.reduce((acc, v) => {
        acc[v.severity] = (acc[v.severity] || 0) + 1;
        return acc;
    }, {} as Record<Vulnerability['severity'], number>);
  }, [vulnerabilities])

  const totalHosts = useMemo(() => new Set(vulnerabilities.map(v => v.host)).size, [vulnerabilities]);

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  };

  const StatCard = ({ title, value, icon: Icon, description, isLoading }: { title: string, value: React.ReactNode, icon: React.ElementType, description: string, isLoading: boolean }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-3 w-full mt-2" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in-50">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Vulnerabilities"
          value={vulnerabilities.length}
          icon={Bug}
          description="Total unique issues found across all targets"
          isLoading={loading}
        />
        <StatCard
          title="Scanned Targets"
          value={scannedTargets.length}
          icon={Server}
          description="Unique root domains scanned"
          isLoading={loading}
        />
        <StatCard
          title="Critical & High"
          value={
            <div className="flex items-center gap-2">
                <div className={cn('flex items-center', severityColorClassMap['Critical']?.replace('bg-', 'text-').replace('/80',''))}><ShieldX className="mr-1.5 h-5 w-5"/> {globalSeverityCounts.Critical || 0}</div>
                <div className="text-muted-foreground text-2xl font-light">/</div>
                <div className={cn('flex items-center', severityColorClassMap['High']?.replace('bg-', 'text-').replace('/80',''))}><ShieldAlert className="mr-1.5 h-5 w-5"/> {globalSeverityCounts.High || 0}</div>
            </div>
          }
          icon={ShieldX}
          description="Critical / High priority issues"
          isLoading={loading}
        />
        <StatCard
          title="Medium & Low"
          value={
            <div className="flex items-center gap-2">
                <div className={cn('flex items-center', severityColorClassMap['Medium']?.replace('bg-', 'text-').replace('/80',''))}><AlertTriangle className="mr-1.5 h-5 w-5"/> {globalSeverityCounts.Medium || 0}</div>
                <div className="text-muted-foreground text-2xl font-light">/</div>
                <div className={cn('flex items-center', severityColorClassMap['Low']?.replace('bg-', 'text-').replace('/80',''))}><ShieldCheck className="mr-1.5 h-5 w-5"/> {globalSeverityCounts.Low || 0}</div>
            </div>
          }
          icon={ShieldAlert}
          description="Medium / Low priority issues"
          isLoading={loading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scanned Targets</CardTitle>
          <CardDescription>
            A list of all scanned targets. Click a target to see detailed results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Target</TableHead>
                <TableHead>Total Vulnerabilities</TableHead>
                <TableHead>Highest Severity</TableHead>
                <TableHead className="hidden md:table-cell">Last Scanned</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[100px] rounded-full" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[120px]" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : scannedTargets.length > 0 ? (
                scannedTargets.map((target) => {
                  const HighestSeverityIcon = severityIcons[target.highestSeverity] || Shield
                  return (
                    <TableRow key={target.name}>
                      <TableCell className="font-medium">
                        <Link href={`/targets/${target.name}`} className="hover:underline text-primary">
                          {target.name}
                        </Link>
                      </TableCell>
                      <TableCell>{target.totalVulnerabilities}</TableCell>
                      <TableCell>
                        <SeverityBadge severity={target.highestSeverity} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(target.lastSeen)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon">
                            <Link href={`/targets/${target.name}`}>
                                <ArrowRight className="h-4 w-4" />
                                <span className="sr-only">View Details</span>
                            </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                )
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No targets scanned yet. Run a scan to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
