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

    $('.trigger-speed').on('input', function(){
        console.log('change %o', this.value);
        socket.emit('speed', this.value);
    });

    $('.start').on('click', function(e){
        e.preventDefault();
        socket.emit('zwaveStart');
    });

    var timerLevel = undefined;
    $('.trigger-level').on('input', function(){
        if (undefined != timerLevel) {
            clearTimeout(timerLevel);
        }

        var level = this.value;
        timerLevel = setTimeout(function() {
            console.log('Envoi nouveau level %s', level);
            timerLevel = undefined;

            socket.emit('zwaveSetLevel', parseInt(level, 10));
        }, 1000);
    });

    var timerColor = undefined;
    $('.color').on('change', function(){
        if (undefined != timerColor) {
            clearTimeout(timerColor);
        }

        var color = this.value;
        timerColor = setTimeout(function() {
            console.log('Envoi nouvelle couleur %s', color);
            timerColor = undefined;

            socket.emit('zwaveSetColor', color);
        }, 1000);
    });

    socket.on('cry', function(){
        console.log('Here I am');
    });
})(jQuery, window);