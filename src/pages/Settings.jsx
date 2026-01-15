import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft,
  User,
  Coins,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  CreditCard,
  HelpCircle,
  Star,
  MessageCircle,
  Settings as SettingsIcon } from
'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import BottomNav from '@/components/BottomNav';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [allowCalls, setAllowCalls] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setPhone(currentUser.phone || '');
        setAllowCalls(currentUser.allow_phone_calls || false);
      } catch (error) {
        console.log('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSavePhone = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ phone, allow_phone_calls: allowCalls });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-purple-500">Cargando...</div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="text-white">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-3 py-1 flex items-center gap-1">
              <span className="text-purple-400 font-bold text-sm">{(user?.credits || 0).toFixed(2)}€</span>
            </div>
            <Link to={createPageUrl('Home')}>
              <h1 className="text-lg font-semibold cursor-pointer hover:opacity-80 transition-opacity">
                <span className="text-white">Wait</span><span className="text-purple-500">Me!</span>
              </h1>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <Link to={createPageUrl('Settings')}>
              <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20">
                <SettingsIcon className="w-5 h-5" />
              </Button>
            </Link>
            <Link to={createPageUrl('Chats')} className="relative">
              <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20">
                <MessageCircle className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-20 pb-24 px-4 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }} className="my-2 space-y-3">


          {/* Perfil resumen */}
          <Link to={createPageUrl('Profile')}>
            <div className="bg-gray-900 rounded-2xl p-4 flex items-center gap-4 hover:bg-gray-800/50 transition-colors">
              {user?.photo_url ?
              <img src={user.photo_url} className="w-14 h-14 rounded-full object-cover" alt="" /> :

              <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center">
                  <User className="w-7 h-7 text-gray-500" />
                </div>
              }
              <div className="flex-1">
                <p className="font-semibold">{user?.display_name || user?.full_name?.split(' ')[0]}</p>
                <p className="text-sm text-gray-400">{user?.email}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </div>
          </Link>

          {/* Créditos */}
          <div className="bg-gradient-to-r from-purple-900/50 to-purple-600/30 rounded-2xl p-5 border-2 border-purple-500">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Coins className="w-6 h-6 text-purple-400" />
                <span className="font-medium">Mis créditos</span>
              </div>
              <span className="text-2xl font-bold text-purple-400">
                {(user?.credits || 0).toFixed(2)}€
              </span>
            </div>
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              <CreditCard className="w-4 h-4 mr-2" />
              Añadir créditos
            </Button>
          </div>

          {/* Opciones */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 divide-y divide-gray-800">
            <Link to={createPageUrl('NotificationSettings')} className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/50 transition-colors">
              <Bell className="w-5 h-5 text-purple-500" />
              <span className="flex-1">Notificaciones</span>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </Link>
            
            <button className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/50 transition-colors">
              <Shield className="w-5 h-5 text-purple-500" />
              <span className="flex-1">Privacidad</span>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
            
            <button className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/50 transition-colors">
              <Star className="w-5 h-5 text-purple-500" />
              <span className="flex-1">Valorar la app</span>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
            
            <button className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/50 transition-colors">
              <HelpCircle className="w-5 h-5 text-purple-500" />
              <span className="flex-1">Ayuda</span>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Cerrar sesión */}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300">

            <LogOut className="w-5 h-5 mr-2" />
            Cerrar sesión
          </Button>

          {/* Footer */}
          <div className="text-center pt-4">
            <Logo size="sm" />
            <p className="text-xs text-gray-500 mt-2">Versión 1.0.0</p>
          </div>
        </motion.div>
      </main>
      
      <BottomNav />
    </div>);

}