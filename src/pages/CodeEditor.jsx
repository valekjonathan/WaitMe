import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check } from 'lucide-react';

export default function CodeEditor() {
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Editor de Código</h1>
          <Button
            onClick={handleCopy}
            disabled={!code}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </>
            )}
          </Button>
        </div>
        
        <Textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Pega tu código aquí..."
          className="min-h-[calc(100vh-200px)] font-mono text-sm bg-gray-900 border-gray-700 text-white"
        />
      </div>
    </div>
  );
}