'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { apiPath } from '@/lib/config';

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
  pdf_path: string | null;
}
interface Invoice {
  id: number;
  lead_id: number;
  amount: string | number;
  status: string;
  pdf_path: string | null;
}

const PIPELINE = ['Quote Requested', 'Site Visit Scheduled', 'Quoted', 'Booked', 'In Progress', 'Completed', 'Invoiced'];

function Timeline({ status }: { status: string }) {
  const idx = PIPELINE.indexOf(status);
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {PIPELINE.map((s, i) => (
        <span
          key={s}
          className={`text-xs px-2 py-0.5 rounded-full ${
            i <= idx ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-400'
          }`}
        >
          {s}
        </span>
      ))}
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

  if (loading || !user) return <div className="container mx-auto py-16">Loading…</div>;

  const quotesByLead = (leadId: number) => quotes.filter((q) => q.lead_id === leadId);

  return (
    <div className="min-h-screen bg-green-50 py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <h1 className="text-3xl font-bold text-green-900 mb-1">My Account</h1>
        <p className="text-gray-600 mb-8">Welcome back, {user.name || user.email}.</p>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-green-900">My Requests</h2>
          <a href="/contact" className="bg-green-900 text-white px-4 py-2 rounded-full text-sm hover:bg-green-800">
            + New quote request
          </a>
        </div>

        {leads.length === 0 && (
          <p className="text-gray-500 bg-white rounded-xl p-6">No requests yet. Request your first quote!</p>
        )}

        <div className="space-y-4">
          {leads.map((lead) => (
            <div key={lead.id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{lead.service || 'Tree service'}</p>
                  <p className="text-sm text-gray-500">{lead.address}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(lead.created_at).toLocaleDateString('en-ZA')}
                </span>
              </div>
              <Timeline status={lead.status} />

              {quotesByLead(lead.id).map((q) => (
                <div key={q.id} className="mt-4 border-t pt-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm">
                        Quote #{q.id} —{' '}
                        <span className="font-semibold">
                          R {Number(q.price || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </span>
                      </p>
                      {q.details && <p className="text-xs text-gray-500">{q.details}</p>}
                      <span className="text-xs text-gray-400">Status: {q.status}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      {q.pdf_path && (
                        <a
                          href={apiPath(q.pdf_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-800 text-sm hover:underline"
                        >
                          PDF
                        </a>
                      )}
                      {q.status === 'Sent' && (
                        <>
                          <button
                            disabled={busy}
                            onClick={() => respond(q.id, 'Accepted')}
                            className="bg-green-700 text-white text-sm px-3 py-1 rounded-full hover:bg-green-600 disabled:opacity-60"
                          >
                            Accept
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => respond(q.id, 'Rejected')}
                            className="bg-gray-200 text-gray-700 text-sm px-3 py-1 rounded-full hover:bg-gray-300 disabled:opacity-60"
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
            <h2 className="text-xl font-semibold text-green-900 mt-10 mb-4">My Invoices</h2>
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Invoice #{inv.id} — R{' '}
                      {Number(inv.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        inv.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {inv.pdf_path && (
                      <a
                        href={apiPath(inv.pdf_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-800 text-sm hover:underline"
                      >
                        PDF
                      </a>
                    )}
                    {inv.status !== 'Paid' && (
                      <button
                        onClick={() => pay(inv.id)}
                        className="bg-green-700 text-white text-sm px-4 py-1.5 rounded-full hover:bg-green-600"
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

        <div className="bg-white rounded-xl shadow-sm p-5 mt-10">
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input type="checkbox" checked={optIn} onChange={(e) => toggleOptIn(e.target.checked)} />
            Keep me updated about seasonal specials and promotions from KV Tree.
          </label>
        </div>
      </div>
    </div>
  );
}
