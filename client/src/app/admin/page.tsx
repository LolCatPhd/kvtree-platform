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
    return <div className="container mx-auto py-16">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-green-900">Operations Dashboard</h1>
            <p className="text-sm text-gray-500">
              {user.role === 'admin' ? 'Administrator' : 'Field worker'} · {user.email}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTab('pipeline')}
              className={`px-4 py-2 rounded-full text-sm ${tab === 'pipeline' ? 'bg-green-900 text-white' : 'bg-white border'}`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setTab('map')}
              className={`px-4 py-2 rounded-full text-sm ${tab === 'map' ? 'bg-green-900 text-white' : 'bg-white border'}`}
            >
              Map
            </button>
            {user.role === 'admin' && (
              <button
                onClick={() => setTab('campaigns')}
                className={`px-4 py-2 rounded-full text-sm ${tab === 'campaigns' ? 'bg-green-900 text-white' : 'bg-white border'}`}
              >
                Campaigns
              </button>
            )}
            {user.role === 'admin' && (
              <button
                onClick={() => setShowAddWorker(true)}
                className="px-4 py-2 rounded-full text-sm bg-white border"
              >
                + Worker
              </button>
            )}
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <StatCard label="Leads" value={stats.totals.leads} />
            <StatCard label="Quotes" value={stats.totals.quotes} />
            <StatCard label="Jobs" value={stats.totals.jobs} />
            <StatCard
              label="Paid revenue"
              value={`R ${Number(stats.totals.paid_revenue || 0).toLocaleString('en-ZA')}`}
            />
            <StatCard
              label="Outstanding"
              value={`R ${Number(stats.totals.outstanding || 0).toLocaleString('en-ZA')}`}
            />
          </div>
        )}

        {tab === 'pipeline' ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {statuses.map((status) => {
              const col = leads.filter((l) => l.status === status);
              return (
                <div
                  key={status}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const id = Number(e.dataTransfer.getData('text/plain'));
                    const lead = leads.find((l) => l.id === id);
                    if (lead) moveLead(lead, status);
                  }}
                  className="bg-white rounded-xl border min-w-[260px] w-[260px] flex-shrink-0"
                >
                  <div className="px-3 py-2 border-b flex justify-between items-center">
                    <span className="font-semibold text-sm text-gray-700">{status}</span>
                    <span className="text-xs bg-gray-100 rounded-full px-2">{col.length}</span>
                  </div>
                  <div className="p-2 space-y-2 min-h-[80px]">
                    {col.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', String(lead.id))}
                        onClick={() => setSelected(lead)}
                        className="bg-gray-50 hover:bg-green-50 border rounded-lg p-3 cursor-pointer"
                      >
                        <p className="font-medium text-sm text-gray-900">{lead.name || 'Unnamed'}</p>
                        <p className="text-xs text-gray-500">{lead.service}</p>
                        <p className="text-xs text-gray-400 truncate">{lead.address}</p>
                        {lead.distance_km != null && (
                          <p className="text-xs text-green-700 mt-1">{lead.distance_km} km away</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : tab === 'map' ? (
          <LeadMap leads={leads} />
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold text-green-900 mb-4">Add field worker</h2>
        {error && <div className="mb-3 text-sm rounded-lg bg-red-50 text-red-700 px-3 py-2">{error}</div>}
        <input className="w-full border rounded-lg px-3 py-2 mb-2 text-sm" placeholder="Name" value={form.name} onChange={(e) => up('name', e.target.value)} required />
        <input type="email" className="w-full border rounded-lg px-3 py-2 mb-2 text-sm" placeholder="Email" value={form.email} onChange={(e) => up('email', e.target.value)} required />
        <input className="w-full border rounded-lg px-3 py-2 mb-2 text-sm" placeholder="Phone" value={form.phone} onChange={(e) => up('phone', e.target.value)} />
        <input type="password" className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" placeholder="Temporary password" value={form.password} onChange={(e) => up('password', e.target.value)} required />
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 border rounded-lg py-2 text-sm">Cancel</button>
          <button type="submit" disabled={busy} className="flex-1 bg-green-900 text-white rounded-lg py-2 text-sm disabled:opacity-60">
            {busy ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-green-900">{value}</p>
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

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end z-50" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md h-full overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-green-900">{lead.name || 'Lead #' + lead.id}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        <dl className="text-sm space-y-1 mb-4">
          <Row k="Service" v={lead.service} />
          <Row k="Status" v={lead.status} />
          <Row k="Email" v={lead.email} />
          <Row k="Phone" v={lead.phone} />
          <Row k="Address" v={lead.address} />
          <Row k="Distance" v={lead.distance_km != null ? `${lead.distance_km} km` : '—'} />
        </dl>
        {lead.description && <p className="text-sm text-gray-600 mb-4 bg-gray-50 rounded-lg p-3">{lead.description}</p>}

        {Array.isArray(lead.photos) && lead.photos.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {lead.photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <a key={p} href={p} target="_blank" rel="noopener noreferrer">
                <img src={p} alt="site" className="w-20 h-20 object-cover rounded-lg border" />
              </a>
            ))}
          </div>
        )}

        {msg && <div className="mb-3 text-sm rounded-lg bg-green-50 text-green-800 px-3 py-2">{msg}</div>}

        {canAssign && (
          <Section title="Assign worker">
            <div className="flex gap-2">
              <select value={worker} onChange={(e) => setWorker(e.target.value)} className="border rounded-lg px-3 py-2 flex-1 text-sm">
                <option value="">Unassigned</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>{w.name || w.email}</option>
                ))}
              </select>
              <button
                disabled={busy}
                onClick={() => run(() => api(`/api/leads/${lead.id}`, { method: 'PUT', body: { assignedWorkerId: worker ? Number(worker) : null, status: 'Site Visit Scheduled' } }).then(() => {}), 'Assigned')}
                className="bg-green-900 text-white px-3 rounded-lg text-sm"
              >
                Save
              </button>
            </div>
          </Section>
        )}

        <Section title="Preliminary estimate (optional)">
          <div className="flex gap-2">
            <input value={estimate} onChange={(e) => setEstimate(e.target.value)} placeholder="R amount" className="border rounded-lg px-3 py-2 flex-1 text-sm" />
            <button
              disabled={busy}
              onClick={() => run(() => api(`/api/leads/${lead.id}`, { method: 'PUT', body: { estimatedQuote: estimate ? Number(estimate) : null } }).then(() => {}), 'Estimate saved')}
              className="bg-green-900 text-white px-3 rounded-lg text-sm"
            >
              Save
            </button>
          </div>
        </Section>

        <Section title="Create & send quote">
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Final price (R)" className="border rounded-lg px-3 py-2 w-full text-sm mb-2" />
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Quote details / scope of work" className="border rounded-lg px-3 py-2 w-full text-sm mb-2" rows={3} />
          <button
            disabled={busy || !price}
            onClick={() => run(() => api('/api/quotes', { method: 'POST', body: { leadId: lead.id, price: Number(price), details } }).then(() => {}), 'Quote generated, PDF created and sent to client')}
            className="w-full bg-green-700 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
          >
            Generate PDF & notify client
          </button>
        </Section>

        <Section title="Schedule job">
          <div className="flex gap-2">
            <input type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="border rounded-lg px-3 py-2 flex-1 text-sm" />
            <button
              disabled={busy || !scheduledDate}
              onClick={() => run(() => api('/api/jobs', { method: 'POST', body: { leadId: lead.id, assignedWorkerId: worker ? Number(worker) : null, scheduledDate } }).then(() => {}), 'Job scheduled')}
              className="bg-green-900 text-white px-3 rounded-lg text-sm"
            >
              Book
            </button>
          </div>
        </Section>

        <Section title="Raise invoice">
          <div className="flex gap-2">
            <input value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} placeholder="Amount (R)" className="border rounded-lg px-3 py-2 flex-1 text-sm" />
            <button
              disabled={busy || !invoiceAmount}
              onClick={() => run(() => api('/api/invoices', { method: 'POST', body: { leadId: lead.id, amount: Number(invoiceAmount) } }).then(() => {}), 'Invoice raised and emailed to client')}
              className="bg-green-900 text-white px-3 rounded-lg text-sm"
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
      <dt className="text-gray-400">{k}</dt>
      <dd className="text-gray-800 text-right">{v || '—'}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t pt-4 mt-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
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
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={send} className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold text-green-900 mb-3">New campaign</h2>
        {msg && <div className="mb-3 text-sm rounded-lg bg-green-50 text-green-800 px-3 py-2">{msg}</div>}
        <label className="block text-xs text-gray-500 mb-1">Audience</label>
        <select value={segment} onChange={(e) => setSegment(e.target.value)} className="border rounded-lg px-3 py-2 w-full text-sm mb-1">
          <option value="all">All opted-in users</option>
          <option value="clients">Opted-in clients</option>
          <option value="past">Past clients (completed/invoiced jobs)</option>
        </select>
        <p className="text-xs text-gray-400 mb-3">
          {count != null ? `${count} recipient${count === 1 ? '' : 's'} will receive this` : '—'} (POPIA: opted-in only)
        </p>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="border rounded-lg px-3 py-2 w-full text-sm mb-2" required />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message (HTML allowed)" rows={6} className="border rounded-lg px-3 py-2 w-full text-sm mb-3" required />
        <button disabled={busy || !count} className="w-full bg-green-700 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-60">
          {busy ? 'Sending…' : 'Send campaign'}
        </button>
      </form>

      <div>
        <h2 className="font-semibold text-green-900 mb-3">Sent campaigns</h2>
        {list.length === 0 && <p className="text-sm text-gray-500">No campaigns yet.</p>}
        <div className="space-y-2">
          {list.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border p-4">
              <p className="font-medium text-sm text-gray-900">{c.subject}</p>
              <p className="text-xs text-gray-500">
                {c.segment} · {c.recipients} recipients · {new Date(c.created_at).toLocaleDateString('en-ZA')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
