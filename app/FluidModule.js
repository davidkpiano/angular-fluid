angular.module('FluidApp', []);

angular.module('FluidApp')
    .controller('LoginController', ['FluidService', 'LoginService', function(FluidService, LoginService) {
        var self = this;

        self.foo = 'bar';


        var FL = window.FL = FluidService.register('login', self);

        self.ui = FL.state();

        self.login = function() {
            FL.go('status.loading');

            var loginPromise = LoginService.login(self.user, self.pass)
                .then(function(data) {
                    FL.go('status.loaded');
                },

                function(data) {
                    FL.go('status.error');
                });
        }

        FL.state('user', 'user', true).acceptAny()
            .sink('user.valid');

        FL.state('user.valid');

        FL.state('user.invalid')
            .addRule('@user.invalid.length || @user.invalid.illegal');

        FL.state('user.invalid.length')
            .addRule(function() {
                return !self.user || self.user.length < 6;
            });
 
        FL.state('user.invalid.illegal')
            .addRule(function() {
                return /[0-9]/.test(self.user);
            });

        // FL.state('name', 'user', true).acceptAny();

        // FL.state('name.empty', function() {return !self.user.length})
        //     .initial();

        // FL.state('name.short', function() {return self.user.length < 6});
        // FL.state('name.medium', function() {return self.user.length >= 6 && self.user.length < 12});
        // FL.state('name.long', function() {return self.user.length >= 12});

        // FL.state('pass', 'pass');

        // FL.state('pass.valid', function() {
        //     return self.pass && self.pass.length;
        // });

        // FL.state('status', true, true)
        //     .acceptAny();
        // FL.state('status.pending', true)
        //     .to('status.loading')
        //     .initial();
        // FL.state('status.loading', false)
        //     .to('status.loaded')
        //     .to('status.error');
        // FL.state('status.loaded', false)
        //     .to('status.loading');
        // FL.state('status.error', false)
        //     .to('status.loading');

        // FL.state('form', 'user && pass');
        // FL.state('form.valid', '@user.valid && @pass.valid');
        // FL.state('form.canLogin', '@form.valid && !@status.loading');

        FL.initialize();
    }]);

angular.module('FluidApp')
    .controller('TennisController', ['FluidService', '$interval', function(FluidService, $interval) {
        var self = this;
        var FL = window.tennis = FluidService.register('tennis', self);

        this.ui = FL.state();

        self.p1Scored = function() {
            return self.foo.slice(-1) == 'p';
        }

        self.q1Scored = function() {
            return self.foo.slice(-1) == 'q';
        }

        FL.state('p1', 'foo', true).acceptAny()
            .initial('p1.love');

        FL.state('p1.love')
            .to('p1.s15', self.p1Scored);

        FL.state('p1.s15')
            .to('p1.s30', self.p1Scored);

        FL.state('p1.s30')
            .to('p1.s40', function() {
                return !FL.isActive('q1.s40') && self.p1Scored();
            })
            .to('p1.deuce', '@q1.s40');

        FL.state('p1.s40')
            .to('p1.win', self.p1Scored)
            .to('p1.deuce', '@q1.s40 || @q1.deuce');

        FL.state('p1.deuce')
            .to('p1.ad', self.p1Scored)
            .to('p1.dis', self.q1Scored);

        FL.state('p1.ad')
            .to('p1.win', self.p1Scored)
            .to('p1.deuce', self.q1Scored);

        FL.state('p1.dis')
            .to('p1.deuce', self.p1Scored);

        FL.state('p1.win');

        FL.state('q1', 'foo', true).acceptAny()
            .initial('q1.love');

        FL.state('q1.love')
            .to('q1.s15', self.q1Scored);

        FL.state('q1.s15')
            .to('q1.s30', self.q1Scored);

        FL.state('q1.s30')
            .to('q1.s40', function() {
                return !FL.isActive('p1.s40') && self.q1Scored();
            })
            .to('q1.deuce', '@p1.s40 || @p1.deuce');

        FL.state('q1.s40')
            .to('q1.win', self.q1Scored);

        FL.state('q1.deuce')
            .to('q1.ad', self.q1Scored)
            .to('q1.dis', self.p1Scored);

        FL.state('q1.ad')
            .to('q1.win', self.q1Scored)
            .to('q1.deuce', self.p1Scored);

        FL.state('q1.dis')
            .to('q1.deuce', self.q1Scored);

        FL.state('q1.win');

        FL.initialize();

    }]);


angular.module('FluidApp')
    .service('LoginService', ['$timeout', '$q', function($timeout, $q) {
        var self = this;

        var credentials = {
            user: 'username',
            pass: 'password'
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