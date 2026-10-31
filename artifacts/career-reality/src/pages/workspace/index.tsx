import { useEffect, useState } from 'react';
import { Redirect } from 'wouter';
import { 
  BarChart3, Building2, TrendingDown, BrainCircuit, 
  Plus, Trash2, ArrowRight, Loader2, AlertCircle
} from 'lucide-react';
import { AppNav } from '@/components/shared/app-nav';
import { PublicFooter } from '@/components/shared/public-shell';
import { 
  useGetWorkspaceSummary, useListSavedDecisions, useListWatchlist, 
  useCreateSavedDecision, useDeleteSavedDecision, useCreateWatchlistItem, 
  useDeleteWatchlistItem, getGetWorkspaceSummaryQueryKey, getListSavedDecisionsQueryKey, getListWatchlistQueryKey,
  type SavedDecisionInputKind
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { trackEvent } from '@/lib/analytics';
import { useAppAuth } from '@/lib/app-auth';
import { useSeo } from '@/lib/seo';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const decisionIcons = {
  salary: <BarChart3 size={16} className="text-[#83c9b4]" />,
  company: <Building2 size={16} className="text-[#e88c77]" />,
  risk: <TrendingDown size={16} className="text-[#e5b755]" />,
  ai: <BrainCircuit size={16} className="text-[#b8c7d0]" />
};

export default function Workspace() {
  const { isLoaded, userId } = useAppAuth();
  useSeo({
    title: 'Private workspace | CareerReality',
    description: 'Your private CareerReality saved decisions and company watchlist.',
    path: '/workspace',
    noIndex: true,
  });

  useEffect(() => {
    trackEvent('workspace_opened', { route: '/workspace' });
  }, []);
  
  if (!isLoaded) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!userId) return <Redirect to="/sign-in" />;

  return (
    <div className="grain min-h-[100dvh] flex flex-col bg-muted/20">
      <AppNav />
      <main className="flex-1 w-full max-w-[1240px] mx-auto px-5 sm:px-8 py-10 sm:py-16">
        <div className="relative mb-10 overflow-hidden rounded-[22px] border border-border bg-card px-6 py-7 shadow-[0_14px_35px_hsl(var(--foreground)/.05)] sm:px-9 sm:py-9">
          <div className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-primary/[.08] blur-3xl" />
          <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-data text-[10px] uppercase tracking-[.2em] text-primary">Private Area / your signal archive</span>
            <span className="rounded-full border border-primary/20 bg-primary/[.06] px-3 py-1.5 font-data text-[9px] uppercase tracking-[.12em] text-primary">Private by default</span>
          </div>
          <h1 className="mt-5 font-display text-5xl tracking-[-.04em] sm:text-6xl">Your Desk</h1>
          <p className="mt-3 max-w-[500px] text-sm leading-[1.7] text-muted-foreground">
            Your saved intelligence, active watchlists, and considered decisions. Everything here is private to you.
          </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-8 bg-card border border-border">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="decisions" data-testid="tab-decisions">Saved Decisions</TabsTrigger>
            <TabsTrigger value="watchlist" data-testid="tab-watchlist">Watchlist</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="animate-enter">
            <WorkspaceOverview />
          </TabsContent>
          <TabsContent value="decisions" className="animate-enter">
            <DecisionsManager />
          </TabsContent>
          <TabsContent value="watchlist" className="animate-enter">
            <WatchlistManager />
          </TabsContent>
        </Tabs>
      </main>
      <PublicFooter />
    </div>
  );
}

function WorkspaceOverview() {
  const { data: summary, isLoading, isError, refetch } = useGetWorkspaceSummary();

  if (isLoading) return <div className="grid gap-6 sm:grid-cols-2"><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-40 rounded-2xl" /></div>;
  if (isError || !summary) return (
    <div className="p-6 bg-destructive/10 text-destructive rounded-xl flex flex-col items-start gap-3">
      <div className="flex items-center gap-2"><AlertCircle size={16}/> Could not load summary.</div>
      <Button variant="outline" size="sm" onClick={() => refetch()} className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground">Retry</Button>
    </div>
  );

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Card className="surface-lift rounded-[20px] shadow-sm border-border bg-card overflow-hidden relative">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Building2 size={80} /></div>
        <CardHeader className="pb-3 relative">
          <CardDescription className="font-data text-[10px] uppercase tracking-wider text-muted-foreground">Companies Tracked</CardDescription>
          <CardTitle className="text-5xl font-display font-normal">{summary.watchlistCount}</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          {summary.latestWatchlistItem ? (
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Latest addition</p>
              <p className="font-semibold text-sm">{summary.latestWatchlistItem.company}</p>
              <p className="text-xs text-muted-foreground truncate">{summary.latestWatchlistItem.signal}</p>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">No companies watched yet.</div>
          )}
        </CardContent>
      </Card>

      <Card className="surface-lift rounded-[20px] shadow-sm border-border bg-card overflow-hidden relative">
        <div className="absolute top-0 right-0 p-6 opacity-10"><BarChart3 size={80} /></div>
        <CardHeader className="pb-3 relative">
          <CardDescription className="font-data text-[10px] uppercase tracking-wider text-muted-foreground">Saved Decisions</CardDescription>
          <CardTitle className="text-5xl font-display font-normal">{summary.savedDecisionCount}</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          {summary.latestDecision ? (
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Latest decision</p>
              <p className="font-semibold text-sm flex items-center gap-2">
                {decisionIcons[summary.latestDecision.kind]} {summary.latestDecision.title}
              </p>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">No decisions saved yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DecisionsManager() {
  const { data: decisions, isLoading, isError, refetch } = useListSavedDecisions();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteDecision = useDeleteSavedDecision();

  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [kind, setKind] = useState<SavedDecisionInputKind>('salary');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [signal, setSignal] = useState('');
  
  const createDecision = useCreateSavedDecision();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createDecision.mutate({ data: { kind, title, summary, signal } }, {
      onSuccess: () => {
        toast({ title: 'Decision saved', description: 'Your intelligence has been added.' });
        trackEvent('workspace_decision_created', { location: 'workspace' });
        setOpen(false);
        setTitle('');
        setSummary('');
        setSignal('');
        queryClient.invalidateQueries({ queryKey: getListSavedDecisionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetWorkspaceSummaryQueryKey() });
      },
      onError: () => toast({ variant: 'destructive', title: 'Failed to save', description: 'Check your inputs and try again.' })
    });
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    deleteDecision.mutate({ id }, {
      onSuccess: () => {
        toast({ title: 'Deleted', description: 'Decision removed from workspace.' });
        queryClient.invalidateQueries({ queryKey: getListSavedDecisionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetWorkspaceSummaryQueryKey() });
      },
      onError: () => toast({ variant: 'destructive', title: 'Failed to delete', description: 'Please try again.' })
    });
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-24 w-full rounded-xl" /><Skeleton className="h-24 w-full rounded-xl" /></div>;
  if (isError) return (
    <div className="p-6 bg-destructive/10 text-destructive rounded-xl flex flex-col items-start gap-3">
      <div className="flex items-center gap-2"><AlertCircle size={16}/> Could not load decisions.</div>
      <Button variant="outline" size="sm" onClick={() => refetch()} className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground">Retry</Button>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display">Saved Decisions</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full" data-testid="button-new-decision">
              <Plus size={14} className="mr-1" /> Record Decision
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Record a decision</DialogTitle>
                <DialogDescription>Save a career signal to reference later.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={kind} onValueChange={(val) => setKind(val as SavedDecisionInputKind)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salary">Salary reality</SelectItem>
                      <SelectItem value="company">Company stability</SelectItem>
                      <SelectItem value="risk">Resignation risk</SelectItem>
                      <SelectItem value="ai">AI exposure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Title</Label>
                  <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Acme Corp Offer" />
                </div>
                <div className="grid gap-2">
                  <Label>Core Signal</Label>
                  <Input required value={signal} onChange={e => setSignal(e.target.value)} placeholder="e.g. +14% above market, strong pipeline" />
                </div>
                <div className="grid gap-2">
                  <Label>Your Note</Label>
                  <Textarea required value={summary} onChange={e => setSummary(e.target.value)} placeholder="What does this mean for your next move?" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createDecision.isPending}>
                  {createDecision.isPending ? <Loader2 className="animate-spin mr-2" size={14}/> : null}
                  Save decision
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!decisions?.length ? (
        <div className="border border-dashed border-border rounded-2xl p-12 text-center bg-card/50">
          <p className="text-muted-foreground text-sm">No decisions recorded yet. Start building your intelligence desk.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {decisions.map(d => (
            <Card key={d.id} className="surface-lift relative group overflow-hidden border-border/80">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
              <div className="p-5 flex items-start gap-4">
                <div className="mt-1 p-2 rounded-lg bg-muted">{decisionIcons[d.kind]}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-data text-[9px] uppercase tracking-wider text-muted-foreground">{d.kind}</p>
                      <h3 className="font-semibold text-lg leading-tight mt-1">{d.title}</h3>
                    </div>
                    <Button variant="ghost" size="icon" aria-label={`Delete saved decision ${d.title}`} title="Delete saved decision" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100" onClick={() => handleDelete(d.id)} data-testid={`button-delete-decision-${d.id}`}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="bg-background rounded-md p-3 border border-border/50">
                      <p className="text-[10px] font-bold text-muted-foreground mb-1">THE SIGNAL</p>
                      <p className="text-sm">{d.signal}</p>
                    </div>
                    <div className="bg-background rounded-md p-3 border border-border/50">
                      <p className="text-[10px] font-bold text-muted-foreground mb-1">SUMMARY</p>
                      <p className="text-sm text-muted-foreground">{d.summary}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(isOpen) => { if (!isOpen) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this saved decision?</AlertDialogTitle>
            <AlertDialogDescription>This removes the decision from your private workspace and cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete decision</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function WatchlistManager() {
  const { data: watchlist, isLoading, isError, refetch } = useListWatchlist();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteItem = useDeleteWatchlistItem();
  const createItem = useCreateWatchlistItem();

  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [company, setCompany] = useState('');
  const [note, setNote] = useState('');
  const [signal, setSignal] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createItem.mutate({ data: { company, note, signal } }, {
      onSuccess: () => {
        toast({ title: 'Added to watchlist', description: `${company} is now tracked.` });
        trackEvent('watchlist_item_created', { location: 'workspace' });
        setOpen(false);
        setCompany('');
        setNote('');
        setSignal('');
        queryClient.invalidateQueries({ queryKey: getListWatchlistQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetWorkspaceSummaryQueryKey() });
      },
      onError: () => toast({ variant: 'destructive', title: 'Failed to add', description: 'Check inputs and try again.' })
    });
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    deleteItem.mutate({ id }, {
      onSuccess: () => {
        toast({ title: 'Removed', description: 'Company removed from watchlist.' });
        queryClient.invalidateQueries({ queryKey: getListWatchlistQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetWorkspaceSummaryQueryKey() });
      },
      onError: () => toast({ variant: 'destructive', title: 'Failed to delete', description: 'Please try again.' })
    });
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-16 w-full rounded-xl" /><Skeleton className="h-16 w-full rounded-xl" /></div>;
  if (isError) return (
    <div className="p-6 bg-destructive/10 text-destructive rounded-xl flex flex-col items-start gap-3">
      <div className="flex items-center gap-2"><AlertCircle size={16}/> Could not load watchlist.</div>
      <Button variant="outline" size="sm" onClick={() => refetch()} className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground">Retry</Button>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display">Company Watchlist</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full" data-testid="button-new-watchlist">
              <Plus size={14} className="mr-1" /> Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Watch a company</DialogTitle>
                <DialogDescription>Track stability and momentum signals over time.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Company Name</Label>
                  <Input required value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Nexus" />
                </div>
                <div className="grid gap-2">
                  <Label>Primary Signal</Label>
                  <Input required value={signal} onChange={e => setSignal(e.target.value)} placeholder="e.g. Hiring slowed, key leadership left" />
                </div>
                <div className="grid gap-2">
                  <Label>Private Note</Label>
                  <Textarea required value={note} onChange={e => setNote(e.target.value)} placeholder="Why are you watching them?" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createItem.isPending}>
                  {createItem.isPending ? <Loader2 className="animate-spin mr-2" size={14}/> : null}
                  Add to watchlist
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!watchlist?.length ? (
        <div className="border border-dashed border-border rounded-2xl p-12 text-center bg-card/50">
          <p className="text-muted-foreground text-sm">No companies tracked yet. Add one to monitor signals.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {watchlist.map(item => (
            <Card key={item.id} className="surface-lift group relative border-border/80 hover:border-primary/50">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-base">{item.company}</h3>
                  <Button variant="ghost" size="icon" aria-label={`Remove ${item.company} from watchlist`} title="Remove from watchlist" className="h-7 w-7 -mt-1 -mr-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100" onClick={() => handleDelete(item.id)} data-testid={`button-delete-watchlist-${item.id}`}>
                    <Trash2 size={13} />
                  </Button>
                </div>
                <div className="mt-3 text-sm">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle size={14} className="mt-0.5 text-primary shrink-0" />
                    <span className="text-foreground">{item.signal}</span>
                  </div>
                  <div className="pl-5 text-xs text-muted-foreground italic border-l-2 border-border/50 ml-1">
                    "{item.note}"
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(isOpen) => { if (!isOpen) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this company from your watchlist?</AlertDialogTitle>
            <AlertDialogDescription>Your saved note and signal for this company will be removed from the private workspace.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep watching</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Remove company</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
