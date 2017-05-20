const gulp = require('gulp');
const sass = require('gulp-sass');
const ts = require('gulp-typescript');
const beautify = require('gulp-jsbeautifier');
const tsProject = ts.createProject('tsconfig.json');


gulp.task('sass', function() {
  gulp
    .src([ 'public/*.scss' ])
    .pipe(sass())
    .pipe( gulp.dest(f => f.base) );
});

gulp.task('typescript', function() {
  gulp
    .src([ '*.ts', 'public/**/*.ts', 'routes/**/*.ts', 'models/**/*.ts' ])
    .pipe(tsProject())
    .pipe(beautify())
    .pipe( gulp.dest(f => f.base) );
});

gulp.task('default', ['sass', 'typescript']);

gulp.task('watch', [ 'default' ], function() {
  gulp.watch('*.scss', ['sass']);
  gulp.watch('*.ts', ['typescript']);
});
