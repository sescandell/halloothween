;(function($, window, undefined){
    // Mise en cache des éléments du DOM
    var $photos = $('.photos');
    var $trigger = $('.trigger');
    var $popinImg = $('.popin img');
    var $body = $('body');

    // connect to the socket
    var socket = io.connect('/socket');

    socket.on('connected', function(){
        console.log('Connected');
        socket.emit('loadPhotos');
    });

    $trigger.on('click', function(e){
        console.log('Click');
        socket.emit('triggerFired');
        e.preventDefault();
    });

    socket.on('picture', function(path){
        console.log('Image disponible %o', path);
        $('<li />')
            .append(
                $('<img />')
                    .prop('src', '/thumbnails/'+path)
                    .data('path', path)
            )
            .prependTo($photos);
    });

    $photos.on('click', 'img', function(){
        $popinImg.prop('src', '/pictures/'+$(this).data('path'));
        $body.addClass('popin-shown');
    });

    $('.popin img, .overlay').click(function(){
        $body.removeClass('popin-shown');
    })
})(jQuery, window);