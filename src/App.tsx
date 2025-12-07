import { useEffect, useState, useRef } from 'react';
import { DiscordSDK } from '@discord/embedded-app-sdk';
import './App.css';

const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID || 'YOUR_CLIENT_ID');

function App() {
  const [status, setStatus] = useState<string>('Disconnected');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string>('ws://localhost:54321');
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const setupDiscord = async () => {
      try {
        await discordSdk.ready();
      } catch (e) {
        console.error(e);
      }
    };
    setupDiscord();
  }, []);

  const connect = () => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setStatus('Connected');
        setIsConnected(true);
      };

      ws.onclose = () => {
        setStatus('Disconnected');
        setIsConnected(false);
      };

      ws.onerror = () => {
        setStatus('Error');
        setIsConnected(false);
      };

      ws.onmessage = async (event) => {
        if (event.data instanceof Blob) {
          const url = URL.createObjectURL(event.data);
          setImageSrc((prev) => {
            if (prev) URL.revokeObjectURL(prev); // Cleanup old URL
            return url;
          });
        }
      };
    } catch (e) {
      console.error(e);
      setStatus('Invalid URL');
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
    setStatus('Disconnected');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isConnected && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'key',
        key: e.keyCode,
        action: 1
      }));
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (isConnected && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'key',
        key: e.keyCode,
        action: 0
      }));
    }
  };

  return (
    <div
      className="app-container"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      style={{ outline: 'none' }}
    >
      {!isConnected && (
        <div className="login-screen">
          <h1>Minecraft Control</h1>
          <div className="input-group">
            <label>WebSocket URL</label>
            <input
              type="text"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              placeholder="ws://your-ip:25565"
            />
          </div>
          <button onClick={connect}>Connect</button>
          <p className="status-text">Status: {status}</p>
        </div>
      )}

      {isConnected && (
        <>
          <div className="status-bar">
            <span>Status: {status}</span>
            <button className="disconnect-btn" onClick={disconnect}>Disconnect</button>
          </div>
          <div className="video-container">
            {imageSrc ? (
              <img src={imageSrc} alt="Minecraft Stream" />
            ) : (
              <div className="placeholder">Waiting for stream...</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
