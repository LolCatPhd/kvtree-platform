import type { ComponentType, SVGProps } from "react";
import type { StaticImageData } from "next/image";
import { photos } from "./photos";
import {
  TreeFellingIcon,
  StumpIcon,
  SiteClearingIcon,
  PruningIcon,
  WoodIcon,
  EmergencyIcon,
} from "@/components/icons";

export type Service = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  bullets: string[];
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  image: StaticImageData;
  imageAlt: string;
};

export const services: Service[] = [
  {
    slug: "tree-felling",
    title: "Tree Felling",
    tagline: "Safe removal of trees of any size",
    description:
      "From compact ornamentals to towering blue gums beside houses and power lines, our climbers and riggers bring down trees in controlled, calculated sections — no surprises, no damage.",
    bullets: [
      "On-site risk assessment before any cut",
      "Sectional dismantling near structures",
      "Full clean-up and debris removal",
      "Optional stump grinding to finish",
    ],
    Icon: TreeFellingIcon,
    image: photos.treeFelling,
    imageAlt: "KV Tree climber sectioning a large tree beside a Kempton Park home",
  },
  {
    slug: "stump-grinding",
    title: "Stump Grinding",
    tagline: "Reclaim your yard, below the surface",
    description:
      "We grind stumps well below ground level so you can replant, lay lawn or pave with a clean slate — and the chips make excellent mulch.",
    bullets: [
      "Ground 15–30cm below the surface",
      "Removes trip hazards and pests",
      "Ready for lawn, paving or planting",
      "Wood chips reused as mulch",
    ],
    Icon: StumpIcon,
    image: photos.stumpGrinding,
    imageAlt: "KV Tree technician operating a stump grinder in a suburban garden",
  },
  {
    slug: "site-clearing",
    title: "Site Clearing",
    tagline: "A clean slate for your project",
    description:
      "Preparing land for construction, landscaping or agriculture. We clear trees, vegetation and debris efficiently and chip it on site.",
    bullets: [
      "Residential & commercial developments",
      "Fire-break creation",
      "On-site chipping of green waste",
      "Tidy, graded finish",
    ],
    Icon: SiteClearingIcon,
    image: photos.siteClearing,
    imageAlt: "KV Tree crew clearing land with a wood chipper under a clear sky",
  },
  {
    slug: "pruning",
    title: "Pruning & Trimming",
    tagline: "Healthier, safer, better-shaped trees",
    description:
      "Certified arborists shape and thin your trees using industry-best practice — improving light, airflow, safety and the long-term health of the tree.",
    bullets: [
      "Crown thinning & reduction",
      "Crown raising for clearance",
      "Deadwooding for safety",
      "Fruit-tree pruning for yield",
    ],
    Icon: PruningIcon,
    image: photos.pruning,
    imageAlt: "KV Tree arborist pruning a mature tree from a climbing line",
  },
  {
    slug: "wood-sales",
    title: "Wood Sales",
    tagline: "Quality seasoned firewood & timber",
    description:
      "Responsibly sourced from our own felling operations and properly seasoned for a clean, long burn. Collection or delivery available.",
    bullets: [
      "Seasoned hardwood & softwood mixes",
      "Timber for building & woodworking",
      "Wood chips for mulch",
      "Delivery across the East Rand",
    ],
    Icon: WoodIcon,
    image: photos.woodSales,
    imageAlt: "Stacks of KV Tree seasoned firewood for sale being loaded",
  },
  {
    slug: "emergency",
    title: "Emergency Response",
    tagline: "24/7 storm-damage call-outs",
    description:
      "When a tree comes down on your roof, driveway or fence, we mobilise fast — day or night — to make the site safe and clear the danger.",
    bullets: [
      "Rapid response, day or night",
      "Safe removal of fallen trees & limbs",
      "Crane lifts off structures",
      "Insurance documentation support",
    ],
    Icon: EmergencyIcon,
    image: photos.emergency,
    imageAlt: "KV Tree emergency crew lifting a storm-fallen tree off a house at night",
  },
];
