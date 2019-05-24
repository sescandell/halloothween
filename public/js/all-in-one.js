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
            if (0==count) {
                // Envoie de la demande de prise de photo
                socket.emit('takePicture');

                $counter.removeClass('zoom-start');
                clearInterval(countdown);
                countdown = undefined;

                return;
            }

            count -= 1;
            $counter.html(count ? count : 'souriez...');
        }, 1000);
    });

    socket.on('connected', function(){
        console.log('Connected');
        socket.emit('loadPhotos');
    });

    socket.on('picture', function(path){
        $popinImg.prop('src', '/pictures/'+path);
        $body.addClass('popin-shown');
        $counter.hide();

        setTimeout(function(){
            $body.removeClass('popin-shown');
            $popinImg.prop('src', '');
            $trigger.show();
        }, 8000);
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