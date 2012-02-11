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




function NodeResource(id) {
	return {
		handle: function(req, res) {
			res.writeHead(200, {'Content-Type': 'text/html'});

			var dependencyOfQuery = db.prepare("SELECT dependent FROM depends_on WHERE dependency=?");
			var dependsOnQuery = db.prepare("SELECT dependency FROM depends_on WHERE dependent=?");

			function throwOnError(err) {
				if (err) throw err;
			}

			dependencyOfQuery.run(id, throwOnError);

			dependencyOfQuery.all(function (err, dependency_of) {
				if (err) throw err;

				dependsOnQuery.run(id, throwOnError);
				dependsOnQuery.all(function (err, depends_on) {
					if (err) throw err;
					console.log(depends_on);
					render(dependency_of, depends_on);
				});
			});

			function render(dependency_of, depends_on) {
				var data = {
					"name": id,
					"dependency_of": dependency_of,
					"depends_on": depends_on
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

function BitbucketLookup() {
	return {
		lookup: function(reqpath, callback) {
			if (reqpath !== '' && reqpath !== '/') {
				callback(null);
			} else {
				callback(BitbucketResource());
			}
		}
	}
}


var root = http_resources.MapLookup({
	"node": NodeLookup(),
	"bitbucket": BitbucketLookup()
});

http_resources.createServer(root).listen(1339, "127.0.0.1");

console.log('Server running at http://127.0.0.1:1339/');
