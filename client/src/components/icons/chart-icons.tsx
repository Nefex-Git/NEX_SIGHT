import { SVGProps } from "react";

export function BigNumberIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <text x="12" y="16" fontSize="12" fontWeight="bold" textAnchor="middle" fill="currentColor" stroke="none">1</text>
    </svg>
  );
}

export function TrendlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <text x="12" y="11" fontSize="10" fontWeight="bold" textAnchor="middle" fill="currentColor" stroke="none">42</text>
      <polyline points="4,16 8,14 12,15 16,12 20,13" strokeWidth="1.5" />
    </svg>
  );
}

export function GaugeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2a10 10 0 0 1 7.07 17.07" />
      <path d="M12 2a10 10 0 0 0-7.07 17.07" />
      <path d="M12 12l4 4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export function BarChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="8" width="4" height="13" rx="1" />
      <rect x="10" y="4" width="4" height="17" rx="1" />
      <rect x="17" y="11" width="4" height="10" rx="1" />
    </svg>
  );
}

export function StackedBarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="14" width="4" height="7" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="3" y="8" width="4" height="6" rx="1" />
      <rect x="10" y="11" width="4" height="10" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="10" y="4" width="4" height="7" rx="1" />
      <rect x="17" y="16" width="4" height="5" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="17" y="11" width="4" height="5" rx="1" />
    </svg>
  );
}

export function GroupedBarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="10" width="3" height="11" rx="0.5" />
      <rect x="7" y="13" width="3" height="8" rx="0.5" fill="currentColor" opacity="0.5" />
      <rect x="11" y="6" width="3" height="15" rx="0.5" />
      <rect x="15" y="9" width="3" height="12" rx="0.5" fill="currentColor" opacity="0.5" />
      <rect x="19" y="12" width="2" height="9" rx="0.5" />
    </svg>
  );
}

export function LineChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="3,17 7,11 12,14 16,8 21,11" />
      <circle cx="3" cy="17" r="1.5" fill="currentColor" />
      <circle cx="7" cy="11" r="1.5" fill="currentColor" />
      <circle cx="12" cy="14" r="1.5" fill="currentColor" />
      <circle cx="16" cy="8" r="1.5" fill="currentColor" />
      <circle cx="21" cy="11" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function MultiLineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="3,15 7,9 12,12 16,6 21,9" />
      <polyline points="3,19 7,16 12,17 16,13 21,15" opacity="0.6" />
    </svg>
  );
}

export function AreaChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3,21 L3,15 L7,9 L12,12 L16,6 L21,9 L21,21 Z" fill="currentColor" opacity="0.2" />
      <polyline points="3,15 7,9 12,12 16,6 21,9" />
    </svg>
  );
}

export function PieChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3 L12 12 L18 18" fill="currentColor" opacity="0.3" />
      <line x1="12" y1="3" x2="12" y2="12" />
      <line x1="12" y1="12" x2="18" y2="18" />
    </svg>
  );
}

export function DonutChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="9" opacity="0.2" />
      <path d="M12 3 A 9 9 0 0 1 21 12" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.6" />
    </svg>
  );
}

export function ScatterPlotIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="5" cy="18" r="1.5" fill="currentColor" />
      <circle cx="8" cy="12" r="1.5" fill="currentColor" />
      <circle cx="11" cy="16" r="1.5" fill="currentColor" />
      <circle cx="14" cy="9" r="1.5" fill="currentColor" />
      <circle cx="17" cy="14" r="1.5" fill="currentColor" />
      <circle cx="20" cy="7" r="1.5" fill="currentColor" />
      <circle cx="7" cy="8" r="1.5" fill="currentColor" />
      <circle cx="18" cy="19" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function BubbleChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="6" cy="16" r="3" fill="currentColor" opacity="0.3" />
      <circle cx="12" cy="8" r="5" fill="currentColor" opacity="0.3" />
      <circle cx="18" cy="15" r="4" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function HeatmapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="4" height="4" fill="currentColor" opacity="0.8" />
      <rect x="8" y="3" width="4" height="4" fill="currentColor" opacity="0.4" />
      <rect x="13" y="3" width="4" height="4" fill="currentColor" opacity="0.6" />
      <rect x="18" y="3" width="4" height="4" fill="currentColor" opacity="0.3" />
      <rect x="3" y="8" width="4" height="4" fill="currentColor" opacity="0.5" />
      <rect x="8" y="8" width="4" height="4" fill="currentColor" opacity="0.9" />
      <rect x="13" y="8" width="4" height="4" fill="currentColor" opacity="0.7" />
      <rect x="18" y="8" width="4" height="4" fill="currentColor" opacity="0.4" />
      <rect x="3" y="13" width="4" height="4" fill="currentColor" opacity="0.6" />
      <rect x="8" y="13" width="4" height="4" fill="currentColor" opacity="0.5" />
      <rect x="13" y="13" width="4" height="4" fill="currentColor" opacity="0.8" />
      <rect x="18" y="13" width="4" height="4" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export function TableIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

export function FunnelIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4,4 L20,4 L17,10 L7,10 Z" fill="currentColor" opacity="0.3" />
      <path d="M7,10 L17,10 L15,16 L9,16 Z" fill="currentColor" opacity="0.5" />
      <path d="M9,16 L15,16 L13,20 L11,20 Z" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

export function SankeyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3,6 Q12,6 12,12 Q12,18 21,18" strokeWidth="4" fill="none" opacity="0.5" />
      <path d="M3,12 Q12,12 12,12 Q12,12 21,12" strokeWidth="3" fill="none" opacity="0.6" />
      <path d="M3,18 Q12,18 12,12 Q12,6 21,6" strokeWidth="4" fill="none" opacity="0.5" />
    </svg>
  );
}

export function TreemapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="10" height="18" fill="currentColor" opacity="0.3" />
      <rect x="14" y="3" width="7" height="9" fill="currentColor" opacity="0.5" />
      <rect x="14" y="13" width="7" height="8" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

export function RadarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="12,3 21,8 18,17 6,17 3,8" fill="currentColor" opacity="0.2" />
      <polygon points="12,6 18,9 16,15 8,15 6,9" fill="currentColor" opacity="0.3" />
      <line x1="12" y1="3" x2="12" y2="12" opacity="0.5" />
      <line x1="12" y1="12" x2="21" y2="8" opacity="0.5" />
      <line x1="12" y1="12" x2="18" y2="17" opacity="0.5" />
      <line x1="12" y1="12" x2="6" y2="17" opacity="0.5" />
      <line x1="12" y1="12" x2="3" y2="8" opacity="0.5" />
    </svg>
  );
}

export function MapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

export function WaterfallIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="15" width="3" height="6" fill="currentColor" opacity="0.6" />
      <rect x="7" y="10" width="3" height="5" fill="currentColor" opacity="0.4" />
      <rect x="11" y="5" width="3" height="5" fill="currentColor" opacity="0.4" />
      <rect x="15" y="8" width="3" height="8" fill="currentColor" opacity="0.5" />
      <rect x="19" y="5" width="3" height="16" fill="currentColor" opacity="0.7" />
      <line x1="6" y1="15" x2="7" y2="10" strokeDasharray="2,2" opacity="0.5" />
      <line x1="10" y1="10" x2="11" y2="5" strokeDasharray="2,2" opacity="0.5" />
      <line x1="14" y1="5" x2="15" y2="8" strokeDasharray="2,2" opacity="0.5" />
      <line x1="18" y1="8" x2="19" y2="5" strokeDasharray="2,2" opacity="0.5" />
    </svg>
  );
}

export function MultiValueCardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <line x1="2" y1="9" x2="22" y2="9" strokeWidth="1" />
      <line x1="2" y1="15" x2="22" y2="15" strokeWidth="1" />
      <circle cx="7" cy="5.5" r="1" fill="currentColor" />
      <circle cx="7" cy="12" r="1" fill="currentColor" />
      <circle cx="7" cy="18.5" r="1" fill="currentColor" />
    </svg>
  );
}

export function BoxPlotIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="4" x2="12" y2="7" />
      <rect x="8" y="7" width="8" height="10" fill="currentColor" opacity="0.2" />
      <line x1="6" y1="12" x2="18" y2="12" strokeWidth="2" />
      <line x1="12" y1="17" x2="12" y2="20" />
      <line x1="6" y1="4" x2="18" y2="4" />
      <line x1="6" y1="20" x2="18" y2="20" />
    </svg>
  );
}

export function HistogramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="16" width="3" height="5" fill="currentColor" opacity="0.3" />
      <rect x="7" y="12" width="3" height="9" fill="currentColor" opacity="0.5" />
      <rect x="11" y="6" width="3" height="15" fill="currentColor" opacity="0.7" />
      <rect x="15" y="9" width="3" height="12" fill="currentColor" opacity="0.6" />
      <rect x="19" y="14" width="3" height="7" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

export function SunburstIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" fill="currentColor" opacity="0.3" />
      <path d="M12 2 A 10 10 0 0 1 22 12 L12 12 Z" fill="currentColor" opacity="0.2" />
      <path d="M22 12 A 10 10 0 0 1 12 22 L12 12 Z" fill="currentColor" opacity="0.15" />
      <path d="M12 22 A 10 10 0 0 1 2 12 L12 12 Z" fill="currentColor" opacity="0.25" />
    </svg>
  );
}
