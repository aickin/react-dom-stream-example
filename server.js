import express from "express";
import compression from "compression";

import React from "react";
import ReactDOM from "react/dist/react.min";
import ReactDOMStream from "react-dom-stream/server";

import RecursiveDivs from "./RecursiveDivs";
import DynamicRecursiveDivs from "./DynamicRecursiveDivs";

var app = express();

// app.use(compression({chunkSize: 1024 * 5, filter:function(req) { return !!(req.query.compress); }}));

app.use('/static', express.static('static'));

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

  // var hash = await ReactDOMStream.renderToString(<RecursiveDivs depth={depth} breadth={breadth}/>, res, {bufferSize: 10000});
  // res.end();

  ReactDOMStream.renderToString(<RecursiveDivs depth={depth} breadth={breadth}/>).pipe(res);
});

// =========== client-rendered responses ==========
// these endpoints show how to connect back to the markup with React on the client side.
// However, since they read out the <html> open tag immediately, they are not reliable for measuring
// TTFB.


app.get('/client/stream2', async function (req, res) {
  var {depth = 1, breadth = 1, isIE8 = false} = req.query;

  res.write(`<!DOCTYPE html><html><head>`);
  if (isIE8) res.write(`
      <script src="https://cdnjs.cloudflare.com/ajax/libs/es5-shim/3.4.0/es5-shim.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/es5-shim/3.4.0/es5-sham.js"></script>
      <script type="text/javascript">
        // Console-polyfill. MIT license.
        // https://github.com/paulmillr/console-polyfill
        // Make it safe to do console.log() always.
        (function(global) {
          'use strict';
          global.console = global.console || {};
          var con = global.console;
          var prop, method;
          var empty = {};
          var dummy = function() {};
          var properties = 'memory'.split(',');
          var methods = ('assert,clear,count,debug,dir,dirxml,error,exception,group,' +
             'groupCollapsed,groupEnd,info,log,markTimeline,profile,profiles,profileEnd,' +
             'show,table,time,timeEnd,timeline,timelineEnd,timeStamp,trace,warn').split(',');
          while (prop = properties.pop()) if (!con[prop]) con[prop] = empty;
          while (method = methods.pop()) if (typeof con[method] !== 'function') con[method] = dummy;
          // Using 'this' for web workers & supports Browserify / Webpack.
        })(typeof window === 'undefined' ? this : window);
      </script>
    `);
  res.write(`</head><body><div id="renderNode">`);
  ReactDOMStream.renderToString(<DynamicRecursiveDivs/>).on("end", () => {
    res.write(`</div>`);
    res.write(`
      <script src="/static/client-stream.bundle.js"></script>
      <script type="text/javascript">
        renderDynamic();
      </script>
      `);
    res.write(`</body></html>`);
    res.end();

  }).pipe(res, {end: false});
});

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
  ReactDOMStream.renderToString(<RecursiveDivs depth={depth} breadth={breadth}/>).on("end", () => {
    res.write(`</div>`);
    res.write(`
      <script src="/static/client-stream.bundle.js"></script>
      <script type="text/javascript">
        render(${depth}, ${breadth}, ${hash});
      </script>
      `);
    res.write(`</body></html>`);
    res.end();
  }).pipe(res, {end: false});
});

var server = app.listen(process.env.PORT, () => {
  var host = server.address().address || "localhost";
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
