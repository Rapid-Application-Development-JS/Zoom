# Zoom
JS Zoom library with native CSS scroll

---

`Zoom` allows you to easily make zoom with native scroll in desktop applications and in mobile applications.

###Advantages

- `Zoom` doesn't need any library
- `Zoom` can work with desktop application using mouse wheel and also with mobile application using pinch
- `Zoom` has several options for customization

###Usage

Just include [.min.js](https://github.com/Rapid-Application-Development-JS/) and [.css](https://github.com/Rapid-Application-Development-JS/)

`<link rel="stylesheet" href=""/>`

`<script src=""></script>`

###Dependence
You can see all dependences into first item of advantages

###Methods

`destroy`
This method remove zoom for chosen element

`redefineOptions`
This method redefine zoom options. Receive one argument (could be object) with params

###Parameters

```javascript
new Zoom(zoomViewer, zoomOptions);
```

First parameter it's your container or selector of container witch you want to use like zoom wrapper. Second parameter it's zoom options in which you specify settings for zoom.
Description for each zoom options:
- `maxZoom` - maximum scale size (set 2 by default)
- `minZoom` - minimum scale size (set 1 by default)
- `preventBounce` - prevent set more then maximum scale (less then minimum scale) and returning back to maximum (minimum) scale. This parameter doesn't work for mouse wheel. Set true if you want prevent zoom bounce or false if you don't want prevent bounce
- `withMoving` - moving zoom body while you zooming. Could be true for moving adn false for static
- `withMouse` - zoom with mouse zoom. Could be true for add mouse events and false for prevent mouse zooming

###Example

To create zoom view
```javascript
var zoom = new Zoom(document.querySelector('.zoom-viewer'), {
                maxZoom: 2,
                minZoom: 1,
                preventBounce: false,
                withMoving: true,
                withMouse: true
            });
```

To change zoom options
```javascript
zoom.redefineOptions({
        withMouse: false
    });
```