import { Download, Copy, Check, Smartphone, Laptop } from 'lucide-react';
import { useState } from 'react';

export default function LogoDownloadPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [copiedColor, setCopiedColor] = useState('');

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(type);
    setTimeout(() => setCopiedColor(''), 2000);
  };

  const downloadLogo = (format: 'png' | 'svg', size: 'sm' | 'md' | 'lg' | 'xl') => {
    const sizes = {
      sm: { width: 256, height: 256, label: '256px' },
      md: { width: 512, height: 512, label: '512px' },
      lg: { width: 1024, height: 1024, label: '1024px' },
      xl: { width: 2048, height: 2048, label: '2048px' },
    };

    const sizeInfo = sizes[size];

    if (format === 'svg') {
      const svgContent = generateSVG(true);
      downloadFile(svgContent, `danhausa-logo.svg`, 'image/svg+xml');
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = sizeInfo.width;
      canvas.height = sizeInfo.width;
      const ctx = canvas.getContext('2d')!;

      // Draw background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#4f83f3');
      gradient.addColorStop(1, '#2e42c1');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Round corners
      const radius = 20 * (canvas.width / 100);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(canvas.width - radius, 0);
      ctx.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
      ctx.lineTo(canvas.width, canvas.height - radius);
      ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height);
      ctx.lineTo(radius, canvas.height);
      ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw SVG as image on canvas
      const svgString = generateSVG(true);
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `danhausa-logo-${sizeInfo.label}.png`;
            link.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateSVG = (includeGradient = true) => {
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f83f3" />
      <stop offset="100%" stop-color="#2e42c1" />
    </linearGradient>
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22c55e" />
      <stop offset="100%" stop-color="#16a34a" />
    </linearGradient>
  </defs>

  <rect width="100" height="100" fill="url(#logoGradient)" rx="20" />

  <g transform="translate(50, 50)">
    <circle cx="0" cy="0" r="32" fill="white" opacity="0.15" />

    <path d="M -12 -8 L -6 -14 L 0 -8 L 6 -14 L 12 -8 L 12 8 Q 12 12 8 14 L -8 14 Q -12 12 -12 8 Z" fill="white" opacity="0.9" />

    <rect x="-16" y="-4" width="6" height="8" fill="url(#accentGradient)" rx="1" />
    <rect x="10" y="-4" width="6" height="8" fill="url(#accentGradient)" rx="1" />

    <circle cx="-6" cy="8" r="2" fill="url(#accentGradient)" />
    <circle cx="6" cy="8" r="2" fill="url(#accentGradient)" />
  </g>
</svg>`;
  };

  const brandColors = [
    { name: 'Primary Blue', hex: '#4f83f3', rgb: 'rgb(79, 131, 243)' },
    { name: 'Primary Dark Blue', hex: '#2e42c1', rgb: 'rgb(46, 66, 193)' },
    { name: 'Accent Green', hex: '#22c55e', rgb: 'rgb(34, 197, 94)' },
    { name: 'Accent Dark Green', hex: '#16a34a', rgb: 'rgb(22, 163, 74)' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Logo & Brand Assets</h1>
            <p className="text-xl text-gray-600">Download official Danhausa brand materials</p>
          </div>
          <button
            onClick={() => onNavigate('home')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Logo Preview</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-8 min-h-64">
                <svg
                  viewBox="0 0 100 100"
                  width="160"
                  height="160"
                  className="drop-shadow-lg"
                >
                  <defs>
                    <linearGradient id="logoGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4f83f3" />
                      <stop offset="100%" stopColor="#2e42c1" />
                    </linearGradient>
                    <linearGradient id="accentGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#16a34a" />
                    </linearGradient>
                  </defs>
                  <rect width="100" height="100" fill="url(#logoGradient1)" rx="20" />
                  <g transform="translate(50, 50)">
                    <circle cx="0" cy="0" r="32" fill="white" opacity="0.15" />
                    <path
                      d="M -12 -8 L -6 -14 L 0 -8 L 6 -14 L 12 -8 L 12 8 Q 12 12 8 14 L -8 14 Q -12 12 -12 8 Z"
                      fill="white"
                      opacity="0.9"
                    />
                    <rect x="-16" y="-4" width="6" height="8" fill="url(#accentGradient1)" rx="1" />
                    <rect x="10" y="-4" width="6" height="8" fill="url(#accentGradient1)" rx="1" />
                    <circle cx="-6" cy="8" r="2" fill="url(#accentGradient1)" />
                    <circle cx="6" cy="8" r="2" fill="url(#accentGradient1)" />
                  </g>
                </svg>
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Logo Specifications</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span>Modern, scalable design</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span>Works on any background</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span>Professional color gradients</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span>Available in multiple formats</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Quick Download</h4>
                  <button
                    onClick={() => downloadLogo('png', 'md')}
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
                  >
                    <Download size={20} />
                    Download Logo (512px PNG)
                  </button>
                </div>
              </div>
            </div>

            <hr className="my-8" />

            <h3 className="text-xl font-bold text-gray-900 mb-6">Download Options</h3>

            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">PNG Format (Recommended for web)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { size: 'sm' as const, label: '256px' },
                    { size: 'md' as const, label: '512px' },
                    { size: 'lg' as const, label: '1024px' },
                    { size: 'xl' as const, label: '2048px' },
                  ].map((item) => (
                    <button
                      key={item.size}
                      onClick={() => downloadLogo('png', item.size)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Download size={18} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4">SVG Format (For scalability)</h4>
                <button
                  onClick={() => downloadLogo('svg', 'md')}
                  className="bg-green-50 hover:bg-green-100 text-green-700 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2 w-full md:w-auto"
                >
                  <Download size={20} />
                  Download SVG (Vector)
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Brand Colors</h2>

            <div className="space-y-4">
              {brandColors.map((color) => (
                <div key={color.hex}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{color.name}</h4>
                  </div>

                  <div className="flex gap-2 items-center">
                    <div
                      className="w-12 h-12 rounded-lg shadow-md border-2 border-gray-200"
                      style={{ backgroundColor: color.hex }}
                    ></div>

                    <div className="flex-1 space-y-1">
                      <button
                        onClick={() => handleCopy(color.hex, color.hex)}
                        className="flex items-center gap-2 w-full px-2 py-1 bg-gray-50 hover:bg-gray-100 rounded text-xs font-mono text-gray-700 transition-colors"
                      >
                        {copiedColor === color.hex ? (
                          <>
                            <Check size={14} className="text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            {color.hex}
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleCopy(color.rgb, color.name + '-rgb')}
                        className="flex items-center gap-2 w-full px-2 py-1 bg-gray-50 hover:bg-gray-100 rounded text-xs font-mono text-gray-700 transition-colors"
                      >
                        {copiedColor === color.name + '-rgb' ? (
                          <>
                            <Check size={14} className="text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            RGB
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Brand Guidelines</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Always maintain clear space around logo</li>
                <li>• Don't distort or rotate the logo</li>
                <li>• Use official brand colors only</li>
                <li>• Ensure sufficient contrast with background</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Need Custom Branding?</h2>
            <p className="text-lg opacity-90 mb-6">
              For custom logo variations, color schemes, or other branding needs, please contact our team.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => onNavigate('contact')}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Contact Us
              </button>
              <button
                onClick={() => onNavigate('home')}
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
