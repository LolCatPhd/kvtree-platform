export default function About() {
  return (
    <>
      <section className="py-12">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            About KV Tree
          </h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Our Story</h2>
              <p>
                KV Tree has been serving the Kempton Park and greater East Rand
                community for over 20 years. What started as a small, family-
                operated business has grown into a trusted name in tree care,
                known for our commitment to safety, professionalism, and
                environmental stewardship.
              </p>
              <p>
                Our founder, Kelvin van der Merwe, began with a passion for
                arboriculture and a dedication to providing honest, reliable
                service. Today, we continue that legacy with a team of certified
                arborists and skilled technicians who share the same values.
              </p>
            </div>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-bold mb-2">20+</h3>
                <p className="text-sm text-gray-600">
                  Years of Experience
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-bold mb-2">1,000+</h3>
                <p className="text-sm text-gray-600">
                  Projects Completed
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-bold mb-2">100%</h3>
                <p className="text-sm text-gray-600">
                  Customer Satisfaction Guarantee
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-bold mb-2">Fully</h3>
                <p className="text-sm text-gray-600">
                  Insured & Certified
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-green-50 py-12">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Our Commitment to Safety & Excellence
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <h3 className="text-xl font-bold mb-2">Safety First</h3>
              <p>
                We adhere to the highest safety standards in the industry. Our
                team is trained in the latest safety protocols and uses
                state-of-the-art equipment to ensure every job is completed
                without incident.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <h3 className="text-xl font-bold mb-2">Certified Experts</h3>
              <p>
                Our arborists are certified by recognized industry bodies and
                participate in ongoing education to stay current with best
                practices in tree care.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <h3 className="text-xl font-bold mb-2">Environmental Care</h3>
              <p>
                We believe in responsible tree care that considers the health
                of the entire ecosystem. We recycle wood waste and recommend
                planting new trees to replace those we remove when necessary.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Meet Our Team
          </h2>
          <p className="text-center text-gray-600 mb-8">
            The skilled professionals who make KV Tree possible.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border rounded-lg p-6 text-center hover:shadow-lg transition">
              <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-green-900 text-white flex items-center justify-center text-3xl font-bold">
                KM
              </div>
              <h3 className="text-xl font-bold mb-2">Kelvin van der Merwe</h3>
              <p className="text-gray-600">Founder & Chief Arborist</p>
            </div>
            <div className="border rounded-lg p-6 text-center hover:shadow-lg transition">
              <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-green-900 text-white flex items-center justify-center text-3xl font-bold">
                TM
              </div>
              <h3 className="text-xl font-bold mb-2">Thandiwe Mokoena</h3>
              <p className="text-gray-600">Operations Manager</p>
            </div>
            <div className="border rounded-lg p-6 text-center hover:shadow-lg transition">
              <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-green-900 text-white flex items-center justify-center text-3xl font-bold">
                JB
              </div>
              <h3 className="text-xl font-bold mb-2">Jaco Botha</h3>
              <p className="text-gray-600">Lead Arborist</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}