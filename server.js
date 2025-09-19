const cors = require('cors');
const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
const server = createServer(app);
const io = new Server(server);


// Required for taking into account Azure Cloud Environment
const port = process.env.PORT || 8181;

// Require the configuration and the routes files, and pass
// the app and io as arguments to the returned functions.
require('./config')(app, io);
require('./routes')(app, io);


server.listen(port, () => {
  console.log('server running at port ' + port);
});