/**
 * Página de perfil. Orquestador ligero.
 */

import { motion } from 'framer-motion';
import { useProfileData } from '@/hooks/profile/useProfileData';
import { useProfileActions } from '@/hooks/profile/useProfileActions';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileInfo from '@/components/profile/ProfileInfo';
import ProfileActions from '@/components/profile/ProfileActions';

export default function Profile() {
  const data = useProfileData();
  const actions = useProfileActions(data);

  return (
    <div className="flex flex-col flex-1 min-h-0 px-4">
      <div className="flex flex-col items-center pt-6 pb-6">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <ProfileHeader
              formData={data.formData}
              profile={data.profile}
              avatarSrc={data.avatarSrc}
              initial={data.initial}
              selectedColor={data.selectedColor}
              onPhotoUpload={actions.handlePhotoUpload}
            />

            <ProfileInfo
              formData={data.formData}
              onUpdateField={actions.updateField}
              onPlateChange={actions.handlePlateChange}
              formatPlate={data.formatPlate}
              selectedColor={data.selectedColor}
            />

            <ProfileActions
              onSave={actions.handleSave}
              saving={actions.saving}
              disabled={actions.saving || !data.user?.id}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
