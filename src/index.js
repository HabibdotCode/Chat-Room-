//import express from 'express';
const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {generateMessage, generateLocationMessage} = require('./utils/messages.js');
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users.js');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const port  = 7000;

const publicDirectory = path.join(__dirname, '../public');

app.use(express.static(publicDirectory));

//important - io.emit sends message to everybody on the connection/connected server
// io.to.emit - it only sends to specific room on the connection/connected server
// socket.broadcast.to.emit - it only sends to specific room on the connection/connected server expect itself 

let count = 0;
io.on('connection',(socket) =>{
    console.log("New Connection established through SocketIO");

    //setting a listener when someone joins the chatroom using username and chatroom name
    socket.on('join', ({username:username, room:room}, callback) =>{

        //the socket object always contains an ID, so we can retrieve it using socket.id
        const {error, user} = addUser({id: socket.id, username, room})
        if(error){
            return callback(error);
        }
        
        socket.join(user.room);
        socket.emit('message', generateMessage('Mr Admin','Welcome to Blackberry Messenger!'));
    
        //following code tells the chatroom that a new user has joined but that new user itself won't get the message - like in real chat app
        socket.broadcast.to(user.room).emit('message', generateMessage('Mr Admin',`${user.username} has joined!`));

        //creating another listener for making/showing the list of users in the current chatroom
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });

        callback();
    })
    
    socket.on('sendMessage', (message, callback)=>{

        //getting the user from the array
        const user = getUser(socket.id);

        //check for profane or foul language - if present reject the message
        const filter = new Filter();
        if(filter.isProfane(message)){
            return callback('Foul language is strictly not allowed!')
        }

        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback()
    });
    
    socket.on('sendLocation', (position, callback) => {

        //getting the user from the array and using the methods we created in users.js
        const user = getUser(socket.id);

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${position.lat},${position.long}`)); 
        callback();
    })

    socket.on('disconnect', () => {
        
        //removing the user from the array that we created in users.js using socket.id
        const user = removeUser(socket.id);
        
        //checking if user already existed in the room, if so, we will remove him or her from the array and room
        if(user) {
            io.to(user.room).emit('message', generateMessage('Mr Admin',`${user.username} has left the chat!`));
            io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
            })
        } 
    })
})


server.listen(port, ()=>{
    console.log(`Server is listening on port ${port}`);
})