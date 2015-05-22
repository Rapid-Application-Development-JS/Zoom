function Zoom (zoomViewer, options) {
    var self = this,
        viewerClientRect;
    this.options = options;

    this.options.maxZoom = this.options.maxZoom || 2;
    this.options.minZoom = this.options.minZoom || 1;

    this.zoomViewer = typeof zoomViewer == 'string' ? document.querySelector(zoomViewer) : zoomViewer;
    this.zoomBody = this.zoomViewer.children[0];

    viewerClientRect = this.zoomViewer.getBoundingClientRect();
    this.viewerOffsets = {};
    this.viewerOffsets.top = viewerClientRect.top;
    this.viewerOffsets.left = viewerClientRect.left;

    this.zoomViewer.classList.add('zoom-viewer');
    this.zoomBody.classList.add('zoom-body');

    this.touchStart = function (e) {
        e.stopPropagation();
        self._touchZoomStart(e);
    };

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

    this.zoomViewer.addEventListener('touchstart', this.touchStart, false);

    if (this.options.withMouse) {
        this.mouseDown = function (e) {
            e.stopPropagation();
            self._mouseZoomStart(e);
        };
        this.zoomViewer.addEventListener('mousedown', this.mouseDown, false);
    }


//    this.addStyles();
    this.scale = 1;
}
Zoom.prototype = {
    _mouseEvent: {
        'mousewheel': 'mouseZoomMove',
        'DOMMouseScroll': 'mouseZoomMove',
        'mouseup': 'mouseZoomEnd'
    },
    _touchEvent: {
        'touchmove': 'touchZoomMove',
        'touchend': 'touchZoomEnd',
        'touchcancel': 'touchZoomEnd'
    },
    destroy: function () {
        this.removeMouseListeners();
        this.removeTouchListeners();
        this.zoomViewer.removeEventListener('touchstart', this.touchStart, false);

        if (this.options.withMouse) {
            this.zoomViewer.removeEventListener('mousedown', this.mouseDown, false);
        }

        this.zoomViewer.classList.add('zoom-viewer');
        this.zoomBody.classList.add('zoom-body');

        this.zoomViewer = null;
        this.zoomBody = null;
    },
    redefineOptions: function (options) {
        var self = this;
        this.removeMouseListeners();
        this.removeTouchListeners();
        this.zoomViewer.removeEventListener('touchstart', this.touchStart, false);
        this.zoomViewer.removeEventListener('mousedown', this.mouseDown, false);
        for (var param in options) {
            if (options.hasOwnProperty(param)) {
                this.options[param] = options[param];
            }
        }
        this.options.maxZoom = this.options.maxZoom || 2;
        this.options.minZoom = this.options.minZoom || 1;
        if (this.options.withMouse) {
            this.mouseDown = function (e) {
                e.stopPropagation();
                self._mouseZoomStart(e);
            };
            this.zoomViewer.addEventListener('mousedown', this.mouseDown, false);
        }
        this.addTouchListeners();
    },

    _mouseZoomStart: function (e) {
        if (e.target === this.zoomViewer) {
            return;
        }
        e.preventDefault();
        var clientRect = this.zoomBody.getBoundingClientRect();

        this.zoomViewer.classList.add('without-scroll');

        this.startLeft = -clientRect.left /*this.zoomViewer.scrollLeft*/;
        this.startTop = -clientRect.top/*this.zoomViewer.scrollTop*/;

        this.averX = e.pageX;
        this.averY = e.pageY;

        this.transform(0, 0, this.scale);

        this.distance = 1;
        this.startScale = this.scale;

        this.pinching = true;

        this.addMouseListeners();
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
            shifts;

        if ( this.scale > this.options.maxZoom ) {
            this.scale = this.options.maxZoom;
        } else if ( this.scale < this.options.minZoom ) {
            this.scale = this.options.minZoom;
        }
        this.zoomViewer.classList.remove('without-scroll');

        shifts = this.calculateShifts(this.scale / this.startScale);

        this.transform(0, 0, this.scale);

        pdfViewer.scrollLeft = this.startLeft - shifts.shiftX - (-this.viewerOffsets.left);
        pdfViewer.scrollTop = this.startTop - shifts.shiftY - (-this.viewerOffsets.top);

        this.pinching = false;
        this.scaled = false;
        this.averX = 0;
        this.averY = 0;
        this.removeMouseListeners();
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

        this.addTouchListeners();
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
            shifts;
        if ( this.scale > this.options.maxZoom ) {
            this.scale = this.options.maxZoom;
        } else if ( this.scale < this.options.minZoom ) {
            this.scale = this.options.minZoom;
        }
        this.zoomViewer.classList.remove('without-scroll');

        shifts = this.calculateShifts(this.scale / this.startScale);

        this.transform(0, 0, this.scale);

        pdfViewer.style.display='none';
        pdfViewer.offsetHeight;
        pdfViewer.style.display='block';

        pdfViewer.scrollLeft = this.startLeft - shifts.shiftX - (-this.viewerOffsets.left);
        pdfViewer.scrollTop = this.startTop - shifts.shiftY - (-this.viewerOffsets.top);

        this.pinching = false;
        this.scaled = false;
        this.averX = 0;
        this.averY = 0;
        this.removeTouchListeners();
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
        this.averX = ((coords.x1 + coords.x2) / 2);
        this.averY = ((coords.y1 + coords.y2) / 2);
    },
    transform: function (x, y, s) {
        this.zoomBody.style.transform = 'translate(' + x + 'px, ' + y + 'px)' + 'scale(' + s + ') translateZ(0)';
        this.zoomBody.style['-webkit-transform'] = 'translate(' + x + 'px, ' + y + 'px)' + 'scale(' + s + ') translateZ(0)';
    },
    addMouseListeners: function () {
        for (var eventName in this._mouseEvent) {
            if (this._mouseEvent.hasOwnProperty(eventName)) {
                this.zoomViewer.addEventListener(eventName, this[this._mouseEvent[eventName]], false);
            }
        }
        if (this.options.withMoving) {
            this.zoomViewer.addEventListener('mousemove', this.mouseMove, false);
        }
    },
    removeMouseListeners: function () {
        for (var eventName in this._mouseEvent) {
            if (this._mouseEvent.hasOwnProperty(eventName)) {
                this.zoomViewer.removeEventListener(eventName, this[this._mouseEvent[eventName]], false);
            }
        }
        if (this.options.withMoving) {
            this.zoomViewer.removeEventListener('mousemove', this.mouseMove, false);
        }
    },
    addTouchListeners: function () {
        for (var eventName in this._touchEvent) {
            if (this._touchEvent.hasOwnProperty(eventName)) {
                this.zoomViewer.addEventListener(eventName, this[this._touchEvent[eventName]], false);
            }
        }
    },
    removeTouchListeners: function () {
        for (var eventName in this._touchEvent) {
            if (this._touchEvent.hasOwnProperty(eventName)) {
                this.zoomViewer.removeEventListener(eventName, this[this._touchEvent[eventName]], false);
            }
        }
    }
};
