angular.module('fl', []);

angular.module('fl')
    .service('fl.StateService', [function() {
        var FL = {
            state: 
        }

    }]);



// State Object
{
    // State ID, unique
    // Built from fl-state="parent:child"
    id: 'string',

    // Boolean marker for whether state is active or not
    // If a child state is active, this state is active.
    // If a child state is not active, activation must be explicit.
    // If no child states, activation must be explicit.
    active: 'boolean',

    // Reference to parent state
    // Built from fl-id="parent:child"
    parent: 'object',

    // Array (can be empty) of child states
    children: 'array',

    // Rules determine if state is active or not.
    // Rules is an array of Rule objects, all which must be true for state to be active.
    rules: 'array of Rule',

    // Actions are executed when a state change is triggered
    // Actions is an array of Action objects
    actions: 'array of Action',

    // Data is a simple object representing custom key-value pairs.
    // Data is accessible via isolate scope in the directive via fl.property
    // or [configurable prefix].property
    data: 'object',

    // Boolean marker for whether state can exist as a parallel state relative to sibling states.
    // If true, activating this state deactivates unparallel sibling states.
    // If false, activating this state deactivates all sibling states.
    // Default: false
    parallel: 'boolean (false)',

    // Boolean marker for whether state must be activated explicitly; i.e.
    // using fl.activate(state)
    // If true, all of the policy rules must be true and the state must be 
    // explicitly activated to be active.
    // If false, all of the policy rules being true means the state will be activated.
    // Default: false
    explicit: 'boolean (false)'
}

// Rule object
{
    // Rule ID, autogenerated if friendly ID not provided. UNIQUE
    id: 'string',

    // Validation method
    // Can validate against scope and fl-states using $eval
    // Returns boolean
    validate: 'function'
}

// Action object
{
    // Action ID, autogenerated if friendly ID not provided. UNIQUE
    id: 'string',

    // Active method, executed when state is activated
    active: 'function',

    // Inactive method, executed when state is deactivated.
    // Ideally the reverse of the 'active' method.
    inactive: 'function'
}