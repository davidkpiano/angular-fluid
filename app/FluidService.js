

angular.module('FluidApp')
    .service('FluidService', [function() {
        var fl = new FluidInstance();

        fl.addState('login');
        fl.addState('login.loading');
        fl.addState('login.failure');
        fl.addState('login.success');

        fl.addState('credentials');
        fl.addState('credentials:usernameError');
        fl.addState('credentials:passwordError');
        fl.addState('credentials.valid');

        this.toggle = function(state) {
            state.toggle();
        }

        this.getStates = function() {
            return fl.states;
        }
    }]);

// Constructor for FluidState
function FluidState(id, params, FluidInstance) {
    var self = this;

    this.meta = {};

    this.id = id;

    this.meta.id = this.parseId(this.id);

    this.parallel = this.meta.id.params[0].parallel;

    this.instance = FluidInstance;

    this.children = [];

    this.active = false;

    this.activate = function() {
        console.log('activating');
        if (self.active) return true;

        if (self.parent) {        
            if (!self.parallel) {
                _.each(this.parent.children, function(state) {
                    state.deactivate();
                });
            } else {
                _.each(this.parent.children, function(state) {
                    if (!state.parallel) {
                        state.deactivate();
                    }
                });
            }
        }

        self.active = true;

        return self;
    }

    this.deactivate = function() {
        if (!self.active) return true;

        self.active = false;
    }

    this.toggle = function() {
        self[self.active ? 'deactivate' : 'activate']();
    }
}

FluidState.prototype.parseId = function(id) {
    var idData = {
        id: id,
        parent: null,
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

    idData.parent = idData.params
        .splice(0, idData.params.length - 1)
        .join('') || null;

    // console.log(idParams);

    idData.params = idData.params.map(function(idParam) {
        console.log(idParam);
        var tag = /[\:\.]?/.exec(idParam)[0];
        var param = /\w+/.exec(idParam)[0];

        var tagMapItem = tagMap.filter(function(tagMapItem) {
            return tagMapItem.tag == tag;
        })[0];

        return angular.extend({ param: param }, tagMapItem);
    });

    return idData;
}

// Constructor for FluidInstance
function FluidInstance() {
    var self = this;

    this.states = [];

    this.addState = function(id) {
        // 1. Split the ID string
        var state = new FluidState(id, {}, self);

        // Add state's parent
        state.parent = this.getState(state.meta.id.parent);
        if (state.parent) state.parent.children.push(state);

        self.states.push(state);

        return state;
    }

    this.getState = function(id) {
        if (id == null) return null;

        var stateResults = self.states.filter(function(state) {
            return state.id === id;
        });

        if (stateResults.length !== 1) {
            console.error("FluidState '%s' does not exist.", id);

            return null;
        }

        return stateResults[0];
    }
}