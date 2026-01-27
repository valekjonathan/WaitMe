import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, User, Coins, Bell, Shield, LogOut, ChevronRight, CreditCard, HelpCircle, Star, MessageCircle, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/lib/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');

  useEffect(() => {
    // Damos un pequeño delay para simular carga de configuración si se requiere
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) return;
    try {
      // Lógica para cambiar contraseña (por ejemplo usando Base44 auth)
      // await base44.auth.updatePassword(oldPassword, newPassword);
      alert('Contraseña cambiada exitosamente (simulado)');
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      alert('No se pudo cambiar la contraseña.');
    }
  };

  const handleLogout = async () => {
    // Logout utilizando Base44 (u otra estrategia)
    await base44.auth.signOut();
    window.location.href = createPageUrl('Home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gray-400">Cargando ajustes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Ajustes" showBackButton={true} backTo="Home" />
      <main className="pt-[60px] pb-24 px-4">
        <div className="space-y-6">
          <div>
            <Link to={createPageUrl('Profile')} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-purple-400" />
                <span>Mi perfil</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
            <Separator />
            <Link to={createPageUrl('NotificationSettings')} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-purple-400" />
                <span>Notificaciones</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
            <Separator />
          </div>
          <div className="space-y-3">
            <p className="text-gray-400 text-sm">Cuenta</p>
            <div>
              <Label htmlFor="old_password">Contraseña actual</Label>
              <Input
                id="old_password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="new_password">Nueva contraseña</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <Button className="mt-2 bg-purple-600 hover:bg-purple-700 w-full" onClick={handleChangePassword}>
              Cambiar contraseña
            </Button>
          </div>
          <div className="space-y-3">
            <p className="text-gray-400 text-sm">Seguridad</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-purple-400" />
                <span>Usar huella digital/FaceID</span>
              </div>
              <Switch />
            </div>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-3">Otros</p>
            <Link to="#" className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-purple-400" />
                <span>Centro de ayuda</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
            <Separator />
            <Link to="#" className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-purple-400" />
                <span>Califícanos</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          </div>
          <Button variant="outline" className="w-full border-gray-700 text-red-400 mt-6" onClick={handleLogout}>
            <LogOut className="w-5 h-5 mr-2" />
            Cerrar sesión
          </Button>
          <div className="flex items-center justify-center mt-8 text-gray-500 text-sm">
            <Logo className="w-5 h-5 mr-2 text-purple-500" />
            <span>WaitMe! v1.0.0</span>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}