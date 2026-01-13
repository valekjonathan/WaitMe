import Chat from './pages/Chat';
import History from './pages/History';
import Home from './pages/Home';
import Navigate from './pages/Navigate';
import NotificationSettings from './pages/NotificationSettings';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Chats from './pages/Chats';


export const PAGES = {
    "Chat": Chat,
    "History": History,
    "Home": Home,
    "Navigate": Navigate,
    "NotificationSettings": NotificationSettings,
    "Notifications": Notifications,
    "Profile": Profile,
    "Settings": Settings,
    "Chats": Chats,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};