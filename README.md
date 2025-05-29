# CodeBoard - Interactive Code Editor Platform

CodeBoard is a real-time collaborative code editor platform that allows instructors to create and manage coding exercises for students. The platform features a dynamic, resizable code editor with support for multiple programming languages and real-time updates.

## Features

- Real-time collaborative code editing
- Support for multiple programming languages (JavaScript, Python, Java, C++)
- Dynamic resizable code editor
- Instructor board with editable content
- Persistent state management
- Responsive design
- WebSocket-based real-time communication

## Tech Stack

### Frontend
- React.js
- Material-UI
- Monaco Editor
- CodeMirror
- TailwindCSS

### Backend
- Node.js
- Express.js
- WebSocket (ws)
- CORS

## Project Structure

```
CodeBoard/
├── client/                 # Frontend React application
│   ├── public/            # Static files
│   └── src/               # React source code
├── server-node/           # Backend Node.js server
│   └── index.js          # Server entry point
└── README.md             # Project documentation
```

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd client
   npm install

   # Install backend dependencies
   cd ../server-node
   npm install
   ```

3. Start the development servers:
   ```bash
   # Start frontend (in client directory)
   npm start

   # Start backend (in server-node directory)
   npm start
   ```

## Deployment

The application is configured for deployment on:
- Frontend: Vercel
- Backend: Render

## License

ISC 