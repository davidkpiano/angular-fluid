
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
    }

    var init = function() {
        var regex = instance.settings.regex;

        if (!regex.TRIGGER.test(id)) {
            console.error("Invalid trigger ID: '%s'", id);
        }

        var triggerComponent = instance.components.trigger(self);

        self.type = triggerComponent.type;

        triggerComponent.link(self);
    };

    init();
}