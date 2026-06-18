'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { photos } from '@/lib/photos';
import { LeafIcon, CheckIcon } from '@/components/icons';

const inputClass =
  "w-full rounded-xl border border-forest-200 bg-white px-4 py-2.5 text-forest-900 placeholder:text-forest-300 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/30 transition";

export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [optIn, setOptIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const user =
        mode === 'login'
          ? await login(form.email, form.password)
          : await register({ name: form.name, email: form.email, password: form.password, phone: form.phone, marketingOptIn: optIn });
      router.push(user.role === 'client' ? '/portal' : '/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* Visual panel */}
      <div className="relative hidden lg:block">
        <Image
          src={photos.treeFelling}
          alt="KV Tree crew at work"
          fill
          sizes="50vw"
          className="object-cover"
          placeholder="blur"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/90 via-forest-950/50 to-forest-950/30" />
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-white">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-lime-accent">
              <LeafIcon className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-semibold">KV Tree</span>
          </Link>
          <h2 className="mt-6 max-w-sm font-display text-3xl font-semibold leading-tight">
            Manage your quotes, jobs and invoices in one place
          </h2>
          <ul className="mt-6 space-y-2.5 text-sm text-forest-100">
            {["Track your quote requests", "Accept quotes & pay invoices online", "Follow every job to completion"].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <CheckIcon className="h-5 w-5 text-lime-accent" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-sand-50 px-5 py-14">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm ring-1 ring-forest-100 sm:p-10">
          <Link href="/" className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest-900 text-lime-accent">
              <LeafIcon className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-semibold text-forest-900">KV Tree</span>
          </Link>

          <h1 className="font-display text-2xl font-semibold text-forest-900">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-1 text-sm text-forest-500">
            {mode === 'login'
              ? 'Log in to track your quotes and jobs.'
              : 'Register to request quotes and follow their progress.'}
          </p>

          {error && (
            <div className="mt-5 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <input className={inputClass} placeholder="Full name" value={form.name} onChange={(e) => update('name', e.target.value)} required />
            )}
            <input type="email" className={inputClass} placeholder="Email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
            {mode === 'register' && (
              <input className={inputClass} placeholder="Phone (for WhatsApp updates)" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            )}
            <input type="password" className={inputClass} placeholder="Password" value={form.password} onChange={(e) => update('password', e.target.value)} required />
            {mode === 'register' && (
              <label className="flex items-start gap-2.5 text-xs text-forest-600">
                <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="mt-0.5 accent-forest-700" />
                I&apos;d like to receive seasonal specials and promotions from KV Tree (optional).
              </label>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-forest-900 py-3 font-semibold text-white transition hover:bg-forest-800 disabled:opacity-60"
            >
              {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-forest-600">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
              className="font-semibold text-forest-800 hover:underline"
            >
              {mode === 'login' ? 'Register' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
