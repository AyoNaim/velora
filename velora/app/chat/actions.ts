'use server'
// app/chat/actions.ts (Server Action)
import { ChannelData, StreamChat } from 'stream-chat';

interface CustomChannel extends ChannelData {
  name: string;
}

const apiKey = '4q5rmprnfmcs';
const apiSecret = 'nccryng5pt4kk83479qpaba3ygcv52y8dpdv92u93x38kkzx9kyzcqt3sbys4xwk';

const serverClient = StreamChat.getInstance(apiKey, apiSecret);


export async function generateToken(userId: string) {

  const testUsers = ['user_1', 'user_2', 'user_3'];

  if (!testUsers.includes(userId)) {
    throw new Error('Unauthorized user');
  }

  const token = serverClient.createToken(userId);

  const channel = serverClient.channel('messaging', 'react-channel', {
    name: 'React Channel',
    members: testUsers,
  } as CustomChannel);

  // Only try to create the channel — Stream will ignore it if already exists
  await channel.create();

  return token;
}


// Server action to generate token
export const generateStreamToken = async (userId: string) => {
  
  const allowedUsers = ['user_1', 'user_2', 'user_3'];
  if (!allowedUsers.includes(userId)) {
    throw new Error('unauthorized user')
  };

  const token = serverClient.createToken(userId);
  return token
}