// to run local gulp: ./node_modules/.bin/gulp <task>
// to create dist: ./node_modules/.bin/gulp package
// to publish package: cd dist; npm publish; cd ..\

var bump = require('gulp-bump'),
    del = require('del'),
    exec = require('child_process').exec,
    gulp = require('gulp'),
    merge = require('merge2'),
    typescript = require('gulp-typescript'),
    fs = require('fs');

gulp.task('clean', function () {
    del(['dist/*']);
});

gulp.task('bump', ['clean'], function () {
    gulp.src('./package.json')
        .pipe(bump({
            type: 'patch'
        }))
        .pipe(gulp.dest('./'));
});

gulp.task('bundle', ['bump'], function () {
    var tsResult = gulp.src('src/*.ts')
        .pipe(typescript({
            module: "commonjs",
            target: "es5",
            noImplicitAny: true,
            experimentalDecorators: true,
            outDir: "dist/",
            rootDir: "src/",
            sourceMap: true,
            declaration: true,
            moduleResolution: "node",
            removeComments: false,
            lib: [
                "es2015",
                "dom"
            ],
            types: ["jasmine"]
        }));

    return merge([
        tsResult.dts.pipe(gulp.dest('dist/')),
        tsResult.js.pipe(gulp.dest('dist/'))
    ]);
});

gulp.task('copy', ['bundle'], () => {
    gulp.src(['src/adal-angular.d.ts', 'README.md', 'LICENSE'])
        .pipe(gulp.dest('dist/'));
});

gulp.task('package', ['copy'], () => {
    const pkgjson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

    delete pkgjson.scripts;
    delete pkgjson.devDependencies;

    const filepath = './dist/package.json';

    fs.writeFileSync(filepath, JSON.stringify(pkgjson, null, 2), 'utf-8');
});