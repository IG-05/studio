
"use client";

import { ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import type { Bucket } from '@/lib/types';
import { Edit } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const ONE_YEAR_IN_MINUTES = 365 * 24 * 60;

const requestAccessSchema = z.object({
  reason: z.string().min(10, 'Please provide a reason of at least 10 characters.'),
  durationDays: z.coerce.number().int().min(0).max(365),
  durationHours: z.coerce.number().int().min(0).max(23),
  durationMinutes: z.coerce.number().int().min(0).max(59),
}).refine(
  (data) => (data.durationDays * 24 * 60) + (data.durationHours * 60) + data.durationMinutes >= 15, {
    message: "Total duration must be at least 15 minutes.",
    path: ["durationMinutes"], // Point error to the last field
  }
).refine(
  (data) => (data.durationDays * 24 * 60) + (data.durationHours * 60) + data.durationMinutes <= ONE_YEAR_IN_MINUTES, {
    message: "Total duration cannot exceed 1 year.",
    path: ["durationDays"], // Point error to the first field
  }
).refine(
    (data) => !(data.durationDays === 365 && (data.durationHours > 0 || data.durationMinutes > 0)), {
    message: "If days is 365, hours and minutes must be 0.",
    path: ["durationHours"],
});


type RequestAccessFormValues = z.infer<typeof requestAccessSchema>;

interface RequestAccessDialogProps {
  children: ReactNode;
  bucket: Bucket;
  onAccessRequest: () => void;
}

export function RequestAccessDialog({ children, bucket, onAccessRequest }: RequestAccessDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RequestAccessFormValues>({
    resolver: zodResolver(requestAccessSchema),
    defaultValues: {
      reason: '',
      durationDays: 0,
      durationHours: 8,
      durationMinutes: 0,
    },
  });

  const onSubmit = async (values: RequestAccessFormValues) => {
    setIsSubmitting(true);
    const durationInMinutes = (values.durationDays * 24 * 60) + (values.durationHours * 60) + values.durationMinutes;

    try {
      const response = await fetch('/api/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: values.reason,
          durationInMinutes: durationInMinutes,
          buckets: [bucket],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit request');
      }

      toast({
        title: 'Write Access Request Submitted',
        description: `Your request for write access to "${bucket.name}" has been sent for approval.`,
      });
      setOpen(false);
      onAccessRequest(); // Refresh the parent component's data
      form.reset();

    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: error.message || 'Could not submit your access request. Please try again.',
        variant: 'destructive',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" /> Request Write Access
          </DialogTitle>
          <DialogDescription>
            Request temporary write access to the bucket: <strong>{bucket.name}</strong>.
            You already have read-only access.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="space-y-2">
                <FormLabel>Duration of Write Access</FormLabel>
                <div className="grid grid-cols-3 items-start gap-4">
                    <FormField
                    control={form.control}
                    name="durationDays"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Days</FormLabel>
                        <FormControl>
                            <Input type="number" min="0" max="365" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="durationHours"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Hours</FormLabel>
                        <FormControl>
                            <Input type="number" min="0" max="23" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="durationMinutes"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Minutes</FormLabel>
                        <FormControl>
                            <Input type="number" min="0" max="59" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
            </div>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Write Access</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Need to upload new data for project X..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={!form.formState.isValid || isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Request
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
