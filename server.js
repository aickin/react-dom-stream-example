
var express = require('express');
var app = express();

var React = require("react");
var ReactDOM = require("react-dom/server");
var ReactDOMStream = require("react-dom-stream/server");

var RecursiveDivs = require("./RecursiveDivs");

app.get('/string', function (req, res) {
  var {depth = 1, breadth = 1} = req.query;

  res.write(`<html><body><div id="renderNode">`);
  res.write(ReactDOM.renderToString(<RecursiveDivs depth={depth} breadth={breadth}/>));
  res.write(`</div>`);
  res.write(`
  	<script src="/static/client.bundle.js"></script>
  	<script type="text/javascript">
  		render(${depth}, ${breadth});
  	</script>
  	`);
  res.write(`</body></html>`);
  res.end();
});

app.use('/static', express.static('static'));

app.get('/stream', async function (req, res) {
  var {depth = 1, breadth = 1} = req.query;

  // for now, we need to buffer some of the stream coming out; express performs really poorly if you 
  // chunk out a few bytes at a time. I plan to move this functionality into react-dom-stream.
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
  wrappedRes.write(`<html><body><div id="renderNode">`);
  var hash = await ReactDOMStream.renderToString(<RecursiveDivs depth={depth} breadth={breadth}/>, wrappedRes);
  wrappedRes.write(`</div>`);
  wrappedRes.write(`
  	<script src="/static/client-stream.bundle.js"></script>
  	<script type="text/javascript">
  		render(${depth}, ${breadth}, ${hash});
  	</script>
  	`);
  wrappedRes.write(`</body></html>`);
  wrappedRes.end();
});

var server = app.listen(process.env.PORT, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});