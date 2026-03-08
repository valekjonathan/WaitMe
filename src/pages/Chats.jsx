/**
 * Pantalla Chats — orquestador.
 */

import { useEffect, useRef, useState } from 'react';
import { useChatsData } from '@/hooks/chats/useChatsData';
import { useChatsActions } from '@/hooks/chats/useChatsActions';
import ChatList from '@/components/chats/ChatList';
import ProrrogaDialog from '@/components/chats/ProrrogaDialog';

export default function Chats() {
  const data = useChatsData();
  const actions = useChatsActions(data);

  const [showProrrogaDialog, setShowProrrogaDialog] = useState(false);
  const [selectedProrroga, setSelectedProrroga] = useState(null);
  const [currentExpiredAlert, setCurrentExpiredAlert] = useState(null);
  const expiredHandledRef = useRef(new Set());

  useEffect(() => {
    const max = 25;
    for (const conv of data.filteredConversations.slice(0, max)) {
      const alert = data.alertsMap.get(conv.alert_id);
      if (!alert) continue;
      const isBuyer = alert?.reserved_by_id === data.user?.id;
      const remainingMs = data.getRemainingMsForAlert(alert, isBuyer);

      if (
        remainingMs === 0 &&
        data.hasEverHadTimeRef.current.get(alert.id) === true &&
        !showProrrogaDialog
      ) {
        actions.openExpiredDialog({
          alert,
          isBuyer,
          expiredHandledRef,
          setCurrentExpiredAlert,
          setSelectedProrroga,
          setShowProrrogaDialog,
        });
      }
    }
  }, [
    data.nowTs,
    data.filteredConversations,
    data.alertsMap,
    data.user?.id,
    data.getRemainingMsForAlert,
    showProrrogaDialog,
  ]);

  const handleProrroga = () =>
    actions.handleProrroga({
      selectedProrroga,
      currentExpiredAlert,
      setShowProrrogaDialog,
      setSelectedProrroga,
      setCurrentExpiredAlert,
    });

  const handleDialogClose = (open) => {
    setShowProrrogaDialog(open);
    if (!open) {
      setSelectedProrroga(null);
      setCurrentExpiredAlert(null);
      expiredHandledRef.current.clear();
    }
  };

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col">
      <main className="flex-1 flex flex-col min-h-0 overflow-auto">
        <ChatList
          demoConvs={data.demoConvs}
          filteredConversations={data.filteredConversations}
          searchQuery={data.searchQuery}
          setSearchQuery={data.setSearchQuery}
          user={data.user}
          alertsMap={data.alertsMap}
          nowTs={data.nowTs}
          calculateDistanceText={data.calculateDistanceText}
          getRemainingMsForAlert={data.getRemainingMsForAlert}
          openDirectionsToAlert={actions.openDirectionsToAlert}
          navigateToChat={actions.navigateToChat}
          clearDemoUnread={actions.clearDemoUnread}
          removeDemoConv={actions.removeDemoConv}
          navigateToDemoChat={actions.navigateToDemoChat}
        />
      </main>

      <ProrrogaDialog
        open={showProrrogaDialog}
        onOpenChange={handleDialogClose}
        currentExpiredAlert={currentExpiredAlert}
        selectedProrroga={selectedProrroga}
        setSelectedProrroga={setSelectedProrroga}
        onProrroga={handleProrroga}
      />
    </div>
  );
}
