var fs = require('fs');
var mimer = require('mimer');
var through = require('through');

function transformImage(data, filename) {
  var uri = 'data:' + mimer(filename) + ';base64,' + data;
  return 'module.exports = ' + JSON.stringify(uri) + ';\n';
}

function hasExt(filename, exts) {
  for (var i = 0; i < exts.length; i++) {
    if (filename.indexOf(exts[i]) === filename.length - exts[i].length) {
      return true;
    }
  }
  return false;
}

function isImage(filename) {
  return hasExt(filename, ['.png', '.jpg', '.gif']);
}

function transformer(func, args) {
  var buf = '';
  return through(
    function(data) {
      buf += data;
    },
    function() {
      this.queue(func.apply(this, [buf].concat(args)));
      this.queue(null);
    }
  );
}

function noop() {
}

function guardWrites(stream) {
  var sink = through();
  // store sink's write and end method so we can override original references
  // and make sink non-writable by anyone except the source
  sinkWrite = sink.write;
  sinkEnd = sink.end;
  sink.write = noop;
  sink.end = noop;
  // pass data from source to sink
  var source = through(sinkWrite.bind(sink), sinkEnd.bind(sink, null));
  stream.pipe(source);
  return sink;
}

module.exports = function(filename) {
  if (isImage(filename)) {
    // Unfortunately the data we get in is already character decoded, so
    // we need to read the raw data in instead.
    // For this we use guardWrites which turns external writes into noops.
    return guardWrites(
      fs.createReadStream(filename, {encoding: 'base64'})
        .pipe(transformer(transformImage, [filename])))
  } else {
    return through();
  }
};
