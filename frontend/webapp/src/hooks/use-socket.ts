// useNotificationCount.ts
import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';

export function useSocket() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/clientHub', {
        // If you use auth cookie:
        // withAutomaticReconnect()
        // or if you use JWT:
        // accessTokenFactory: () => getToken()
      })
      .configureLogging(signalR.LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        console.log('SignalR connected');
        // Optional: join group
        // connection.invoke('JoinUserGroup');
      })
      .catch(err => console.error(err));

    connection.on('ReceiveCount', (newCount: number) => {
      setCount(newCount);
    });

    // Cleanup
    return () => {
      connection.stop();
    };
  }, []);

  return count;
}
