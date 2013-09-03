/**
 * @author David Corvoysier / Copyright Orange 2013
 * 
 * Background Subtraction
 *
 */
(function(global) {
        
    var BGSubtractor = function (mask,update) {
        
        var _bgmodel;
        
        this.process = function (frameIn,fgmask) {
            _bgmodel = _bgmodel || global.frame(frameIn.width,frameIn.height,true);
            // Convert arguments to an array
            var args = Array.prototype.slice.call(arguments);
            // Only keep extra parameters
            args.splice(0,2);
            // Calculate foreground mask
            mask.apply(this,[frameIn,fgmask,_bgmodel].concat(args));
            // Update background model
            update.apply(this,[frameIn,_bgmodel].concat(args));
        };
    };
    
    var _bgfgs = [];
    
    global.bgfg = function (type) {
        type = type || 'basic';
        var _bgfg = _bgfgs[type];
        if (!_bgfg) {
            throw new Error('Unknown background-subtractor type');
        }
        return new BGSubtractor(_bgfgs[type].mask,_bgfgs[type].update);
    };
    
    global.addBGsubtractor = function (name, mask, update) {
        _bgfgs[name] = {
            mask: mask,
            update: update
        };
    };

})(glimp);
