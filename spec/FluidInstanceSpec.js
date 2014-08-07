

describe('FluidInstance', function() {
    var FluidService,
        $rootScope;
    
    beforeEach(angular.mock.module('FluidApp'));

    beforeEach(inject(function(_FluidService_, _$rootScope_) {
        FluidService = _FluidService_;
        $rootScope = _$rootScope_;
    }));

    it('can create a FluidInstance', function() {
        var fluidInstance = new FluidInstance();

        expect(fluidInstance instanceof FluidInstance).toBe(true);
    });
});