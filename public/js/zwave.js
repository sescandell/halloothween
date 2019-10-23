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

    var timer = undefined;
    $('.trigger-level').on('input', function(){
        if (undefined != timer) {
            clearTimeout(timer);
        }

        var level = this.value;
        timer = setTimeout(function() {
            console.log('Envoi nouveau level %d', level);
            timer = undefined;

            socket.emit('zwaveSetLevel', parseInt(level, 10));
        }, 1000);
    })

    socket.on('cry', function(){
        console.log('Here I am');
    });
})(jQuery, window);