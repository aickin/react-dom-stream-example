import express from "express";

import React from "react";
import ReactDOM from "react-dom/server";
import ReactDOMStream from "react-dom-stream/server";

import RecursiveDivs from "./RecursiveDivs";
import ChildArray from "./ChildArray";
import Issue4Page from "./Issue4Page";
import FunctionalComponent from "./FunctionalComponent";

var app = express();

app.use('/static', express.static('static'));

app.get("/childArray", (req, res) => {
  ReactDOMStream.renderToString(<ChildArray/>, res);
  res.end();
});

app.get("/issue4Page", (req, res) => {
  ReactDOMStream.renderToString(<Issue4Page req={req}/>, res);
  res.end();
});

app.get("/functionalComponent", (req, res) => {
  ReactDOMStream.renderToString(<FunctionalComponent text={"Foo"}/>, res);
  res.end();
});




// =========== raw responses ==============
// these responses (/string and /stream) just read out from ReactDOM and ReactDOMStream to make it easy to measure 
// TTFB and TTLB. If you want to have a fully functional, connected React page, use /stringClient or /streamClient.

app.get('/string', (req, res) => {
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

app.get('/client/string', (req, res) => {
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

var server = app.listen(process.env.PORT, () => {
  var host = server.address().address || "localhost";
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});