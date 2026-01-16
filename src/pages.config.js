import Chat from './pages/Chat';
import Chats from './pages/Chats';
import History from './pages/History';
import Navigate from './pages/Navigate';
import NotificationSettings from './pages/NotificationSettings';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Home from './pages/Home';


export const PAGES = {
    "Chat": Chat,
    "Chats": Chats,
    "History": History,
    "Navigate": Navigate,
    "NotificationSettings": NotificationSettings,
    "Notifications": Notifications,
    "Profile": Profile,
    "Settings": Settings,
    "Home": Home,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};