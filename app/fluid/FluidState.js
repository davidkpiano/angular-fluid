// Constructor for FluidState
function FluidState(id, rule, instance) {
    var self = this;

    this.meta = {};

    this.id = id;

    this.meta.id = this.parseId(this.id);

    this.name = this.meta.id.name;

    this.parallel = this.meta.id.params[0].parallel;

    this.instance = instance;

    this.parent = null;

    this.states = [];

    this.triggers = [];

    this.trigger = null;

    this.active = false;

    this.rules = [];

    this.toggle = function() {
        self[self.active ? 'deactivate' : 'activate']();
    }

    var initialize = function() {
        rule && self.addRule('initial', rule);

        console.log(self.meta.id.parent);

        instance.getState(self.meta.id.parent).addState(self);
    }

    initialize();
}

FluidState.prototype.addTrigger = function(property) {
    console.log("Adding trigger for '%s'", property);

    this.instance.addTrigger(property, this);
}

FluidState.prototype.parseId = function(id) {
    var idData = {
        id: id,
        parent: null,
        name: null,
        params: id.match(/([\:\.]?\w+)/g)
    };

    var tagMap = [
        {
            tag: ':',
            parallel: true
        },
        {
            tag: '.',
            parallel: false
        },
        {
            tag: '',
            parallel: true,
            parent: true
        }
    ];

    console.log(idData.params);

    idData.parent = idData.params
        .splice(0, idData.params.length - 1)
        .join('') || null;

    idData.params = idData.params.map(function(idParam) {
        console.log(idParam);
        var tag = /[\:\.]?/.exec(idParam)[0];
        var param = /\w+/.exec(idParam)[0];

        var tagMapItem = tagMap.filter(function(tagMapItem) {
            return tagMapItem.tag == tag;
        })[0];

        return angular.extend({ param: param }, tagMapItem);
    });

    idData.name = idData.params.slice(-1)[0].param;

    return idData;
}

FluidState.prototype.addState = function(state) {
    this.states.push(state);

    state.parent = this;
}

FluidState.prototype.validate = function() {
    // Check rules
    var rules = this.rules;

    if (!rules.length) return true;

    var valid = true;

    _.forEach(rules, function(rule) {
        valid = valid && rule.validate();
    });

    if (valid) {
        this.activate();
    } else {
        this.deactivate();
    }
}

FluidState.prototype.validateSiblings = function() {
    var siblings = this.getSiblings();

    if (this.parallel) {
        _.each(_.where(siblings, {parallel: false, active: true}), function(siblingState) {
            siblingState.deactivate();
        });
    } else {
        _.each(_.where(siblings, {active: true}), function(siblingState) {
            siblingState.deactivate();
        });
    }
}

FluidState.prototype.activate = function() {
    console.log("Activating state '%s'", this.id);

    var stateChanged = !this.active;

    this.active = true;

    stateChanged && this.instance.getStates();

    if (stateChanged && this.trigger) {
        this.trigger.trigger();
    }

    this.validateSiblings();

    _.each(this.states, function(state) {
        console.log("Validating child state '%s'", state.id);
        state.validate();
    });

    return this;
}

FluidState.prototype.deactivate = function() {
    console.log("Deactivating state '%s'", this.id);

    var stateChanged = this.active;

    this.active = false;

    stateChanged && this.instance.getStates();

    if (stateChanged && this.trigger) {
        this.trigger.trigger();
    }

    _.each(this.states, function(state) {
        console.log("Validating child state '%s'", state.id);
        state.validate();
    });

    return this;
}

FluidState.prototype.getSiblings = function() {
    var self = this;

    return _.reject(this.parent.states, function(state) {
        return state == self;
    });
}

FluidState.prototype.addRule = function(id, rule) {
    var self = this;

    if (!rule) return self;

    console.log("Adding rule '%s' to state '%s'", id, self.id);

    var fluidRule = this.instance.addRule(id, rule, self);

    self.rules.push(fluidRule);

    return self;
}

FluidState.prototype.setTrigger = function(trigger) {
    var self = this;

    if (trigger instanceof FluidTrigger) {
        self.trigger = trigger;
    }
}