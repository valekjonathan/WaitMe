import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, MessageCircle } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();

  const baseBtn =
    "flex-1 flex flex-col items-center justify-center text-purple-400 h-[60px] rounded-lg";

  const activeStyle = "bg-purple-700/40 border border-purple-500/50";

  const labelClass =
    "text-[10px] font-bold leading-none mt-[2px] whitespace-nowrap";

  const divider = <div className="w-px h-8 bg-gray-700" />;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-700 px-4 pt-[6px] pb-2 z-[2147483647]">
      <div className="flex items-center max-w-md mx-auto">

        <NavLink
          to="/history"
          className={({ isActive }) => `${baseBtn} ${isActive ? activeStyle : ""}`}
        >
          <span className={labelClass}>Alertas</span>
        </NavLink>

        {divider}

        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new Event('forceGoHome'));
            navigate('/');
          }}
          className={baseBtn}
        >
          <span className={labelClass}>Mapa</span>
        </button>

        {divider}

        <NavLink
          to="/notifications"
          className={({ isActive }) => `${baseBtn} ${isActive ? activeStyle : ""}`}
        >
          <Bell className="w-6 h-6" />
          <span className={labelClass}>Notificaciones</span>
        </NavLink>

        {divider}

        <NavLink
          to="/chats"
          className={({ isActive }) => `${baseBtn} ${isActive ? activeStyle : ""}`}
        >
          <MessageCircle className="w-6 h-6" />
          <span className={labelClass}>Chats</span>
        </NavLink>

      </div>
    </nav>
  );
}
