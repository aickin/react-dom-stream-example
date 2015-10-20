
var express = require('express');
var app = express();

var React = require("react");
var ReactDOM = require("react-dom/server");
var ReactDOMStream = require("react-dom-stream/server");

var RecursiveDivs = require("./RecursiveDivs");

app.use('/static', express.static('static'));

// =========== raw responses ==============
// these responses (/string and /stream) just read out from ReactDOM and ReactDOMStream to make it easy to measure 
// TTFB and TTLB. If you want to have a fully functional, connected React page, use /stringClient or /streamClient.

app.get('/string', function (req, res) {
  var {depth = 1, breadth = 1} = req.query;

  res.write(ReactDOM.renderToString(<RecursiveDivs depth={depth} breadth={breadth}/>));
  res.end();
});

app.get('/stream', async function (req, res) {
  var {depth = 1, breadth = 1} = req.query;

  var hash = await ReactDOMStream.renderToString(<RecursiveDivs depth={depth} breadth={breadth}/>, res, {bufferSize: 10000});
  res.end();
});

// =========== client-rendered responses ==========
// these endpoints show how to connect back to the markup with React on the client side.
// However, since they read out the <html> open tag immediately, they are not reliable for measuring
// TTFB.

app.get('/client/string', function (req, res) {
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

app.get('/client/stream', async function (req, res) {
  var {depth = 1, breadth = 1} = req.query;

  res.write(`<html><body><div id="renderNode">`);
  var hash = await ReactDOMStream.renderToString(<RecursiveDivs depth={depth} breadth={breadth}/>, res, {bufferSize: 10000});
  res.write(`</div>`);
  res.write(`
  	<script src="/static/client-stream.bundle.js"></script>
  	<script type="text/javascript">
  		render(${depth}, ${breadth}, ${hash});
  	</script>
  	`);
  res.write(`</body></html>`);
  res.end();
});

var server = app.listen(process.env.PORT, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});