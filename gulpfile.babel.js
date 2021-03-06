import gulp from 'gulp';
import path from 'path';
import fs   from 'fs-extra';

gulp.task('clean', (done) => {
    fs.remove(path.join(__dirname, 'postcss.js'), () => {
        fs.remove(path.join(__dirname, 'build'), done);
    });
});

// Build

gulp.task('build:lib', ['clean'], () => {
    let babel = require('gulp-babel');
    return gulp.src('lib/*.es6')
        .pipe(babel())
        .pipe(gulp.dest('build/lib'));
});

gulp.task('build:docs', ['clean'], () => {
    let ignore = require('fs').readFileSync('.npmignore').toString()
        .trim().split(/\n+/)
        .concat(['.npmignore', 'index.js', 'package.json'])
        .map( i => '!' + i );
    return gulp.src(['*'].concat(ignore))
        .pipe(gulp.dest('build'));
});

gulp.task('build:package', ['clean'], () => {
    let editor = require('gulp-json-editor');
    gulp.src('./package.json')
        .pipe(editor( (p) => {
            p.main = 'lib/safe-parse';
            p.devDependencies.babel = p.dependencies.babel;
            delete p.dependencies.babel;
            delete p.scripts.prepublish;
            return p;
        }))
        .pipe(gulp.dest('build'));
});

gulp.task('build', ['build:lib', 'build:docs', 'build:package']);

// Lint

gulp.task('lint', () => {
    let eslint = require('gulp-eslint');
    return gulp.src(['*.js', 'lib/*.es6', 'test/*.es6'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

// Test

gulp.task('test', () => {
    require('./');
    let mocha = require('gulp-mocha');
    return gulp.src('test/*.es6', { read: false }).pipe(mocha());
});

gulp.task('integration', (done) => {
    let real = require('postcss-parser-tests/real');
    let safe = require('./');
    real(done, [['Browserhacks', 'http://browserhacks.com/']], (css) => {
        return safe(css).toResult({ map: { annotation: false } });
    });
});

// Common

gulp.task('default', ['lint', 'test', 'integration']);
