import Chat from './pages/Chat';
import Chats from './pages/Chats';
import History from './pages/History';
import Home from './pages/Home';
import Navigate from './pages/Navigate';
import NotificationSettings from './pages/NotificationSettings';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Chat": Chat,
    "Chats": Chats,
    "History": History,
    "Home": Home,
    "Navigate": Navigate,
    "NotificationSettings": NotificationSettings,
    "Notifications": Notifications,
    "Profile": Profile,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};