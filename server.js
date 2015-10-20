
var express = require('express');
var app = express();

var React = require("react");
var ReactDOM = require("react-dom/server");
var ReactDOMStream = require("react-dom-stream/server");

var RecursiveDivs = require("./RecursiveDivs");

app.use('/static', express.static('static'));

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

app.get('/stream', async function (req, res) {
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