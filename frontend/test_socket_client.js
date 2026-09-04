import { io } from 'socket.io-client';
const socket = io('http://localhost:5002');
socket.on('connect', () => {
    console.log("CLIENT CONNECTED!");
    socket.emit('join', 'test_room');
});
