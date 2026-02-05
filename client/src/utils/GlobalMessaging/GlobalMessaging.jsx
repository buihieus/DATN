import { useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useStore } from '../../hooks/useStore';
import Messager from '../Messager/Messager';
import './GlobalMessaging.css';

function GlobalMessaging() {
    const { dataUser } = useStore();
    const { usersMessage, setUsersMessage, dataMessagersUser } = useSocket();

    useEffect(() => {
        console.log(
            'GlobalMessaging - Current chat windows:',
            usersMessage?.map((user) => ({ id: user.id, name: user.username })),
        );
    }, [usersMessage]);

    // Component will display chat windows across the entire site
    return (
        <div className="global-messaging">
            {/* Display all chat windows */}
            <div className="messager-container">
                {usersMessage && usersMessage.length > 0
                    ? usersMessage.map((chatUser) => {
                          console.log('Rendering chat window for:', chatUser.username, 'ID:', chatUser.id);
                          return (
                              <Messager
                                  key={chatUser.id}
                                  user={chatUser}
                                  setUsersMessage={setUsersMessage}
                                  usersMessage={usersMessage}
                              />
                          );
                      })
                    : null}
            </div>
        </div>
    );
}

export default GlobalMessaging;