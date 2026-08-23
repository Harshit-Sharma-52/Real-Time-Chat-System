import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Workspace from '../src/models/Workspace.js';
import WorkspaceMember from '../src/models/WorkspaceMember.js';
import Conversation from '../src/models/Conversation.js';
import Message from '../src/models/Message.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp';

const hasNoWorkspace = {
  $or: [
    { workspaceId: null },
    { workspaceId: { $exists: false } },
  ],
};

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB for migration');

  // 1. Create a default workspace per user (idempotent via isDefault flag)
  const users = await User.find({});
  const userWorkspace = {};

  for (const user of users) {
    let ws = await Workspace.findOne({ owner: user._id, isDefault: true });
    if (!ws) {
      ws = await Workspace.create({
        name: `${user.name}'s Workspace`,
        owner: user._id,
        isDefault: true,
      });
      await WorkspaceMember.create({
        workspace: ws._id,
        user: user._id,
        role: 'owner',
      });
      console.log(`  created default workspace for ${user.email}`);
    }
    userWorkspace[user._id.toString()] = ws._id;
  }
  console.log(`Workspaces ready for ${users.length} user(s)`);

  // 2. Backfill workspaceId on conversations (preserves existing data)
  const conversations = await Conversation.find(hasNoWorkspace);
  for (const conv of conversations) {
    const firstParticipant = conv.participants?.[0];
    const wsId = firstParticipant ? userWorkspace[firstParticipant.toString()] : null;
    if (wsId) {
      conv.workspaceId = wsId;
      await conv.save();
    }
  }
  console.log(`Backfilled workspaceId on ${conversations.length} conversation(s)`);

  // 3. Backfill workspaceId on messages from their conversation
  const messages = await Message.find(hasNoWorkspace);
  let backfilled = 0;
  for (const msg of messages) {
    const conv = await Conversation.findById(msg.chatId);
    if (conv?.workspaceId) {
      msg.workspaceId = conv.workspaceId;
      await msg.save();
      backfilled += 1;
    }
  }
  console.log(`Backfilled workspaceId on ${backfilled} message(s)`);

  console.log('Migration complete');
}

migrate()
  .then(() => mongoose.connection.close())
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error('Migration failed:', err);
    await mongoose.connection.close();
    process.exit(1);
  });
