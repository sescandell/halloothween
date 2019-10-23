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

    $('.trigger-level').on('input', function(){
        console.log('change %o', this.value);
        socket.emit('zwaveSetLevel', parseInt(this.value, 10));
    })

    socket.on('cry', function(){
        console.log('Here I am');
    });
})(jQuery, window);