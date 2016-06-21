var gulp = require('gulp');
var path = require('path');
var os = require('os');
var connect = require('gulp-connect');
var modRewrite = require('connect-modrewrite');

var config = require('../config');

gulp.task('serve', ['build:development'], function () {
  connect.server({
    root: [config.paths.app_build, config.paths.app],
    port: 3000,
    middleware: function () {
      return [
        modRewrite([
          '!\\.\\w+$ /index.html [L]'
        ])
      ];
    }
  });
});