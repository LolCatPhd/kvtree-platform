export default function Services() {
  return (
    <>
      <section className="py-12">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            Our Services
          </h1>
          <div className="space-y-8">
            {/* Tree Felling */}
            <div className="border rounded-lg p-6 hover:shadow-lg transition">
              <h2 className="text-2xl font-bold mb-4">Tree Felling</h2>
              <p>
                Our professional tree felling service ensures safe and efficient
                removal of trees of any size. We handle everything from small
                ornamental trees to large, hazardous trees near structures or
                power lines.
              </p>
              <h3 className="text-xl font-bold mt-4 mb-2">Our Process:</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  Assessment of the tree and surrounding area for safety risks.
                </li>
                <li>
                  Strategic planning of the felling direction and escape routes.
                </li>
                <li>
                  Use of specialized equipment and techniques for controlled
                  felling.
                </li>
                <li>
                  Complete cleanup and removal of all debris.
                </li>
                <li>
                  Optional stump grinding and site restoration services.
                </li>
              </ol>
            </div>

            {/* Stump Grinding */}
            <div className="border rounded-lg p-6 hover:shadow-lg transition">
              <h2 className="text-2xl font-bold mb-4">Stump Grinding</h2>
              <p>
                Remove unsightly stumps and reclaim your yard with our stump
                grinding service. We use powerful grinders to chip stumps below
                ground level, allowing for replanting or landscaping.
              </p>
              <h3 className="text-xl font-bold mt-4 mb-2">Benefits:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Eliminates trip hazards.</li>
                <li>Prevents pest infestations in old stumps.</li>
                <li>Allows for smooth lawn mowing and landscaping.</li>
                <li>Environmentally friendly – wood chips can be used as mulch.</li>
              </ul>
            </div>

            {/* Site Clearing */}
            <div className="border rounded-lg p-6 hover:shadow-lg transition">
              <h2 className="text-2xl font-bold mb-4">Site Clearing</h2>
              <p>
                Prepare your land for construction, landscaping, or agricultural
                use with our comprehensive site clearing service. We remove
                trees, vegetation, rocks, and debris to create a clean slate.
              </p>
              <h3 className="text-xl font-bold mt-4 mb-2">Ideal For:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>New home construction sites.</li>
                <li>Commercial development projects.</li>
                <li> Agricultural land preparation.</li>
                <li>Fire break creation.</li>
              </ul>
            </div>

            {/* Pruning & Trimming */}
            <div className="border rounded-lg p-6 hover:shadow-lg transition">
              <h2 className="text-2xl font-bold mb-4">Pruning & Trimming</h2>
              <p>
                Proper pruning is essential for tree health, safety, and
                aesthetics. Our certified arborists use industry-best practices
                to enhance the structure and appearance of your trees.
              </p>
              <h3 className="text-xl font-bold mt-4 mb-2">Types of Pruning:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Crown thinning to improve light penetration and air flow.</li>
                <li>Crown raising to provide clearance for buildings, vehicles, or pedestrians.</li>
                <li>Crown reduction to reduce the size of a tree while maintaining its natural shape.</li>
                <li>Deadwooding to remove hazardous dead branches.</li>
                <li>Fruit tree pruning to maximize yield and health.</li>
              </ul>
            </div>

            {/* Wood Sales */}
            <div className="border rounded-lg p-6 hover:shadow-lg transition">
              <h2 className="text-2xl font-bold mb-4">Wood Sales</h2>
              <p>
                We offer quality firewood and timber for sale. Our wood is
                sourced responsibly from our tree felling operations and is
                properly seasoned for optimal burning.
              </p>
              <h3 className="text-xl font-bold mt-4 mb-2">Available Products:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Seasoned firewood (hardwood and softwood mixes)</li>
                <li>Timber for construction or woodworking projects</li>
                <li>Wood chips for mulch or landscaping</li>
              </ul>
            </div>

            {/* Emergency Services */}
            <div className="border rounded-lg p-6 hover:shadow-lg transition">
              <h2 className="text-2xl font-bold mb-4">Emergency Storm Response</h2>
              <p>
                When storms strike, we're available 24/7 to respond to hazardous
                tree situations. Our emergency team quickly assesses and
                addresses fallen trees, dangerous limbs, and storm-damaged
                trees to protect your property and safety.
              </p>
              <h3 className="text-xl font-bold mt-4 mb-2">Our Emergency Services Include:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Rapid response to storm damage calls.</li>
                <li>Safe removal of fallen trees and limbs.</li>
                <li>Temporary stabilization of damaged trees.</li>
                <li>Coordination with insurance companies when needed.</li>
                <li>24/7 availability during storm season.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}