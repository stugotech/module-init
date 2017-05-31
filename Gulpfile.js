const del = require('del');
const gulp = require('gulp');
const gulpMerge = require('gulp-merge');
const gulpTslint = require('gulp-tslint');
const sourcemaps = require('gulp-sourcemaps');
const ts = require('gulp-typescript');
const tslint = require('tslint');


// for incremental compilation
const tsProject = ts.createProject('tsconfig.json', ts.reporter.fullReporter);


gulp.task('tslint', () => {
  gulp.src(['src/*.ts', 'src/**/*.ts'])
    .pipe(gulpTslint({
      program: tslint.Linter.createProgram('./tsconfig.json'),
    }))
    .pipe(gulpTslint.report());
});


gulp.task('tsc', ['tslint'], () => {
  let result = gulp.src(['src/*.ts', 'src/**/*.ts'])
    .pipe(tsProject())
  ;
  
  return gulpMerge([
    result.dts.pipe(gulp.dest('dist/')),
    result.js.pipe(gulp.dest('dist/')),
  ]);
});


gulp.task('watch', ['tsc'], function() {
  gulp.watch(['src/*.ts', 'src/**/*.ts'], ['tsc']);
});


gulp.task('clean', () => {
  return del([
    'dist/',
  ]);
});

gulp.task('default', ['clean'], () => {
  gulp.start('tsc');
});