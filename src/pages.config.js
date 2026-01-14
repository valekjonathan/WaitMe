import History from './pages/History';
import Home from './pages/Home';
import Navigate from './pages/Navigate';
import NotificationSettings from './pages/NotificationSettings';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Chat from './pages/Chat';
import Chats from './pages/Chats';


export const PAGES = {
    "History": History,
    "Home": Home,
    "Navigate": Navigate,
    "NotificationSettings": NotificationSettings,
    "Notifications": Notifications,
    "Profile": Profile,
    "Settings": Settings,
    "Chat": Chat,
    "Chats": Chats,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};