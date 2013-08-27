/**
 * @author David Corvoysier / Copyright Orange 2013
 */
(function(global) {
    
    var createTexture = function (gl, width, height, type) {
        var texture = gl.createTexture();
        //set properties for the texture
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, type, null);

        return texture;
    };
        
    var Frame = function (canvas, width, height, type) {
        var _gl = canvas.gl;
        var _fb = canvas.fb;
        var _texture = createTexture(_gl, width, height, type);
        
        return {
            load : function (element) {
                _gl.bindTexture(_gl.TEXTURE_2D, _texture);
                if (element.buffer) {
                    _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, width, height, 0, _gl.RGBA, type, element);
                } else {
                    _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, type, element);
                }
            },
            copy: function (buffer,x,y,w,h) {
                x = x || 0;
                y = y || 0;
                w = w || width;
                h = h || height;
                _gl.bindFramebuffer(_gl.FRAMEBUFFER, _fb);
                _gl.framebufferTexture2D(_gl.FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, _gl.TEXTURE_2D, _texture, 0);
                if (_gl.checkFramebufferStatus(_gl.FRAMEBUFFER) !== _gl.FRAMEBUFFER_COMPLETE) {
                    throw new Error('incomplete framebuffer');
                }
                _gl.viewport(0, 0, width, height);
                _gl.readPixels(x, y, w, h, _gl.RGBA, _gl.UNSIGNED_BYTE, buffer);
                _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
            },
            texture: _texture,
            width: width,
            height: height,
            highres: type != _gl.UNSIGNED_BYTE
        };
    };
    
    var frame = function (element, width, height, highres) {
        var canvas = global.canvas();
        var gl = canvas.gl;
        var w = width || (element ? element.width || element.videoWidth: canvas.width);
        var h = height || (element ? element.height || element.videoHeight: canvas.height);
        var type = gl.UNSIGNED_BYTE;
        highres = highres || false;
        if(highres) {
            if (gl.getExtension('OES_texture_float')) {
                type = gl.FLOAT;
            } else {
                throw new Error('High-resolution textures are not supported by your browser');
            }
        }
        var f = new Frame(canvas, w, h, type);
        if(element) {
            f.load(element);
        }
        return f;
    };

    global.frame = frame;

})(glimp);

