import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';
import dotenv from 'dotenv';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp');
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    console.log('Cleared existing data');

    const passwordHash = await bcrypt.hash('password123', 12);

    const users = await User.create([
      {
        name: 'John Doe',
        email: 'demo@example.com',
        password: passwordHash,
        status: 'online',
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: passwordHash,
        status: 'offline',
      },
      {
        name: 'Bob Wilson',
        email: 'bob@example.com',
        password: passwordHash,
        status: 'offline',
      },
      {
        name: 'Alice Brown',
        email: 'alice@example.com',
        password: passwordHash,
        status: 'offline',
      },
      {
        name: 'Charlie Davis',
        email: 'charlie@example.com',
        password: passwordHash,
        status: 'offline',
      },
    ]);

    console.log('Created users:', users.map(u => u.email).join(', '));

    const chat1 = await Conversation.create({
      type: 'private',
      participants: [users[0]._id, users[1]._id],
    });

    const chat2 = await Conversation.create({
      type: 'private',
      participants: [users[0]._id, users[2]._id],
    });

    await Conversation.create({
      type: 'group',
      name: 'Family Group',
      description: 'Family chat group',
      participants: [users[0]._id, users[1]._id, users[3]._id],
      admins: [users[0]._id],
    });

    console.log('Created chats');

    const messages1 = await Message.create([
      {
        chatId: chat1._id,
        sender: users[0]._id,
        content: 'Hey Jane! How are you?',
        messageType: 'text',
        status: 'read',
        readBy: [{ user: users[0]._id }, { user: users[1]._id }],
      },
      {
        chatId: chat1._id,
        sender: users[1]._id,
        content: "Hi John! I'm doing great, thanks for asking!",
        messageType: 'text',
        status: 'read',
        readBy: [{ user: users[0]._id }, { user: users[1]._id }],
      },
      {
        chatId: chat1._id,
        sender: users[0]._id,
        content: "That's awesome! Want to catch up later?",
        messageType: 'text',
        status: 'read',
        readBy: [{ user: users[0]._id }, { user: users[1]._id }],
      },
      {
        chatId: chat1._id,
        sender: users[1]._id,
        content: 'Sure! Let me know when works for you.',
        messageType: 'text',
        status: 'delivered',
        readBy: [{ user: users[1]._id }],
      },
    ]);

    const messages2 = await Message.create([
      {
        chatId: chat2._id,
        sender: users[0]._id,
        content: 'Hey Bob, did you see the game last night?',
        messageType: 'text',
        status: 'read',
        readBy: [{ user: users[0]._id }, { user: users[2]._id }],
      },
      {
        chatId: chat2._id,
        sender: users[2]._id,
        content: 'Yeah! It was incredible!',
        messageType: 'text',
        status: 'read',
        readBy: [{ user: users[0]._id }, { user: users[2]._id }],
      },
    ]);

    chat1.lastMessage = messages1[messages1.length - 1]._id;
    chat2.lastMessage = messages2[messages2.length - 1]._id;

    await chat1.save();
    await chat2.save();

    console.log('Created messages');

    console.log('\n✅ Seed completed successfully!');
    console.log('\nDemo accounts:');
    console.log('  Email: demo@example.com');
    console.log('  Password: password123');
    console.log('\nOther accounts (same password):');
    console.log('  jane@example.com, bob@example.com, alice@example.com, charlie@example.com');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
