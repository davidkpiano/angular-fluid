// Constructor for FluidRule
function FluidRule(id, rule, FluidState) {
    this.id = id;

    this.state = FluidState;

    this.validate = this.parseValidate(rule);
}

FluidRule.prototype.parseValidate = function(rule) {
    var self = this;

    var fluidRule = rule;

    if (angular.isString(rule)) {
        var properties = rule.split(/\s+/);

        _.each(properties, function(property) {
            self.state.addTrigger(property);
        });

        fluidRule = function() {
            return !!self.state.instance.parse(rule);
        }
    };

    return fluidRule;
}