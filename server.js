const express = require('express');
const http = require('http');
const socketio = require('socket.io');

const app = express()
const server=http.createServer(app);
const io=socketio(server);
const port = 3000

const activeBuilds = {};

require('./routes/viewRoutes')(app)

// Set a static folder with all subfolders and files
app.use(express.static('public'))

// Set Pug as the view engine
app.set('view engine', 'pug')

// Set views folder as the default folder for views
app.set('views', './views')

app.get('*', (req, res) => {
    res.status(404).send('404 Not Found')
})

io.on("connection",(client)=>{
  console.log('New client connected.');
  // Assign a room with a unique ID to the client
  client.join(client.id);

  // Add the client to the activeBuilds object
  activeBuilds[client.id] = client.id;

  // Send the room ID to the client
  client.emit("receive-room-id", client.id);
  
  // Listen for the "updateBuilds" event from the client
  client.on("updateBuilds", (data) => {
    // Broadcast the "updateBuilds" event to all clients in the room
    client.to(client.id).emit("updateBuilds", data);
  });

  client.on("disconnect", () => {
    console.log("Client disconnected");

    // Remove the client from the room
    client.leave(client.id);

    // Check if the room is empty
    if (io.sockets.adapter.rooms.get(client.id) === undefined) {
      // Delete the room if it is empty
      delete activeBuilds[client.id];
    }
  });

})

server.listen(port, () => {
  console.log(`DBD Balance Checker listening on port ${port}`)
})