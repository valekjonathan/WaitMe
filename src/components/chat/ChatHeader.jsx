import React from 'react';

export default function ChatHeader({ otherUserPhoto, otherUserName }) {
  return (
    <div className="pt-16 flex items-center justify-between px-4 py-4 border-b border-gray-700">
      <ChatAvatar photo={otherUserPhoto} name={otherUserName} />
      <div />
    </div>
  );
}

export function ChatAvatar({ photo, name }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-purple-500">
        {photo && (
          <img 
            src={photo} 
            alt={name} 
            className="w-full h-full object-cover" 
          />
        )}
      </div>
      <h2 className="text-white font-semibold">{name}</h2>
    </div>
  );
}