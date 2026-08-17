import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Exact SVG representation of the AI Study Buddy Brain Logo
const svgLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="50%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
  </defs>
  
  <!-- Rounded Squircle / Circle Badge -->
  <rect x="16" y="16" width="480" height="480" rx="140" fill="url(#bgGrad)" filter="url(#glow)"/>
  
  <!-- Central Brain Vector Icon matching uploaded design -->
  <g fill="none" stroke="#ffffff" stroke-width="26" stroke-linecap="round" stroke-linejoin="round">
    <!-- Left Hemisphere Outer Lobes -->
    <path d="M 236 128 
             C 190 128 150 148 136 186 
             C 106 200 88 232 92 268 
             C 96 304 122 334 156 342 
             C 152 366 172 396 204 402 
             C 226 406 242 394 246 380
             L 246 142 Z" />
             
    <!-- Left Hemisphere Inner Folds -->
    <path d="M 136 186 C 160 210 190 214 244 214" />
    <path d="M 92 268 C 130 274 164 266 200 286 C 220 298 238 316 246 346" />
    <path d="M 156 342 C 174 340 196 352 208 376" />
    
    <!-- Right Hemisphere Outer Lobes (Symmetric) -->
    <path d="M 276 128 
             C 322 128 362 148 376 186 
             C 406 200 424 232 420 268 
             C 416 304 390 334 356 342 
             C 360 366 340 396 308 402 
             C 286 406 270 394 266 380
             L 266 142 Z" />
             
    <!-- Right Hemisphere Inner Folds -->
    <path d="M 376 186 C 352 210 322 214 268 214" />
    <path d="M 420 268 C 382 274 348 266 312 286 C 292 298 274 316 266 346" />
    <path d="M 356 342 C 338 340 316 352 304 376" />

    <!-- Center Neural Bridge / Stem Accent -->
    <line x1="256" y1="160" x2="256" y2="368" stroke="#ffffff" stroke-width="16" stroke-linecap="round" opacity="0.4" />
  </g>
</svg>`;

async function generateFavicons() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Save SVG
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgLogo.trim());
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgLogo.trim());

  // Generate 512x512 PNG
  await sharp(Buffer.from(svgLogo))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'logo.png'));

  // Generate 192x192 PNG for PWA / Android
  await sharp(Buffer.from(svgLogo))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'logo-192.png'));

  // Generate Apple Touch Icon 180x180
  await sharp(Buffer.from(svgLogo))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // Generate 32x32 PNG for standard browser tab favicon
  await sharp(Buffer.from(svgLogo))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));

  // Generate 16x16 PNG
  await sharp(Buffer.from(svgLogo))
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));

  // Generate favicon.ico (using 32x32 png buffer or sharp ico output)
  await sharp(Buffer.from(svgLogo))
    .resize(48, 48)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));

  console.log('Favicons and logo assets generated successfully in /public!');
}

generateFavicons().catch(err => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
