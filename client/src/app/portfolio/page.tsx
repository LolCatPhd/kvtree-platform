import treeFellingImg from "./portfolio-tree-felling-1.jpg.webp";
import stumpGrindingImg from "./portfolio-stump-grinding-1.jpg.webp";
import siteClearingImg from "./portfolio-site-clearing-1.jpg.webp";
import emergencyImg from "./portfolio-emergency-response-1.jpg.webp";
import pruningImg from "./portfolio-pruning-1.jpg.webp";
import woodSalesImg from "./portfolio-wood-sales-1.jpg.webp";

export default function Portfolio() {
  return (
    <>
      <section className="py-12">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            Our Portfolio
          </h1>
          <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
            A selection of our recent tree felling, stump grinding, and site
            clearing projects across Kempton Park and surrounding areas.
          </p>

          {/* Filter buttons */}
          <div className="mb-8 flex flex-wrap justify-center gap-4">
            <button
              className="px-4 py-2 bg-green-900 text-white rounded-full hover:bg-green-800 transition"
            >
              All
            </button>
            <button
              className="px-4 py-2 bg-green-100 text-green-900 rounded-full hover:bg-green-200 transition"
            >
              Tree Felling
            </button>
            <button
              className="px-4 py-2 bg-green-100 text-green-900 rounded-full hover:bg-green-200 transition"
            >
              Stump Grinding
            </button>
            <button
              className="px-4 py-2 bg-green-100 text-green-900 rounded-full hover:bg-green-200 transition"
            >
              Site Clearing
            </button>
          </div>

          {/* Projects grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Project 1 */}
            <div className="border rounded-lg overflow-hidden hover:shadow-lg transition">
              <img
                src={treeFellingImg.src}
                alt="Large tree felling in Kempton Park"
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-bold mb-2">Large Tree Felling</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Kempton Park • June 2026
                </p>
                <p className="text-gray-700">
                  Safe removal of a 20-meter blue gum tree near residential
                  property.
                </p>
              </div>
            </div>

            {/* Project 2 */}
            <div className="border rounded-lg overflow-hidden hover:shadow-lg transition">
              <img
                src={stumpGrindingImg.src}
                alt="Stump grinding in Edenvale"
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-bold mb-2">Stump Grinding</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Edenvale • May 2026
                </p>
                <p className="text-gray-700">
                  Complete stump removal and site preparation for new lawn
                  installation.
                </p>
              </div>
            </div>

            {/* Project 3 */}
            <div className="border rounded-lg overflow-hidden hover:shadow-lg transition">
              <img
                src={siteClearingImg.src}
                alt="Site clearing for development"
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-bold mb-2">Site Clearing</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Benoni • April 2026
                </p>
                <p className="text-gray-700">
                  Clearing of 1.5 hectares for new residential development.
                </p>
              </div>
            </div>

            {/* Project 4 */}
            <div className="border rounded-lg overflow-hidden hover:shadow-lg transition">
              <img
                src={emergencyImg.src}
                alt="Emergency storm response"
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-bold mb-2">Emergency Response</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Boksburg • March 2026
                </p>
                <p className="text-gray-700">
                  24/7 storm damage response - removed hazardous trees after
                  severe winds.
                </p>
              </div>
            </div>

            {/* Project 5 */}
            <div className="border rounded-lg overflow-hidden hover:shadow-lg transition">
              <img
                src={pruningImg.src}
                alt="Tree pruning in Modderfontein"
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-bold mb-2">Pruning & Trimming</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Modderfontein • February 2026
                </p>
                <p className="text-gray-700">
                  Expert pruning of mature oak trees to enhance health and
                  appearance.
                </p>
              </div>
            </div>

            {/* Project 6 */}
            <div className="border rounded-lg overflow-hidden hover:shadow-lg transition">
              <img
                src={woodSalesImg.src}
                alt="Wood sales"
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-bold mb-2">Wood Sales</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Ongoing • Year-round
                </p>
                <p className="text-gray-700">
                  Quality firewood and timber available for purchase.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}