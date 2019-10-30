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

    $('.camera-init').on('click', function(e){
        e.preventDefault();
        socket.emit('initCamera');
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
        }, 300);
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
        }, 300);
    });

    $('.dimmer').on('change', function(){
        if ($(this).prop('checked')) {
            $('.light-mode-onoff').hide();
            $('.light-mode-dimmer').show();
        } else {
            $('.light-mode-onoff').show();
            $('.light-mode-dimmer').hide();
        }
    });

    var timerLightLevel = undefined;
    $('.light-level').on('input', function(){
        if (undefined != timerLightLevel) {
            clearTimeout(timerLightLevel);
        }

        var level = this.value;
        timerLightLevel = setTimeout(function() {
            console.log('Envoi nouveau level %s', level);
            timerLightLevel = undefined;

            socket.emit('zwaveSetLightLevel', parseInt(level, 10));
        }, 300);
    });

    $('.light').on('change', function(){
        socket.emit('zwaveSetLight', $(this).prop('checked') ? '1' : '0');
    });

    socket.on('cry', function(){
        console.log('Here I am');
    });
})(jQuery, window);