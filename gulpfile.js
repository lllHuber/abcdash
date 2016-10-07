// --------------------------------------------------
// DEPENDENCIES
// --------------------------------------------------

var gulp = require('gulp');
var runSequence = require('run-sequence');
var changed = require('gulp-changed');
var compass = require('gulp-compass');
var plumber = require('gulp-plumber');
var babel = require('gulp-babel');
var htmlmin = require('gulp-htmlmin');
var uglify = require('gulp-uglify');
var notify = require('gulp-notify');
var sourcemaps = require('gulp-sourcemaps');
var del = require('del');
var vinylPaths = require('vinyl-paths');
var assign = Object.assign || require('object.assign');
var browserSync = require('browser-sync');


// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

var appRoot = 'src/';
var outputRoot = 'application/';

var paths = {
    root: appRoot,
    js: appRoot + '**/*.js',
    html: appRoot + '**/*.html',
    scss: appRoot + 'assets/scss/*.scss',
    assets: [
      appRoot + 'assets/**/*',
      "!" + appRoot + "assets/{scss,scss/**}"
    ],
    output: outputRoot
};

var compilerOptions = {
    modules: 'system',
    moduleIds: false,
    comments: false,
    compact: false,
    stage: 2,
    optional: [
      'es7.decorators',
      'es7.classProperties'
    ]
};


// --------------------------------------------------
// TASKS
// --------------------------------------------------

gulp.task('clean', function() {
    return gulp.src([paths.output])
      .pipe(vinylPaths(del));
});

// Minify HTML
gulp.task('build-html', function() {
    return gulp.src(paths.html)
      .pipe(changed(paths.output, {extension: '.html'}))
      .pipe(htmlmin({collapseWhitespace: true}))
      .pipe(gulp.dest(paths.output))
	;
});

// Transpile JS to SystemJS format and uglify
gulp.task('build-js', function() {
    return gulp.src(paths.js)
      .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
      .pipe(changed(paths.output, {extension: '.js'}))
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(babel(assign({}, compilerOptions, {modules: 'system'})))
      .pipe(sourcemaps.write({includeContent: true}))
      .pipe(uglify())
      .pipe(gulp.dest(paths.output))
    ;
});

// Compile SCSS
gulp.task("build-css", function () {
	gulp.src(paths.scss)
    .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
		.pipe(compass({
			sass: "src/assets/scss",
			css: paths.output + "assets/css",
			style: "compressed"
		}))
		.pipe(gulp.dest(paths.output + "assets/css"))
    .pipe(browserSync.stream())
	;
});

// Copy Assets
gulp.task('build-assets', function() {
    return gulp.src(paths.assets)
      .pipe(gulp.dest(paths.output + 'assets/'))
	;
});


gulp.task('build', function(callback) {
    return runSequence(
      'clean',
      ['build-assets', 'build-js', 'build-html', 'build-css'],
      callback
  );
});

gulp.task('serve', ['build'], function(done) {
    browserSync({
      online: false,
      open: false,
      port: 7777,
      server: {
        baseDir: ['.'],
        middleware: function(req, res, next) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          next();
        }
      }
    }, done);
});

function reportChange(event) {
  console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
}

gulp.task('watch', ['serve'], function() {
    gulp.watch(paths.js, ['build-js', browserSync.reload]).on('change', reportChange);
    gulp.watch(paths.html, ['build-html', browserSync.reload]).on('change', reportChange);
    gulp.watch(paths.scss, ['build-css', browserSync.reload]).on('change', reportChange);
});