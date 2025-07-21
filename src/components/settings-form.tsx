
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { debounce } from 'lodash';
import { Rabbit, Shield, Zap, Bug, Key, DoorOpen, Fingerprint, FileSearch, Settings2, Subtitles, Bot, Dna, Info, SlidersHorizontal, Package, FilterX } from 'lucide-react';
import { cn } from '@/lib/utils';


const settingsSchema = z.object({
  flags: z.object({
    rateLimit: z.coerce.number().min(0).default(150),
    retries: z.coerce.number().int().min(0).default(1),
    timeout: z.coerce.number().int().min(5).default(10),
    concurrency: z.coerce.number().int().min(1).default(25),
    bulkSize: z.coerce.number().int().min(1).default(25),
    headless: z.boolean().default(false),
    scanStrategy: z.enum(['auto', 'host-spray', 'template-spray']).default('auto'),
    excludeInfo: z.boolean().default(false),
  }),
  templates: z.array(z.object({
    id: z.string(),
    name: z.string(),
    path: z.string(),
    description: z.string(),
    enabled: z.boolean(),
  })),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const defaultTemplates: { name: string; path: string; description: string, id: string, icon: React.ElementType }[] = [
    { id: '1', name: 'CVEs', path: 'cves', description: 'Recent and critical CVEs.', icon: Bug },
    { id: '2', name: 'Default Logins', path: 'default-logins', description: 'Test for default credentials.', icon: Key },
    { id: '3', name: 'Exposed Panels', path: 'exposed-panels', description: 'Find exposed admin panels.', icon: DoorOpen },
    { id: '4', name: 'Exposed Secrets', path: 'exposures', description: 'Look for exposed secrets and tokens.', icon: Fingerprint },
    { id: '5', name: 'File Disclosures', path: 'file', description: 'Identify sensitive file disclosures.', icon: FileSearch },
    { id: '6', name: 'Misconfigurations', path: 'misconfiguration', description: 'Common security misconfigurations.', icon: Settings2 },
    { id: '7', name: 'Takeovers', path: 'takeovers', description: 'Check for subdomain takeover vulnerabilities.', icon: Subtitles },
    { id: '8', name: 'Vulnerabilities', path: 'vulnerabilities', description: 'Generic web vulnerabilities.', icon: Shield },
    { id: '9', name: 'Technologies', path: 'technologies', description: 'Detect web technologies in use.', icon: Bot },
    { id: '10', name: 'Headless', path: 'headless', description: 'Templates requiring headless browser.', icon: Dna },
    { id: '11', name: 'Workflows', path: 'workflows', description: 'Multi-step vulnerability checks.', icon: Zap },
    { id: '12', name: 'DNS', path: 'dns', description: 'Check for DNS misconfigurations.', icon: Rabbit },
];

const presets: Record<string, Partial<SettingsFormValues>> = {
  fast: {
    flags: {
      rateLimit: 500,
      retries: 1,
      timeout: 8,
      concurrency: 50,
      bulkSize: 50,
      headless: false,
      scanStrategy: 'host-spray',
      excludeInfo: true,
    },
    templates: defaultTemplates.map(t => ({...t, enabled: ['CVEs', 'Exposed Panels', 'Misconfigurations'].includes(t.name)})),
  },
  comprehensive: {
    flags: {
      rateLimit: 150,
      retries: 2,
      timeout: 15,
      concurrency: 25,
      bulkSize: 25,
      headless: true,
      scanStrategy: 'auto',
      excludeInfo: false,
    },
    templates: defaultTemplates.map(t => ({...t, enabled: !['Technologies', 'DNS'].includes(t.name)})),
  },
  stealthy: {
    flags: {
      rateLimit: 20,
      retries: 3,
      timeout: 20,
      concurrency: 5,
      bulkSize: 5,
      headless: false,
      scanStrategy: 'template-spray',
      excludeInfo: false,
    },
    templates: defaultTemplates.map(t => ({...t, enabled: ['CVEs', 'Exposed Secrets', 'Takeovers', 'Vulnerabilities'].includes(t.name)})),
  }
};

export function SettingsForm() {
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "templates",
  });
  
  const debouncedSave = useMemo(
    () =>
      debounce(async (data: SettingsFormValues) => {
        try {
          const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!response.ok) throw new Error('Failed to save settings');
          toast({
            title: 'Settings Saved',
            description: 'Your scan settings have been updated.',
          });
          window.dispatchEvent(new CustomEvent('refreshDashboard'));
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to save settings automatically.',
          });
        }
      }, 1000), // 1 second debounce delay
    [toast]
  );
  
  useEffect(() => {
    const subscription = form.watch((value) => {
      const parsed = settingsSchema.safeParse(value);
      if (parsed.success) {
        debouncedSave(parsed.data);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, debouncedSave]);

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        const data = await response.json();
        form.reset(data.settings);
        replace(data.settings.templates);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load settings.',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [form, replace, toast]);
  
  const applyPreset = (presetName: string) => {
    const presetData = presets[presetName];
    if (presetData) {
      form.reset(presetData as SettingsFormValues);
      toast({
        title: `Preset Applied: ${presetName.charAt(0).toUpperCase() + presetName.slice(1)}`,
        description: 'Settings have been updated to the selected preset.',
      })
    }
  };

  if (loading) {
    return <SettingsSkeleton />;
  }

  return (
    <Form {...form}>
      <form className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><SlidersHorizontal className='w-5 h-5'/> Configuration Presets</CardTitle>
                <CardDescription>Select a preset to quickly configure your scan settings. Your changes are saved automatically.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => applyPreset('fast')}><Rabbit className="mr-2"/> Fast Scan</Button>
                <Button type="button" variant="outline" onClick={() => applyPreset('comprehensive')}><Shield className="mr-2"/> Comprehensive Scan</Button>
                <Button type="button" variant="outline" onClick={() => applyPreset('stealthy')}><Zap className="mr-2"/> Stealthy Scan</Button>
            </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-8">
                <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Settings2 className='w-5 h-5'/> Nuclei Flags</CardTitle>
                    <CardDescription>
                    Fine-tune the performance and behavior of the Nuclei scanner.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField control={form.control} name="flags.rateLimit" render={({ field }) => ( <FormItem><FormLabel>Rate Limit</FormLabel><FormControl><Input type="number" placeholder="150" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="flags.concurrency" render={({ field }) => ( <FormItem><FormLabel>Concurrency</FormLabel><FormControl><Input type="number" placeholder="25" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="flags.bulkSize" render={({ field }) => ( <FormItem><FormLabel>Bulk Size</FormLabel><FormControl><Input type="number" placeholder="25" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="flags.retries" render={({ field }) => ( <FormItem><FormLabel>Retries</FormLabel><FormControl><Input type="number" placeholder="1" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="flags.timeout" render={({ field }) => ( <FormItem><FormLabel>Timeout (seconds)</FormLabel><FormControl><Input type="number" placeholder="10" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="flags.scanStrategy" render={({ field }) => (<FormItem><FormLabel>Scan Strategy</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a strategy" /></SelectTrigger></FormControl><SelectContent><SelectItem value="auto">Auto</SelectItem><SelectItem value="host-spray">Host Spray</SelectItem><SelectItem value="template-spray">Template Spray</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="flags.headless" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3"><div className="space-y-0.5"><FormLabel>Enable Headless</FormLabel><FormDescription>Use headless browser for certain templates.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
                </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2'><FilterX className='w-5 h-5'/> Result Settings</CardTitle>
                        <CardDescription>
                            Configure how scan results are processed and displayed.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormField control={form.control} name="flags.excludeInfo" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3"><div className="space-y-0.5"><FormLabel>Exclude 'Info' Severity</FormLabel><FormDescription>Hide informational findings from results.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
                    </CardContent>
                </Card>
            </div>


            <Card>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'><Package className='w-5 h-5'/> Template Selection</CardTitle>
                <CardDescription>
                Choose which template categories to include in scans.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="space-y-3">
                {fields.map((field, index) => {
                    const templateInfo = defaultTemplates.find(t => t.id === field.id) || { icon: Shield };
                    const Icon = templateInfo.icon;
                    return (
                        <FormField
                            key={field.id}
                            control={form.control}
                            name={`templates.${index}.enabled`}
                            render={({ field: switchField }) => (
                            <FormItem 
                                className={cn(
                                    "flex flex-col justify-between rounded-lg border p-3 transition-colors",
                                    switchField.value && "bg-muted/50 border-primary/20"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div className='flex items-center gap-2'>
                                        <Icon className="w-5 h-5 text-muted-foreground" />
                                        <FormLabel className="font-normal">{form.getValues(`templates.${index}.name`)}</FormLabel>
                                    </div>
                                    <FormControl>
                                    <Switch
                                        checked={switchField.value}
                                        onCheckedChange={switchField.onChange}
                                    />
                                    </FormControl>
                                </div>
                                <FormDescription className="pt-2 text-xs">
                                    {form.getValues(`templates.${index}.description`)}
                                </FormDescription>
                            </FormItem>
                            )}
                        />
                    )
                })}
                </div>
            </CardContent>
            </Card>
        </div>
      </form>
    </Form>
  );
}

const SettingsSkeleton = () => (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="flex gap-2">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-32" />
            </CardContent>
        </Card>
        <div className="grid md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-6">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-1/6" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-3">
                     <div className="space-y-3">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="flex flex-col justify-between rounded-lg border p-3 h-24">
                               <div className="flex items-center justify-between">
                                    <Skeleton className="h-5 w-24" />
                                    <Skeleton className="h-6 w-11 rounded-full" />
                                </div>
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
);
