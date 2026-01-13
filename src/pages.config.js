import Chats from './pages/Chats';
import Home from './pages/Home';
import Navigate from './pages/Navigate';
import NotificationSettings from './pages/NotificationSettings';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import History from './pages/History';
import Notifications from './pages/Notifications';
import Chat from './pages/Chat';


export const PAGES = {
    "Chats": Chats,
    "Home": Home,
    "Navigate": Navigate,
    "NotificationSettings": NotificationSettings,
    "Profile": Profile,
    "Settings": Settings,
    "History": History,
    "Notifications": Notifications,
    "Chat": Chat,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};