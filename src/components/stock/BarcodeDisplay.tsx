'use client';

import dynamic from 'next/dynamic';
import { Printer } from 'lucide-react';

// react-barcode utilise le DOM — on le charge uniquement côté client
const Barcode = dynamic(() => import('react-barcode'), { ssr: false });

interface BarcodeDisplayProps {
  value: string;
  /** Afficher le bouton d'impression */
  printable?: boolean;
  /** Hauteur des barres en px (défaut 60) */
  height?: number;
}

export function BarcodeDisplay({ value, printable = true, height = 60 }: BarcodeDisplayProps) {
  if (!value) return null;

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=400,height=300');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Code-barres — ${value}</title>
          <style>
            body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: monospace; background: #fff; }
            svg { max-width: 100%; }
          </style>
        </head>
        <body>
          <div id="bc"></div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
          <script>
            var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
            document.getElementById('bc').appendChild(svg);
            JsBarcode(svg, '${value}', { format:'EAN13', width:2, height:80, displayValue:true, fontSize:14 });
            window.print();
            window.close();
          <\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="bg-white rounded-lg p-3 inline-block">
        <Barcode
          value={value}
          format="EAN13"
          width={1.5}
          height={height}
          displayValue={true}
          fontSize={12}
          textMargin={4}
          margin={4}
          background="#ffffff"
          lineColor="#000000"
        />
      </div>
      {printable && (
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <Printer className="w-3 h-3" />
          Imprimer
        </button>
      )}
    </div>
  );
}
