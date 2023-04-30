const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);


// add static folder
app.use(express.static(path.join(__dirname, 'public')))

const botName = 'ChatCord Bot';

// Run when a client connects
io.on('connection', socket => {
    socket.on("join-room", ({ username, room }) => {
      const user = userJoin(socket.id, username, room);
      socket.join(user.room);

      // Welcome current user and send msg to client
      socket.emit("message", formatMessage(botName, "Welcome to ChatCord!"));

      // io.emit() broadcast to all user
      // broadcast.emit() broadcast to all user except the user itself
      socket.broadcast
        .to(user.room)
        .emit(
          "message",
          formatMessage(botName, `${user.username} has joined the chat`)
        );

        // send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });


    // listen for chat msg
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username,msg));
    });

    // runs when client disconnect
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user) {
            io.to(user.room).emit('message', formatMessage(botName,`${user.username} has left the chat`));
        }

        // send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
        
    });

})

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

