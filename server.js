import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import config from './config.js';
import routes from './routes.js';

const app = express();
app.use(cors());
const server = createServer(app);
const io = new Server(server);


// Required for taking into account Azure Cloud Environment
const port = process.env.PORT || 8181;

// Load the configuration and the routes files, and pass
// the app and io as arguments to the returned functions.
config(app, io);
await routes(app, io);


server.listen(port, (error) => {
  if (error) {
    console.error('[ERROR] Failed to start server:', error);
    process.exit(1);
  }
  console.log('server running at port ' + port);
});