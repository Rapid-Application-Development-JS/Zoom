requirejs(["../../libs/zoom"], function(Zoom) {    
        new Zoom(document.querySelector('.zoom-viewer'), {
            maxZoom: 2,
            minZoom: 1,
            preventBounce: false,
            withMoving: true,
            withMouse: true
        });  
});