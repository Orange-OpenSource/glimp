/**
 * @author David Corvoysier / Copyright Orange 2013
 */
(function(global) {

    var _canvas,
        _width,
        _height,
        _gl;
    
    var initialize = function(canvas) {
        _canvas = (canvas && typeof canvas === 'object') ? canvas : document.createElement("canvas");
        _width = _canvas.width;
        _height = _canvas.height;
        _gl = _canvas.getContext('webgl') || _canvas.getContext('experimental-webgl');
        if (!_gl) {
            throw 'This browser does not support WebGL';
        }
    }
    
    var setCanvas = function(canvas) {
        initialize(canvas);
    }

    var canvas = function() {
        if(!_canvas){
            initialize();
        }
        var resize = function(width,height) {
            _width = _canvas.width = width || _width;
            _height = _canvas.height = height || _height;
        }
        return {
            width : _width,
            height: _height,
            gl: _gl,
            resize: resize
        }
    }

    global.canvas = canvas;
    global.setCanvas = setCanvas;
    global.draw = function (frame) {
        var shader = new Shader(_gl);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, frame.asTexture());
        shader.drawRect
    }

})(glimp);

