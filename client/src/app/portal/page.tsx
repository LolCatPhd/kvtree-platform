'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { apiPath } from '@/lib/config';
import { ArrowRightIcon, CheckIcon } from '@/components/icons';

interface Lead {
  id: number;
  service: string;
  address: string;
  status: string;
  created_at: string;
}
interface Quote {
  id: number;
  lead_id: number;
  price: string | number | null;
  details: string | null;
  status: string;
  pdf_url: string | null;
}
interface Invoice {
  id: number;
  lead_id: number;
  amount: string | number;
  status: string;
  pdf_url: string | null;
}

const PIPELINE = ['Quote Requested', 'Site Visit Scheduled', 'Quoted', 'Booked', 'In Progress', 'Completed', 'Invoiced'];

function Timeline({ status }: { status: string }) {
  const idx = PIPELINE.indexOf(status);
  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {PIPELINE.map((s, i) => {
        const done = i < idx;
        const current = i === idx;
        return (
          <span
            key={s}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
              current
                ? 'bg-forest-900 text-white ring-2 ring-forest-200'
                : done
                ? 'bg-forest-600 text-white'
                : 'bg-forest-50 text-forest-300'
            }`}
          >
            {s}
          </span>
        );
      })}
    </div>
  );
}

export default function PortalPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [optIn, setOptIn] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [l, q, i, me] = await Promise.all([
      api<Lead[]>('/api/leads'),
      api<Quote[]>('/api/quotes'),
      api<Invoice[]>('/api/invoices'),
      api<{ marketing_opt_in: boolean }>('/api/auth/me'),
    ]);
    setLeads(l);
    setQuotes(q);
    setInvoices(i);
    setOptIn(Boolean(me.marketing_opt_in));
  }, []);

  const pay = async (id: number) => {
    try {
      const { processUrl, fields } = await api<{ processUrl: string; fields: Record<string, string> }>(
        `/api/invoices/${id}/pay`,
        { method: 'POST' }
      );
      // Build and submit a hidden form that redirects to PayFast.
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = processUrl;
      Object.entries(fields).forEach(([k, v]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = k;
        input.value = String(v);
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Payment could not be started');
    }
  };

  const toggleOptIn = async (value: boolean) => {
    setOptIn(value);
    try {
      await api('/api/auth/me', { method: 'PUT', body: { marketingOptIn: value } });
    } catch {
      setOptIn(!value);
    }
  };

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (user) load().catch(console.error);
  }, [user, load]);

  const respond = async (id: number, status: 'Accepted' | 'Rejected') => {
    setBusy(true);
    try {
      await api(`/api/quotes/${id}`, { method: 'PUT', body: { status } });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user) return <div className="grid min-h-[60vh] place-items-center text-forest-600">Loading…</div>;

  const quotesByLead = (leadId: number) => quotes.filter((q) => q.lead_id === leadId);

  return (
    <div className="min-h-screen bg-sand-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-forest-900">My Account</h1>
          <p className="mt-1 text-forest-600">Welcome back, {user.name || user.email}.</p>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-forest-900">My requests</h2>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-forest-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-forest-800"
          >
            New quote request <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {leads.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-forest-100">
            <p className="text-forest-600">No requests yet.</p>
            <Link href="/contact" className="mt-3 inline-flex text-sm font-semibold text-forest-800 hover:underline">
              Request your first quote →
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {leads.map((lead) => (
            <div key={lead.id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-forest-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-lg font-semibold text-forest-900">{lead.service || 'Tree service'}</p>
                  <p className="text-sm text-forest-500">{lead.address}</p>
                </div>
                <span className="shrink-0 text-xs text-forest-400">
                  {new Date(lead.created_at).toLocaleDateString('en-ZA')}
                </span>
              </div>
              <Timeline status={lead.status} />

              {quotesByLead(lead.id).map((q) => (
                <div key={q.id} className="mt-4 border-t border-forest-100 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-forest-700">
                        Quote #{q.id} —{' '}
                        <span className="font-semibold text-forest-900">
                          R {Number(q.price || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </span>
                      </p>
                      {q.details && <p className="mt-0.5 text-xs text-forest-500">{q.details}</p>}
                      <span className="text-xs text-forest-400">Status: {q.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {q.pdf_url && (
                        <a
                          href={apiPath(q.pdf_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-forest-200 px-3 py-1.5 text-sm font-semibold text-forest-800 transition hover:bg-forest-50"
                        >
                          View PDF
                        </a>
                      )}
                      {q.status === 'Sent' && (
                        <>
                          <button
                            disabled={busy}
                            onClick={() => respond(q.id, 'Accepted')}
                            className="rounded-full bg-forest-700 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-forest-600 disabled:opacity-60"
                          >
                            Accept
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => respond(q.id, 'Rejected')}
                            className="rounded-full border border-forest-200 px-4 py-1.5 text-sm font-semibold text-forest-700 transition hover:bg-forest-50 disabled:opacity-60"
                          >
                            Decline
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {invoices.length > 0 && (
          <>
            <h2 className="mb-4 mt-10 font-display text-xl font-semibold text-forest-900">My invoices</h2>
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-forest-100">
                  <div>
                    <p className="font-semibold text-forest-900">
                      Invoice #{inv.id} — R{' '}
                      {Number(inv.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </p>
                    <span
                      className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {inv.status === 'Paid' && <CheckIcon className="h-3 w-3" />}
                      {inv.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {inv.pdf_url && (
                      <a
                        href={apiPath(inv.pdf_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-forest-200 px-3 py-1.5 text-sm font-semibold text-forest-800 transition hover:bg-forest-50"
                      >
                        View PDF
                      </a>
                    )}
                    {inv.status !== 'Paid' && (
                      <button
                        onClick={() => pay(inv.id)}
                        className="rounded-full bg-forest-700 px-5 py-1.5 text-sm font-semibold text-white transition hover:bg-forest-600"
                      >
                        Pay now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-10 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-forest-100">
          <label className="flex items-center gap-3 text-sm text-forest-700">
            <input
              type="checkbox"
              checked={optIn}
              onChange={(e) => toggleOptIn(e.target.checked)}
              className="h-4 w-4 accent-forest-700"
            />
            Keep me updated about seasonal specials and promotions from KV Tree.
          </label>
        </div>
      </div>
    </div>
  );
}
