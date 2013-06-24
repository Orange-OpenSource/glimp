/**
 * @author David Corvoysier / Copyright Orange 2013
 */
(function(global) {
    
    function createTexture(gl, width, height) {
        var texture = gl.createTexture();
        //set properties for the texture
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        return texture;
    };
    
    var Frame = function (gl, width, height) {
        var _width = width;
        var _height = height;
        var _gl = gl;
        var _fb = _gl.createFramebuffer();
        //bind framebuffer to texture
        _gl.bindFramebuffer(_gl.FRAMEBUFFER, _fb);
        _texture = createTexture(_gl, _width, _height);
        _gl.framebufferTexture2D(_gl.FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, _gl.TEXTURE_2D, _texture, 0);
        
        return {
            load : function (element) {
                _gl.bindTexture(_gl.TEXTURE_2D, _texture);
                _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, element);
            },
            asTexture: function () {
                return _texture;
            }
        }
    };
    
    var frame = function (element, width, height) {
        var canvas = global.canvas();
        var w = width || (element ? element.width || element.videoWidth: canvas.width);
        var h = height || (element ? element.height || element.videoHeight: canvas.height);
        var f = new Frame(canvas.gl, w, h);
        if(element) {
            f.load(element);
        }
        return f;
    };

    global.frame = frame;

})(glimp);

