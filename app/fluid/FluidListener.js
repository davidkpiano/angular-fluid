

function FluidListener(state, activeListener, inactiveListener) {
    var self = this;

    self.state = state;
    
    self.activeListener = activeListener;

    self.inactiveListener = inactiveListener;

    var init = function() {
        state.addListener(self);
    }

    init();
}

FluidListener.prototype.notify = function() {
    var self = this;

    if (self.state.active && self.activeListener) {
        self.activeListener();
    } else if (!self.state.active && self.inactiveListener) {
        self.inactiveListener();
    }

    return self;
}