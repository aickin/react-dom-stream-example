
var express = require('express');
var app = express();

var React = require("react");
var ReactStream = require("react-dom-server-stream");

var RecursiveDivs = require("./RecursiveDivs");

app.get('/string', function (req, res) {
  var {depth = 1, breadth = 1} = req.query;

  res.send(React.renderToString(<RecursiveDivs depth={depth} breadth={breadth}/>));
});

app.get('/stream', function (req, res) {
  var {depth = 1, breadth = 1} = req.query;

  var wrappedRes = {
  	write: function(data) {
	  this.buffer = this.buffer || "";
	  this.buffer += data;

	  if (this.buffer.length >= 10000) {
	  	res.write(this.buffer);
	  	this.buffer = "";
	  }
	},

	end: function(data) {
		res.write(this.buffer);
		res.end(data);
	}
  }

  ReactStream.asyncRenderToString(<RecursiveDivs depth={depth} breadth={breadth}/>, wrappedRes);
  wrappedRes.end();
});

var server = app.listen(process.env.PORT, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});