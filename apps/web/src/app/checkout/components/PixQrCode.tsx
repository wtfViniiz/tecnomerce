'use client';

interface PixQrCodeProps {
  qrCodeBase64: string;
  copyPasteCode: string;
}

export function PixQrCode({ qrCodeBase64, copyPasteCode }: PixQrCodeProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyPasteCode);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = copyPasteCode;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="overflow-hidden rounded-md border border-gray-200 bg-white p-4 shadow-soft">
          <img
            src={`data:image/png;base64,${qrCodeBase64}`}
            alt="QR Code PIX"
            className="h-48 w-48"
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-charcoal/60 uppercase tracking-wide">
          Codigo copia e cola
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={copyPasteCode}
            className="flex-1 min-w-0 rounded-sm border border-gray-300 bg-gray-50 px-3 py-2.5 text-xs font-mono text-charcoal/70 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="flex-shrink-0 rounded-sm bg-charcoal px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-charcoal-surface"
          >
            Copiar
          </button>
        </div>
      </div>
    </div>
  );
}
