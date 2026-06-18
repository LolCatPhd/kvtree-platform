'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

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

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [statuses, setStatuses] = useState<string[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tab, setTab] = useState<'pipeline' | 'map' | 'campaigns'>('pipeline');
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
  }, []);

  useEffect(() => {
    if (!loading && (!user || user.role === 'client')) router.replace(user ? '/portal' : '/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (user && user.role !== 'client') load().catch(console.error);
  }, [user, load]);

  const moveLead = async (lead: Lead, status: string) => {
    if (lead.status === status) return;
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
    ...(user.role === 'admin' ? [{ key: 'campaigns' as const, label: 'Campaigns' }] : []),
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
        ) : (
          <Campaigns />
        )}
      </div>

      {selected && (
        <LeadPanel
          lead={selected}
          workers={workers}
          canAssign={user.role === 'admin'}
          onClose={() => setSelected(null)}
          onChanged={() => { load(); setSelected(null); }}
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

function LeadPanel({
  lead,
  workers,
  canAssign,
  onClose,
  onChanged,
}: {
  lead: Lead;
  workers: Worker[];
  canAssign: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [price, setPrice] = useState('');
  const [details, setDetails] = useState('');
  const [estimate, setEstimate] = useState(lead.estimated_quote ? String(lead.estimated_quote) : '');
  const [worker, setWorker] = useState(lead.assigned_worker_id ? String(lead.assigned_worker_id) : '');
  const [scheduledDate, setScheduledDate] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState(lead.estimated_quote ? String(lead.estimated_quote) : '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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

        <Section title="Create & send quote">
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Final price (R)" className={`${inputClass} mb-2`} />
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Quote details / scope of work" className={`${inputClass} mb-2`} rows={3} />
          <button
            disabled={busy || !price}
            onClick={() => run(() => api('/api/quotes', { method: 'POST', body: { leadId: lead.id, price: Number(price), details } }).then(() => {}), 'Quote generated, PDF created and sent to client')}
            className="w-full rounded-lg bg-forest-700 py-2 text-sm font-semibold text-white hover:bg-forest-600 disabled:opacity-60"
          >
            Generate PDF & notify client
          </button>
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
