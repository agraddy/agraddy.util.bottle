var each = require('agraddy.async.each');
var http = require('http');
var parse = require('url').parse;
var qs = require('querystring');

var mod = {};

var boundary = '---------------------------NODECLIENT';

multipart = {};

multipart.chunk = function(req, data) {
	var keys = Object.keys(data);
	var i;
	var output = '';

	each(keys, function(item, cb) {
		var output = '';
		if(typeof data[item]._read == 'function') {
			output += '--';
			output += boundary;
			output += '\r\n';
			output += 'Content-Disposition: form-data; name="' + item + '"';
			output += '\r\n';
			output += '\r\n';
			req.write(output);

			data[item].on('data', function(chunk) {
				req.write(chunk);
			});

			data[item].on('end', function() {
				req.write('\r\n');
				cb();
			});
		} else {
			req.write(multipart.partify(item, data[item]));
			cb();
		}
	}, function(err) {
		var output = '';
		output += '--';
		output += boundary;
		output += '--';
		output += '\r\n';

		req.write(output);
		req.end();
	});
}

multipart.partify = function(name, value) {
	var output = '';
	output += '--';
	output += boundary;
	output += '\r\n';
	output += 'Content-Disposition: form-data; name="' + name + '"';
	output += '\r\n';
	output += '\r\n';
	output += value;
	output += '\r\n';

	return output;
}

multipart.stringify = function(data) {
	var keys = Object.keys(data);
	var i;
	var output = '';

	for(i = 0; i < keys.length; i++) {
		output += multipart.partify(keys[i], data[keys[i]]);
	}

	if(keys.length) {
		output += '--';
		output += boundary;
		output += '--';
		output += '\r\n';
	}

	return output;
}

mod.get = function(url, cb) {
	mod.request('GET', url, cb);
}

mod.post = function(url, data, options, cb) {
	mod.request('POST', url, data, options, cb);
}

mod.request = function(method, url, data, opts, cb) {
	var encoded;
	var options = parse(url);
	var req;

	options.method = method.toUpperCase();

	if(typeof opts == 'function') {
		cb = opts;
		opts = {};
	} else if(typeof data == 'function') {
		cb = data;
		data = {};
		opts = {};
	}

	if(method.toUpperCase() == 'POST') {

		if(opts.type && opts.type == 'multipart') {
			if(opts.encoding && opts.encoding == 'chunked') {
				options.headers = {};
				options.headers['Content-Type'] = 'multipart/form-data; boundary=' + boundary;
				options.headers['Transfer-Encoding'] = 'chunked';
			} else {
				encoded = multipart.stringify(data);

				options.headers = {};
				options.headers['Content-Type'] = 'multipart/form-data; boundary=' + boundary;
				options.headers['Content-Length'] = Buffer.byteLength(encoded);
			}
		} else {
			encoded = qs.stringify(data);

			options.headers = {};
			options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
			options.headers['Content-Length'] = Buffer.byteLength(encoded);
		}
	}

	req = http.request(options, function(res) {
		var data = '';
		res.on('data', function(chunk) {
			data += chunk;
		});
		res.on('end', function() {
			// TODO: parse if json is the return type
			cb(null, data);
		});
		res.on('error', function(err) {
			console.log('ERROR');
			cb(err);
		});
	});

	if(method.toUpperCase() == 'POST') {
		if(opts.encoding && opts.encoding == 'chunked') {
			 multipart.chunk(req, data);
		} else {
			req.write(encoded);
			req.end();
		}
	} else {
		req.end();
	}
};

module.exports = mod;
