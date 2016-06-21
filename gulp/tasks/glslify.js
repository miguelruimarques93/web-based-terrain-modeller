var gulp = require('gulp');
var through = require('through2');
var glslify = require('glslify');
var path = require('path');
var rename = require('gulp-rename');

var config = require('../config');

gulp.task('glslify', function () {
  return gulp.src(config.shaders.src)
    .pipe(through.obj(function (file, encoding, callback) {
      if (file.isNull()) {
        return callback(null, file);
      }
      // console.log(file.contents);
      // file.contents = glslify(file.path);
      glslify.bundle(file.path, {}, function(err, src, files) {
        file.contents = new Buffer(src, 'utf-8');
        callback(null, file);
      });
    }))
    .pipe(rename(function (path) {
      path.dirname = '_shaders';
    }))
    .pipe(gulp.dest(config.shaders.dest));
});