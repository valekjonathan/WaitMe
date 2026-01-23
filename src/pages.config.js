import Chat from './pages/Chat';
import History from './pages/History';
import Navigate from './pages/Navigate';
import NotificationSettings from './pages/NotificationSettings';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Chats from './pages/Chats';
import Home from './pages/Home';
import Notifications from './pages/Notifications';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Chat": Chat,
    "History": History,
    "Navigate": Navigate,
    "NotificationSettings": NotificationSettings,
    "Profile": Profile,
    "Settings": Settings,
    "Chats": Chats,
    "Home": Home,
    "Notifications": Notifications,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};