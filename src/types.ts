export interface GpuPrice {
  name: string;
  category: 'gaming' | 'ai' | 'both';
  basePrice: string; // e.g., "18xxx" or "18,500 - 19,500"
  trend: 'up' | 'down' | 'stable';
  popular?: boolean;
  specs: {
    vram: string; // e.g., "24GB GDDR6X"
    tdp: string; // e.g., "450W"
    cuda?: string; // CUDA cores count
  };
}

export interface WorkflowStep {
  step: number;
  title: string;
  desc: string;
}

export interface Advantage {
  title: string;
  desc: string;
  iconName: string; // Lucide icon reference
}

export interface StationTier {
  id: string;
  title: string;
  subtitle: string;
  gpuRecommend: string;
  budgetRange: string;
  benefits: string[];
  popular?: boolean;
}

export interface CaseItem {
  id: number;
  tag: string;
  title: string;
  desc: string;
  time: string;
}

export interface FAQItem {
  q: string;
  a: string;
}

export interface GalleryPhoto {
  tag: string;
  title: string;
  mockUrl: string;
  desc: string;
}
