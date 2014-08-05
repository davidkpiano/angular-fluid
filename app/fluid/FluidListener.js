

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

FluidListener.prototype.notify = function(active) {
    var self = this;

    if (active && self.activeListener) {
        self.activeListener();
    } else if (!active && self.inactiveListener) {
        self.inactiveListener();
    }

    return self;
}