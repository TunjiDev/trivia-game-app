const socket = io('http://localhost:9090');

socket.on('message', data => {
    console.log(data);
});