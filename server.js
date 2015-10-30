import express from "express";
import compression from "compression";

import React from "react";
import ReactDOM from "react-dom/server";
import ReactDOMStream from "react-dom-stream/server";

import RecursiveDivs from "./RecursiveDivs";
import ChildArray from "./ChildArray";
import Issue3Page from "./Issue3Page";
import Issue4Page from "./Issue4Page";
import FunctionalComponent from "./FunctionalComponent";
import bufferedStream from "buffered-stream";

var app = express();

app.use(compression({chunkSize: 1024 * 5, filter:function(req) { return !!(req.query.compress); }}));

app.use('/static', express.static('static'));

// ============= ad hoc test pages ================
// these are just ad hoc pages for testing issues that have been reported.
app.get("/childArray", (req, res) => {
  ReactDOMStream.renderToString(<ChildArray/>, res);
  res.end();
});

app.get("/issue3", (req, res) => {
  res.write("<html><body>");
  ReactDOMStream.renderToString(<Issue3Page/>, res);
  res.write("</body></html>");
  res.end();
});

app.get("/issue4", (req, res) => {
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

  // var hash = await ReactDOMStream.renderToString(<RecursiveDivs depth={depth} breadth={breadth}/>, res, {bufferSize: 10000});
  // res.end();

  var stream = ReactDOMStream.renderToString(<RecursiveDivs depth={depth} breadth={breadth}/>);
  stream.pipe(res, {end:false});
  var hash = await stream.hash;
  res.end();
});

// random test of streaming without RDS.
app.get("/streampass", (req, res) => {
  // const pass = require("stream").PassThrough();
  // var pass = new require("stream").Transform({
  //   highWaterMark: 1 * 1024,
  //   transform: function(chunk, encoding, next) {
  //     this.push(chunk);
  //     next();
  //   }
  // });

  // pass.pipe(res);
  // new Promise((resolve, reject) => {
  //   for (let i = 0; i < 100000; i++) {
  //     pass.write("asdfasdfasdfasdfasdfasdfasdfasdf");
  //   }
  //   pass.end();
  //   resolve();
  // });
  var read = new require("stream").Readable();
  read._read =function(n) {
    this.i = this.i || 0;
    while(this.i < 100000) {
      this.i++
      if (!this.push("asdfasdfasdfasdfasdfasdfasdfasdf")) {
        return;
      }
    }
    this.push(null);
  };
  read.pipe(res);
});

app.get("/comp/write", (req, res) => {
  var startTime = new Date();
  var {size = 1 * 1024 * 1024} = req.query;

  for (let i = 0; i < size; i++) {
    res.write("a");
  }
  res.write("\nserver:" + (new Date() - startTime) + "\n");
  res.end();
});

app.get("/comp/wrapwrite", (req, res) => {
  var startTime = new Date();
  var {size = 1 * 1024 * 1024} = req.query;

  var wrapped = function(res) {
    return {
      write: function(data) {
        this.buffer = this.buffer || "";
        if (this.buffer.length + data.length >= 5000) {
          res.write(this.buffer + data);
          this.buffer = "";
        } else {
          this.buffer += data;
        }
      }, 

      end: function() {
        res.write(this.buffer);
        res.write("\nserver:" + (new Date() - startTime) + "\n");
        res.end();
      }
    }
  };

  res = wrapped(res);
  for (let i = 0; i < size; i++) {
    res.write("a");
  }
  res.end();
});

app.get("/comp/string", (req, res) => {
  var startTime = new Date();
  var {size = 1 * 1024 * 1024} = req.query;

  var result = "";
  for (let i = 0; i < size; i++) {
    result += "a";
  }

  res.write(result);
  res.write("\nserver:" + (new Date() - startTime) + "\n");
  res.end();
});

class RudeStream extends require("stream").Readable {
  constructor(size, startTime, options) {
    super(options);
    this.size = size;
    this.startTime = startTime;
  }

  _read(n) {
    for (let i = 0; i < this.size; i++) {
      this.push("a");
    }
    this.push("\nserver:" + (new Date() - this.startTime) + "\n");
    this.push(null);
  }
}

app.get("/comp/rudestream", (req, res) => {
  var startTime = new Date();

  var {size = 1 * 1024 * 1024} = req.query;
  new RudeStream(size, startTime).pipe(res);
});

class PoliteStream extends require("stream").Readable {
  constructor(size, startTime, options) {
    super(options);
    this.size = size;
    this.sentCount = 0
    this.startTime = startTime;
  }

  _read(n) {
    while (this.sentCount < this.size) {
      this.sentCount++;
      if (!this.push("a")) return;
    }
    this.push("\nserver:" + (new Date() - this.startTime) + "\n");
    this.push(null);
  }
}


app.get("/comp/politestream", (req, res) => {
  var startTime = new Date();
  var {size = 1 * 1024 * 1024} = req.query;
  new PoliteStream(size, startTime).pipe(res);
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
