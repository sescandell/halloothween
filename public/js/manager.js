;(function($, window, undefined){
    // connect to the socket
    var socket = io.connect('/socket');

    socket.on('connected', function(){
        console.log('Connected');
    });

    $('.trigger').on('click', function(e){
        e.preventDefault();
        var $elt = $(this);
        socket.emit('trigger' + $elt.data('name'), $elt.data('param'));
    });

    $('.trigger-brigthness').on('input', function(){
        console.log('change %o', this.value);
        socket.emit('brigthness', this.value);
    })

    socket.on('cry', function(){
        console.log('Here I am');
    });
})(jQuery, window);