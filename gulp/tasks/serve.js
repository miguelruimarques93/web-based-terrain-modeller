'use strict'

var gulp = require('gulp');
var browserSync = require('browser-sync');
var path = require('path');
var os = require('os');

var config = require('../config');

gulp.task('serve', ['build:development'], function () {
  browserSync({
    server: {
      baseDir: config.paths.app,
      index: path.relative(config.paths.app, config.paths.app_build) + '/index.html'
    },
    notify: true
  });
  
  gulp.watch(config.sass.watch_src, ['compile-sass']);
});