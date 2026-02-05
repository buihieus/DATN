import { useEffect } from 'react';
import './App.css';
import Header from './Components/Header/Header';
import HomePage from './Components/HomePage/HomePage';
import { message } from 'antd';
import { useSocket } from './hooks/useSocket';

function App() {
    const { dataMessagersUser, usersMessage, setUsersMessage, dataFavourite } = useSocket();

    useEffect(() => {
        if (dataFavourite !== null) {
            return message.success(dataFavourite);
        }
    }, [dataFavourite]);

    return (
        //  <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>
        <div className="wrapper">
            <header>
                <Header
                    dataMessagersUser={dataMessagersUser}
                    usersMessage={usersMessage}
                    setUsersMessage={setUsersMessage}
                />
            </header>

            <main style={{ width: '60%', margin: '0 auto' }} className="main">
                <HomePage />
            </main>
        </div>
        // </GoogleOAuthProvider>
    );
}

export default App;
