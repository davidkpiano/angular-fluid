angular.module('FluidApp', []);

angular.module('FluidApp')
    .controller('LoginController', ['FluidService', 'LoginService', function(FluidService, LoginService) {
        var self = this;

        self.foo = 'bar';

        var FL = window.FL = FluidService.register('login', self);

        self.ui = FL.state;

        self.login = function() {
            FL.getState('user.valid').validate();

            LoginService.login(self.user, self.pass)
                .then(function(data) {
                    alert('logged in!');
                },

                function(data) {
                    alert('Incorrect credentials!');
                });
        }

        FL.createState('user', 'user');

        FL.createState('user.valid', function() {
            return self.user && self.user.length > 6;
        });

        FL.createState('passValid', 'pass')
            .rule('length', function() {
                return self.pass && self.pass.length;
            });

        FL.createState('formValid', 'user && pass')
            .rule('valid', function() {
                return FL.getState('user.valid').active && FL.getState('passValid').active;
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