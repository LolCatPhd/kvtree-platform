'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

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
    <div className="min-h-screen bg-green-50 py-16">
      <div className="container mx-auto max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-green-900 mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-gray-500 mb-6 text-sm">
            {mode === 'login'
              ? 'Log in to track your quotes and jobs.'
              : 'Register to request quotes and follow their progress.'}
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <input
                className="w-full border rounded-lg px-4 py-2"
                placeholder="Full name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
              />
            )}
            <input
              type="email"
              className="w-full border rounded-lg px-4 py-2"
              placeholder="Email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
            />
            {mode === 'register' && (
              <input
                className="w-full border rounded-lg px-4 py-2"
                placeholder="Phone (for WhatsApp updates)"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
            )}
            <input
              type="password"
              className="w-full border rounded-lg px-4 py-2"
              placeholder="Password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
            />
            {mode === 'register' && (
              <label className="flex items-start gap-2 text-xs text-gray-600">
                <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="mt-0.5" />
                I&apos;d like to receive seasonal specials and promotions from KV Tree (optional).
              </label>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-green-900 text-white rounded-lg py-2.5 font-semibold hover:bg-green-800 transition disabled:opacity-60"
            >
              {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-gray-600 mt-6 text-center">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
              className="text-green-800 font-semibold hover:underline"
            >
              {mode === 'login' ? 'Register' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
