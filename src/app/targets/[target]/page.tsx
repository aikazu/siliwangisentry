
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import type { Vulnerability } from '@/types/scan';
import { AlertTriangle, Bug, ShieldAlert, ShieldCheck, ShieldX, Server } from 'lucide-react';
import { SeverityBadge } from '@/components/severity-badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const severityIcons: Record<Vulnerability['severity'], React.ElementType> = {
  Critical: ShieldX,
  High: ShieldAlert,
  Medium: AlertTriangle,
  Low: ShieldCheck,
  Info: Bug,
  Unknown: Bug,
}


export default function TargetDetailPage({ params }: { params: { target: string } }) {
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const target = decodeURIComponent(params.target);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/results');
      if (!response.ok) throw new Error('Failed to fetch results');
      const data = await response.json();
      const filteredData = data.filter((v: Vulnerability) => v.target === target);
      if (filteredData.length === 0) {
        // This could mean the target is invalid or has no vulns.
        // We can check if the directory exists for a better 404.
        // For now, we'll just show an empty state.
      }
      setVulnerabilities(filteredData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load scan results.",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [toast, target]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const { hosts, severityCounts } = useMemo(() => {
    const hostsMap = new Map<string, Vulnerability[]>();
    const counts: Record<Vulnerability['severity'], number> = { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0, Unknown: 0 };
    
    vulnerabilities.forEach(vuln => {
      if (!hostsMap.has(vuln.host)) {
        hostsMap.set(vuln.host, []);
      }
      hostsMap.get(vuln.host)!.push(vuln);
      counts[vuln.severity]++;
    });

    const sortedHosts = new Map([...hostsMap.entries()].sort((a, b) => a[0].localeCompare(b[0])));
    return { hosts: sortedHosts, severityCounts: counts };
  }, [vulnerabilities]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy, HH:mm");
    } catch (e) {
      return "Invalid date";
    }
  };

  const StatCard = ({ title, value, icon: Icon }: { title: string, value: React.ReactNode, icon: React.ElementType }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
          <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className='h-24'/>)}
            </div>
            <Skeleton className="h-96 w-full" />
        </div>
    )
  }
  
  if (!loading && vulnerabilities.length === 0) {
      return (
          <div className="text-center py-16">
              <h1 className="text-2xl font-bold">Target Not Found or No Vulnerabilities</h1>
              <p className="text-muted-foreground mt-2">No results found for <span className="font-mono text-primary">{target}</span>.</p>
              <Button asChild variant="outline" className="mt-6">
                  <Link href="/"><ArrowLeft className='mr-2'/> Back to Dashboard</Link>
              </Button>
          </div>
      )
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in-50">
        <div>
            <Button asChild variant="outline" size="sm" className='mb-4'>
                <Link href="/"><ArrowLeft className='mr-2'/> Back to Dashboard</Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Scan Results</h1>
            <p className="text-muted-foreground font-mono">{target}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Affected Hosts" value={hosts.size} icon={Server} />
            <StatCard title="Critical" value={severityCounts.Critical} icon={severityIcons.Critical} />
            <StatCard title="High" value={severityCounts.High} icon={severityIcons.High} />
            <StatCard title="Medium" value={severityCounts.Medium} icon={severityIcons.Medium} />
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Affected Hosts</CardTitle>
          <CardDescription>
            List of hosts with identified vulnerabilities for the target "{target}".
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full">
                {Array.from(hosts.entries()).map(([host, vulns]) => (
                    <AccordionItem value={host} key={host}>
                        <AccordionTrigger className='font-mono hover:no-underline'>
                            <div className='flex items-center gap-4'>
                                <span>{host}</span>
                                <div className="flex items-center gap-1">
                                    {Object.entries(vulns.reduce((acc, v) => { acc[v.severity] = (acc[v.severity] || 0) + 1; return acc; }, {} as Record<string, number>))
                                        .sort(([a], [b]) => severityIcons[b as keyof typeof severityIcons] - severityIcons[a as keyof typeof severityIcons])
                                        .map(([severity, count]) => {
                                            const Icon = severityIcons[severity as Vulnerability['severity']]
                                            return <SeverityBadge key={severity} severity={severity as Vulnerability['severity']} count={count} />
                                        })
                                    }
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Vulnerability</TableHead>
                                    <TableHead>Severity</TableHead>
                                    <TableHead className='hidden sm:table-cell'>Port</TableHead>
                                    <TableHead className="hidden md:table-cell">Last Seen</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vulns.map(v => (
                                    <TableRow key={v.id}>
                                        <TableCell className="max-w-[300px] truncate">{v.vulnerability}</TableCell>
                                        <TableCell>
                                            <SeverityBadge severity={v.severity}/>
                                        </TableCell>
                                        <TableCell className='hidden sm:table-cell'>{v.port}</TableCell>
                                        <TableCell className="hidden md:table-cell">{formatDate(v.lastSeen)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                           </Table>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
