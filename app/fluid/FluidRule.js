// Constructor for FluidRule
function FluidRule(id, rule, instance) {
    var self = this;

    this.id = id;

    this.validate = null;

    this.triggers = [];

    this.instance = instance;

    var initialize = function() {
        self.validate = self.parseValidate(rule);
    }

    initialize();
}

FluidRule.prototype.parseValidate = function(rule) {
    var self = this;

    console.log("Parsing rule '%s'", rule);

    var fluidRule = rule;

    if (angular.isString(rule)) {
        self.triggers = rule.match(self.instance.settings.regex.TRIGGER);

        fluidRule = function() {
            return !!self.instance.parse(rule);
        }
    }

    return fluidRule;
}