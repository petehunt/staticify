var exec = require('child_process').exec;
var fs = require('fs');

// TODO: I couldn't get this to work by calling the API directly since
// browserify ignored my files and provided no guidance as to what was
// going on.
function getBrowserifyBinary() {
  var browserifyRoot = require.resolve('browserify');
  var nodeModulesRoot = browserifyRoot.substring(
    0,
    browserifyRoot.indexOf('node_modules') + ('node_modules').length
  );
  var binRoot = nodeModulesRoot + '/.bin';
  return binRoot + '/browserify';
}

describe('staticify', function() {
  it('should work for jpgs and css', function() {
    var finished = false;
    runs(function() {
      exec(
        getBrowserifyBinary() + ' -t ./index.js ./spec/fixtures/root',
        function(error, stdout, stderr) {
          expect(stdout).toEqual(fs.readFileSync('./spec/fixtures/desired.js', 'utf8'));
          finished = true;
        }
      );
    });
    waitsFor(function() {
      return finished;
    });
  });
});