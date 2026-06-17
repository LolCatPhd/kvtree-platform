import { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    service: "",
    description: "",
    preferredDate: "",
  });
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e) => {
    setFormData((prev) => ({ ...prev, preferredDate: e.target.value }));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadedPhotos((prev) => [...prev, ...files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // In a real app, you would send this data to your backend API
      const response = await fetch("http://localhost:5000/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          service: formData.service,
          description: formData.description,
          // Note: Photo upload handling will be implemented in a future update
          // For now, we're not sending photos as the API doesn't handle file uploads yet
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Lead created:", result);
      
      setIsSubmitting(false);
      setSubmitSuccess(true);
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        service: "",
        description: "",
        preferredDate: "",
      });
      setUploadedPhotos([]);
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
      setSubmitError(error.message || "Failed to submit. Please try again.");
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-green-50 py-12">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl font-bold mb-6">Thank You!</h1>
          <p className="text-lg mb-6">
            We've received your quote request. Our team will review your
            information and get back to you within 24 hours.
          </p>
          <a
            href="/"
            className="bg-green-900 text-white px-6 py-3 rounded-full hover:bg-green-800 transition"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 py-12">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Get a Free Quote
        </h1>
        <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
          Fill out the form below to request a free, no-obligation quote for
          our tree care services.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium mb-2">
                    Property Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="service" className="block text-sm font-medium mb-2">
                  Service Required
                </label>
                <select
                  id="service"
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select a service</option>
                  <option value="tree-felling">Tree Felling</option>
                  <option value="stump-grinding">Stump Grinding</option>
                  <option value="site-clearing">Site Clearing</option>
                  <option value="pruning">Pruning & Trimming</option>
                  <option value="wood-sales">Wood Sales</option>
                  <option value="emergency">Emergency Services</option>
                </select>
              </div>

              <div>
                <label htmlFor="preferredDate" className="block text-sm font-medium mb-2">
                  Preferred Date (Optional)
                </label>
                <input
                  type="date"
                  id="preferredDate"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleDateChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Project Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  required
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="photos" className="block text-sm font-medium mb-2">
                  Upload Photos (Optional)
                </label>
                <input
                  type="file"
                  id="photos"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {uploadedPhotos.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    {uploadedPhotos.length} photo{uploadedPhotos.length !== 1 ? "s" : ""}
                    selected
                  </p>
                )}
              </div>

              {submitError && (
                <p className="mt-2 text-sm text-red-500">{submitError}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-900 text-white px-6 py-3 rounded-full hover:bg-green-800 transition disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Request Free Quote"}
              </button>
            </form>
          </div>

          {/* Contact Info & Map */}
          <div className="space-y-6">
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Contact Information</h2>
              <p className="mb-4">
                <span className="font-bold">Phone:</span> +27 11 123 4567
              </p>
              <p className="mb-4">
                <span className="font-bold">Email:</span> info@kvtree.co.za
              </p>
              <p className="mb-4">
                <span className="font-bold">Address:</span>
                123 Tree Street, Kempton Park, 1619
              </p>
              <p className="mb-4">
                <span className="font-bold">Business Hours:</span>
                Monday - Friday: 7:00 AM - 5:00 PM<br />
                Saturday: 8:00 AM - 1:00 PM<br />
                Sunday: Closed
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://facebook.com"
                  className="text-green-900 hover:text-green-700"
                >
                  Facebook
                </a>
                <a
                  href="https://instagram.com"
                  className="text-green-900 hover:text-green-700"
                >
                  Instagram
                </a>
                <a
                  href="https://whatsapp.com"
                  className="text-green-900 hover:text-green-700"
                >
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Service Area</h2>
              <p className="text-gray-600 mb-4">
                We proudly serve Kempton Park and the greater East Rand,
                including:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Benoni</li>
                <li>Boksburg</li>
                <li>Edenvale</li>
                <li>Germiston</li>
                <li>Modderfontein</li>
                <li>Nigel</li>
                <li>Springs</li>
                <li>And surrounding areas</li>
              </ul>
              {/* In a real app, you would embed a Google Map here */}
              <div className="mt-4 h-48 bg-green-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-600">Map would appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}