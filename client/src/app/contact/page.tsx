'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiPath } from '@/lib/config';
import { uploadPhotos } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import {
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  ClockIcon,
  CheckIcon,
  FacebookIcon,
  InstagramIcon,
  WhatsAppIcon,
} from '@/components/icons';

const inputClass =
  'w-full rounded-xl border border-forest-200 bg-white px-4 py-2.5 text-forest-900 placeholder:text-forest-300 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/30 transition';

const AREAS = ['Kempton Park', 'Benoni', 'Boksburg', 'Edenvale', 'Germiston', 'Modderfontein', 'Nigel', 'Springs'];

// Owner contact (Pieter Bekker)
const PHONE_DISPLAY = '+27 83 302 2877';
const PHONE_TEL = '+27833022877';
const WHATSAPP = 'https://wa.me/27833022877';

export default function Contact() {
  const { user } = useAuth();
  const [coords, setCoords] = useState<{ lat?: number; lng?: number } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    service: '',
    description: '',
    preferredDate: '',
  });
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Pre-fill from the logged-in user where we can.
  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      name: user.name ?? prev.name,
      email: user.email ?? prev.email,
      phone: (user.phone as string) ?? prev.phone,
      // keep address blank so users can enter it each request
    }));
  }, [user]);

  // Local object-URL previews for the selected photos, cleaned up on change.
  useEffect(() => {
    const urls = uploadedPhotos.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [uploadedPhotos]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, preferredDate: e.target.value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []) as File[];
    setUploadedPhotos((prev) => [...prev, ...files]);
    // Allow re-selecting the same file (e.g. retaking a photo) after removal.
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Upload any photos first, then attach their URLs to the lead.
      const photoUrls = await uploadPhotos(uploadedPhotos);

      const body: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        service: formData.service,
        description: formData.description,
        photos: photoUrls,
      };
      // Include coords from autocomplete if we have them (server still geocodes if missing).
      if (coords?.lat != null && coords?.lng != null) {
        body.latitude = coords.lat;
        body.longitude = coords.lng;
      }

      const response = await fetch(apiPath('/api/leads'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit: ${response.statusText}`);
      }

      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', phone: '', address: '', service: '', description: '', preferredDate: '' });
      setUploadedPhotos([]);
      setCoords(null);
    } catch (error: unknown) {
      console.error('Error submitting form:', error);
      setIsSubmitting(false);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit. Please try again.');
    }
  };

  if (submitSuccess) {
    return (
      <section className="bg-sand-50 py-24">
        <div className="wrap">
          <div className="mx-auto max-w-lg rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-forest-100">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-forest-100 text-forest-700">
              <CheckIcon className="h-9 w-9" />
            </span>
            <h1 className="mt-6 font-display text-3xl font-semibold text-forest-900">Thank you!</h1>
            <p className="mt-3 text-forest-600">
              We&apos;ve received your quote request. Our team will review your details and get back to you within 24 hours.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex rounded-full bg-forest-900 px-7 py-3.5 font-semibold text-white transition hover:bg-forest-800"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-forest-950 py-20 text-white sm:py-24">
        <div className="wrap max-w-3xl">
          <span className="eyebrow text-lime-accent">Get in touch</span>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Request your free quote
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-forest-100">
            Tell us about your tree and we&apos;ll come back with a free, no-obligation quote — usually within 24 hours.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="wrap grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
          {/* Form */}
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-100 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-forest-800">Full name</label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-forest-800">Email address</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-forest-800">Phone number</label>
                  <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-forest-800">Property address</label>
                  <AddressAutocomplete
                    value={formData.address}
                    onChange={(v) => {
                      setFormData((p) => ({ ...p, address: v }));
                      setCoords(null);
                    }}
                    onPlaceSelect={(p) => {
                      if (!p) {
                        setCoords(null);
                      } else {
                        setFormData((p0) => ({ ...p0, address: p.address }));
                        if (p.latitude != null && p.longitude != null) setCoords({ lat: p.latitude, lng: p.longitude });
                      }
                    }}
                    placeholder="Street address, suburb, city"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="service" className="mb-1.5 block text-sm font-medium text-forest-800">Service required</label>
                  <select id="service" name="service" value={formData.service} onChange={handleChange} required className={inputClass}>
                    <option value="">Select a service</option>
                    <option value="tree-felling">Tree Felling</option>
                    <option value="stump-grinding">Stump Grinding</option>
                    <option value="site-clearing">Site Clearing</option>
                    <option value="pruning">Pruning &amp; Trimming</option>
                    <option value="wood-sales">Wood Sales</option>
                    <option value="emergency">Emergency Services</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="preferredDate" className="mb-1.5 block text-sm font-medium text-forest-800">Preferred date (optional)</label>
                  <input type="date" id="preferredDate" name="preferredDate" value={formData.preferredDate} onChange={handleDateChange} className={inputClass} />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-forest-800">Project description</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} required className={inputClass} />
              </div>

              <div>
                <label htmlFor="photos" className="mb-1.5 block text-sm font-medium text-forest-800">Photos of the tree (optional)</label>
                <input
                  type="file"
                  id="photos"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="w-full rounded-xl border border-forest-200 px-4 py-2.5 text-sm text-forest-600 file:mr-4 file:rounded-full file:border-0 file:bg-forest-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-forest-800 hover:file:bg-forest-200"
                />
                <p className="mt-1.5 text-xs text-forest-400">
                  On your phone you can snap a photo with your camera or pick from your gallery — it helps us quote accurately.
                </p>
                {previews.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {previews.map((src, i) => (
                      <div key={src} className="group relative h-20 w-20 overflow-hidden rounded-xl ring-1 ring-forest-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`Selected photo ${i + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          aria-label={`Remove photo ${i + 1}`}
                          className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-forest-950/70 text-xs leading-none text-white transition hover:bg-forest-950"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {submitError && (
                <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{submitError}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-forest-900 px-6 py-3.5 font-semibold text-white transition hover:bg-forest-800 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting…' : 'Request free quote'}
              </button>
            </form>
          </div>

          {/* Contact info */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-forest-950 p-8 text-white">
              <h2 className="font-display text-xl font-semibold">Contact information</h2>
              <ul className="mt-6 space-y-5 text-sm">
                <li className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-lime-accent"><PhoneIcon className="h-5 w-5" /></span>
                  <span><span className="block text-forest-300">Phone</span><a href={`tel:${PHONE_TEL}`} className="font-medium hover:text-lime-accent">{PHONE_DISPLAY}</a></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-lime-accent"><MailIcon className="h-5 w-5" /></span>
                  <span><span className="block text-forest-300">Email</span><a href="mailto:info@kvtree.co.za" className="font-medium hover:text-lime-accent">info@kvtree.co.za</a></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-lime-accent"><MapPinIcon className="h-5 w-5" /></span>
                  <span><span className="block text-forest-300">Address</span><span className="font-medium">123 Tree Street, Kempton Park, 1619</span></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-lime-accent"><ClockIcon className="h-5 w-5" /></span>
                  <span><span className="block text-forest-300">Hours</span><span className="font-medium">Mon–Fri 7:00–17:00<br />Sat 8:00–13:00 · Sun closed</span></span>
                </li>
              </ul>
              <div className="mt-7 flex gap-3">
                {[
                  { Icon: FacebookIcon, href: 'https://facebook.com', label: 'Facebook' },
                  { Icon: InstagramIcon, href: 'https://instagram.com', label: 'Instagram' },
                  { Icon: WhatsAppIcon, href: WHATSAPP, label: 'WhatsApp' },
                ].map(({ Icon, href, label }) => (
                  <a key={label} href={href} aria-label={label} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-lime-accent hover:text-forest-950">
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-forest-100">
              <iframe
                title="KV Tree service area map"
                className="h-56 w-full border-0"
                loading="lazy"
                src="https://www.openstreetmap.org/export/embed.html?bbox=28.15%2C-26.18%2C28.32%2C-26.02&layer=mapnik&marker=-26.10%2C28.23"
              />
              <div className="p-6">
                <h2 className="font-display text-lg font-semibold text-forest-900">Service area</h2>
                <p className="mt-1 text-sm text-forest-600">Proudly serving Kempton Park and the greater East Rand:</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {AREAS.map((a) => (
                    <span key={a} className="rounded-full bg-forest-50 px-3 py-1 text-xs font-medium text-forest-700">{a}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
