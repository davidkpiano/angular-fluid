angular.module('FluidApp', []);

angular.module('FluidApp')
    .controller('LoginController', ['FluidService', 'LoginService', function(FluidService, LoginService) {
        var self = this;

        self.foo = 'bar';

        var FL = self.FL = FluidService.register('login', self);

        self.state = self.FL._states;

        self.login = function() {
            FL.getState('userValid').validate();

            LoginService.login(self.user, self.pass)
                .then(function(data) {
                    alert('logged in!');
                },

                function(data) {
                    alert('Incorrect credentials!');
                });
        }

        FL.addState('userValid', 'user')
            .rule('length', function() {
                return self.user && self.user.length > 6;
            });

        FL.addState('passValid', 'pass')
            .rule('length', function() {
                return self.pass && self.pass.length;
            });

        FL.addState('formValid', 'user pass')
            .rule('valid', function() {
                return FL.getState('userValid').active && FL.getState('passValid').active;
            });
    }]);


angular.module('FluidApp')
    .service('LoginService', ['$timeout', '$q', function($timeout, $q) {
        var self = this;

        var credentials = {
            user: 'foo',
            pass: 'bar'
        };

        self.login = function(user, pass) {
            var deferred = $q.defer();

            $timeout(function() {
                if (credentials.user == user && credentials.pass == pass) {
                    deferred.resolve(true);
                } else {
                    deferred.reject(false);
                };
            }, 2000);

            return deferred.promise;
        }
    }]);