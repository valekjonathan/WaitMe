import React from 'react';

export default function ChatHeader({ otherUserPhoto, otherUserName }) {
  return (

  );
}

export function ChatAvatar({ photo, name }) {
  return (
    <div className="flex items-center gap-3">
      {photo ? (
        <img 
          src={photo} 
          alt={name} 
          className="w-10 h-10 rounded-full object-cover border border-purple-500 flex-shrink-0" 
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center flex-shrink-0 border border-purple-500" />
      )}
      <h2 className="text-white font-semibold">{name}</h2>
    </div>
  );
}