import React from 'react';

// Common props for icons for consistency
const iconProps = {
  strokeWidth: "1.5",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
};

export const BookOpenIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...iconProps} className="w-6 h-6" {...props}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  </svg>
);

export const ChartBarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...iconProps} className="w-6 h-6" {...props}>
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
);

export const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...iconProps} className="w-6 h-6" {...props}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export const MessageSquareIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...iconProps} className="w-6 h-6" {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...iconProps} className="w-6 h-6" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...iconProps} className="w-6 h-6" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export const FlameIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...iconProps} className="w-6 h-6" {...props}>
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
);

export const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...iconProps} className="w-4 h-4 text-white" {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const LoaderIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg className="w-6 h-6 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export const MicIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...iconProps} className="w-6 h-6" {...props}>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" y1="19" x2="12" y2="22"></line>
  </svg>
);

export const SendIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...iconProps} className="w-5 h-5" {...props}>
        <path d="M22 2 11 13" />
        <path d="m22 2-7 20-4-9-9-4 20-7z" />
    </svg>
);

export const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...iconProps} className="w-6 h-6" {...props}>
        <path d="m12 3-1.9 1.9-1.4-1.4-1.9 1.9-1.9-1.9L3.5 5l-1.9 1.9L3 8.8l1.9 1.9-1.9 1.9-1.4 1.4 1.9 1.9 1.9-1.9L5 20.5l1.9-1.9L8.8 21l1.9-1.9 1.9 1.9 1.4 1.4-1.9-1.9-1.9 1.9L19 19.1l1.9-1.9-1.4-1.4 1.9-1.9 1.9 1.9L20.5 12l1.9-1.9-1.9-1.9L21 3.5l-1.9 1.9-1.9-1.9Z" />
    </svg>
);

export const Volume2Icon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...iconProps} className="w-6 h-6" {...props}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
  </svg>
);

export const ClipboardCheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...iconProps} className="w-6 h-6" {...props}>
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="m9 14 2 2 4-4" />
    </svg>
);
