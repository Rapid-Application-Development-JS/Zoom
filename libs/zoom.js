function Zoom (zoomViewer, options) {
    var self = this;
    this.options = options;
    this.zoomViewer = zoomViewer;
    this.zoomBody = this.zoomViewer.children[0];
    this.zoomViewer.addEventListener('touchstart', function (e) {
        e.stopPropagation();
        self._zoomStart(e);
    }, false);

    this.zoomMove = function (e) {
        self._zoom(e);
    };

    this.zoomEnd = function (e) {
        self._zoomEnd(e);
    };
//    this.addStyles();
    this.scale = 1;
}
Zoom.prototype = {
    _zoomStart: function (e) {
        if (!e.touches || e.touches.length < 2) {
            return;
        }

        var coords = {
                x1 : e.touches[0].pageX,
                x2 : e.touches[1].pageX,
                y1 : e.touches[0].pageY,
                y2 : e.touches[1].pageY
            },
            deltas = this.calculateDelta(coords),
            distance = this.calculateDistance({
                x: deltas.x,
                y: deltas.y
            }),
            clientRect = this.zoomBody.getBoundingClientRect();

        this.zoomViewer.classList.add('without-scroll');

        this.startLeft = -clientRect.left;
        this.startTop = -clientRect.top;

        this.averX = ((coords.x1 + coords.x2) / 2);
        this.averY = ((coords.y1 + coords.y2) / 2);

        this.transform(0, 0, this.scale);

        this.distanceStart = distance;
        this.startScale = this.scale;

        this.pinching = true;

        this.addListenners();
    },
    _zoom: function (e) {
        if (!e.touches || e.touches.length < 2 || !this.pinching) {
            return;
        }
        var deltas = this.calculateDelta({
                x1 : e.touches[0].pageX,
                x2 : e.touches[1].pageX,
                y1 : e.touches[0].pageY,
                y2 : e.touches[1].pageY
            }),
            distance = this.calculateDistance({
                x: deltas.x,
                y: deltas.y
            }),
            scale = 1 / this.distanceStart * distance * this.startScale,
            shifts;

        if (!this.scaled) {
            if(!scale || Math.abs(this.distanceStart - distance) < 10) {
                return;
            }
        }

        this.scaled = true;

        if (!this.options.preventBounce) {
            if (scale < this.options.minZoom) {
                scale = 0.5 * this.options.minZoom * Math.pow(2.0, scale / this.options.minZoom);
            } else if (scale > this.options.maxZoom) {
                scale = 2.0 * this.options.maxZoom * Math.pow(0.5, this.options.maxZoom / scale);
            }
        } else if (scale < this.options.minZoom || scale > this.options.maxZoom) {
            return;
        }

        shifts = this.calculateShifts(scale / this.startScale);
        this.transform(shifts.shiftX, shifts.shiftY, scale);
        this.scale = scale;
    },
    _zoomEnd: function (e) {
        if (!e.touches || e.touches.length >= 2 || !this.pinching) {
            return;
        }
        var pdfViewer = this.zoomViewer,
            clientRect, shifts;

        if ( this.scale > this.options.maxZoom ) {
            this.scale = this.options.maxZoom;
        } else if ( this.scale < this.options.minZoom ) {
            this.scale = this.options.minZoom;
        }
        this.zoomViewer.classList.remove('without-scroll');

        shifts = this.calculateShifts(this.scale / this.startScale);

        this.transform(shifts.shiftX, shifts.shiftY, this.scale);

        clientRect = this.zoomBody.getBoundingClientRect();

        this.transform(0, 0, this.scale);

        pdfViewer.scrollLeft = -clientRect.left;
        pdfViewer.scrollTop = -clientRect.top;

        this.pinching = false;
        this.scaled = false;
        this.averX = 0;
        this.averY = 0;
        this.removeListenners();
    },
    calculateShifts: function (deltaScale) {
        var shifts = {};
        shifts.shiftX = (this.averX) - (this.averX * deltaScale) + (this.startLeft - (this.startLeft * deltaScale));
        shifts.shiftY = (this.averY) - (this.averY * deltaScale) + (this.startTop - (this.startTop * deltaScale));

        return shifts;
    },
    calculateDistance: function (deltaCoords) {
        return Math.sqrt(Math.pow(deltaCoords.x, 2) + Math.pow(deltaCoords.y, 2))
    },
    calculateDelta: function (coords) {
        return {
            x : Math.abs(coords.x1 - coords.x2),
            y : Math.abs(coords.y1 - coords.y2)
        }
    },
    transform: function (x, y, s) {
        this.zoomBody.style.transform = 'translate(' + x + 'px, ' + y + 'px)' + 'scale(' + s + ') translateZ(0)';
        this.zoomBody.style['-webkit-transform'] = 'translate(' + x + 'px, ' + y + 'px)' + 'scale(' + s + ') translateZ(0)';
    },
    addListenners: function () {
        this.zoomViewer.addEventListener('touchmove', this.zoomMove, false);
        this.zoomViewer.addEventListener('touchend', this.zoomEnd, false);
        this.zoomViewer.addEventListener('touchcancel', this.zoomEnd, false);
    },
    removeListenners: function () {
        this.zoomViewer.removeEventListener('touchmove', this.zoomMove, false);
        this.zoomViewer.removeEventListener('touchend', this.zoomEnd, false);
        this.zoomViewer.removeEventListener('touchcancel', this.zoomEnd, false);
    }
};
