;(function($, window, undefined){
    var countdown = undefined;
    var pictureTimer = undefined;

    // Mise en cache des éléments du DOM
    var $messageContainer = $('.message');
    var $counterContainer = $('.counter');
    var $pictureContainer = $('.photo');

    // connect to the socket
    var socket = io.connect('/socket');

    socket.on('controllerTriggered', function(){
        if (undefined != countdown) {
            return;
        }

        if (pictureTimer) {
            clearTimeout(pictureTimer);
            pictureTimer = undefined;
            $pictureContainer.hide();
        }


        var count = 6;
        $counterContainer.html(count--);

        $messageContainer.hide();
        $counterContainer.show();

        countdown = setInterval(function() {
            if (0==count) {
                clearInterval(countdown);
                countdown = undefined;
                // Envoie de la demande de prise de photo
                socket.emit('takePicture');
            }

            $counterContainer.html(count--);
        }, 1000);
    });

    socket.on('picture', function(path){
        console.log('Image disponible %o', path);
        $counterContainer.hide();
        $pictureContainer.show();

        pictureTimer = setTimeout(function(){
            $pictureContainer.hide();
            $messageContainer.show();

            pictureTimer = undefined;
        }, 3000);
    });
})(jQuery, window);