# react-dom-stream-example

This is a simple example Express app for [`react-dom-stream`](https://github.com/aickin/react-dom-stream).

## How to run it

You must have node & npm installed to start.

```
git clone https://github.com/aickin/react-dom-stream-example.git
cd react-dom-stream-example
npm install
NODE_ENV=production npm start
```

It is a very simple page that reads out a recursive tree of simple divs, using either `ReactDOM.renderToString` or `ReactDOMStream.renderToString`. You can access it at:

```
http://localhost:{PORT}/{renderMethod}?depth={d}&breadth={b}
```

* `PORT` is whatever port it started on.
* `renderMethod` is either "string" or "stream".
* `d` is the tree depth. Defaults to 1.
* `b` is the tree breadth. Defaults to 1.

There is also a simple curl bash script, called `test.sh` that will run against a chosen URL 100 times and print out, for each run: preconnect time, TTFB, and TTLB. You need to supply the URL, like this:

```
> ./test.sh "http://localhost:5000/string?depth=3&breadth=10"
```

## Some simple preliminary results

I ran some simple tests on my MacBook Pro (Retina, mid-2014, 2.8GHz) and came up with these results (all times in ms):

| Depth	| Breadth	| Bytes	| String TTFB	| String TTLB	| Stream TTFB	| Stream TTLB	| TTFB diff	| TTLB diff
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1	| 12	| 683	| 1.17	| 1.22	| 1	| 1.05	| -15%	| -14%
| 2	| 12	| 8,389	| 3.13	| 3.2	| 3.45	| 3.53	| 10%	| 10%
| 3	| 12	| 108,194	| 22.93	| 23.11	| 3.26	| 23.9	| -86%	| 3%
| 4	| 12	| 1,347,013	| 274.76	| 275.39	| 4.24	| 283	| -98%	| 3%
| 5	| 12	| 17,294,882	| 3,263.62	| 3,271.68	| 5.22	| 3,336.49	| -100%	| 2%

It's worth noting that the in the depth=2 case, streaming was slower than string rendering both in TTFB and TTLB, but this is deceiving. `react-dom-stream` does keep a buffer, defaulted to 10,000 bytes, so neither depth=1 nor depth=2 actually involved any streaming. (Side note: this indicates to me that I should maybe lower the `bufferSize` default.)

In the larger tests, however, it's very easy to see the effects of streaming, which are a huge decrease in TTFB and a slight increase in TTLB.

I also ran a less scientific, real world test on a free dyno on heroku, to see what happens when real world latencies are added:

| Depth	| Breadth	| Bytes	| String TTFB	| String TTLB	| Stream TTFB	| Stream TTLB	| TTFB diff	| TTLB diff
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1	| 12	| 683	| 70.48	| 70.55	| 72.76	| 72.9	| 3%	| 3%
| 2	| 12	| 8,389	| 80.02	| 81.17	| 83.81	| 94.2	| 5%	| 16%
| 3	| 12	| 108,194	| 242.63	| 528.59	| 85.19	| 334.26	| -65%	| -37%
| 4	| 12	| 1,347,013	| 1,734.79	| 3,688.25	| 74.52	| 1,938.34	| -96%	| -47%
| 5	| 12	| 17,294,882	| 16,358.2	| 23,598.9	| 72.2	| 19,075.2	| -100%	| -19%

In this test at depth 1 and 2, string beats streaming, but once again, that's probably because `react-dom-stream` doesn't actually stream with that few number of bytes. At the larger sizes, the benefits of streaming are clear in both TTFB and TTLB.

There's clearly a lot more to be done here; this is a microbenchmark of a complicated topic. However, it's worth noting that the gap between streaming and string rendering should in theory get larger as pages get larger, as connection latency increases, and as bandwidth decreases.