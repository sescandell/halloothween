;(function($, window, undefined){
    // connect to the socket
    var socket = io.connect('/socket');

    socket.on('connected', function(){
        console.log('Connected');
    });

    $('.start').on('click', function(e){
        e.preventDefault();
        socket.emit('zwaveStart');
    });

    $('.trigger-level').on('input', function(){
        console.log('change %o', this.value);
        socket.emit('zwaveSetLevel', parseInt(this.value, 10));
    })

    socket.on('cry', function(){
        console.log('Here I am');
    });
})(jQuery, window);