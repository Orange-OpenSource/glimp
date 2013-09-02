/**
 * @author David Corvoysier / Copyright Orange 2013
 * 
 */
(function(global) {

    var _canvas;
    
    /**
     * @class Canvas
     * 
     */
    var Canvas = function(canvas) {
        canvas = (canvas && typeof canvas === 'object') ? canvas : document.createElement("canvas");
        var _width = canvas.width;
        var _height = canvas.height;
        var _gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!_gl) {
            throw 'This browser does not support WebGL';
        }
        var _fb = _gl.createFramebuffer();
        return {
            width : _width,
            height: _height,
            gl: _gl,
            fb: _fb,
        };
    };

    global.canvas = function() {
        _canvas = _canvas || new Canvas();
        return _canvas;
    };
    global.setCanvas = function(canvas) {
        _canvas = new Canvas(canvas);
    };

})(glimp);

