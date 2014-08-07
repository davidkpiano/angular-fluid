module.exports = function(grunt) {

    grunt.initConfig({
        jshint: {
            all: ['Gruntfile.js', 'app.js']
        },
        jasmine: {
            src: [
                'app/*.js',
                'app/fluid/*.js'
            ],
            options: {
                vendor: [
                    'assets/js/lodash.min.js',
                    'assets/js/angular.min.js',
                    'assets/js/angular-mocks.js'
                ],
                specs: 'spec/*Spec.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.registerTask('default', 'jshint');
};