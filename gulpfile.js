const gulp = require('gulp');
const sass = require('gulp-sass');
const ts = require('gulp-typescript');
const beautify = require('gulp-jsbeautifier');
const tsProject = ts.createProject('tsconfig.json');

const tsSrc = [ '*.ts', 'public/**/*.ts', 'routes/**/*.ts', 'models/**/*.ts', 'controllers/**/*.ts' ];
const sassSrc = [ 'public/**/*.scss' ];

gulp.task('sass', function() {
  gulp
    .src(sassSrc)
    .pipe(sass())
    .pipe( gulp.dest(f => f.base) );
});

gulp.task('typescript', function() {
  gulp
    .src(tsSrc)
    .pipe(tsProject())
    .pipe(beautify())
    .pipe( gulp.dest(f => f.base) );
});

gulp.task('default', ['sass', 'typescript']);

gulp.task('watch', [ 'default' ], function() {
  gulp.watch(sassSrc, ['sass']);
  gulp.watch(tsSrc, ['typescript']);
});
