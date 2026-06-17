# Real-Time Chat Application

A fully functional real-time chat application built with React.js, Node.js, Express.js, Socket.IO, and MongoDB.

## Features

### Authentication
- User registration and login with email and password
- JWT-based authentication
- Protected routes

### Real-Time Messaging
- Instant message delivery using Socket.IO
- Typing indicators
- Online/offline status
- Message status (sent, delivered, read)
- Message reactions (emoji)

### Chat Features
- Private chats between two users
- Group chats with multiple participants
- User search functionality
- Chat history with pagination
- Unread message counts

### Media Sharing
- Image sharing
- File attachments (PDF, DOC, TXT, ZIP, RAR)
- File upload with progress

### UI/UX
- Responsive design for web and mobile
- Dark mode support
- Clean, modern interface
- Smooth animations

## Tech Stack

### Frontend
- React.js 18 with Vite
- React Router for navigation
- Zustand for state management
- Socket.IO Client
- Tailwind CSS
- Emoji Picker

### Backend
- Node.js with Express.js
- Socket.IO for real-time communication
- MongoDB with Mongoose
- JWT for authentication
- Multer for file uploads
- bcryptjs for password hashing

## Project Structure

```
chat-app/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/      # Route controllers
│   │   ├── middleware/       # Express middleware
│   │   ├── models/           # Mongoose models
│   │   ├── routes/           # API routes
│   │   ├── socket/           # Socket.IO handlers
│   │   └── index.js          # Main server file
│   ├── uploads/              # Uploaded files
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── context/          # React context
│   │   ├── hooks/            # Custom hooks
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── store/            # Zustand store
│   │   ├── utils/            # Utility functions
│   │   ├── App.jsx           # Main app component
│   │   └── main.jsx          # Entry point
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
└── README.md
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd chat-app
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

### 5. Start MongoDB

Make sure MongoDB is running:

```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 6. Seed the Database (Optional)

Create demo users and sample data:

```bash
cd backend
npm run seed
```

Demo accounts created:
- Email: `demo@example.com`
- Password: `password123`

## Running the Application

### Development Mode

**Terminal 1 - Start Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Start Frontend:**

```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Production Build

**Backend:**

```bash
cd backend
npm start
```

**Frontend:**

```bash
cd frontend
npm run build
npm run preview
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| GET | `/api/auth/search?q=` | Search users |

### Chats

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chats/private` | Get or create private chat |
| POST | `/api/chats/group` | Create group chat |
| GET | `/api/chats` | Get user's chats |
| GET | `/api/chats/:chatId` | Get chat by ID |
| POST | `/api/chats/add-participant` | Add participant |
| POST | `/api/chats/remove-participant` | Remove participant |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/messages` | Send message |
| GET | `/api/messages/chat/:chatId` | Get chat messages |
| PUT | `/api/messages/:messageId/read` | Mark as read |
| PUT | `/api/messages/chat/:chatId/read` | Mark chat as read |
| POST | `/api/messages/reaction` | Add reaction |
| DELETE | `/api/messages/:messageId/reaction` | Remove reaction |
| GET | `/api/messages/search?q=` | Search messages |

### File Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload file |

## Socket.IO Events

### Client to Server

- `joinChat` - Join a chat room
- `leaveChat` - Leave a chat room
- `typing` - Send typing indicator
- `sendMessage` - Send a message
- `markAsRead` - Mark message as read
- `addReaction` - Add emoji reaction
- `removeReaction` - Remove reaction
- `getOnlineUsers` - Get online users

### Server to Client

- `connected` - Connection established
- `userOnline` - User came online
- `userOffline` - User went offline
- `userTyping` - User is typing
- `newMessage` - New message received
- `messageSent` - Message sent confirmation
- `messageRead` - Message read by recipient
- `reactionAdded` - Reaction added
- `reactionRemoved` - Reaction removed
- `onlineUsers` - List of online users
- `error` - Error occurred

## Database Schema

### Users

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  avatar: String,
  status: 'online' | 'offline' | 'away',
  lastSeen: Date,
  socketId: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Chats

```javascript
{
  _id: ObjectId,
  type: 'private' | 'group',
  name: String,
  description: String,
  participants: [ObjectId],
  admins: [ObjectId],
  lastMessage: ObjectId,
  unreadCount: Map<String, Number>,
  createdAt: Date,
  updatedAt: Date
}
```

### Messages

```javascript
{
  _id: ObjectId,
  chatId: ObjectId,
  sender: ObjectId,
  content: String,
  messageType: 'text' | 'image' | 'file' | 'system',
  fileUrl: String,
  fileName: String,
  status: 'sent' | 'delivered' | 'read',
  readBy: [{ user: ObjectId, readAt: Date }],
  reactions: [{ user: ObjectId, emoji: String }],
  createdAt: Date,
  updatedAt: Date
}
```

## Deployment

### Docker

**Backend Dockerfile:**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

**Frontend Dockerfile:**

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
  
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/chatapp
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongodb
  
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

### Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create your-chat-app

# Set environment variables
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_secret_key

# Deploy
git push heroku main
```

### AWS (Elastic Beanstalk)

1. Create `Procfile` in backend:
   ```
   web: npm start
   ```

2. Install EB CLI and configure:
   ```bash
   pip install awsebcli
   eb init
   eb create production
   eb setenv MONGODB_URI=... JWT_SECRET=...
   eb deploy
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/chatapp |
| `JWT_SECRET` | Secret for JWT signing | - |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |
| `UPLOAD_DIR` | Directory for uploaded files | ./uploads |
| `MAX_FILE_SIZE` | Max file upload size in bytes | 10485760 (10MB) |

## Security Considerations

1. **JWT Secret**: Use a strong, unique secret in production
2. **Password Hashing**: Passwords are hashed with bcrypt (12 rounds)
3. **CORS**: Configure allowed origins for production
4. **File Upload**: File types are validated on upload
5. **Rate Limiting**: Consider adding rate limiting for production
6. **Input Validation**: All inputs are validated on both client and server

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check connection string
   - Verify network connectivity

2. **Socket.IO Not Connecting**
   - Check if backend is running
   - Verify CORS configuration
   - Check authentication token

3. **File Upload Failed**
   - Check upload directory permissions
   - Verify file size limit
   - Ensure file type is allowed

4. **Messages Not Appearing**
   - Check Socket.IO connection
   - Verify user is authenticated
   - Check browser console for errors

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

Built with ❤️ using React, Node.js, Express, Socket.IO, and MongoDB
