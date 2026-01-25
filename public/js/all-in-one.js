; (function ($, window, undefined) {
    var COUNTDOWN_TIME = 5;

    var countdown = undefined;
    
    // Application configuration
    var appConfig = null;
    var qrCache = {}; // Cache for generated QR codes
    
    // Stream vidéo (référence globale pour pause/resume)
    var videoStream = null;
    var isStreamPaused = false;

    // Mise en cache des éléments du DOM
    var $photos = $('.photos');
    var $trigger = $('.trigger');
    var $popinImg = $('.popin img');
    var $qrOverlay = $('.qr-overlay');
    var $qrLoader = $('.qr-loader');
    var $qrCode = $('.qr-code');
    var $body = $('body');
    var $video = $('video');
    var $counter = $('.counter');
    var socket = io.connect('/socket');

    // Fonctions de gestion du flux vidéo
    function pauseStream() {
        if (videoStream && !isStreamPaused) {
            console.log('[STREAM] Pausing video stream...');
            videoStream.getTracks().forEach(track => track.stop());
            isStreamPaused = true;
            console.log('[STREAM] Video stream paused');
        }
    }

    function resumeStream() {
        if (isStreamPaused || !videoStream) {
            console.log('[STREAM] Resuming video stream...');
            navigator.mediaDevices
                .getUserMedia({ video: true })
                .then(function (stream) {
                    videoStream = stream;
                    $video[0].srcObject = stream;
                    isStreamPaused = false;
                    console.log('[STREAM] Video stream resumed');
                })
                .catch(function (error) {
                    console.error('[STREAM] Error resuming stream:', error);
                    alert('Erreur lors de la reprise du flux vidéo');
                });
        }
    }

    $trigger.on('click', function (e) {
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

        countdown = setInterval(function () {
            if (0 == count) {
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

    socket.on('connected', function () {
        console.log('Connected');
        socket.emit('loadPhotos');
    });

    socket.on('app-config', function (config) {
        console.log('App config received:', config);
        appConfig = config;
        
        if (config.pauseStreamMode) {
            console.log('[CONFIG] Pause stream mode ENABLED');
        } else {
            console.log('[CONFIG] Pause stream mode DISABLED (direct capture)');
        }
    });

    // Handler pour demande de pause du stream
    socket.on('requestStreamPause', function () {
        console.log('[STREAM] Backend requests stream pause');
        $counter.html('Préparation...');
        pauseStream();
        
        // Confirmer au backend que le stream est arrêté
        socket.emit('streamPaused');
        console.log('[STREAM] Pause confirmation sent to backend');
    });

    // Handler pour erreur de capture
    socket.on('captureError', function (data) {
        console.error('[CAPTURE] Error:', data.message);
        $counter.hide();
        $trigger.show();
        
        // Redémarrer le stream si nécessaire
        if (appConfig && appConfig.pauseStreamMode && isStreamPaused) {
            setTimeout(function() {
                resumeStream();
            }, 500);
        }
        
        // alert(data.message);
    });

    // Function to generate QR code and display in overlay
    function generateAndShowQR(photoName) {
        if (!appConfig.streamerUrl) {
            console.warn('Streamer config not available, hiding QR overlay');
            $qrOverlay.hide();

            return;
        }

        // Check cache first
        if (qrCache[photoName]) {
            console.log('Using cached QR for:', photoName);
            $qrLoader.hide();
            $qrCode.attr('src', qrCache[photoName]).show();

            return;
        }

        console.log('Generating QR code for:', photoName);
        
        // Show loader
        $qrLoader.show();
        $qrCode.hide();
        
        // Generate streaming URL
        var streamUrl = appConfig.streamerUrl + '/stream/' + photoName + '?rpi=' + appConfig.rpiId;
        
        try {
            // Create temporary div for QR generation
            var tempDiv = document.createElement('div');
            tempDiv.style.width = '140px';
            tempDiv.style.height = '140px';
            document.body.appendChild(tempDiv);
            
            // Generate QR code using davidshimjs/qrcodejs API
            var _qr = new QRCode(tempDiv, {
                text: streamUrl,
                width: 140,
                height: 140,
                colorDark: '#000000',
                colorLight: '#FFFFFF',
                correctLevel: QRCode.CorrectLevel.M
            });
            
            // Wait a bit for QR generation then extract image
            setTimeout(function() {
                var img = tempDiv.querySelector('img');
                if (img && img.src) {
                    var qrDataUrl = img.src;
                    
                    // Cache result
                    qrCache[photoName] = qrDataUrl;
                    
                    // Hide loader and show QR
                    $qrLoader.hide();
                    $qrCode.attr('src', qrDataUrl).show();
                    
                    console.log('QR code generated and cached for:', photoName);
                } else {
                    console.error('Failed to generate QR image');
                    $qrLoader.text('Erreur QR').css('color', '#ff0000');
                }
                
                // Clean up temporary element
                document.body.removeChild(tempDiv);
            }, 100);
            
        } catch (err) {
            console.error('QR generation error:', err);
            $qrLoader.text('Erreur QR').css('color', '#ff0000');
        }
    }

    socket.on('picture', function (path) {
        // Display image immediately for performance
        $popinImg.prop('src', '/pictures/' + path);
        $body.addClass('popin-shown');
        $counter.hide();
        
        // Show QR overlay and generate QR asynchronously
        $qrOverlay.show();
        generateAndShowQR(path);

        setTimeout(function () {
            $body.removeClass('popin-shown');
            $popinImg.prop('src', '');
            $qrOverlay.hide(); // Hide QR overlay when closing

            if (!countdown) {
                $trigger.show();
            }
            
            // Redémarrer le stream si mode pause activé et stream arrêté
            if (appConfig && appConfig.pauseStreamMode && isStreamPaused) {
                setTimeout(function() {
                    resumeStream();
                }, 500);
            }
        }, 8000);
    });

    socket.on('picture-thumbnail', function (path) {
        console.log('Image disponible %o', path);
        $('<li />')
            .append(
                $('<img />')
                    .prop('src', '/thumbnails/' + path)
                    .data('path', path)
            )
            .prependTo($photos);
    });

    socket.on('gallery', function (path) {
        console.log('Image disponible %o', path);
        $('<li />')
            .append(
                $('<img />')
                    .prop('src', '/thumbnails/' + path)
                    .data('path', path)
            )
            .prependTo($photos);
    });

    socket.on('cry', function () {
        console.log('Here I am');
    });

    $photos.on('click', 'img', function () {
        var photoPath = $(this).data('path');
        
        // Display clicked photo immediately for performance
        $popinImg.prop('src', '/display/' + photoPath);
        $body.addClass('popin-shown');
        
        // Show QR overlay and generate QR asynchronously
        $qrOverlay.show();
        generateAndShowQR(photoPath);
    });

    $('.popin img, .overlay').click(function () {
        $body.removeClass('popin-shown');
        $qrOverlay.hide(); // Hide QR overlay when closing
        $trigger.show();
    });

    try {
        navigator
            .mediaDevices
            .getUserMedia({ video: true })
            .then(function (stream) {
                console.log("Récupération flux");
                videoStream = stream; // Stocker la référence globale
                $video[0].srcObject = stream;
                isStreamPaused = false;
            })
            .catch(function (error) {
                alert(error);
            });
    } catch (e) {
        alert(e);
    }

    $('.fullscreen').on('click', function () {
        var el = document.documentElement;
        if (el.requestFullscreen) {
            el.requestFullscreen();
        } else if (el.msRequestFullscreen) {
            el.msRequestFullscreen();
        } else if (el.mozRequestFullScreen) {
            el.mozRequestFullScreen();
        } else if (el.webkitRequestFullscreen) {
            el.webkitRequestFullscreen();
        }
        $(this).hide();

        return false;
    })
})(jQuery, window);
