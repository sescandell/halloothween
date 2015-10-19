var cors = require('cors');
var app = require('express')();
app.use(cors());

// Required for taking into account Azure Cloud Environment
var port = process.env.PORT || 80;


// Initialize a new socket.io object. It is bound to 
// the express app, which allows them to coexist.
var io = require('socket.io').listen(app.listen(port));


// Require the configuration and the routes files, and pass
// the app and io as arguments to the returned functions.
require('./config')(app, io);
require('./routes')(app, io);

console.log('Application is running listening on ' + port);