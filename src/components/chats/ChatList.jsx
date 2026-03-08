/**
 * Lista de chats: demo + real.
 */

import ChatHeader from './ChatHeader';
import ChatEmptyState from './ChatEmptyState';
import ChatListItem from './ChatListItem';
import DemoChatListItem from './DemoChatListItem';

export default function ChatList({
  demoConvs,
  filteredConversations,
  searchQuery,
  setSearchQuery,
  user,
  alertsMap,
  nowTs,
  calculateDistanceText,
  getRemainingMsForAlert,
  openDirectionsToAlert,
  navigateToChat,
  clearDemoUnread,
  removeDemoConv,
  navigateToDemoChat,
}) {
  return (
    <>
      {demoConvs.length > 0 && (
        <div className="px-4 pt-3 space-y-3">
          {demoConvs.map((dc) => (
            <DemoChatListItem
              key={dc.id}
              dc={dc}
              demoConvs={demoConvs}
              clearDemoUnread={clearDemoUnread}
              removeDemoConv={removeDemoConv}
              navigateToDemoChat={navigateToDemoChat}
            />
          ))}
        </div>
      )}

      {filteredConversations.length === 0 && demoConvs.length === 0 && <ChatEmptyState />}

      {filteredConversations.length > 0 && (
        <>
          <ChatHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

          <div className="px-4 space-y-3 pt-1">
            {filteredConversations.map((conv, index) => {
              const alert = alertsMap.get(conv.alert_id);
              if (!alert) return null;

              const isP1 = conv.participant1_id === user?.id;
              const unreadCount = isP1 ? conv.unread_count_p1 : conv.unread_count_p2;
              const hasUnread = (unreadCount || 0) > 0;

              const isBuyer = alert?.reserved_by_id === user?.id;
              const isSeller = alert?.reserved_by_id && !isBuyer;

              const otherUserName = isP1 ? conv.participant2_name : conv.participant1_name;
              const otherUserPhoto = isP1 ? conv.participant2_photo : conv.participant1_photo;

              const distanceText = calculateDistanceText(alert);
              const remainingMs = getRemainingMsForAlert(alert, isBuyer);

              return (
                <ChatListItem
                  key={conv.id}
                  conv={conv}
                  alert={alert}
                  index={index}
                  unreadCount={unreadCount || 0}
                  hasUnread={hasUnread}
                  isBuyer={isBuyer}
                  isSeller={isSeller}
                  otherUserName={otherUserName}
                  otherUserPhoto={otherUserPhoto}
                  distanceText={distanceText}
                  remainingMs={remainingMs}
                  nowTs={nowTs}
                  openDirectionsToAlert={openDirectionsToAlert}
                  navigateToChat={() => navigateToChat(conv, otherUserName, otherUserPhoto)}
                />
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
