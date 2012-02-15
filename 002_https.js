// 002_https.js - a simple server to serve up static files
//
// This server demonstrates listening on multiple ports and the use of
// https. It assumes you're familiar with the basics of creating an
// express server. Look at 001_static.js if you think you need a refresher.
//
// This app can be started with the command:
//
//    node 002_https.js
//
// Once it's running, you should be able to point your browser at either
// of these two URLs:
//
//    http://<hostname>:10101/
//    https://<hostname>:10102/

// Step 1 : Import Modules

var express = require( 'express' );
var fs      = require( 'fs' );

// Step 2 : Set Defaults
//
// We're setting up our defaults slightly differently in this example than in the
// previous one. In this example, we have an array of option objects. Each element
// in the array corresponds to one server application we'll be creating. We need
// multiple express servers because we're going to listen for both HTTP and HTTP(S)
// traffic.
//
// The options are essentially the same as the previous example except options is
// now an array. Later in the code we'll be creating a separate express server
// object for each port we're listening on. Each object in the options array contains
// the defaults for one single server instance.
//
// The main difference in this example is the second server we instantiate will be
// a HTTPS server, so we provide the path to a private key file and a certificate.
// The certificate distributed with this package is for the host 'localhost' which
// should be resolvable on all hosts.

var options = [
	    {
	    	name: 'standard http server'
	    	, listen: {
	    		port: 10101
	    		/* , host: '127.0.0.1' */
	    	}
			, logger: {
				path: __dirname + '/002a_https.log',
				mode: 0666
			}
			, static: {
				path: __dirname + '/static'
				, options: {
					maxAge: 3600000
				}
			}
			, favicon: {
				/* path: __dirname + '/resources/nodify_favicon.ico' */
			}
	    }
		, {
	    	name: 'secure https server'
    		, key_path: __dirname + '/resources/ssl_server.key'
    		, cert_path: __dirname + '/resources/ssl_server.crt'
    		, listen: {
    		  	port: 10102
    		}
			, logger: {
				path: __dirname + '/002b_https.log',
				mode: 0666
			}
			, static: {
				path: __dirname + '/static'
				, options: {
					maxAge: 3600000
				}
			}
			, favicon: {
				path: __dirname + '/resources/nodify_favicon.ico'
			}
	    }
	];

var apps = [];
var current;

for( var i = 0, il = options.length; i < il; i++ ) {
	
	// Step 3 : Create Server Objects
	//
	// Express requires you to create a distinct server object for each
	// port you want to listen on. In this example, we're creating two
	// server objects. The first thing we do is check to see if path names
	// for the key and certificate files are defined in the option map.
	// If they are, we assume it's a HTTPS server and read the contents
	// of the files and pass them as parameters to the createServer() call.

	if( options[i].key_path && options[i].cert_path ) {
		current = express.createServer({
			key: fs.readFileSync( options[i].key_path )
			, cert: fs.readFileSync( options[i].cert_path )
		});
	} else {
		current = express.createServer();		
	}
	
	// Step 4 : Configure Server Middleware
	//
	// This section is more or less the same as the previous example: we check to
	// see if we want to load various middleware packages. But in this app, we
	// check for parameters in an array of option maps rather than a single map.
	
	if( options[i].favicon ) {
		current.use( express.favicon( options[i].favicon.path ) );
	}

	if( options[i].logger && options[i].logger.path ) {
		options[i].logger.stream = fs.createWriteStream( options[i].logger.path, { flags: 'w', encoding: 'utf-8', mode: options[i].logger.mode || 0644 } );
		current.use( express.logger( options[i].logger ) );
	}

	if( options[i].static && options[i].static.path ) {
		current.use( express.static( options[i].static.path, options[i].static.options ) );
	}

	if( options[i].directory && options[i].directory.path ) {
		current.use( express.directory( options[i].directory.path, options[i].directory ) );
	}
	
	apps.push( current );
}

process.on( 'SIGHUP', function () {
	for( var i = 0, il = apps.length; i > il; i++ ) {
		apps[i].close();
	}
} );

// Step 5 : Listen for requests

for( var i = 0, il = apps.length; i < il; i++ ) {
	console.log( 'staring server: ' + options[i].name );

	if( options[i].listen && options[i].listen.port ) {
		apps[i].listen( options[i].listen.port, options[i].listen.host );
	}
}
