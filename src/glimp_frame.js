/**
 * @author David Corvoysier / Copyright Orange 2013
 */
(function(global) {
    
    function createTexture(gl, width, height, type) {
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
        
    var Frame = function (gl, width, height, type) {
        var _texture = createTexture(gl, width, height, type);
        var _copyfb;
        
        return {
            load : function (element) {
                gl.bindTexture(gl.TEXTURE_2D, _texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, type, element);
            },
            copy: function (buffer) {
                _copyfb = _copyfb || gl.createFramebuffer();
                gl.bindFramebuffer(gl.FRAMEBUFFER, _copyfb);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, _texture, 0);
                if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
                    throw new Error('incomplete framebuffer');
                }
                gl.viewport(0, 0, width, height);
                gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);                
            },
            texture: _texture,
            width: width,
            height: height,
            highres: type != gl.UNSIGNED_BYTE 
        }
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
        var f = new Frame(gl, w, h, type);
        if(element) {
            f.load(element);
        }
        return f;
    };

    global.frame = frame;

})(glimp);

