// Constructor for FluidRule
function FluidRule(rule, toState, fromState, instance) {
    var self = this;

    self.rule = rule;

    self.toState = toState;

    self.fromState = fromState;

    self.validate = null;

    self.instance = instance;

    self.initialized = false;
}

FluidRule.prototype.initialize = function() {
    var self = this;

    self.toState = self.instance.getState(self.toState);

    self.fromState = self.instance.getState(self.fromState);

    self.toState.pushRule(self);

    self.validate = self.parseValidate(self.rule);

    self.initialized = true;

    return self;
}

FluidRule.prototype.parseValidate = function(rule) {
    var self = this;

    var fluidRule = rule;

    var triggers;

    if (angular.isString(rule)) {
        triggers = rule.match(self.instance.settings.regex.TRIGGER);

        self.instance.addTriggers(triggers, self.toState);

        fluidRule = function() {
            return !!self.instance.parse(rule);
        }
    }

    return fluidRule;
}