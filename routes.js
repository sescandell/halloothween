module.exports = function(app,io){

    app.get('/', function(req, res){
        res.render('camera');
    });

    app.get('/controller', function(req,res){
        res.render('/controller');
    });

    app.get('/displayer', function(req,res){
        // Render the chat.html view
        res.render('displayer');
    });


    // Initialize a new socket.io application
    io.of('/socket').on('connection', function (socket) {

        // When the client emits the 'load' event, reply with the
        // number of people in this chat room
        socket.on('takePicture',function(){
            setTimeout(function(){
                socket.emit('picture', 'path_to_image');
            }, 3000);
        });

        setTimeout(function(){
            socket.emit('controllerTriggered');
        }, 5000);
    });
};