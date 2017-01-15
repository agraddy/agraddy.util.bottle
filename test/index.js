var tap = require('agraddy.test.tap')(__filename);
var http = require('http');
var stream = require('stream');

var bottle = require('../');

var port;

var boundary = '---------------------------NODECLIENT';

var server = http.createServer(function(req, res) {
	var writable;
	var writable2;
	var writable3;
	var writable4;
	var expected2 = '';
	var expected3 = '';
	var expected4 = '';

	if(req.url == '/test/get') {
		res.end('get');
	} else if(req.url == '/test/post1') {
		writable = new stream.Writable();
		writable._content = '';
		writable._write = function(chunk, encoding, callback) {
			writable._content += chunk.toString();
			callback();
		};

		req.pipe(writable).on('finish', function() {
			tap.assert.equal(writable._content, 'one=1&two=2&three=3', 'Handle application/x-www-form-urlencoded form data.');
		});

		res.end('post1');
	} else if(req.url == '/test/post2') {
		writable2 = new stream.Writable();
		writable2._content = '';
		writable2._write = function(chunk, encoding, callback) {
			writable2._content += chunk.toString();
			callback();
		};

		req.pipe(writable2).on('finish', function() {

			expected2 += '--';
			expected2 += boundary;
			expected2 += '\r\n';
			expected2 += 'Content-Disposition: form-data; name="one"';
			expected2 += '\r\n';
			expected2 += '\r\n';
			expected2 += '1';
			expected2 += '\r\n';
			expected2 += '--';
			expected2 += boundary;
			expected2 += '\r\n';
			expected2 += 'Content-Disposition: form-data; name="two"';
			expected2 += '\r\n';
			expected2 += '\r\n';
			expected2 += '2';
			expected2 += '\r\n';
			expected2 += '--';
			expected2 += boundary;
			expected2 += '\r\n';
			expected2 += 'Content-Disposition: form-data; name="three"';
			expected2 += '\r\n';
			expected2 += '\r\n';
			expected2 += '3';
			expected2 += '\r\n';
			expected2 += '--';
			expected2 += boundary;
			expected2 += '--';
			expected2 += '\r\n';

			tap.assert.equal(writable2._content, expected2, 'Handle multipart/form-data form data.');
		});

		res.end('post2');
	} else if(req.url == '/test/post3') {
		writable3 = new stream.Writable();
		writable3._content = '';
		writable3._write = function(chunk, encoding, callback) {
			writable3._content += chunk.toString();
			callback();
		};

		req.pipe(writable3).on('finish', function() {

			expected3 += '--';
			expected3 += boundary;
			expected3 += '\r\n';
			expected3 += 'Content-Disposition: form-data; name="normal"';
			expected3 += '\r\n';
			expected3 += '\r\n';
			expected3 += 'This is some normal content.';
			expected3 += '\r\n';
			expected3 += '--';
			expected3 += boundary;
			expected3 += '\r\n';
			expected3 += 'Content-Disposition: form-data; name="stream"';
			expected3 += '\r\n';
			expected3 += '\r\n';
			expected3 += 'This is some content.\nIt is multiline.\nThe stream sends the data one line at a time.';
			expected3 += '\r\n';

			expected3 += '--';
			expected3 += boundary;
			expected3 += '--';
			expected3 += '\r\n';

			tap.assert.equal(writable3._content, expected3, 'Handle multipart/form-data form data.');
		});

		res.end('post3');
	} else if(req.url == '/test/ssl') {
		/*
		writable4 = new stream.Writable();
		writable4._content = '';
		writable4._write = function(chunk, encoding, callback) {
			writable4._content += chunk.toString();
			callback();
		};

		expected4 = 'normal=normal';

		req.pipe(writable4).on('finish', function() {
			!!!tap.!assert.equal(writable4._content, expected4, 'Handle ssl data.');
		});

		res.end('ssl');
		*/
	}
});

server.listen(function() {
	port = server.address().port;
	console.log('port');
	console.log(port);

	start();
});

function start() {
	tap.assert.equal(typeof bottle.get, 'function', 'Function should exist.');
	tap.assert.equal(typeof bottle.post, 'function', 'Function should exist.');

	bottle.get('http://localhost:' + port + '/test/get', function(err, res) {
			tap.assert.equal(res, 'get', 'GET response working.');

			post1();
			});
}

function post1() {
	bottle.post('http://localhost:' + port + '/test/post1', {one: 1, two: 2, three: 3}, function(err, res) {
			tap.assert.equal(res, 'post1', 'POST response working.');

			post2();
			});
}

function post2() {
	bottle.post('http://localhost:' + port + '/test/post2', {one: 1, two: 2, three: 3}, {type: 'multipart'}, function(err, res) {
			tap.assert.equal(res, 'post2', 'POST response working.');

			post3();
			});
}

function post3() {
	var readable = new stream.Readable();
	readable._index = 0;
	readable._content = 'This is some content.\nIt is multiline.\nThe stream sends the data one line at a time.'.split('\n');
	readable._read = function(size) {
		if(readable._index < readable._content.length) {
			if((readable._index + 1) == readable._content.length) {
				this.push(readable._content[readable._index]);
			} else {
				this.push(readable._content[readable._index] + '\n');
			}
			readable._index++;
		} else {
			this.push(null);
		}
	};

	bottle.post('http://localhost:' + port + '/test/post3', {normal: 'This is some normal content.', stream: readable}, {type: 'multipart', encoding: 'chunked'}, function(err, res) {
			tap.assert.equal(res, 'post3', 'POST response working.');

			ssl();
			});
}

function ssl() {
	end();
/*
	bottle.post('https://localhost:' + port + '/test/ssl', {normal: 'normal'}, function(err, res) {
			!!!tap.!assert.equal(res, 'post3', 'POST response working.');

			end();
			});
			*/
}

function end() {
	process.exit();
}

