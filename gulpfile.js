var gulp = require('gulp'),
	uglify = require('gulp-uglifyjs'),
    rename = require("gulp-rename");


function compressJs() {
    return gulp.src('libs/zoom.js')
    	.pipe(uglify('zoom.min.js', {
    		outSourceMap: true
    	}))
    	.pipe(gulp.dest('dist'));
}

gulp.task('compressJs', compressJs);
gulp.task('watch', function () {
	gulp.watch('libs/zoom.js', ['compressJs']);
});

