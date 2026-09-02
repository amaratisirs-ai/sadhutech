#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, "..", "public", "images");

// Ensure public/images directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

const images = [
  {
    name: "hero-shield",
    svg: `<svg viewBox="0 0 1024 768" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#60a5fa;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#d946ef;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1024" height="768" fill="#0f172a"/>
      <circle cx="512" cy="384" r="300" fill="url(#grad1)" opacity="0.3"/>
      <circle cx="512" cy="384" r="280" fill="none" stroke="url(#grad2)" stroke-width="2" opacity="0.6"/>
      <path d="M 512 200 L 600 300 L 580 430 L 512 500 L 444 430 L 424 300 Z" fill="url(#grad1)" opacity="0.8"/>
      <g opacity="0.5">
        <circle cx="512" cy="384" r="250" fill="none" stroke="#60a5fa" stroke-width="1" stroke-dasharray="5,5"/>
      </g>
      <text x="512" y="650" font-size="48" font-weight="bold" text-anchor="middle" fill="#60a5fa">PROTECTED</text>
    </svg>`,
  },
  {
    name: "transaction-flow",
    svg: `<svg viewBox="0 0 1024 768" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="flow1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#34d399;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1024" height="768" fill="#0f172a"/>
      <circle cx="200" cy="384" r="50" fill="#10b981" opacity="0.8"/>
      <circle cx="512" cy="384" r="50" fill="#34d399" opacity="0.8"/>
      <circle cx="824" cy="384" r="50" fill="#10b981" opacity="0.8"/>
      <path d="M 250 384 L 462 384" stroke="url(#flow1)" stroke-width="3" fill="none"/>
      <path d="M 562 384 L 774 384" stroke="url(#flow1)" stroke-width="3" fill="none"/>
      <circle cx="380" cy="374" r="8" fill="#34d399"/>
      <circle cx="692" cy="374" r="8" fill="#34d399"/>
      <text x="512" y="650" font-size="48" font-weight="bold" text-anchor="middle" fill="#34d399">VERIFIED FLOW</text>
    </svg>`,
  },
  {
    name: "community-network",
    svg: `<svg viewBox="0 0 1024 768" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="comm1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#10b981;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1024" height="768" fill="#0f172a"/>
      <circle cx="300" cy="250" r="40" fill="#fbbf24" opacity="0.8"/>
      <circle cx="724" cy="250" r="40" fill="#10b981" opacity="0.8"/>
      <circle cx="512" cy="500" r="40" fill="#fbbf24" opacity="0.8"/>
      <circle cx="512" cy="300" r="50" fill="#10b981" opacity="0.6"/>
      <line x1="300" y1="250" x2="512" y2="300" stroke="url(#comm1)" stroke-width="2" opacity="0.6"/>
      <line x1="724" y1="250" x2="512" y2="300" stroke="url(#comm1)" stroke-width="2" opacity="0.6"/>
      <line x1="512" y1="300" x2="512" y2="500" stroke="url(#comm1)" stroke-width="2" opacity="0.6"/>
      <line x1="300" y1="250" x2="512" y2="500" stroke="url(#comm1)" stroke-width="1" opacity="0.3" stroke-dasharray="5,5"/>
      <line x1="724" y1="250" x2="512" y2="500" stroke="url(#comm1)" stroke-width="1" opacity="0.3" stroke-dasharray="5,5"/>
      <text x="512" y="650" font-size="48" font-weight="bold" text-anchor="middle" fill="#fbbf24">CONNECTED</text>
    </svg>`,
  },
  {
    name: "wallet-protection",
    svg: `<svg viewBox="0 0 1024 768" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wallet1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1024" height="768" fill="#0f172a"/>
      <rect x="350" y="250" width="324" height="220" rx="20" fill="#06b6d4" opacity="0.2" stroke="url(#wallet1)" stroke-width="2"/>
      <rect x="370" y="280" width="284" height="40" rx="10" fill="#3b82f6" opacity="0.3"/>
      <circle cx="400" cy="380" r="30" fill="#06b6d4" opacity="0.6"/>
      <circle cx="512" cy="380" r="30" fill="#3b82f6" opacity="0.6"/>
      <circle cx="624" cy="380" r="30" fill="#06b6d4" opacity="0.6"/>
      <path d="M 380 450 L 644 450" stroke="#06b6d4" stroke-width="2" opacity="0.6"/>
      <path d="M 385 460 L 390 470 M 425 460 L 430 470 M 465 460 L 470 470 M 505 460 L 510 470 M 545 460 L 550 470 M 585 460 L 590 470 M 625 460 L 630 470" stroke="#3b82f6" stroke-width="2" opacity="0.6"/>
      <text x="512" y="650" font-size="48" font-weight="bold" text-anchor="middle" fill="#06b6d4">SECURED</text>
    </svg>`,
  },
  {
    name: "threat-detection",
    svg: `<svg viewBox="0 0 1024 768" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="threat1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f97316;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1024" height="768" fill="#0f172a"/>
      <circle cx="512" cy="384" r="120" fill="url(#threat1)" opacity="0.1" stroke="url(#threat1)" stroke-width="2"/>
      <circle cx="512" cy="384" r="90" fill="url(#threat1)" opacity="0.2" stroke="url(#threat1)" stroke-width="2"/>
      <circle cx="512" cy="384" r="60" fill="url(#threat1)" opacity="0.3"/>
      <text x="512" y="395" font-size="120" font-weight="bold" text-anchor="middle" fill="#ef4444" opacity="0.8">!</text>
      <path d="M 300 200 L 400 300 M 400 200 L 300 300" stroke="#f97316" stroke-width="3" opacity="0.6"/>
      <path d="M 700 500 L 800 600 M 800 500 L 700 600" stroke="#f97316" stroke-width="3" opacity="0.6"/>
      <text x="512" y="650" font-size="48" font-weight="bold" text-anchor="middle" fill="#ef4444">THREAT ALERT</text>
    </svg>`,
  },
];

function svgToBase64(svg) {
  return Buffer.from(svg).toString("base64");
}

async function createImages() {
  console.log("📊 Creating beautiful SVG images...\n");

  for (const { name, svg } of images) {
    // Save as SVG
    const svgPath = path.join(PUBLIC_DIR, `${name}.svg`);
    fs.writeFileSync(svgPath, svg);
    console.log(`✅ Created ${name}.svg`);

    // Create data URL version for potential inline use
    const dataUrl = `data:image/svg+xml;base64,${svgToBase64(svg)}`;
    const dataUrlPath = path.join(PUBLIC_DIR, `${name}-data-url.txt`);
    fs.writeFileSync(dataUrlPath, dataUrl);
  }

  console.log("\n✅ All images created successfully!");
  console.log(`📁 Images saved to: ${PUBLIC_DIR}`);
}

createImages().catch(console.error);
