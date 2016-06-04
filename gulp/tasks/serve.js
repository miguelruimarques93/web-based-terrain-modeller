var gulp = require('gulp');
var browserSync = require('browser-sync');
var path = require('path');
var os = require('os');
var modRewrite = require('connect-modrewrite');

var config = require('../config');

gulp.task('serve', ['build:development'], function () {
  browserSync({
    server: {
      baseDir: config.paths.app,
      index: path.relative(config.paths.app, config.paths.app_build) + '/index.html',
      middleware: [
        modRewrite([
          '!\\.\\w+$ /index.html [L]'
        ])
      ]
    },
    notify: true
  });
  
  gulp.watch(config.sass.watch_src, ['compile-sass']);
  gulp.watch(config.shaders.src, ['glslify']);
  gulp.watch(config.html.watch_src, function () { browserSync.reload(); });
  gulp.watch(config.js.watch_src, function () { browserSync.reload(); });
});