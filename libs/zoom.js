function Zoom (zoomViewer, options) {
    var self = this;
    this.options = options;
    this.zoomViewer = zoomViewer;
    this.zoomBody = this.zoomViewer.children[0];
    this.zoomViewer.addEventListener('touchstart', function (e) {
        e.stopPropagation();
        self._touchZoomStart(e);
    }, false);

    if (this.options.withMouse) {
        this.zoomViewer.addEventListener('mousedown', function (e) {
            e.stopPropagation();
            self._mouseZoomStart(e);
        }, false);
    }

    this.touchZoomMove = function (e) {
        self._touchZoom(e);
    };

    this.touchZoomEnd = function (e) {
        self._touchZoomEnd(e);
    };
    this.mouseZoomMove = function (e) {
        self._mouseZoom(e);
    };

    this.mouseZoomEnd = function (e) {
        self._mouseZoomEnd(e);
    };
    this.mouseMove = function (e) {
        self._mouseMove(e);
    };
//    this.addStyles();
    this.scale = 1;
}
Zoom.prototype = {
    _mouseZoomStart: function (e) {
        if (e.target === this.zoomViewer) {
            return;
        }
        e.preventDefault();
        var clientRect = this.zoomBody.getBoundingClientRect();

        this.zoomViewer.classList.add('without-scroll');

        this.startLeft = -clientRect.left;
        this.startTop = -clientRect.top;

        this.averX = e.pageX;
        this.averY = e.pageY;

        this.transform(0, 0, this.scale);

        this.distance = 1;
        this.startScale = this.scale;

        this.pinching = true;

        this.addMouseListenners();
    },
    _mouseZoom: function (e) {
        if (!this.pinching || (this.scale <= this.options.minZoom && e.wheelDelta > 0) || (this.scale >= this.options.maxZoom && e.wheelDelta < 0)) {
            return;
        }

        this.distance = this.distance + (e.wheelDelta > 0 ? 0.01 : -0.01);
        var scale = 1 / this.distance * this.startScale,
            shifts;
        if (!this.scaled) {
            if(!scale) {
                return;
            }
        }
        this.scaled = true;
        shifts = this.calculateShifts(scale / this.startScale);
        this.transform(shifts.shiftX, shifts.shiftY, scale);
        this.scale = scale;
    },
    _mouseMove: function (e) {
        var shifts;
        this.averX = e.pageX;
        this.averY = e.pageY;
        shifts = this.calculateShifts(this.scale / this.startScale);
        this.transform(shifts.shiftX, shifts.shiftY, this.scale);
    },
    _mouseZoomEnd: function (e) {
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
        this.removeMouseListenners();
    },

    _touchZoomStart: function (e) {
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

        this.calculateAveragePoint(coords);

        this.transform(0, 0, this.scale);

        this.distanceStart = distance;
        this.startScale = this.scale;

        this.pinching = true;

        this.addTouchListenners();
    },
    _touchZoom: function (e) {
        if (!e.touches || e.touches.length < 2 || !this.pinching) {
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
            scale = 1 / this.distanceStart * distance * this.startScale,
            shifts;
console.log(distance);
        if (!this.scaled) {
            if(!scale || Math.abs(this.distanceStart - distance) < 10) {
                return;
            }
        }
        this.scaled = true;
        if (this.options.withMoving) {
            this.calculateAveragePoint(coords);
        }
        if (scale < this.options.minZoom) {
            scale = !this.options.preventBounce ? 0.5 * this.options.minZoom * Math.pow(2.0, scale / this.options.minZoom) : this.options.minZoom;
        } else if (scale > this.options.maxZoom) {
            scale = !this.options.preventBounce ? 2.0 * this.options.maxZoom * Math.pow(0.5, this.options.maxZoom / scale) : this.options.maxZoom;
        }

        shifts = this.calculateShifts(scale / this.startScale);
        this.transform(shifts.shiftX, shifts.shiftY, scale);
        this.scale = scale;
    },
    _touchZoomEnd: function (e) {
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

        pdfViewer.style.display='none';
        pdfViewer.offsetHeight;
        pdfViewer.style.display='block';

        pdfViewer.scrollLeft = -clientRect.left;
        pdfViewer.scrollTop = -clientRect.top;

        this.pinching = false;
        this.scaled = false;
        this.averX = 0;
        this.averY = 0;
        this.removeTouchListenners();
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
    calculateAveragePoint: function (coords) {
        if (!this.options.withMouse) {
            this.averX = ((coords.x1 + coords.x2) / 2);
            this.averY = ((coords.y1 + coords.y2) / 2);
        } else {
            this.averX = coords.x1;
            this.averY = coords.y1;
        }

    },
    transform: function (x, y, s) {
        this.zoomBody.style.transform = 'translate(' + x + 'px, ' + y + 'px)' + 'scale(' + s + ') translateZ(0)';
        this.zoomBody.style['-webkit-transform'] = 'translate(' + x + 'px, ' + y + 'px)' + 'scale(' + s + ') translateZ(0)';
    },
    addMouseListenners: function () {
        this.zoomViewer.addEventListener('mousewheel', this.mouseZoomMove, false);
        this.zoomViewer.addEventListener('DOMMouseScroll', this.mouseZoomMove, false);
        if (this.options.withMoving) {
            this.zoomViewer.addEventListener('mousemove', this.mouseMove, false);
        }
        this.zoomViewer.addEventListener('mouseup', this.mouseZoomEnd, false);
    },
    removeMouseListenners: function () {
        this.zoomViewer.removeEventListener('mousewheel', this.mouseZoomMove, false);
        this.zoomViewer.removeEventListener('DOMMouseScroll', this.mouseZoomMove, false);
        if (this.options.withMoving) {
            this.zoomViewer.removeEventListener('mousemove', this.mouseMove, false);
        }
        this.zoomViewer.removeEventListener('mouseup', this.mouseZoomEnd, false);
    },
    addTouchListenners: function () {
        this.zoomViewer.addEventListener('touchmove', this.touchZoomMove, false);
        this.zoomViewer.addEventListener('touchend', this.touchZoomEnd, false);
        this.zoomViewer.addEventListener('touchcancel', this.touchZoomEnd, false);
    },
    removeTouchListenners: function () {
        this.zoomViewer.removeEventListener('touchmove', this.touchZoomMove, false);
        this.zoomViewer.removeEventListener('touchend', this.touchZoomEnd, false);
        this.zoomViewer.removeEventListener('touchcancel', this.touchZoomEnd, false);
    }
};
