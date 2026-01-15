import Chat from './pages/Chat';
import Chats from './pages/Chats';
import Home from './pages/Home';
import Navigate from './pages/Navigate';
import NotificationSettings from './pages/NotificationSettings';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import History from './pages/History';


export const PAGES = {
    "Chat": Chat,
    "Chats": Chats,
    "Home": Home,
    "Navigate": Navigate,
    "NotificationSettings": NotificationSettings,
    "Notifications": Notifications,
    "Profile": Profile,
    "Settings": Settings,
    "History": History,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};