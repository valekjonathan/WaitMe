import Home from './pages/Home';
import Profile from './pages/Profile';
import History from './pages/History';
import Chats from './pages/Chats';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import CodeEditor from './pages/CodeEditor';


export const PAGES = {
    "Home": Home,
    "Profile": Profile,
    "History": History,
    "Chats": Chats,
    "Chat": Chat,
    "Settings": Settings,
    "CodeEditor": CodeEditor,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};