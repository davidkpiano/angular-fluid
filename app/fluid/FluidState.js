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
        self.addRule('initial', rule);

        instance.getState(self.meta.id.parent).addState(self);
    }

    initialize();
}

FluidState.prototype.addTrigger = function(property) {
    console.log("Adding trigger for '%s'", property);

    this.instance.addTrigger(property, this);

    // this.triggers.push(property);
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

    var valid = true;

    angular.forEach(rules, function(rule) {
        if (!(rule instanceof FluidRule)) {
            throw 'Invalid rule';
        }

        valid = valid && rule.validate();
    });

    console.log("%s valid: %s", this.id, valid);

    if (valid) {
        this.activate();
    } else {
        this.deactivate();
    }
    
    // Activate/Deactivate if rules true/false
}

FluidState.prototype.activate = function() {
    console.log("Activating state '%s'", this.id);

    var stateChanged = !this.active;

    this.active = true;

    if (stateChanged && this.trigger) {
        this.trigger.trigger();
    }

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

    if (!rule) {
        return _.find(this.rules, {id: id});
    };

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