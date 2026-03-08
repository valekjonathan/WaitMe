/**
 * Botón de guardar perfil.
 */

import { Button } from '@/components/ui/button';

export default function ProfileActions({ onSave, saving, disabled }) {
  return (
    <Button
      onClick={onSave}
      disabled={disabled}
      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl mt-4"
    >
      {saving ? 'Guardando...' : 'Guardar'}
    </Button>
  );
}
