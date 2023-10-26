const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const config = require('./server-config.json');
const canvasGen = require('./canvasGenerator.js');

const app = express()
const server=http.createServer(app);
const io=socketio(server);
const port = 3000

const activeBuilds = {};

require('./routes/viewRoutes')(app)

// Set a static folder with all subfolders and files
app.use(express.static('public'))

// middleware 
app.use(express.json()) //Add it first then others follw

app.use(express.urlencoded({ extended: true }))

app.use('/favicon.ico', express.static('/favicon.ico'));

// Set Pug as the view engine
app.set('view engine', 'pug')

// Set views folder as the default folder for views
app.set('views', './views')

app.get('/config', (req, res) => {
  res.json(config);
});

app.post('/get-build-image', (req, res) => {
  // Get the build data from the request body
  const buildData = req.body;
  console.log(buildData);

  if (buildData == null) {
    res.status(400).send("Invalid build data. Build data is null.");
    return;
  }

  let exportData = buildData["ExportData"];
  console.log(exportData);

  // Generate the build image
  canvasGen.BeginGenerationImport(exportData, function(data) {
    if (data["status"] == 200) {
      res.setHeader('Content-Type', 'image/png');
      res.status(data["status"]).send(data["imageData"]);
    } else {
      res.status(data["status"]).send(data["message"]);
    }
  });
});

app.get('*', (req, res) => {
  res.status(404).send('404 Not Found')
})

// If config shows that m ultiplayer is enabled, then start the server.
if (config.multiplayerEnabled) {

  io.on("connection",(client)=>{
    console.log('New client connected.');
  
    // Assign a room with a unique ID to the client
    client.join(client.id);
  
    // Request Room data from the client. The client will emit a 'roomDataResponse' event.
    client.emit('serverRequestRoomData', client.id);
  
    // Send the client the room ID
    client.emit('roomID', client.id);
  
    client.on('clientRoomDataResponse', (data) => { 
      // Create a new roomData object with the data received from the client
      const roomData = CreateRoomData(client, data);
  
      console.log("clientRoomDataResponse");
      console.log('-------- Room Data --------');
      console.log(roomData);
      console.log('---------------------------');
  
      // Add the roomData object to the activeBuilds object
      activeBuilds[client.id] = roomData;
  
      // Send the roomData object back to all clients in the room.
      io.to(client.id).emit('serverRoomDataResponse', roomData);
    });
  
    client.on('clientRoomDataUpdate', (data) => {
      // Create a new roomData object with the data received from the client.
      const roomData = UpdateRoomData(activeBuilds[client.id], data);
  
      console.log("clientRoomDataUpdate");
      console.log('-------- Room Data --------');
      console.log(roomData);
      console.log('---------------------------');
  
      // Update the roomData object in the activeBuilds object
      activeBuilds[client.id] = roomData;
  
      // Send the roomData object back to all clients in the room.
      io.to(client.id).emit('serverRoomDataResponse', roomData);
    });
  
    client.on('clientJoinRoom', (roomID) => {
      // Join the room with the roomID
      client.join(roomID);
  
      // Send the client the roomData object
      client.emit('serverRoomDataResponse', activeBuilds[roomID]);
    });
  
    client.on('clientLeaveRoom', (data) => {
      console.log("DATA:");
      console.log(data);
      // Leave the room with the roomID
      let roomID = data["roomID"];
      client.leave(roomID);
  
      // Check if owner left the room
      console.log(activeBuilds[roomID]);
      if (client.id == activeBuilds[roomID].owner) {
        // Delete the room from the activeBuilds object
        delete activeBuilds[roomID];
      }
  
      // Put the client back in their own room
      client.join(client.id);
  
      // Create a new roomData object with the client ID.
      const roomData = CreateRoomData(client, data);
  
      // Add the roomData object to the activeBuilds object
      activeBuilds[client.id] = roomData;
  
      // Send the roomData object back to all clients in the room.
      io.to(client.id).emit('serverRoomDataResponse', roomData);
    });
  });  

}

server.listen(port, () => {
  console.log(`DBD Balance Checker listening on port ${port}`)
})

function CreateRoomData(client, data) {
  const roomData = {
    owner: client.id,
    users: [ // Includes the owner.
      client.id
    ],
    appStatus: {
      builds: data.SurvivorPerks,
      selectedKiller: data.selectedKiller,
      currentBalancingIndex: data.currentBalancingIndex,
      customBalanceOverride: data.customBalanceOverride,
      currentBalancing: data.currentBalancing
    }
  }

  return roomData;
}

function UpdateRoomData(roomData, newData) {
  roomData.appStatus = {
    builds: newData.SurvivorPerks,
    selectedKiller: newData.selectedKiller,
    currentBalancingIndex: newData.currentBalancingIndex,
    customBalanceOverride: newData.customBalanceOverride,
    currentBalancing: newData.currentBalancing
  }

  return roomData;
}