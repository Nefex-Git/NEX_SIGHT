import { SVGProps } from "react";

export function BigNumberIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <defs>
        <linearGradient id="bigNumberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="url(#bigNumberGradient)" fill="url(#bigNumberGradient)" fillOpacity="0.1" />
      <text x="12" y="16" fontSize="12" fontWeight="bold" textAnchor="middle" fill="url(#bigNumberGradient)" stroke="none">1</text>
    </svg>
  );
}

export function TrendlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <defs>
        <linearGradient id="trendlineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="2" stroke="url(#trendlineGradient)" fill="url(#trendlineGradient)" fillOpacity="0.05" />
      <text x="12" y="11" fontSize="10" fontWeight="bold" textAnchor="middle" fill="url(#trendlineGradient)" stroke="none">42</text>
      <polyline points="4,16 8,14 12,15 16,12 20,13" strokeWidth="1.5" stroke="#10b981" />
    </svg>
  );
}

export function GaugeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2a10 10 0 0 1 7.07 17.07" stroke="#8b5cf6" />
      <path d="M12 2a10 10 0 0 0-7.07 17.07" stroke="#a78bfa" />
      <path d="M12 12l4 4" stroke="#ec4899" strokeWidth="2" />
      <circle cx="12" cy="12" r="1" fill="#ec4899" />
    </svg>
  );
}

export function BarChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="8" width="4" height="13" rx="1" fill="#3b82f6" stroke="#2563eb" />
      <rect x="10" y="4" width="4" height="17" rx="1" fill="#8b5cf6" stroke="#7c3aed" />
      <rect x="17" y="11" width="4" height="10" rx="1" fill="#06b6d4" stroke="#0891b2" />
    </svg>
  );
}

export function StackedBarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="14" width="4" height="7" rx="1" fill="#3b82f6" stroke="#2563eb" />
      <rect x="3" y="8" width="4" height="6" rx="1" fill="#8b5cf6" stroke="#7c3aed" />
      <rect x="10" y="11" width="4" height="10" rx="1" fill="#3b82f6" stroke="#2563eb" />
      <rect x="10" y="4" width="4" height="7" rx="1" fill="#8b5cf6" stroke="#7c3aed" />
      <rect x="17" y="16" width="4" height="5" rx="1" fill="#3b82f6" stroke="#2563eb" />
      <rect x="17" y="11" width="4" height="5" rx="1" fill="#8b5cf6" stroke="#7c3aed" />
    </svg>
  );
}

export function GroupedBarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="10" width="3" height="11" rx="0.5" fill="#3b82f6" stroke="#2563eb" />
      <rect x="7" y="13" width="3" height="8" rx="0.5" fill="#8b5cf6" stroke="#7c3aed" />
      <rect x="11" y="6" width="3" height="15" rx="0.5" fill="#3b82f6" stroke="#2563eb" />
      <rect x="15" y="9" width="3" height="12" rx="0.5" fill="#8b5cf6" stroke="#7c3aed" />
      <rect x="19" y="12" width="2" height="9" rx="0.5" fill="#3b82f6" stroke="#2563eb" />
    </svg>
  );
}

export function LineChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="3,17 7,11 12,14 16,8 21,11" stroke="#10b981" strokeWidth="2" />
      <circle cx="3" cy="17" r="1.5" fill="#10b981" />
      <circle cx="7" cy="11" r="1.5" fill="#10b981" />
      <circle cx="12" cy="14" r="1.5" fill="#10b981" />
      <circle cx="16" cy="8" r="1.5" fill="#10b981" />
      <circle cx="21" cy="11" r="1.5" fill="#10b981" />
    </svg>
  );
}

export function MultiLineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="3,15 7,9 12,12 16,6 21,9" stroke="#10b981" strokeWidth="2" />
      <polyline points="3,19 7,16 12,17 16,13 21,15" stroke="#06b6d4" strokeWidth="2" />
    </svg>
  );
}

export function AreaChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <defs>
        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#a78bfa', stopOpacity: 0.4 }} />
          <stop offset="100%" style={{ stopColor: '#a78bfa', stopOpacity: 0.05 }} />
        </linearGradient>
      </defs>
      <path d="M3,21 L3,15 L7,9 L12,12 L16,6 L21,9 L21,21 Z" fill="url(#areaGradient)" />
      <polyline points="3,15 7,9 12,12 16,6 21,9" stroke="#8b5cf6" strokeWidth="2" />
    </svg>
  );
}

export function PieChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" stroke="#f59e0b" fill="#fef3c7" fillOpacity="0.2" />
      <path d="M12 3 L12 12 L18 18" fill="#f59e0b" fillOpacity="0.5" />
      <line x1="12" y1="3" x2="12" y2="12" stroke="#f59e0b" strokeWidth="2" />
      <line x1="12" y1="12" x2="18" y2="18" stroke="#f59e0b" strokeWidth="2" />
    </svg>
  );
}

export function DonutChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" stroke="#f59e0b" strokeWidth="2" fill="none" />
      <circle cx="12" cy="12" r="5" fill="none" stroke="#fef3c7" strokeWidth="9" opacity="0.3" />
      <path d="M12 3 A 9 9 0 0 1 21 12" fill="none" stroke="#f59e0b" strokeWidth="4" />
      <path d="M21 12 A 9 9 0 0 1 12 21" fill="none" stroke="#fb923c" strokeWidth="4" />
    </svg>
  );
}

export function ScatterPlotIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="5" cy="18" r="1.5" fill="#ec4899" />
      <circle cx="8" cy="12" r="1.5" fill="#f472b6" />
      <circle cx="11" cy="16" r="1.5" fill="#ec4899" />
      <circle cx="14" cy="9" r="1.5" fill="#f472b6" />
      <circle cx="17" cy="14" r="1.5" fill="#ec4899" />
      <circle cx="20" cy="7" r="1.5" fill="#f472b6" />
      <circle cx="7" cy="8" r="1.5" fill="#ec4899" />
      <circle cx="18" cy="19" r="1.5" fill="#f472b6" />
    </svg>
  );
}

export function BubbleChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="6" cy="16" r="3" fill="#ec4899" fillOpacity="0.4" stroke="#ec4899" />
      <circle cx="12" cy="8" r="5" fill="#f472b6" fillOpacity="0.3" stroke="#f472b6" />
      <circle cx="18" cy="15" r="4" fill="#ec4899" fillOpacity="0.4" stroke="#ec4899" />
    </svg>
  );
}

export function HeatmapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="4" height="4" fill="#ef4444" stroke="#dc2626" />
      <rect x="8" y="3" width="4" height="4" fill="#f97316" stroke="#ea580c" />
      <rect x="13" y="3" width="4" height="4" fill="#f59e0b" stroke="#d97706" />
      <rect x="18" y="3" width="4" height="4" fill="#fbbf24" stroke="#f59e0b" />
      <rect x="3" y="8" width="4" height="4" fill="#f97316" stroke="#ea580c" />
      <rect x="8" y="8" width="4" height="4" fill="#ef4444" stroke="#dc2626" />
      <rect x="13" y="8" width="4" height="4" fill="#f59e0b" stroke="#d97706" />
      <rect x="18" y="8" width="4" height="4" fill="#fbbf24" stroke="#f59e0b" />
      <rect x="3" y="13" width="4" height="4" fill="#f59e0b" stroke="#d97706" />
      <rect x="8" y="13" width="4" height="4" fill="#f97316" stroke="#ea580c" />
      <rect x="13" y="13" width="4" height="4" fill="#ef4444" stroke="#dc2626" />
      <rect x="18" y="13" width="4" height="4" fill="#f59e0b" stroke="#d97706" />
    </svg>
  );
}

export function TableIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#64748b" fill="#f1f5f9" fillOpacity="0.3" />
      <line x1="3" y1="9" x2="21" y2="9" stroke="#64748b" />
      <line x1="3" y1="15" x2="21" y2="15" stroke="#64748b" />
      <line x1="9" y1="3" x2="9" y2="21" stroke="#64748b" />
      <line x1="15" y1="3" x2="15" y2="21" stroke="#64748b" />
    </svg>
  );
}

export function FunnelIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4,4 L20,4 L17,10 L7,10 Z" fill="#06b6d4" stroke="#0891b2" />
      <path d="M7,10 L17,10 L15,16 L9,16 Z" fill="#0891b2" stroke="#0e7490" />
      <path d="M9,16 L15,16 L13,20 L11,20 Z" fill="#0e7490" stroke="#155e75" />
    </svg>
  );
}

export function SankeyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3,6 Q12,6 12,12 Q12,18 21,18" strokeWidth="4" fill="none" stroke="#a78bfa" />
      <path d="M3,12 Q12,12 12,12 Q12,12 21,12" strokeWidth="3" fill="none" stroke="#8b5cf6" />
      <path d="M3,18 Q12,18 12,12 Q12,6 21,6" strokeWidth="4" fill="none" stroke="#c4b5fd" />
    </svg>
  );
}

export function TreemapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="10" height="18" fill="#10b981" stroke="#059669" />
      <rect x="14" y="3" width="7" height="9" fill="#14b8a6" stroke="#0d9488" />
      <rect x="14" y="13" width="7" height="8" fill="#06b6d4" stroke="#0891b2" />
    </svg>
  );
}

export function RadarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <defs>
        <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.3 }} />
        </linearGradient>
      </defs>
      <polygon points="12,3 21,8 18,17 6,17 3,8" fill="url(#radarGradient)" stroke="#3b82f6" />
      <polygon points="12,6 18,9 16,15 8,15 6,9" fill="#8b5cf6" fillOpacity="0.4" stroke="#8b5cf6" />
      <line x1="12" y1="3" x2="12" y2="12" stroke="#94a3b8" opacity="0.5" />
      <line x1="12" y1="12" x2="21" y2="8" stroke="#94a3b8" opacity="0.5" />
      <line x1="12" y1="12" x2="18" y2="17" stroke="#94a3b8" opacity="0.5" />
      <line x1="12" y1="12" x2="6" y2="17" stroke="#94a3b8" opacity="0.5" />
      <line x1="12" y1="12" x2="3" y2="8" stroke="#94a3b8" opacity="0.5" />
    </svg>
  );
}

export function MapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21" fill="#d1fae5" fillOpacity="0.3" stroke="#10b981" />
      <line x1="9" y1="3" x2="9" y2="18" stroke="#059669" />
      <line x1="15" y1="6" x2="15" y2="21" stroke="#059669" />
    </svg>
  );
}

export function WaterfallIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="15" width="3" height="6" fill="#10b981" stroke="#059669" />
      <rect x="7" y="10" width="3" height="5" fill="#3b82f6" stroke="#2563eb" />
      <rect x="11" y="5" width="3" height="5" fill="#3b82f6" stroke="#2563eb" />
      <rect x="15" y="8" width="3" height="8" fill="#ef4444" stroke="#dc2626" />
      <rect x="19" y="5" width="3" height="16" fill="#10b981" stroke="#059669" />
      <line x1="6" y1="15" x2="7" y2="10" strokeDasharray="2,2" stroke="#94a3b8" opacity="0.5" />
      <line x1="10" y1="10" x2="11" y2="5" strokeDasharray="2,2" stroke="#94a3b8" opacity="0.5" />
      <line x1="14" y1="5" x2="15" y2="8" strokeDasharray="2,2" stroke="#94a3b8" opacity="0.5" />
      <line x1="18" y1="8" x2="19" y2="5" strokeDasharray="2,2" stroke="#94a3b8" opacity="0.5" />
    </svg>
  );
}

export function MultiValueCardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <defs>
        <linearGradient id="multiValueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="2" stroke="url(#multiValueGradient)" fill="url(#multiValueGradient)" fillOpacity="0.05" />
      <line x1="2" y1="9" x2="22" y2="9" strokeWidth="1" stroke="url(#multiValueGradient)" />
      <line x1="2" y1="15" x2="22" y2="15" strokeWidth="1" stroke="url(#multiValueGradient)" />
      <circle cx="7" cy="5.5" r="1" fill="#8b5cf6" />
      <circle cx="7" cy="12" r="1" fill="#a78bfa" />
      <circle cx="7" cy="18.5" r="1" fill="#ec4899" />
    </svg>
  );
}

export function BoxPlotIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="4" x2="12" y2="7" stroke="#06b6d4" />
      <rect x="8" y="7" width="8" height="10" fill="#06b6d4" fillOpacity="0.2" stroke="#0891b2" />
      <line x1="6" y1="12" x2="18" y2="12" strokeWidth="2" stroke="#0e7490" />
      <line x1="12" y1="17" x2="12" y2="20" stroke="#06b6d4" />
      <line x1="6" y1="4" x2="18" y2="4" stroke="#06b6d4" />
      <line x1="6" y1="20" x2="18" y2="20" stroke="#06b6d4" />
    </svg>
  );
}

export function HistogramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="16" width="3" height="5" fill="#3b82f6" stroke="#2563eb" />
      <rect x="7" y="12" width="3" height="9" fill="#60a5fa" stroke="#3b82f6" />
      <rect x="11" y="6" width="3" height="15" fill="#93c5fd" stroke="#60a5fa" />
      <rect x="15" y="9" width="3" height="12" fill="#60a5fa" stroke="#3b82f6" />
      <rect x="19" y="14" width="3" height="7" fill="#3b82f6" stroke="#2563eb" />
    </svg>
  );
}

export function SunburstIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" stroke="#f59e0b" />
      <circle cx="12" cy="12" r="6" fill="#fbbf24" fillOpacity="0.3" stroke="#f59e0b" />
      <path d="M12 2 A 10 10 0 0 1 22 12 L12 12 Z" fill="#fb923c" fillOpacity="0.4" />
      <path d="M22 12 A 10 10 0 0 1 12 22 L12 12 Z" fill="#f59e0b" fillOpacity="0.3" />
      <path d="M12 22 A 10 10 0 0 1 2 12 L12 12 Z" fill="#fbbf24" fillOpacity="0.5" />
    </svg>
  );
}
