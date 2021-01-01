const path = require ('path');
const socketio = require ('socket.io');
const http = require ('http');
const Filter = require('bad-words');
const {generateMessage} = require('./utils/messsages') 
const {generateLocationMessage} = require('./utils/messsages') 

const {addUser,
    removeUser,
    getUser,
    getUsersInRoom } = require ('./utils/users')

const express = require ('express');
const { setUncaughtExceptionCaptureCallback } = require('process');
const app = express();

const server = http.createServer(app);
const io = socketio(server);

const port = process.env.port || 3000

const public_dirPath = path.join (__dirname, '../public'); 

app.use(express.static(public_dirPath));


io.on('connection',(socket)=>{
    console.log('Socket connected');

    socket.on('join',({username, room}, callback)=>{
        const {error, user} = addUser({id: socket.id, username, room});

        if(error){
            return callback(error);
        }

        socket.join(user.room)

        socket.emit('message',generateMessage('Admin', 'Welcome'));
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin', `${user.username} joined`));
        io.to(user.room).emit('roomData', {
            room : user.room,
            users : getUsersInRoom(user.room)
        })

        callback();
    })


    socket.on('clientMessage',(message, callback)=>{
        const user = getUser(socket.id);
        const filter = new Filter();

        if(filter.isProfane(message)){
            return callback('Profanity not allowed');
        }

        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback();
    })

    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id);

        if(user){
        io.to(user.room).emit('message',generateMessage(user.username, `${user.username} has left`));
        io.to(user.room).emit('roomData', {
            room : user.room,
            users : getUsersInRoom(user.room)
        })
        }
    })

    socket.on('send-location',(location, callback)=>{
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username, `https://google.com/maps?q=${location.longitude},${location.latitude}`));
        callback();
    })
})

server.listen(port, ()=>{
    console.log(`server up at ${port}`);
})
