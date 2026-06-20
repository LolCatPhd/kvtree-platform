'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { apiPath } from '@/lib/config';

const LeadMap = dynamic(() => import('@/components/LeadMap'), { ssr: false });

interface Lead {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  service: string | null;
  description: string | null;
  status: string;
  latitude: number | null;
  longitude: number | null;
  estimated_quote: string | number | null;
  assigned_worker_id: number | null;
  photos: string[];
  distance_km?: number | null;
  created_at: string;
}
interface Worker { id: number; name: string | null; email: string; role: string }
interface Crew { id: number; name: string; phone: string | null; default_daily_rate: string | number; active: boolean }
interface Stats {
  byStatus: { status: string; count: number }[];
  totals: {
    leads: number;
    quotes: number;
    jobs: number;
    accepted_value: string;
    paid_revenue: string;
    outstanding: string;
  };
}

// Per-stage colour accents for the pipeline. Class strings are written out in
// full so Tailwind can see and generate them.
const STATUS_STYLES: Record<string, { dot: string; bar: string; badge: string }> = {
  'Quote Requested': { dot: 'bg-slate-400', bar: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700' },
  'Site Visit Scheduled': { dot: 'bg-sky-500', bar: 'bg-sky-500', badge: 'bg-sky-100 text-sky-700' },
  'Quoted': { dot: 'bg-amber-500', bar: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' },
  'Booked': { dot: 'bg-indigo-500', bar: 'bg-indigo-500', badge: 'bg-indigo-100 text-indigo-700' },
  'In Progress': { dot: 'bg-blue-500', bar: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' },
  'Completed': { dot: 'bg-emerald-500', bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  'Invoiced': { dot: 'bg-forest-700', bar: 'bg-forest-700', badge: 'bg-forest-100 text-forest-800' },
};
const fallbackStyle = { dot: 'bg-forest-400', bar: 'bg-forest-400', badge: 'bg-forest-100 text-forest-700' };
const statusStyle = (s: string) => STATUS_STYLES[s] ?? fallbackStyle;

// Pipeline order, mirrors LEAD_STATUSES on the server. Used for stage-aware UI.
const PIPELINE = Object.keys(STATUS_STYLES);
const stageIdx = (s: string) => PIPELINE.indexOf(s);

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [statuses, setStatuses] = useState<string[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [crew, setCrew] = useState<Crew[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tab, setTab] = useState<'pipeline' | 'map' | 'billing' | 'crew' | 'campaigns'>('pipeline');
  const [selected, setSelected] = useState<Lead | null>(null);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const [meta, l, s] = await Promise.all([
      api<{ leadStatuses: string[] }>('/api/meta'),
      api<Lead[]>('/api/leads'),
      api<Stats>('/api/stats'),
    ]);
    setStatuses(meta.leadStatuses);
    setLeads(l);
    setStats(s);
    // Workers list is admin-only; ignore failure for workers.
    api<Worker[]>('/api/users?role=worker').then(setWorkers).catch(() => {});
    // Crew roster (job costing) — staff-visible.
    api<Crew[]>('/api/workers').then(setCrew).catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading && (!user || user.role === 'client')) router.replace(user ? '/portal' : '/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (user && user.role !== 'client') load().catch(console.error);
  }, [user, load]);

  const moveLead = async (lead: Lead, status: string) => {
    if (lead.status === status) return;

    // Pipeline guardrails — warn (or block) before an unusual transition.
    const from = statuses.indexOf(lead.status);
    const to = statuses.indexOf(status);
    const bookedIdx = statuses.indexOf('Booked');
    if (lead.status === 'Invoiced') {
      alert('This job is invoiced — that is final. Reverse the invoice before moving it back.');
      return;
    }
    let warn = '';
    if (to < from) {
      warn = `Move "${lead.name || 'this lead'}" backwards from ${lead.status} to ${status}?`;
      if (to < bookedIdx && from >= bookedIdx) {
        warn += '\n\nThis cancels the scheduled booking date and removes its Google Calendar event.';
      }
    } else if (to - from > 1) {
      warn = `This skips ${statuses.slice(from + 1, to).join(', ')}. Send "${lead.name || 'this lead'}" straight to ${status}?`;
    }
    if (warn && !window.confirm(warn)) return;

    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status } : l)));
    try {
      await api(`/api/leads/${lead.id}`, { method: 'PUT', body: { status } });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update');
      load();
    }
  };

  if (loading || !user || user.role === 'client') {
    return (
      <div className="grid min-h-[60vh] place-items-center text-forest-600">Loading…</div>
    );
  }

  const tabs: { key: typeof tab; label: string }[] = [
    { key: 'pipeline', label: 'Pipeline' },
    { key: 'map', label: 'Map' },
    { key: 'billing', label: 'Billing' },
    ...(user.role === 'admin'
      ? [{ key: 'crew' as const, label: 'Crew' }, { key: 'campaigns' as const, label: 'Campaigns' }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-sand-50 py-8">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-forest-900">Operations Dashboard</h1>
            <p className="text-sm text-forest-500">
              {user.role === 'admin' ? 'Administrator' : 'Field worker'} · {user.email}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 rounded-full bg-white p-1 ring-1 ring-forest-100">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    tab === t.key ? 'bg-forest-900 text-white' : 'text-forest-700 hover:bg-forest-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {user.role === 'admin' && (
              <button
                onClick={() => setShowAddWorker(true)}
                className="rounded-full border border-forest-200 bg-white px-4 py-2 text-sm font-semibold text-forest-800 transition hover:bg-forest-50"
              >
                + Worker
              </button>
            )}
          </div>
        </div>

        {stats && (
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatCard label="Leads" value={stats.totals.leads} />
            <StatCard label="Quotes" value={stats.totals.quotes} />
            <StatCard label="Jobs" value={stats.totals.jobs} />
            <StatCard
              label="Paid revenue"
              value={`R ${Number(stats.totals.paid_revenue || 0).toLocaleString('en-ZA')}`}
              accent
            />
            <StatCard
              label="Outstanding"
              value={`R ${Number(stats.totals.outstanding || 0).toLocaleString('en-ZA')}`}
            />
          </div>
        )}

        {tab === 'pipeline' ? (
          <div className="flex gap-3 overflow-x-auto pb-4 xl:overflow-x-visible">
            {statuses.map((status) => {
              const col = leads.filter((l) => l.status === status);
              const st = statusStyle(status);
              return (
                <div
                  key={status}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const id = Number(e.dataTransfer.getData('text/plain'));
                    const lead = leads.find((l) => l.id === id);
                    setDragId(null);
                    if (lead) moveLead(lead, status);
                  }}
                  className="flex w-[230px] flex-shrink-0 flex-col overflow-hidden rounded-xl bg-white ring-1 ring-forest-100 xl:w-auto xl:min-w-0 xl:flex-1"
                >
                  <div className={`h-1 ${st.bar}`} />
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <span className="flex items-center gap-2 text-sm font-semibold text-forest-800">
                      <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                      {status}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st.badge}`}>{col.length}</span>
                  </div>
                  <div className="flex-1 space-y-2 px-2 pb-2">
                    {col.length === 0 && (
                      <p className="px-1 py-6 text-center text-xs text-forest-300">No leads</p>
                    )}
                    {col.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(lead.id)); setDragId(lead.id); }}
                        onDragEnd={() => setDragId(null)}
                        onClick={() => setSelected(lead)}
                        className={`cursor-pointer rounded-lg border border-forest-100 bg-white p-3 shadow-sm transition hover:border-forest-300 hover:shadow-md ${
                          dragId === lead.id ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-forest-900">{lead.name || 'Unnamed'}</p>
                          {lead.estimated_quote != null && (
                            <span className="shrink-0 rounded bg-forest-50 px-1.5 py-0.5 text-[11px] font-semibold text-forest-700">
                              R {Number(lead.estimated_quote).toLocaleString('en-ZA')}
                            </span>
                          )}
                        </div>
                        {lead.service && <p className="mt-0.5 text-xs font-medium text-forest-500">{lead.service}</p>}
                        {lead.address && <p className="mt-1 truncate text-xs text-forest-400">{lead.address}</p>}
                        {lead.distance_km != null && (
                          <p className="mt-1 inline-flex items-center gap-1 text-xs text-forest-600">
                            <span className="h-1 w-1 rounded-full bg-forest-400" />
                            {lead.distance_km} km away
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : tab === 'map' ? (
          <div className="overflow-hidden rounded-2xl ring-1 ring-forest-100">
            <LeadMap leads={leads} />
          </div>
        ) : tab === 'billing' ? (
          <Billing />
        ) : tab === 'crew' ? (
          <CrewManager crew={crew} onChanged={load} />
        ) : (
          <Campaigns />
        )}
      </div>

      {selected && (
        <LeadPanel
          lead={selected}
          workers={workers}
          crew={crew}
          canAssign={user.role === 'admin'}
          onClose={() => setSelected(null)}
          onChanged={() => { load(); setSelected(null); }}
          onRefresh={load}
        />
      )}

      {showAddWorker && (
        <AddWorker onClose={() => setShowAddWorker(false)} onCreated={() => { load(); setShowAddWorker(false); }} />
      )}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-forest-200 bg-white px-3 py-2 text-sm text-forest-900 placeholder:text-forest-300 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/30 transition';

function AddWorker({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const up = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('/api/users', { method: 'POST', body: { ...form, role: 'worker' } });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950/40 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 font-display text-lg font-semibold text-forest-900">Add field worker</h2>
        {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="space-y-2">
          <input className={inputClass} placeholder="Name" value={form.name} onChange={(e) => up('name', e.target.value)} required />
          <input type="email" className={inputClass} placeholder="Email" value={form.email} onChange={(e) => up('email', e.target.value)} required />
          <input className={inputClass} placeholder="Phone" value={form.phone} onChange={(e) => up('phone', e.target.value)} />
          <input type="password" className={inputClass} placeholder="Temporary password" value={form.password} onChange={(e) => up('password', e.target.value)} required />
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-forest-200 py-2 text-sm font-semibold text-forest-700 hover:bg-forest-50">Cancel</button>
          <button type="submit" disabled={busy} className="flex-1 rounded-lg bg-forest-900 py-2 text-sm font-semibold text-white hover:bg-forest-800 disabled:opacity-60">
            {busy ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ring-1 ${accent ? 'bg-forest-900 ring-forest-900' : 'bg-white ring-forest-100'}`}>
      <p className={`text-xs ${accent ? 'text-forest-200' : 'text-forest-500'}`}>{label}</p>
      <p className={`mt-1 font-display text-xl font-semibold ${accent ? 'text-white' : 'text-forest-900'}`}>{value}</p>
    </div>
  );
}

// What the operator should usually do next at each pipeline stage. Drives the
// guidance banner and which actions get visually emphasised in the panel.
const STAGE_GUIDE: Record<string, string> = {
  'Quote Requested': 'Assign a worker for a site visit, or send a quote if scope is clear.',
  'Site Visit Scheduled': 'After the visit, create & send the quote.',
  'Quoted': 'Waiting on the client. Once accepted, schedule the job.',
  'Booked': 'Job is booked. Mark it In Progress when the crew starts on site.',
  'In Progress': 'Log crew days under Job costing as work happens. Raise the invoice when done.',
  'Completed': 'Work is done — raise the final invoice.',
  'Invoiced': 'Invoiced. This card is locked; manage payment under Billing.',
};

function LeadPanel({
  lead,
  workers,
  crew,
  canAssign,
  onClose,
  onChanged,
  onRefresh,
}: {
  lead: Lead;
  workers: Worker[];
  crew: Crew[];
  canAssign: boolean;
  onClose: () => void;
  onChanged: () => void;
  onRefresh: () => void;
}) {
  const [price, setPrice] = useState('');
  const [details, setDetails] = useState('');
  const [estimate, setEstimate] = useState(lead.estimated_quote ? String(lead.estimated_quote) : '');
  const [worker, setWorker] = useState(lead.assigned_worker_id ? String(lead.assigned_worker_id) : '');
  const [scheduledDate, setScheduledDate] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState(lead.estimated_quote ? String(lead.estimated_quote) : '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [lastQuote, setLastQuote] = useState<{ price: string | number | null; created_at: string } | null>(null);

  // Latest quote on this lead (DESC order from the API) — surfaced in the
  // re-quote area so you can see what was last sent before pricing again.
  useEffect(() => {
    api<{ price: string | number | null; created_at: string }[]>(`/api/quotes?leadId=${lead.id}`)
      .then((qs) => setLastQuote(qs[0] ?? null))
      .catch(() => setLastQuote(null));
  }, [lead.id]);

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg(ok);
      onChanged();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const bookJob = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const job = await api<{ calendar_link: string | null }>('/api/jobs', {
        method: 'POST',
        body: { leadId: lead.id, assignedWorkerId: worker ? Number(worker) : null, scheduledDate },
      });
      setMsg(job.calendar_link ? 'Job scheduled and added to Google Calendar.' : 'Job scheduled.');
      onChanged();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const locked = lead.status === 'Invoiced';
  // Sending a quote on an already-booked (or later) job supersedes the booking.
  const isRequote = stageIdx(lead.status) >= stageIdx('Booked') && !locked;

  const sendQuote = async () => {
    if (
      isRequote &&
      !window.confirm(
        `This lead is already at "${lead.status}". Sending a new quote will cancel the booking ` +
          `(date + calendar), reset the card to Quoted, and re-send the documents to the client. Continue?`
      )
    ) {
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const q = await api<{ requote?: boolean }>('/api/quotes', {
        method: 'POST',
        body: { leadId: lead.id, price: Number(price), details },
      });
      setMsg(
        q.requote
          ? 'New quote sent. Booking was reset and the card returned to Quoted.'
          : 'Quote generated, PDF created and sent to the client.'
      );
      onChanged();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const st = statusStyle(lead.status);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-forest-950/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-forest-900">{lead.name || 'Lead #' + lead.id}</h2>
            <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
              {lead.status}
            </span>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-forest-300 hover:text-forest-700">×</button>
        </div>

        <dl className="mb-4 space-y-1 text-sm">
          <Row k="Service" v={lead.service} />
          <Row k="Email" v={lead.email} />
          <Row k="Phone" v={lead.phone} />
          <Row k="Address" v={lead.address} />
          <Row k="Distance" v={lead.distance_km != null ? `${lead.distance_km} km` : '—'} />
        </dl>
        {lead.description && <p className="mb-4 rounded-lg bg-sand-50 p-3 text-sm text-forest-600">{lead.description}</p>}

        {Array.isArray(lead.photos) && lead.photos.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {lead.photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <a key={p} href={p} target="_blank" rel="noopener noreferrer">
                <img src={p} alt="site" className="h-20 w-20 rounded-lg border border-forest-100 object-cover" />
              </a>
            ))}
          </div>
        )}

        {STAGE_GUIDE[lead.status] && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-forest-100 bg-sand-50 px-3 py-2 text-xs text-forest-600">
            <span className="mt-0.5 font-semibold uppercase tracking-wide text-forest-400">Next</span>
            <span>{STAGE_GUIDE[lead.status]}</span>
          </div>
        )}

        {msg && <div className="mb-3 rounded-lg bg-forest-50 px-3 py-2 text-sm text-forest-800">{msg}</div>}

        {canAssign && (
          <Section title="Assign worker">
            <div className="flex gap-2">
              <select value={worker} onChange={(e) => setWorker(e.target.value)} className={`${inputClass} flex-1`}>
                <option value="">Unassigned</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>{w.name || w.email}</option>
                ))}
              </select>
              <button
                disabled={busy}
                onClick={() => run(() => api(`/api/leads/${lead.id}`, { method: 'PUT', body: { assignedWorkerId: worker ? Number(worker) : null, status: 'Site Visit Scheduled' } }).then(() => {}), 'Assigned')}
                className="rounded-lg bg-forest-900 px-4 text-sm font-semibold text-white hover:bg-forest-800"
              >
                Save
              </button>
            </div>
          </Section>
        )}

        <Section title="Preliminary estimate (optional)">
          <div className="flex gap-2">
            <input value={estimate} onChange={(e) => setEstimate(e.target.value)} placeholder="R amount" className={`${inputClass} flex-1`} />
            <button
              disabled={busy}
              onClick={() => run(() => api(`/api/leads/${lead.id}`, { method: 'PUT', body: { estimatedQuote: estimate ? Number(estimate) : null } }).then(() => {}), 'Estimate saved')}
              className="rounded-lg bg-forest-900 px-4 text-sm font-semibold text-white hover:bg-forest-800"
            >
              Save
            </button>
          </div>
        </Section>

        <Section title={isRequote ? 'Re-quote (supersedes booking)' : 'Create & send quote'}>
          {locked ? (
            <p className="rounded-lg bg-sand-50 px-3 py-2 text-xs text-forest-500">
              Invoiced — reverse the invoice in Billing before issuing a new quote.
            </p>
          ) : (
            <>
              {isRequote && (
                <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  This job is already {lead.status}. Sending a new quote cancels the booking and returns the card to Quoted.
                </p>
              )}
              {lastQuote && lastQuote.price != null && (
                <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-sand-50 px-3 py-2 text-xs text-forest-600">
                  <span>
                    Previous quote: <strong className="text-forest-900">{rand(lastQuote.price)}</strong>
                    <span className="text-forest-400"> · {shortDate(lastQuote.created_at)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPrice(String(lastQuote.price))}
                    className="shrink-0 rounded-full bg-forest-100 px-2.5 py-1 font-semibold text-forest-700 hover:bg-forest-200"
                  >
                    Use
                  </button>
                </div>
              )}
              <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Final price (R)" className={`${inputClass} mb-2`} />
              <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Quote details / scope of work" className={`${inputClass} mb-2`} rows={3} />
              <button
                disabled={busy || !price}
                onClick={sendQuote}
                className="w-full rounded-lg bg-forest-700 py-2 text-sm font-semibold text-white hover:bg-forest-600 disabled:opacity-60"
              >
                {isRequote ? 'Re-quote & notify client' : 'Generate PDF & notify client'}
              </button>
            </>
          )}
        </Section>

        <Section title="Schedule job">
          <div className="flex gap-2">
            <input type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className={`${inputClass} flex-1`} />
            <button
              disabled={busy || !scheduledDate}
              onClick={bookJob}
              className="rounded-lg bg-forest-900 px-4 text-sm font-semibold text-white hover:bg-forest-800 disabled:opacity-60"
            >
              Book
            </button>
          </div>
        </Section>

        {stageIdx(lead.status) >= stageIdx('Booked') && (
          <JobCosting lead={lead} crew={crew} onMutate={onRefresh} />
        )}

        <Section title="Raise invoice">
          <div className="flex gap-2">
            <input value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} placeholder="Amount (R)" className={`${inputClass} flex-1`} />
            <button
              disabled={busy || !invoiceAmount}
              onClick={() => run(() => api('/api/invoices', { method: 'POST', body: { leadId: lead.id, amount: Number(invoiceAmount) } }).then(() => {}), 'Invoice raised and emailed to client')}
              className="rounded-lg bg-forest-900 px-4 text-sm font-semibold text-white hover:bg-forest-800 disabled:opacity-60"
            >
              Invoice
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-forest-400">{k}</dt>
      <dd className="text-right text-forest-800">{v || '—'}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 border-t border-forest-100 pt-4">
      <h3 className="mb-2 text-sm font-semibold text-forest-700">{title}</h3>
      {children}
    </div>
  );
}

interface CostEntry {
  id: number;
  worker_id: number;
  worker_name: string;
  worker_phone: string | null;
  work_date: string;
  rate: string | number;
  paid: boolean;
  payment_reference: string | null;
}
interface CostSummary {
  worker_id: number;
  worker_name: string;
  worker_phone: string | null;
  days: number;
  total: string | number;
  unpaid_total: string | number;
  unpaid_days: number;
}
interface Costing {
  entries: CostEntry[];
  summary: CostSummary[];
  quoteTotal: number;
  costTotal: number;
  profit: number;
  quoteSource: 'quote' | 'estimate' | 'none';
}

const today = () => new Date().toISOString().slice(0, 10);
const dayLabel = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' });

// Per-lead job costing: log which crew worked which days, see who is owed, and
// pay a worker (marks their outstanding days paid + WhatsApps a receipt).
function JobCosting({ lead, crew, onMutate }: { lead: Lead; crew: Crew[]; onMutate: () => void }) {
  const [data, setData] = useState<Costing | null>(null);
  const [workerId, setWorkerId] = useState('');
  const [date, setDate] = useState(today());
  const [rate, setRate] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const activeCrew = crew.filter((c) => c.active);

  const refresh = useCallback(() => {
    api<Costing>(`/api/leads/${lead.id}/costing`).then(setData).catch(() => {});
  }, [lead.id]);
  useEffect(() => { refresh(); }, [refresh]);

  // Selecting a worker defaults the rate input to their default daily rate.
  const pickWorker = (id: string) => {
    setWorkerId(id);
    const w = crew.find((c) => String(c.id) === id);
    setRate(w ? String(w.default_daily_rate) : '');
  };

  const act = async (fn: () => Promise<Costing>, ok?: string) => {
    setBusy(true);
    setMsg(null);
    try {
      setData(await fn());
      if (ok) setMsg(ok);
      onMutate();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const addDay = () =>
    act(
      () =>
        api<Costing>(`/api/leads/${lead.id}/costing`, {
          method: 'POST',
          body: { workerId: Number(workerId), dates: [date], rate: rate ? Number(rate) : undefined },
        }),
      'Day logged'
    );

  const togglePaid = (e: CostEntry) =>
    act(() => api<Costing>(`/api/costing/${e.id}`, { method: 'PUT', body: { paid: !e.paid } }));
  const removeEntry = (e: CostEntry) =>
    act(() => api<Costing>(`/api/costing/${e.id}`, { method: 'DELETE' }));
  const editRate = (e: CostEntry) => {
    const v = window.prompt(`Daily rate for ${e.worker_name} on ${dayLabel(e.work_date)} (R)`, String(e.rate));
    if (v == null) return;
    act(() => api<Costing>(`/api/costing/${e.id}`, { method: 'PUT', body: { rate: Number(v) } }));
  };

  const payWorker = async (s: CostSummary) => {
    if (!window.confirm(
      `Pay ${s.worker_name} ${rand(s.unpaid_total)} for ${s.unpaid_days} day(s)?` +
        (s.worker_phone ? `\n\nA WhatsApp receipt will be sent to ${s.worker_phone}.` : '\n\n(No phone on file — no receipt will be sent.)')
    )) return;
    const reference = window.prompt('Payment reference (optional)', 'Cash / EFT') ?? undefined;
    setBusy(true);
    setMsg(null);
    try {
      const res = await api<Costing & { whatsapp?: { skipped?: boolean; error?: string; sid?: string } }>(
        `/api/leads/${lead.id}/costing/pay`,
        { method: 'POST', body: { workerId: s.worker_id, reference } }
      );
      setData(res);
      const w = res.whatsapp || {};
      setMsg(
        w.error ? `Paid, but WhatsApp failed: ${w.error}`
          : w.skipped ? 'Marked paid. WhatsApp not configured / no phone — no receipt sent.'
          : 'Paid and WhatsApp receipt sent.'
      );
      onMutate();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const totalOwed = (data?.summary || []).reduce((s, r) => s + Number(r.unpaid_total || 0), 0);

  return (
    <Section title="Job costing">
      {msg && <div className="mb-2 rounded-lg bg-forest-50 px-3 py-2 text-xs text-forest-800">{msg}</div>}

      {data && (
        <div className="mb-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-forest-50 px-2 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-forest-400">
              {data.quoteSource === 'estimate' ? 'Estimate' : 'Quoted'}
            </p>
            <p className="text-sm font-semibold text-forest-900">{rand(data.quoteTotal)}</p>
          </div>
          <div className="rounded-lg bg-amber-50 px-2 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-500">Labour</p>
            <p className="text-sm font-semibold text-amber-700">{rand(data.costTotal)}</p>
          </div>
          <div className={`rounded-lg px-2 py-2 ${data.profit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-wide ${data.profit >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>Profit</p>
            <p className={`text-sm font-semibold ${data.profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{rand(data.profit)}</p>
          </div>
        </div>
      )}
      {data && data.quoteSource === 'none' && (
        <p className="mb-2 text-[11px] text-forest-400">No quote or estimate yet — profit shows labour only until you set a price.</p>
      )}

      {activeCrew.length === 0 ? (
        <p className="rounded-lg bg-sand-50 px-3 py-2 text-xs text-forest-500">
          No active crew yet. Add crew under the Crew tab first.
        </p>
      ) : (
        <div className="mb-3 space-y-2">
          <div className="flex gap-2">
            <select value={workerId} onChange={(e) => pickWorker(e.target.value)} className={`${inputClass} flex-1`}>
              <option value="">Select worker…</option>
              {activeCrew.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} w-40`} />
          </div>
          <div className="flex gap-2">
            <input value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Rate for the day (R)" className={`${inputClass} flex-1`} />
            <button
              disabled={busy || !workerId || !date}
              onClick={addDay}
              className="rounded-lg bg-forest-900 px-4 text-sm font-semibold text-white hover:bg-forest-800 disabled:opacity-60"
            >
              Add day
            </button>
          </div>
        </div>
      )}

      {data && data.summary.length > 0 && (
        <div className="space-y-2">
          {data.summary.map((s) => (
            <div key={s.worker_id} className="rounded-lg border border-forest-100 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-forest-900">{s.worker_name}</p>
                  <p className="text-xs text-forest-500">
                    {s.days} day{s.days === 1 ? '' : 's'} · {rand(s.total)} total
                    {Number(s.unpaid_total) > 0 && (
                      <span className="text-amber-700"> · {rand(s.unpaid_total)} owed</span>
                    )}
                  </p>
                </div>
                {Number(s.unpaid_total) > 0 ? (
                  <button
                    disabled={busy}
                    onClick={() => payWorker(s)}
                    className="shrink-0 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Pay & WhatsApp
                  </button>
                ) : (
                  <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Settled</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data.entries.filter((e) => e.worker_id === s.worker_id).map((e) => (
                  <span
                    key={e.id}
                    className={`group inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      e.paid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    <button onClick={() => togglePaid(e)} disabled={busy} title={e.paid ? 'Mark unpaid' : 'Mark paid'}>
                      {dayLabel(e.work_date)}
                    </button>
                    <button onClick={() => editRate(e)} disabled={busy} className="opacity-70 hover:opacity-100" title="Edit rate">
                      {rand(e.rate)}
                    </button>
                    <button onClick={() => removeEntry(e)} disabled={busy} className="text-forest-300 hover:text-red-600" title="Remove">×</button>
                  </span>
                ))}
              </div>
            </div>
          ))}
          {totalOwed > 0 && (
            <p className="pt-1 text-right text-xs font-semibold text-amber-700">Total outstanding to crew: {rand(totalOwed)}</p>
          )}
        </div>
      )}
      {data && data.summary.length === 0 && activeCrew.length > 0 && (
        <p className="text-xs text-forest-400">No crew days logged yet. Tap days as the work happens.</p>
      )}
    </Section>
  );
}

// Manage the crew roster: names, phones, default daily rates, active state.
function CrewManager({ crew, onChanged }: { crew: Crew[]; onChanged: () => void }) {
  const [form, setForm] = useState({ name: '', phone: '', defaultDailyRate: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const up = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api('/api/workers', {
        method: 'POST',
        body: { name: form.name, phone: form.phone, defaultDailyRate: Number(form.defaultDailyRate) || 0 },
      });
      setForm({ name: '', phone: '', defaultDailyRate: '' });
      onChanged();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const patch = async (id: number, body: Record<string, unknown>) => {
    try {
      await api(`/api/workers/${id}`, { method: 'PUT', body });
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const editRate = (c: Crew) => {
    const v = window.prompt(`Default daily rate for ${c.name} (R)`, String(c.default_daily_rate));
    if (v != null) patch(c.id, { defaultDailyRate: Number(v) });
  };
  const editPhone = (c: Crew) => {
    const v = window.prompt(`Phone for ${c.name} (for WhatsApp receipts)`, c.phone || '');
    if (v != null) patch(c.id, { phone: v });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form onSubmit={add} className="h-fit rounded-2xl bg-white p-6 ring-1 ring-forest-100">
        <h2 className="mb-3 font-display text-lg font-semibold text-forest-900">Add crew member</h2>
        {msg && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</div>}
        <div className="space-y-2">
          <input className={inputClass} placeholder="Name" value={form.name} onChange={(e) => up('name', e.target.value)} required />
          <input className={inputClass} placeholder="Phone (e.g. 083 654 8048)" value={form.phone} onChange={(e) => up('phone', e.target.value)} />
          <input className={inputClass} placeholder="Default daily rate (R)" value={form.defaultDailyRate} onChange={(e) => up('defaultDailyRate', e.target.value)} />
        </div>
        <button disabled={busy} className="mt-4 w-full rounded-lg bg-forest-900 py-2 text-sm font-semibold text-white hover:bg-forest-800 disabled:opacity-60">
          {busy ? 'Adding…' : 'Add crew member'}
        </button>
        <p className="mt-2 text-xs text-forest-400">
          Crew are paid a daily rate and don&apos;t need a login. Their default rate auto-fills when you log a job day.
        </p>
      </form>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-forest-900">Crew roster ({crew.length})</h2>
        {crew.length === 0 && <p className="text-sm text-forest-500">No crew yet.</p>}
        <div className="space-y-2">
          {crew.map((c) => (
            <div key={c.id} className={`rounded-xl bg-white p-4 ring-1 ring-forest-100 ${c.active ? '' : 'opacity-60'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-forest-900">
                    {c.name} {!c.active && <span className="text-xs font-normal text-forest-400">(inactive)</span>}
                  </p>
                  <button onClick={() => editPhone(c)} className="text-xs text-forest-500 hover:underline">
                    {c.phone || '+ add phone'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => editRate(c)} className="rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold text-forest-700 hover:bg-forest-100">
                    {rand(c.default_daily_rate)}/day
                  </button>
                  <button
                    onClick={() => patch(c.id, { active: !c.active })}
                    className="text-xs font-semibold text-forest-400 hover:text-forest-700 hover:underline"
                  >
                    {c.active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface QuoteRow {
  id: number;
  lead_id: number;
  lead_name: string | null;
  lead_service: string | null;
  price: string | number | null;
  status: string;
  pdf_url: string | null;
  created_at: string;
}
interface InvoiceRow {
  id: number;
  lead_id: number;
  lead_name: string | null;
  lead_service: string | null;
  amount: string | number;
  status: string;
  pdf_url: string | null;
  created_at: string;
}

const rand = (n: number | string | null) =>
  `R ${Number(n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
const shortDate = (d: string) => new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'Paid' || status === 'Accepted'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'Rejected'
      ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-700';
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>{status}</span>;
}

function Billing() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [view, setView] = useState<'quotes' | 'invoices'>('quotes');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([api<QuoteRow[]>('/api/quotes'), api<InvoiceRow[]>('/api/invoices')])
      .then(([q, i]) => {
        setQuotes(q);
        setInvoices(i);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const setInvoiceStatus = async (id: number, status: 'Paid' | 'Unpaid') => {
    setBusyId(id);
    try {
      const updated = await api<InvoiceRow>(`/api/invoices/${id}/status`, { method: 'PUT', body: { status } });
      setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update payment status');
    } finally {
      setBusyId(null);
    }
  };

  const colCount = view === 'invoices' ? 8 : 7;

  const quotesTotal = quotes.reduce((s, q) => s + Number(q.price || 0), 0);
  const invoicesTotal = invoices.reduce((s, i) => s + Number(i.amount || 0), 0);
  const outstanding = invoices.filter((i) => i.status !== 'Paid').reduce((s, i) => s + Number(i.amount || 0), 0);

  const rows = view === 'quotes' ? quotes : invoices;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-white p-1 ring-1 ring-forest-100">
          {(['quotes', 'invoices'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
                view === v ? 'bg-forest-900 text-white' : 'text-forest-700 hover:bg-forest-50'
              }`}
            >
              {v} ({v === 'quotes' ? quotes.length : invoices.length})
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-forest-50 px-3 py-1.5 font-semibold text-forest-700">
            Quoted value: {rand(quotesTotal)}
          </span>
          <span className="rounded-full bg-forest-50 px-3 py-1.5 font-semibold text-forest-700">
            Invoiced: {rand(invoicesTotal)}
          </span>
          <span className="rounded-full bg-amber-50 px-3 py-1.5 font-semibold text-amber-700">
            Outstanding: {rand(outstanding)}
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-forest-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-forest-100 text-left text-xs uppercase tracking-wide text-forest-400">
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Client</th>
              <th className="px-4 py-3 font-semibold">Service</th>
              <th className="px-4 py-3 text-right font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">PDF</th>
              {view === 'invoices' && <th className="px-4 py-3 font-semibold">Payment</th>}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={colCount} className="px-4 py-10 text-center text-forest-400">Loading…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={colCount} className="px-4 py-10 text-center text-forest-400">No {view} yet.</td></tr>
            )}
            {rows.map((r) => {
              const amount = view === 'quotes' ? (r as QuoteRow).price : (r as InvoiceRow).amount;
              return (
                <tr key={r.id} className="border-b border-forest-50 last:border-0 hover:bg-sand-50/60">
                  <td className="px-4 py-3 font-semibold text-forest-900">{r.id}</td>
                  <td className="px-4 py-3 text-forest-800">{r.lead_name || `Lead #${r.lead_id}`}</td>
                  <td className="px-4 py-3 text-forest-500">{r.lead_service || '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-forest-900">{rand(amount)}</td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-3 text-forest-500">{shortDate(r.created_at)}</td>
                  <td className="px-4 py-3">
                    {r.pdf_url ? (
                      <a
                        href={apiPath(r.pdf_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-forest-700 hover:underline"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-forest-300">—</span>
                    )}
                  </td>
                  {view === 'invoices' && (
                    <td className="px-4 py-3">
                      {r.status === 'Paid' ? (
                        <button
                          disabled={busyId === r.id}
                          onClick={() => setInvoiceStatus(r.id, 'Unpaid')}
                          className="text-xs font-semibold text-forest-400 hover:text-forest-700 hover:underline disabled:opacity-50"
                        >
                          Mark unpaid
                        </button>
                      ) : (
                        <button
                          disabled={busyId === r.id}
                          onClick={() => setInvoiceStatus(r.id, 'Paid')}
                          className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {busyId === r.id ? '…' : 'Mark paid (EFT)'}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface Campaign {
  id: number;
  subject: string;
  segment: string;
  recipients: number;
  created_at: string;
}

function Campaigns() {
  const [list, setList] = useState<Campaign[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [segment, setSegment] = useState('clients');
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    api<Campaign[]>('/api/campaigns').then(setList).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api<{ count: number }>(`/api/campaigns/recipients?segment=${segment}`)
      .then((r) => setCount(r.count))
      .catch(() => setCount(null));
  }, [segment]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const c = await api<Campaign>('/api/campaigns', { method: 'POST', body: { subject, body, segment } });
      setMsg(`Sent to ${c.recipients} recipient${c.recipients === 1 ? '' : 's'}.`);
      setSubject('');
      setBody('');
      load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form onSubmit={send} className="rounded-2xl bg-white p-6 ring-1 ring-forest-100">
        <h2 className="mb-3 font-display text-lg font-semibold text-forest-900">New campaign</h2>
        {msg && <div className="mb-3 rounded-lg bg-forest-50 px-3 py-2 text-sm text-forest-800">{msg}</div>}
        <label className="mb-1 block text-xs font-medium text-forest-500">Audience</label>
        <select value={segment} onChange={(e) => setSegment(e.target.value)} className={`${inputClass} mb-1`}>
          <option value="all">All opted-in users</option>
          <option value="clients">Opted-in clients</option>
          <option value="past">Past clients (completed/invoiced jobs)</option>
        </select>
        <p className="mb-3 text-xs text-forest-400">
          {count != null ? `${count} recipient${count === 1 ? '' : 's'} will receive this` : '—'} (POPIA: opted-in only)
        </p>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className={`${inputClass} mb-2`} required />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message (HTML allowed)" rows={6} className={`${inputClass} mb-3`} required />
        <button disabled={busy || !count} className="w-full rounded-lg bg-forest-700 py-2 text-sm font-semibold text-white hover:bg-forest-600 disabled:opacity-60">
          {busy ? 'Sending…' : 'Send campaign'}
        </button>
      </form>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-forest-900">Sent campaigns</h2>
        {list.length === 0 && <p className="text-sm text-forest-500">No campaigns yet.</p>}
        <div className="space-y-2">
          {list.map((c) => (
            <div key={c.id} className="rounded-xl bg-white p-4 ring-1 ring-forest-100">
              <p className="text-sm font-semibold text-forest-900">{c.subject}</p>
              <p className="text-xs text-forest-500">
                {c.segment} · {c.recipients} recipients · {new Date(c.created_at).toLocaleDateString('en-ZA')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
