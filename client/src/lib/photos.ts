// Central registry of the real KV Tree job photos so every page imports them
// from one place. Static imports give Next.js the intrinsic dimensions for
// layout-shift-free rendering and automatic blur-up placeholders.
import treeFelling from '@/app/portfolio/portfolio-tree-felling-1.jpg.webp';
import stumpGrinding from '@/app/portfolio/portfolio-stump-grinding-1.jpg.webp';
import siteClearing from '@/app/portfolio/portfolio-site-clearing-1.jpg.webp';
import pruning from '@/app/portfolio/portfolio-pruning-1.jpg.webp';
import woodSales from '@/app/portfolio/portfolio-wood-sales-1.jpg.webp';
import emergency from '@/app/portfolio/portfolio-emergency-response-1.jpg.webp';
import teamGrinding from '@/app/portfolio/portfolio-team-grinding.webp';
import founder from '@/app/portfolio/portfolio-founder.webp';
import hero from '@/app/portfolio/portfolio-hero.webp';

export const photos = {
  treeFelling,
  stumpGrinding,
  siteClearing,
  pruning,
  woodSales,
  emergency,
  teamGrinding,
  founder,
  hero,
};

export type PhotoKey = keyof typeof photos;
