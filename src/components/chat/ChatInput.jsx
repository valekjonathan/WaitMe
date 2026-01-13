import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Send, FileText, Image, X } from 'lucide-react';

export default function ChatInput({
  newMessage,
  setNewMessage,
  attachments,
  setAttachments,
  onSendMessage,
  onFileSelect,
  isPending,
  handleTyping,
  handleKeyPress
}) {
  const fileInputRef = useRef(null);

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed bottom-24 left-0 right-0 bg-black/90 backdrop-blur-sm border-t-2 border-gray-700 p-4">
      <div>
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((att, idx) => (
              <div key={idx} className="bg-gray-800 rounded-lg px-3 py-2 text-xs flex items-center gap-2 border border-purple-500/30">
                {att.type.includes('image') ? <Image className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                <span className="truncate max-w-[100px]">{att.name}</span>
                <button onClick={() => removeAttachment(idx)} className="text-gray-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={onSendMessage} className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileSelect}
            multiple
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-purple-400 hover:text-purple-300 flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-gray-900 border-gray-800 text-white"
            disabled={isPending}
          />
          <Button
            type="submit"
            size="icon"
            className="bg-purple-600 hover:bg-purple-700 flex-shrink-0"
            disabled={(!newMessage.trim() && attachments.length === 0) || isPending}
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}