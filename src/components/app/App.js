import React, { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import './App.css';

const App = () => {
  const [client, setClient] = useState(null);
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [recipient, setRecipient] = useState('');

  useEffect(() => {
    const newClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/chat-websocket'),
    });
    setClient(newClient);
  }, []);

  useEffect(() => {
    if (client) {
      client.onConnect = (frame) => {
        console.log('Connected to WebSocket server');
        client.subscribe('/topic/public', (message) => {
          setMessages((prevMessages) => [...prevMessages, message.body]);
        });
        client.subscribe('/queue/user/' + username, (message) => {
          setMessages((prevMessages) => [...prevMessages, message.body]);
        });
        client.subscribe('/topic/rooms/' + roomId, (message) => {
          setMessages((prevMessages) => [...prevMessages, message.body]);
        });
      };

      client.onStompError = (frame) => {
        console.error('Error on WebSocket connection: ', frame);
      };

      client.activate();
    }

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [client, roomId, username]);

  const sendMessageToAll = () => {
    if (client) {
      client.publish({ destination: '/app/sendMessageToAll', body: message });
    }
  };

  const sendMessageToRoom = () => {
    if (client) {
      client.publish({
        destination: '/app/sendMessageToRoom',
        body: JSON.stringify({ roomId, message }),
      });
    }
  };


  const sendPrivateMessage = () => {
    if (client && recipient) {
      client.publish({
        destination: '/app/sendPrivateMessage',
        body: JSON.stringify({ sender: username, receiver: recipient, message }),
      });
    }
  };

  const handleRecipientChange = (e) => {
    setRecipient(e.target.value);
  };

  

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handleRoomIdChange = (e) => {
    setRoomId(e.target.value);
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  

  return (
    <div>
      <div>
        <label>Username: </label>
        <input type="text" value={username} onChange={handleUsernameChange} />
      </div>
      <div>
        <label>Room ID: </label>
        <input type="text" value={roomId} onChange={handleRoomIdChange} />
      </div>
      <div>
        <label>Message: </label>
        <input type="text" value={message} onChange={handleMessageChange} />
      </div>
      <button onClick={sendMessageToAll}>Send to All</button>
      <button onClick={sendMessageToRoom}>Send to Room</button>
      <div>
        <label>Recipient: </label>
        <input type="text" value={recipient} onChange={handleRecipientChange} />
      </div>
      <button onClick={sendPrivateMessage}>Send Private Message</button>
      <div>
        <h3>Messages:</h3>
        <ul>
          {messages.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;
