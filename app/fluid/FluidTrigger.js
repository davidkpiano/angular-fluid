
function FluidTrigger(id, instance) {
    var self = this;

    self.id = id;

    self.type = null;

    self.states = [];

    self.addState = function(state) {
        if (!_.find(self.states, {id: state.id})) {
            self.states.push(state);
        }

        return self;
    }

    self.trigger = function() {
        console.log("Triggering trigger '%s'", self.id);

        _.forEach(self.states, function(state) {
            state.validate();
        });

        instance.getStates();
    }

    var init = function() {
        if (!instance.types.trigger(self)) {
            console.error("Invalid trigger ID: '%s'", id);
        }

        self.type = instance.types.trigger(self);

        self.type.link(self);
    };

    init();
}