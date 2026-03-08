/**
 * Input de mensaje con adjuntos.
 */

import { Send, Paperclip, Camera, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatInput({
  message,
  setMessage,
  attachments,
  setAttachments,
  showAttachMenu,
  setShowAttachMenu,
  attachMenuRef,
  fileInputRef,
  cameraInputRef,
  handleSend,
  handleFileUpload,
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 pb-[81px]">
      <div className="max-w-3xl mx-auto px-4 py-2.5 pt-[8px]">
        {attachments.length > 0 && (
          <div className="mb-2 flex gap-2">
            {attachments.map((att, i) => (
              <div key={i} className="relative">
                {att.type?.includes('image') ? (
                  <img src={att.url} alt="" className="w-16 h-16 rounded object-cover" />
                ) : (
                  <div className="w-16 h-16 bg-gray-800 rounded flex items-center justify-center text-xs">
                    📄
                  </div>
                )}
                <button
                  onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="relative" ref={attachMenuRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="text-purple-400 hover:bg-gray-800 rounded-md"
            >
              <Paperclip className="w-5 h-5" />
            </Button>

            <AnimatePresence>
              {showAttachMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-12 left-0 bg-gray-800 border border-gray-700 rounded-md overflow-hidden shadow-xl"
                >
                  <button
                    onClick={() => {
                      cameraInputRef.current?.click();
                      setShowAttachMenu(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700 w-full text-left whitespace-nowrap"
                  >
                    <Camera className="w-5 h-5 text-purple-400" />
                    <span className="text-sm text-white">Hacer foto</span>
                  </button>
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowAttachMenu(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700 w-full text-left whitespace-nowrap border-t border-gray-700"
                  >
                    <ImageIcon className="w-5 h-5 text-purple-400" />
                    <span className="text-sm text-white">Subir foto</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFileUpload(e, setAttachments, setShowAttachMenu)}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,application/pdf"
              onChange={(e) => handleFileUpload(e, setAttachments, setShowAttachMenu)}
              className="hidden"
            />
          </div>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) =>
              e.key === 'Enter' &&
              !e.shiftKey &&
              (e.preventDefault(), handleSend(message, attachments))
            }
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-purple-900/30 border border-purple-700/50 rounded-md px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-400 h-[42px]"
          />

          <Button
            onClick={() => handleSend(message, attachments)}
            disabled={!String(message || '').trim() && attachments.length === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-md h-[42px] w-10 p-0 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
