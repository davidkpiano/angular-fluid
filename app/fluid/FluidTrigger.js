
function FluidTrigger(id, instance) {
    var self = this;

    self.id = id;

    self.type = null;

    self.states = [];

    self.instance = instance;

    self.initialized = false;
}

FluidTrigger.prototype.initialize = function() {
    var self = this;

    console.log('Initializing trigger %s', self.id);

    if (!self.instance.types.trigger(self)) {
        console.error("Invalid trigger ID: '%s'", id);
    }

    self.type = self.instance.types.trigger(self);

    self.type.link(self);

    self.initialized = true;

    return self;
}

FluidTrigger.prototype.addState = function(state) {
    var self = this;

    if (!_.find(self.states, {id: state.id})) {
        self.states.push(state);
    }

    return self;
}

FluidTrigger.prototype.activate = function() {
    var self = this;

    console.log("Triggering trigger '%s'", self.id);

    self.instance.queue(self.states);

    return self;
}