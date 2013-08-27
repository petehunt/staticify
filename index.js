var fs = require('fs');
var mimer = require('mimer');
var through = require('through');

function transformCSS(data) {
  var code = '';
  code += 'var node = document.createElement(\'style\');\n';
  code += 'node.innerHTML = ' + JSON.stringify(data) + ';\n';
  code += 'document.head.appendChild(node);\n';
  return code;
}

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

function isCSS(filename) {
  return hasExt(filename, ['.css', '.sass', '.scss', '.less']);
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

function guardWrites(stream) {
  var sink = through();
  // store sink's write and end method so we can override original references
  // and make sink non-writable by anyone except the source
  sinkWrite = sink.write;
  sinkEnd = sink.end;
  sink.write = function() {};
  sink.end = function() {};
  // pass data from source to sink
  var source = through(
    function(data) { sinkWrite.call(sink, data); },
    function() { sinkEnd.call(sink, null); }
  );
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
  } else if (isCSS(filename)) {
    return transformer(transformCSS, [filename]);
  } else {
    return through();
  }
};
