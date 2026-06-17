import Image from 'next/image';
import treeImg from './portfolio/portfolio-tree-felling-1.jpg.webp';
import stumpImg from './portfolio/portfolio-stump-grinding-1.jpg.webp';

export default function Home() {
  return (
    <>
      <section className="bg-green-900 text-white py-20">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">
            Tree Felling & Stump Removal Experts in Kempton Park
          </h1>
          <p className="text-lg mb-6">
            Professional, reliable, and experienced tree care services for
            residential and commercial properties.
          </p>
          <a
            href="/contact"
            className="bg-green-200 text-green-900 px-6 py-3 rounded-full hover:bg-green-300 transition"
          >
            Get Free Quote
          </a>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="text-xl font-bold mb-2">Tree Felling</h3>
              <p>
                Safe and efficient removal of trees of any size, including
                hazardous trees.
              </p>
            </div>
            <div className="border rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="text-xl font-bold mb-2">Stump Grinding</h3>
              <p>
                Complete stump removal using advanced grinding equipment to
                restore your landscape.
              </p>
            </div>
            <div className="border rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="text-xl font-bold mb-2">Site Clearing</h3>
              <p>
                Preparation of land for construction or landscaping by removing
                vegetation, debris, and obstacles.
              </p>
            </div>
            <div className="border rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="text-xl font-bold mb-2">Pruning & Trimming</h3>
              <p>
                Expert pruning to enhance tree health, appearance, and safety.
              </p>
            </div>
            <div className="border rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="text-xl font-bold mb-2">Wood Sales</h3>
              <p>
                Quality firewood and timber available for purchase.
              </p>
            </div>
            <div className="border rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="text-xl font-bold mb-2">Emergency Services</h3>
              <p>
                24/7 response for storm damage and hazardous tree situations.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-green-50 py-12">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Why Choose KV Tree?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <h3 className="text-xl font-bold mb-2">Experienced</h3>
              <p>Serving the Kempton Park community for over 20 years.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Fully Insured</h3>
              <p>
                Comprehensive liability insurance for your peace of mind.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Safety First</h3>
              <p>
                Certified arborists and strict safety protocols on every job.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Recent Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg overflow-hidden hover:shadow-lg transition">
              <Image
                src={treeImg}
                alt="Tree felling project in Kempton Park"
                className="w-full h-48 object-cover"
                width={1200}
                height={800}
              />
              <div className="p-4">
                <h3 className="text-lg font-bold mb-2">Tree Felling in Kempton Park</h3>
                <p className="text-sm text-gray-600">Completed June 2026</p>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden hover:shadow-lg transition">
              <Image
                src={stumpImg}
                alt="Stump grinding project in Edenvale"
                className="w-full h-48 object-cover"
                width={1200}
                height={800}
              />
              <div className="p-4">
                <h3 className="text-lg font-bold mb-2">Stump Grinding in Edenvale</h3>
                <p className="text-sm text-gray-600">Completed May 2026</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-green-900 text-white py-12">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="mb-6">Contact us today for a free, no-obligation quote.</p>
          <a
            href="/contact"
            className="bg-green-200 text-green-900 px-6 py-3 rounded-full hover:bg-green-300 transition"
          >
            Request Quote
          </a>
        </div>
      </section>
    </>
  );
}
