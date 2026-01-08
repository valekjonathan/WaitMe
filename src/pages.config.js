import Chat from './pages/Chat';
import Chats from './pages/Chats';
import History from './pages/History';
import Home from './pages/Home';
import NotificationSettings from './pages/NotificationSettings';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Navigate from './pages/Navigate';


export const PAGES = {
    "Chat": Chat,
    "Chats": Chats,
    "History": History,
    "Home": Home,
    "NotificationSettings": NotificationSettings,
    "Notifications": Notifications,
    "Profile": Profile,
    "Settings": Settings,
    "Navigate": Navigate,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};