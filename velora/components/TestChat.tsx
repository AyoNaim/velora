'use client';

import { generateToken } from '@/app/chat/actions';
import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import { Attachment, ChannelData, StreamChat } from 'stream-chat';

interface CustomChannel extends ChannelData {
  name: string;
}

const apiKey = '4q5rmprnfmcs';
const testUsers = [
  { id: 'user_1', name: 'bob' },
  { id: 'user_2', name: 'alice' },
  { id: 'user_3', name: 'Charlie' },
];

const TestChat = () => {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [selectedFile, setselectedFile] = useState<File | null>(null);
  const [isConnected, setisConnected] = useState(false);
  const [selectedUser, setselectedUser] = useState(testUsers[0]);
  const [chatClient, setchatClient] = useState<StreamChat | null>(null);
  const [channel, setchannel] = useState<ReturnType<StreamChat['channel']> | null>(null);
  const [messages, setmessages] = useState<any[]>([]);
  const [inputValue, setinputValue] = useState('');

  const messageEndRef = useRef(null);

  useEffect(() => {
    const initChat = async () => {
      if (chatClient) {
        await chatClient.disconnectUser();
      }

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

      channel.on('typing.start', (event) => {
        if (event.user?.id !== selectedUser.id) {
          setTypingUsers((prev) => {
            const nameOrId = event.user!.name || event.user!.id;
            const exists = prev.includes(nameOrId);
            return exists ? prev : [...prev, nameOrId];
          });
        }
      });

      channel.on('typing.stop', (event) => {
        if (event.user?.id !== selectedUser.id) {
          setTypingUsers((prev) =>
            prev.filter((u) => u !== (event.user!.name || event.user!.id))
          );
        }
      });
    };

    setisConnected(true);
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
      <h1 className='mb-3'>{channel && <p className='font-bold'>{channel.data?.name}</p>}</h1>

      <div className='flex mb-3 gap-3'>
        {testUsers.map((user) => (
          <button
            key={user.id}
            className={`${selectedUser.id === user.id ? 'bg-green-300' : 'bg-white'} p-3 rounded-xl`}
            onClick={() => setselectedUser(user)}
          >
            {user.name}
          </button>
        ))}
      </div>

      <div className='space-y-4 max-h-[400px] overflow-y-auto border p-4 rounded mb-4 bg-white'>
        {messages.map((msg, index) => (
          <div key={msg.id || index}>
            <p className="font-semibold text-sm text-gray-700">
              {msg.user?.name || msg.user?.id}
            </p>
            <p className="mb-1">{msg.text}</p>

            {msg.attachments?.map((att: Attachment, i: number) => {
              if (att.type === 'image') {
                return (
                  <img
                    src={att.image_url || att.asset_url}
                    key={i}
                    alt={att.author_name}
                    className='w-40 rounded mt-1'
                  />
                );
              } else if (att.type === 'file') {
                return (
                  <a
                    href={att.asset_url}
                    key={i}
                    target='_blank'
                    rel='noreferrer noopener'
                    className='text-blue-600 mt-5 p-3 rounded bg-amber-300'
                  >
                    {att.author_name || selectedFile?.name || 'download file'}
                  </a>
                );
              }
              return null;
            })}
          </div>
        ))}
      </div>

      <form
        className="flex gap-3 flex-col sm:flex-row items-start sm:items-center"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!channel) return;

          if (selectedFile) {
            const upload = await channel.sendFile(selectedFile);
            await channel.sendMessage({
              text: inputValue,
              attachments: [
                {
                  type: selectedFile.type.startsWith('image') ? 'image' : 'file',
                  asset_url: upload.file,
                  author_name: selectedFile.name,
                },
              ],
            });
            setselectedFile(null);
            setinputValue('');
            return;
          }

          if (inputValue.trim()) {
            await channel.sendMessage({ text: inputValue.trim() });
            setinputValue('');
          }
        }}
      >
        <input
          disabled={!isConnected}
          className='p-3 bg-amber-200'
          type='text'
          placeholder='enter your message'
          value={inputValue}
          onChange={(e) => {
            setinputValue(e.target.value);
            if (channel) {
              channel.keystroke(); // triggers typing.start/stop
            }
          }}
        />

        <input
          type='file'
          className='p-2 bg-green-500'
          accept='image/*,application/pdf'
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setselectedFile(e.target.files[0]);
            }
          }}
        />

        <button type='submit' className='p-3 rounded-xl bg-red-500'>
          send message
        </button>
      </form>

      {selectedFile && (
        <p className="text-sm text-gray-500 mt-2">📎 {selectedFile.name}</p>
      )}
      {typingUsers.length > 0 && (
        <p className='text-sm text-gray-600 mt-2'>
          {typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
        </p>
      )}
    </div>
  );
};

export default TestChat;
