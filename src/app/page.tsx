
"use client";

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Header } from '@/components/header';
import type { Bucket, Region } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RequestAccessDialog } from '@/components/request-access-dialog';
import { Eye, Edit, Timer, ChevronRight, Search, CheckCircle } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { formatBytes } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiRequestAccessDialog } from '@/components/multi-request-access-dialog';


export default function DashboardPage() {
  const [selectedRegion, setSelectedRegion] = React.useState('all');
  const [regions, setRegions] = React.useState<Region[]>([]);
  const [buckets, setBuckets] = React.useState<Bucket[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedBuckets, setSelectedBuckets] = React.useState<Bucket[]>([]);

  const regionsById = React.useMemo(() => {
    return regions.reduce((acc, region) => {
        acc[region.id] = region.name;
        return acc;
    }, {} as Record<string, string>);
  }, [regions]);

  const fetchBuckets = React.useCallback(() => {
    setIsLoading(true);
    setSelectedBuckets([]); // Reset selection on fetch
    const regionQuery = selectedRegion === 'all' ? '' : `?region=${selectedRegion}`;
    fetch(`/api/buckets${regionQuery}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Failed to parse error response' }));
          throw new Error(errorData.error || 'Failed to fetch buckets');
        }
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) {
            console.error("API response for buckets is not an array:", data);
            throw new Error('Invalid data format for buckets.');
        }
        setBuckets(data);
      })
      .catch((err) => {
        console.error("Failed to fetch buckets", err);
        setBuckets([]); // Ensure buckets is an array to prevent render errors
        toast({
          title: 'Error Fetching Buckets',
          description: err instanceof Error ? err.message : 'An unknown error occurred.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedRegion]);


  React.useEffect(() => {
    // Fetch regions
    fetch('/api/regions')
      .then(res => res.json())
      .then(setRegions)
      .catch(err => console.error("Failed to fetch regions", err));
  }, []);

  React.useEffect(() => {
    fetchBuckets();
  }, [fetchBuckets]);

  const filteredBuckets = React.useMemo(() => {
    if (!searchQuery) return buckets;
    return buckets.filter(bucket =>
      bucket.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [buckets, searchQuery]);
  
  const readOnlyBuckets = React.useMemo(() => filteredBuckets.filter(b => b.access === 'read-only'), [filteredBuckets]);

  const handleSelectBucket = (bucket: Bucket, checked: boolean) => {
    setSelectedBuckets(prev => 
        checked ? [...prev, bucket] : prev.filter(b => b.name !== bucket.name)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedBuckets(checked ? readOnlyBuckets : []);
  };
  
  const isAllSelected = readOnlyBuckets.length > 0 && selectedBuckets.length === readOnlyBuckets.length;
  const isIndeterminate = selectedBuckets.length > 0 && selectedBuckets.length < readOnlyBuckets.length;

  const getAccessInfo = (bucket: Bucket) => {
    switch (bucket.access) {
      case 'read-write':
        return {
          icon: <Edit className="w-4 h-4 text-green-500" />,
          label: 'Read / Write',
          badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        };
      case 'read-only':
      default:
        return {
          icon: <Eye className="w-4 h-4 text-blue-500" />,
          label: 'Read-Only',
          badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        };
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <Header title="S3 Buckets Dashboard" />
      <div className="p-4 md:p-6 flex-1 overflow-y-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h2 className="text-2xl font-bold tracking-tight">
            Available Buckets {!isLoading && `(${filteredBuckets.length})`}
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search buckets..."
                className="pl-9 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-72">
              <Select onValueChange={setSelectedRegion} defaultValue="all">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name} ({region.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {selectedBuckets.length > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>{selectedBuckets.length} bucket(s) selected</span>
                </div>
                <MultiRequestAccessDialog buckets={selectedBuckets} onAccessRequest={fetchBuckets}>
                    <Button>Request Write Access</Button>
                </MultiRequestAccessDialog>
            </div>
        )}

        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">
                            {readOnlyBuckets.length > 0 && (
                                <Checkbox 
                                    checked={isAllSelected}
                                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                    aria-label="Select all read-only buckets"
                                    data-state={isIndeterminate ? 'indeterminate' : isAllSelected ? 'checked' : 'unchecked'}
                                />
                            )}
                        </TableHead>
                        <TableHead>Bucket Name</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Bucket Size</TableHead>
                        <TableHead>Access Level</TableHead>
                        <TableHead>Expires In</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell>
                            </TableRow>
                        ))
                    ) : filteredBuckets.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">No buckets found matching the configured tag.</TableCell>
                        </TableRow>
                    ) : (
                        filteredBuckets.map((bucket) => {
                            const accessInfo = getAccessInfo(bucket);
                            const regionName = bucket.region ? regionsById[bucket.region] || bucket.region : 'Unknown';
                            const isReadOnly = bucket.access === 'read-only';

                            return (
                                <TableRow key={bucket.name} data-state={selectedBuckets.some(b => b.name === bucket.name) ? "selected" : undefined}>
                                    <TableCell>
                                        {isReadOnly && (
                                            <Checkbox
                                                checked={selectedBuckets.some(b => b.name === bucket.name)}
                                                onCheckedChange={(checked) => handleSelectBucket(bucket, !!checked)}
                                                aria-label={`Select bucket ${bucket.name}`}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">{bucket.name}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{regionName}</div>
                                        {bucket.region && regionName !== bucket.region && <div className="text-sm text-muted-foreground">{bucket.region}</div>}
                                    </TableCell>
                                    <TableCell>{formatBytes(bucket.size)}</TableCell>
                                    <TableCell>
                                        <Badge className={accessInfo.badgeClass}>
                                            <div className="flex items-center gap-2">
                                                {accessInfo.icon}
                                                <span>{accessInfo.label}</span>
                                            </div>
                                            {bucket.access === 'read-write' && bucket.tempAccessExpiresAt && (
                                                <Timer className="w-4 h-4 ml-2 text-orange-500" />
                                            )}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {bucket.access === 'read-write' && bucket.tempAccessExpiresAt ? (
                                            formatDistanceToNow(parseISO(bucket.tempAccessExpiresAt), { addSuffix: true })
                                        ) : (
                                            '--'
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/buckets/${bucket.name}`}>
                                                    Browse
                                                    <ChevronRight className="w-4 h-4 ml-2" />
                                                </Link>
                                            </Button>
                                            {isReadOnly && (
                                                <RequestAccessDialog bucket={bucket} onAccessRequest={fetchBuckets}>
                                                    <Button variant="default" size="sm">
                                                        Request Write
                                                    </Button>
                                                </RequestAccessDialog>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    )}
                </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}
