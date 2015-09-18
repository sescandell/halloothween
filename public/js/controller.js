;(function($, window, undefined){
    // Mise en cache des éléments du DOM
    var $photos = $('.photos');
    var $trigger = $('.trigger');
    // TODO: popin

    // connect to the socket
    var socket = io.connect('/socket');

    socket.on('connected', function(){
        console.log('Connected');
        socket.emit('loadPhotos');
    });

    $trigger.on('click', function(e){
        console.log('Click');
        socket.emit('triggerFired');
        e.preventDefault();
    });

    socket.on('picture', function(path){
        console.log('Image disponible %o', path);
        $('<li />')
            .append($('<img />').prop('src', path))
            .prependTo($photos);
    });
})(jQuery, window);