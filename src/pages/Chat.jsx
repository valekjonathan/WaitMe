import React, { useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';

export default function Chat() {
  const params = new URLSearchParams(window.location.search);
  const demoId = params.get('demo');
  const demoName = params.get('name') || 'Usuario';
  const demoPhoto = params.get('photo') || null;
  const threadId = params.get('threadId');

  const [user, setUser] = useState(null);
  const [text, setText] = useState('');
  const [demoMessages, setDemoMessages] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
      } catch (e) {}
    })();
  }, []);

  const initialDemoMessages = useMemo(() => {
    if (!demoId) return [];
    return [
      { id: 'm1', from: 'them', text: 'Hola, ¿sigues ahí?', ts: Date.now() - 6 * 60 * 1000 },
      { id: 'm2', from: 'me', text: 'Sí, dime.', ts: Date.now() - 5 * 60 * 1000 },
      { id: 'm3', from: 'them', text: 'Estoy a 12 min. Te lo dejo en 4€.', ts: Date.now() - 4 * 60 * 1000 },
      { id: 'm4', from: 'me', text: 'Perfecto. Avísame cuando estés a 2 min.', ts: Date.now() - 3 * 60 * 1000 }
    ];
  }, [demoId]);

  useEffect(() => {
    if (demoId) setDemoMessages(initialDemoMessages);
  }, [demoId, initialDemoMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [demoMessages]);

  const sendDemo = () => {
    const t = text.trim();
    if (!t) return;
    setDemoMessages((m) => [...m, { id: `m_${Date.now()}`, from: 'me', text: t, ts: Date.now() }]);
    setText('');

    // respuesta automática demo
    setTimeout(() => {
      setDemoMessages((m) => [
        ...m,
        { id: `m_${Date.now()}_r`, from: 'them', text: 'Ok 👍', ts: Date.now() }
      ]);
    }, 600);
  };

  // Si tienes chat real en BD, aquí lo conectarás luego. Ahora no rompe nada:
  const hasReal = !!threadId && !demoId;

  return (
    <div className="min-h-screen bg-black text-white">
      <Header
        title={demoId ? demoName : 'Chat'}
        showBackButton={true}
        onBack={() => (window.location.href = createPageUrl('Chats'))}
      />

      <main className="pt-16 pb-24 px-4">
        {hasReal ? (
          <div className="text-center py-20 text-gray-500">
            Chat real pendiente de conectar a tu entidad de mensajes.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-2">
              {demoPhoto ? (
                <img src={demoPhoto} alt="" className="w-10 h-10 rounded-xl object-cover border-2 border-purple-500" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gray-800 border-2 border-purple-500" />
              )}
              <div className="min-w-0">
                <p className="font-semibold text-white truncate">{demoName}</p>
                <p className="text-xs text-gray-400">Demo</p>
              </div>
            </div>

            {demoMessages.map((m) => (
              <div key={m.id} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm border ${
                    m.from === 'me'
                      ? 'bg-purple-600/30 border-purple-500/40 text-white'
                      : 'bg-gray-900 border-gray-800 text-gray-200'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      {/* input */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 border-t-2 border-gray-700 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Escribe un mensaje..."
          />
          <Button
            onClick={sendDemo}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-10 w-10 p-0 flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}