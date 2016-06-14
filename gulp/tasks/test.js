var gulp = require('gulp');
var Server = require('karma').Server;
var config = require('../config');

/**
 * Run test once and exit
 */
gulp.task('test', ['glslify'], function (done) {
  new Server({
    configFile: config.paths.karmaConfigFile,
    singleRun: true
  }, function() { done(); }).start();
});