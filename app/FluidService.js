

angular.module('FluidApp')
    .service('FluidService', [function() {

    }]);

// Constructor for FluidState
function FluidState(id, params, FluidInstance) {
    this.id = id;

    this.instance = FluidInstance;
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
        .join('');

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

        // state.setParent(self.getState)
        console.log(state);

        return state.parseId(id);
    }

    this.getState = function(id) {
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