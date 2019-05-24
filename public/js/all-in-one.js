;(function($, window, undefined){
    var COUNTDOWN_TIME = 5;

    var countdown = undefined;
    var pictureTimer = undefined;

    // Mise en cache des éléments du DOM
    var $photos = $('.photos');
    var $trigger = $('.trigger');
    var $popinImg = $('.popin img');
    var $body = $('body');
    var $video=$('video');
    var $counter = $('.counter');
    var socket = io.connect('/socket');

    $trigger.on('click', function(e){
        e.preventDefault();
        if (undefined != countdown) {
            return;
        }

        console.log('Click');
        socket.emit('triggerFired');
        $trigger.hide();

        var count = COUNTDOWN_TIME;
        $counter.html(count);
        $counter.addClass('zoom-start');
        $counter.show();

        countdown = setInterval(function() {
            $counter.removeClass('zoom-start');
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
                $counter.html(count ? count : 'souriez...');
                $counter.addClass('zoom-start');
            }, 10);
        }, 1100);
    });

    socket.on('connected', function(){
        console.log('Connected');
        socket.emit('loadPhotos');
    });

    socket.on('picture-thumbnail', function(path){
        console.log('Image disponible %o', path);
        $('<li />')
            .append(
                $('<img />')
                    .prop('src', '/thumbnails/'+path)
                    .data('path', path)
            )
            .prependTo($photos);
    });

    socket.on('gallery', function(path){
        console.log('Image disponible %o', path);
        $('<li />')
            .append(
                $('<img />')
                    .prop('src', '/thumbnails/'+path)
                    .data('path', path)
            )
            .prependTo($photos);
    });

    socket.on('cry', function(){
        console.log('Here I am');
    });

    $photos.on('click', 'img', function(){
        $popinImg.prop('src', '/display/'+$(this).data('path'));
        $body.addClass('popin-shown');
    });

    $('.popin img, .overlay').click(function(){
        $body.removeClass('popin-shown');
    });

    navigator
        .mediaDevices
        .getUserMedia({ video: true })
        .then(function (stream) {
            console.log("Récupération flux");
            $video[0].srcObject = stream;
        })
        .catch(function (err0r) {
            console.error("Erreur récupération flux vidéo");
        });

    $('.fullscreen').on('click', function(){
        var el = document.documentElement;
        if (el.requestFullscreen) {
            el.requestFullscreen();
        } else if (el.msRequestFullscreen) {
            el.msRequestFullscreen();
        }else if (el.mozRequestFullScreen) {
            el.mozRequestFullScreen();
        }else if (el.webkitRequestFullscreen) {
            el.webkitRequestFullscreen();
        }
        $(this).hide();

        return false;
    })
})(jQuery, window);