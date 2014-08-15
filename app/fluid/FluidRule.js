// Constructor for FluidRule
function FluidRule(rule, state, instance) {
    var self = this;

    self.rule = rule;

    self.state = state;

    self.validate = null;

    self.instance = instance;
}

FluidRule.prototype.initialize = function() {
    var self = this;

    self.validate = self.parseValidate(self.rule);

    return self;
}

FluidRule.prototype.parseValidate = function(rule) {
    var self = this;

    var fluidRule = rule;

    var triggers;

    if (angular.isString(rule)) {
        triggers = rule.match(self.instance.settings.regex.TRIGGER);

        self.instance.addTriggers(triggers, self.state);

        fluidRule = function() {
            return !!self.instance.parse(rule);
        }
    }

    return fluidRule;
}