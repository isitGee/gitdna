import type { SVGProps } from 'react'

const s = (p: SVGProps<SVGSVGElement>) => ({
  width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const, ...p,
})

export const GitHubIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...s(p)} strokeWidth={1.8}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
)
export const StarIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...s(p)} strokeWidth={1.8}><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
)
export const ForkIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...s(p)} strokeWidth={1.8}><circle cx="6" cy="5" r="2.5" /><circle cx="18" cy="5" r="2.5" /><circle cx="12" cy="19" r="2.5" /><path d="M6 7.5v1a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-1M12 11.5v5" /></svg>
)
export const DnaIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...s(p)} strokeWidth={1.8}><path d="M5 3v18M19 3v18M5 7c4 3 10 3 14 0M5 17c4-3 10-3 14 0M5 12h14" /></svg>
)
export const MapIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...s(p)} strokeWidth={1.8}><circle cx="5.5" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="12" cy="18" r="2.5" /><path d="M7.6 7.4 10.4 16M16.2 7.8 13.6 16M8 6h7.5" /></svg>
)
export const GuideIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...s(p)} strokeWidth={1.8}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><path d="M9 7h7M9 11h7" /></svg>
)
export const SearchIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...s(p)} strokeWidth={1.8}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" /></svg>
)
export const ShareIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...s(p)} strokeWidth={1.8}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>
)
export const FileIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...s(p)} strokeWidth={1.8}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
)
export const FolderIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...s(p)} strokeWidth={1.8}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
)
export const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...s(p)} strokeWidth={2.4}><path d="m4 12.5 5 5L20 6.5" /></svg>
)
export const CloseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...s(p)} strokeWidth={2}><path d="M18 6 6 18M6 6l12 12" /></svg>
)
export const ExternalIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...s(p)} strokeWidth={1.8}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" /></svg>
)
export const SparkIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...s(p)} strokeWidth={1.8}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /><circle cx="12" cy="12" r="3.5" /></svg>
)
export const PlusIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...s(p)} strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
)
export const MinusIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...s(p)} strokeWidth={2}><path d="M5 12h14" /></svg>
)
export const FitIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...s(p)} strokeWidth={1.8}><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" /></svg>
)
export const ResetIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...s(p)} strokeWidth={1.8}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
)
export const FilterIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...s(p)} strokeWidth={1.8}><path d="M22 3H2l8 9.5V19l4 2v-8.5L22 3z" /></svg>
)
export const AlertIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...s(p)} strokeWidth={1.8}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.5" /></svg>
)
export const LogoMark = () => (
  <svg className="logo" viewBox="0 0 32 32" aria-hidden="true">
    <rect width="32" height="32" rx="8" fill="#0B5FDB" />
    <path d="M8 24V8M24 8v16M8 11c4-3 12-3 16 0M8 21c4 3 12 3 16 0M8 16h16" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none" />
  </svg>
)
