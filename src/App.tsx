import React from "react";
import "./App.css";
import { ConfigProvider, theme } from "antd";
import NavigationBar from "./components/main/NavigationBar";
import { useSession } from "./session";

function App() {
    const { darkAlgorithm } = theme;
    const {userSession} = useSession();

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
