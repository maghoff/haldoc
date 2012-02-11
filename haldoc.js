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

	stmt.run("hal", "black rider");
	stmt.run("xbmc", "black rider");
	stmt.run("xbmc", "nfs-blackrider-snasen");
	stmt.run("spotify-mpd", "black rider");
	stmt.run("cinemad", "black rider");

	stmt.run("aziz", "galen");
	stmt.run("spotify", "galen");

	stmt.run("laserfilm", "phone");
	stmt.run("laser remote", "phone");
	stmt.run("spotify", "phone");
	stmt.run("xbmc remote", "phone");

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

			var dependsOnQuery = db.prepare("SELECT dependent FROM depends_on WHERE dependency=?");

			dependsOnQuery.run(id, function(err) {
				if (err) throw err;
			});

			dependsOnQuery.all(function(err, dependency_of) {
				if (err) throw err;

				Mu.render('dependency_of.html', { "dependency_of": dependency_of }, {}, function (err, output) {
					if (err) throw err;

					output
						.addListener('data', function (c) { res.write(c); })
						.addListener('end', function () { res.end(); });
				});
			});
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
