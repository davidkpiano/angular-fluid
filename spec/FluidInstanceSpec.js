

describe('FluidInstance', function() {
    var FluidService,
        $rootScope;
    
    beforeEach(function() {
        angular.module('FluidApp');
    });

    it('can create a FluidInstance', function() {
        var fluidInstance = new FluidInstance();

        expect(fluidInstance instanceof FluidInstance).toBe(true);
    });
});