;(function($, window, undefined){
    var countdown = undefined;
    var pictureTimer = undefined;

    // Mise en cache des éléments du DOM
    var $messageContainer = $('.message');
    var $counterContainer = $('.counter');
    var $pictureContainer = $('.photo');
    var $imageTag = $('img', $pictureContainer);

    // connect to the socket
    var socket = io.connect('/socket');

    socket.on('connected', function(){
        console.log('Connected');
        $messageContainer.show();
    });

    socket.on('controllerTriggered', function(){
        console.log('Controller triggered');
        if (undefined != countdown) {
            return;
        }

        if (pictureTimer) {
            clearTimeout(pictureTimer);
            pictureTimer = undefined;
            $pictureContainer.hide();
        }


        var count = 6;
        $counterContainer.html(count);
        $counterContainer.addClass('zoom-start');

        $messageContainer.hide();
        $counterContainer.show();

        countdown = setInterval(function() {
            $counterContainer.removeClass('zoom-start');
            if (0==count) {
                clearInterval(countdown);
                countdown = undefined;
                // Envoie de la demande de prise de photo
                socket.emit('takePicture');

                return;
            }

            // Force rerender
            setTimeout(function(){
                count -= 1;
                $counterContainer.html(count ? count : 'souriez...');
                $counterContainer.addClass('zoom-start');
            }, 10);
        }, 1100);
    });

    socket.on('picture', function(path){
        console.log('Image disponible %o', path);
        $imageTag.prop('src', path);
        $counterContainer.hide();
        $pictureContainer.fadeIn();

        pictureTimer = setTimeout(function(){
            $pictureContainer.fadeOut(function(){
                $messageContainer.show();
            });

            pictureTimer = undefined;
        }, 3500);
    });
})(jQuery, window);