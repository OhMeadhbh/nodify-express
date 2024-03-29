// 001_static.js - a simple server to serve up static files
//
// This server does nothing other than serving up a few web related files (HTML,
// CSS, JavaScript, etc.) Though it's unlikely you'll want to do something this
// simple, it does demonstrate a basic pattern of express apps:
//
//   1. import modules
//   2. set defaults
//   3. create a server object (or objects)
//   4. configure server middleware
//   5. listen for requests
//
// This particular application serves up files, directory listings and a
// file icon. If you look closely, you can see that it also logs requests
// to the file 001_static.log.
//
// Assuming node and express are properly installed, you should be able to
// launch this server with this command:
//
//    node 001_static.js
//
// Once it's running, point your browser at http://<hostname>:10100/

// Step 1 : Import Modules
//
// node.js uses the CommonJS module pattern to encapsulate related bits of
// functionality. A detailed description of node.js modules can be found at
// http://nodejs.org/docs/latest/api/modules.html -- but it's enough to know
// here that the 'express' variable is initialized to be an object with several
// web serving and middleware related functions. The 'fs' variable has been
// initialized to contain various file-system related functions.

var express = require( 'express' );
var fs      = require( 'fs' );

// Step 2 : Set Defaults
//
// It's not an absolute requirement that default values be set at the beginning
// of a node application, but it makes it easier to modify if you want to change
// anything. In this (and most other) example applications here, we create a
// global variable called 'options' to contain options for the bits of middle-
// ware we use in the server.

// The 'options' map contains a number of sub-maps, one per major middleware
// component:
//
// listen - what port and IP address will we listen on --
//   - listen.port - the port number to listen on
//   - listen.host - the IP address to listen on. defaults to '0.0.0.0' (i.e. - all
//     IP addresses) if not specified.
//
// static - options relating to static content -- Files in the static directory 
//   are served up as is. Express uses the mime package to map file extensions
//   to content types. If you installed the express package properly, the mime
//   package should have been installed as a pre-requisite. More info on mime at:
//   https://github.com/bentomas/node-mime
//   - static.dir - the path to the directory containing static content
//   - static.options - options passed to the express.static() function call. more
//       info at http://www.senchalabs.org/connect/middleware-static.html
//
// logger - options related to the log file -- The most important option is the 'path'
//   property, which tells the server where to put the log file. More info at:
//   http://www.senchalabs.org/connect/middleware-logger.html
//   - logger.path - path name to the log file
//   - logger.mode - file mode for the log file (defaults to 0644)
//
// favicon - connect.js (upon which express is based) includes a middleware to serve
//   up a default favicon.ico file. Or, if you have a favorite favicon.ico file of
//   your own, you can just set the 'path' property to point it.
//   - favicon.path - path to the favicon.ico file you want to use
//
// directory - The directory middleware serves up a directory listing (similar to
//   directory listings generated by Apache.
//   - directory.path - the root of the served directory. When a user requests a URL
//       like http://host:port/path#fragment, the directory middleware will look for
//       a directory in directory.path + '/' + URL.path. If it finds it, it will
//       generate a list of files in the directory.

var options = {
	listen: {
		port: 10100
		/* , host: '127.0.0.1' */
	}
	, static: {
		path: __dirname + '/static'
		, options: {
			maxAge: 3600000
		}
	}
	, logger: {
		path: __dirname + '/001_static.log',
		mode: 0666
	} 
	, favicon: {
		/* path: __dirname + '/resources/nodify_favicon.ico' */
	}
	, directory: {
		path: __dirname + '/static'
		, icons: true
	}
};

// Step 3 : Create a Server Object
//
// Creating an express server application object is pretty simple:

var app = express.createServer();

// Step 4 : Configure Server Middleware
//
// Express applications use the use() function to register middleware. Usually, this
// middleware is configured at the same time. In this sample application, we look in
// the options map for various "sub-maps" like favicon, static, logger, etc. If they
// exist, we register and configure that middleware component.

// Register the favicon middleware. This is a completely optional bit of middleware.
// First off, you don't NEED a favicon for your site. Secondly, you could simply use
// the static middleware and put a favicon.ico in the root directory. If you're
// adventurous (or you need a custom favicon), try experimenting with options like
// uncommenting the favicon.path property in the options map above.

if( options.favicon ) {
	app.use( express.favicon( options.favicon.path ) );
}

// What's more important that an access_log? Probably lots of things, but access logs are
// still pretty important if you're writing a "real" application. Just for fun, point
// your browser over to the favicon.ico at http://your_server/favicon.ico and reload
// it a couple times. Now go look at the log. Notice that the requests for favicon.ico
// don't show up in the log?
//
// This is 'cause order is important in express apps. Because we placed the express.favicon
// middleware before the express.logger middleware, express.favicon gets to process the
// request first. If it sees a request for "/favicon.ico", it sends the icon and ends the
// request.
//
// If you have some spare time, you can move the logger registration code above the
// favicon code and you'll start seeing /favicon.ico requests being logged. This is because
// the logger gets (and logs) the request before the favicon middleware has a chance to
// service (and complete) the request.


if( options.logger && options.logger.path ) {
	options.logger.stream = fs.createWriteStream( options.logger.path, { flags: 'w', encoding: 'utf-8', mode: options.logger.mode || 0644 } );
	app.use( express.logger( options.logger ) );
}

// Register the static content handler. The static middleware component is pretty
// straight-forward. You give it a directory path and it starts serving files out
// of that directory. You can find a list of options at the static middleware page at:
// http://www.senchalabs.org/connect/middleware-static.html

if( options.static && options.static.path ) {
	app.use( express.static( options.static.path, options.static.options ) );
}

// Register the directory renderer. The static content handler above works on specific
// files. It doesn't automagically generate a pretty directory listing; that's what
// this middleware does. There's more info at:
// http://www.senchalabs.org/connect/middleware-directory.html

if( options.directory && options.directory.path ) {
	app.use( express.directory( options.directory.path, options.directory ) );
}

// Before we start the application, it might be nice to be able to shut it down.
// This is how you register a signal handler with node.js applications. This
// code fragment instructs the express application to close the socket it's listening on
// when it receives the HANGUP signal.
//
// After the function completes, the flow of control will pass to the main event loop.
// Because we're no longer waiting on I/O or a timer, the application will exit.

process.on( 'SIGHUP', function () {
	app.close();
} );

// Step 5 : Listen for requests
//
// The listen() function binds an express application object to a particular port. It's
// worth noting that node apps return from listen() calls virtually immediately. It doesn't
// block waiting for a connection request; that's not node's model.
//
// Also, there's no reason an application can't listen on multiple ports simultaneously. In
// fact, that's frequently quite useful.

if( options.listen && options.listen.port ) {
	app.listen( options.listen.port, options.listen.host );
}

console.log( 'listening for requests on port ' + options.listen.port );
