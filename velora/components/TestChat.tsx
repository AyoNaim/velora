// components/ChatPage.tsx
'use client';

import { generateStreamToken, generateToken } from '@/app/chat/actions';
import React, { useState, useEffect, useRef } from 'react';
import { ChannelData, StreamChat } from 'stream-chat';

interface CustomChannel extends ChannelData {
  name: string;
}

const apiKey = '4q5rmprnfmcs';
const testUsers = [
  { id: 'user_1', name: 'bob' },
  { id: 'user_2', name: 'alice' },
  { id: 'user_3', name: 'charlie' },
];

const TestChat = () => {
  const [selectedUser, setselectedUser] = useState(testUsers[0]);
  const [chatClient, setchatClient] = useState<StreamChat | null>(null);
  const [channel, setchannel] = useState<ReturnType<StreamChat['channel']> | null>(null);
  const [messages, setmessages] = useState<any[]>([]);
  const [inputValue, setinputValue] = useState('');

  const messageEndRef = useRef(null);

  useEffect(() => {
    const initChat = async () => {
      if (chatClient) await chatClient.disconnectUser();

      const userToken = await generateToken(selectedUser.id);

      const client = StreamChat.getInstance(apiKey);
      await client.connectUser(
        {
          id: selectedUser.id,
          name: selectedUser.name,
        },
        userToken
      );

      const channel = client.channel('messaging', 'react-channel');

      await channel.watch();

      setchatClient(client);
      setchannel(channel);
      setmessages(channel.state.messages);

      channel.on('message.new', (event) => {
        if (event.message) {
          setmessages((prev) => [...prev, event.message!]);
        }
      });
    };

    initChat();

    return () => {
      const client = StreamChat.getInstance(apiKey);
      if (client.user) {
        client.disconnectUser();
      }
    };
  }, [selectedUser]);

  return (
    <div>
      <h1>Chat Page</h1>

      <div className="flex gap-3 mb-3">
        {testUsers.map((user) => (
          <button
            key={user.id}
            onClick={() => setselectedUser(user)}
            className={`px-3 py-1 rounded ${
              selectedUser.id === user.id ? 'bg-green-500 text-white' : 'bg-gray-300'
            }`}
          >
            {user.name}
          </button>
        ))}
      </div>

      <div>
        {messages.map((msg, index) => (
          <div key={msg.id || index}>
            <p>
              <strong>{msg.user?.name || msg.user?.id}:</strong> {msg.text}
            </p>
          </div>
        ))}
      </div>

      <form
        className="flex gap-5 mt-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!inputValue.trim() || !channel) return;

          await channel.sendMessage({ text: inputValue });

          setinputValue('');
        }}
      >
        <input
          className="p-3 bg-amber-200"
          type="text"
          placeholder="Enter your message"
          value={inputValue}
          onChange={(e) => setinputValue(e.target.value)}
        />
        <button type="submit" className="p-3 rounded-xl bg-red-500">
          Send
        </button>
      </form>
    </div>
  );
};

export default TestChat;
