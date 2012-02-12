#!/usr/bin/env node

var sqlite3 = require('sqlite3').verbose();
var http_resources = require('http_resources');
var url = require('url');
var path = require('path');
var Mu = require('Mu');


var db = new sqlite3.Database(':memory:');

db.serialize(function() {
	db.run("CREATE TABLE depends_on (dependent VARCHAR(60), dependency VARCHAR(60))");

	var stmt = db.prepare("INSERT INTO depends_on VALUES (?, ?)");

	stmt.run("hal", "blackrider");
	stmt.run("xbmc", "blackrider");
	stmt.run("xbmc", "nfs-blackrider-snasen");
	stmt.run("spotify-mpd", "blackrider");
	stmt.run("cinemad", "blackrider");

	stmt.run("aziz", "galen");
	stmt.run("spotify", "galen");

	stmt.run("laserfilm", "phone");
	stmt.run("laserremote", "phone");
	stmt.run("spotify", "phone");
	stmt.run("xbmcremote", "phone");

	stmt.run("nfs-blackrider-snasen", "ethernet-blackrider-switch");
	stmt.run("nfs-blackrider-snasen", "ethernet-switch-bodswitch");
	stmt.run("nfs-blackrider-snasen", "ethernet-bodswitch-snasen");

	stmt.finalize();
});

//db.close();




function throwOnError(err) {
	if (err) throw err;
}

function runMultipleQueries(queries, callback) {
	var outstandingQueries = queries.length;
	var results = new Array(outstandingQueries);

	for (var i = 0; i < queries.length; ++i) (function () {
		var closedIndex = i;
		queries[i](function (err, result) {
			if (err) throw err;

			results[closedIndex] = result;
			if (--outstandingQueries === 0) callback(null, results);
		});
	})();
}


function IndexResource(id) {
	return {
		handle: function(req, res) {
			res.writeHead(200, {'Content-Type': 'text/html'});

			db.all(
				"SELECT dependent AS node FROM depends_on UNION SELECT dependency AS node FROM depends_on",
				function (err, result) {
					if (err) throw err;

					var data = {
						"nodes": result,
					};

					Mu.render('index.html', data, {}, function (err, output) {
						if (err) throw err;

						output
							.addListener('data', function (c) { res.write(c); })
							.addListener('end', function () { res.end(); });
					});
				}
			);
		}
	}
}

function NodeResource(id) {
	return {
		handle: function(req, res) {
			res.writeHead(200, {'Content-Type': 'text/html'});

			var dependencyOfQuery = db.prepare("SELECT dependent FROM depends_on WHERE dependency=?");
			var dependsOnQuery = db.prepare("SELECT dependency FROM depends_on WHERE dependent=?");

			dependencyOfQuery.run(id, throwOnError);
			dependsOnQuery.run(id, throwOnError);

			runMultipleQueries(
				[
					function (callback) { dependencyOfQuery.all(callback); },
					function (callback) { dependsOnQuery.all(callback); }
				],
				render
			);

			function render(err, results) {
				if (err) throw err;

				var data = {
					"name": id,
					"dependency_of": results[0],
					"depends_on": results[1]
				};

				Mu.render('node.html', data, {}, function (err, output) {
					if (err) throw err;

					output
						.addListener('data', function (c) { res.write(c); })
						.addListener('end', function () { res.end(); });
				});
			}
		}
	}
}

function NodeLookup() {
	return {
		lookup: function(reqpath, callback) {
			var splitpath = http_resources.splitOneLevel(reqpath);
			var nodename = splitpath[0], rest = splitpath[1];
			if (rest !== '') {
				callback(null);
			} else {
				callback(NodeResource(nodename));
			}
		}
	};
}


function BitbucketResource() {
	return {
		handle: function(req, res) {
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.end("Terminating server process.");
			process.exit(0);
		}
	};
}


function DirectLookup(resourceConstructor) {
	return {
		lookup: function(reqpath, callback) {
			if (reqpath !== '' && reqpath !== '/') {
				callback(null);
			} else {
				callback(resourceConstructor());
			}
		}
	}
}



var root = http_resources.MapLookup({
	"/": http_resources.DirectLookup(IndexResource),
	"node": NodeLookup(),
	"bitbucket": http_resources.DirectLookup(BitbucketResource)
});

http_resources.createServer(root).listen(1339, "127.0.0.1");

console.log('Server running at http://127.0.0.1:1339/');
