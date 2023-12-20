import React from "react";
import "./App.css";
import { ConfigProvider, theme } from "antd";
import NavigationBar from "./components/main/NavigationBar";
import { useSession } from "./session";
import i18next from "i18next";

function App() {
    const { darkAlgorithm } = theme;
    const {userSession, getSessionLanguage} = useSession();
    const sessionLanguage = getSessionLanguage();

    if (sessionLanguage !== undefined && sessionLanguage !== i18next.language) {
        console.log("Changing language to:", sessionLanguage);
        i18next.changeLanguage(getSessionLanguage());
    }

    return (
            <div className="app-container bg-light">
                <NavigationBar/>
                <div className="container pt-4 pb-4">
                    <ConfigProvider theme={{ algorithm: darkAlgorithm }}>
                    </ConfigProvider>
                </div>
                </div>
    );
}

export default App;
