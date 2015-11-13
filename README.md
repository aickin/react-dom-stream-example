# react-dom-stream-example

This is a simple example Express app for [`react-dom-stream`](https://github.com/aickin/react-dom-stream).

## How to run it

You must have node & npm installed to start.

```
git clone https://github.com/aickin/react-dom-stream-example.git
cd react-dom-stream-example
npm install
NODE_ENV=production PORT=5000 npm start
```

Obviously, you can choose a port other than 5000 if you'd like.

The site has a very simple page that reads out a recursive tree of simple divs, using either `ReactDOM.renderToString` or `ReactDOMStream.renderToString`. You can access it at:

```
http://localhost:{PORT}/{renderMethod}?depth={d}&breadth={b}
```

* `PORT` is whatever port the server started on, 5000 if you followed the instructions above.
* `renderMethod` is either "string" or "stream".
* `d` is the tree depth. Defaults to 1.
* `b` is the tree breadth. Defaults to 1.

There is also a simple JavaScript test script that launches curl, called `test.js`, that will run against both `/string` and `/stream` at a number of depths and report the number of bytes, TTFB, and TTLB for each. It takes the following arguments:

* -h host to run against *default: http://localhost:5000/*
* -b breadth of the recursive divs *default: 2*
* -d maximum depth of the recursive divs *default: 13*
* -i number of iterations against each endpoint *default: 30*

## Some simple preliminary results

I ran some simple tests on my MacBook Pro (Retina, mid-2014, 2.8GHz) and came up with these results running 1,000 iterations (all times in ms):

| Depth	| Bytes	| Stream TTFB	| Stream TTLB	| String TTFB	| String TTLB	| TTFB Diff	| TTLB Diff
| --- | ---:| ---:| ---:| ---:| ---:| ---:| ---:|
| 1	| 629	| 0.7	| 0.8	| 0.7	| 0.7	| 2.8%	| 4.6%
| 2	| 828	| 0.5	| 0.6	| 0.4	| 0.4	| 29.4%	| 31%
| 3	| 1248	| 0.8	| 0.9	| 0.6	| 0.6	| 43.6%	| 40.9%
| 4	| 2138	| 0.9	| 1	| 0.6	| 0.7	| 46.6%	| 41.6%
| 5	| 4012	| 1.2	| 1.2	| 0.9	| 1	| 28.2%	| 26.2%
| 6	| 7951	| 1.8	| 1.8	| 1.4	| 1.5	| 22.3%	| 21.9%
| 7	| 16215	| 2.8	| 2.9	| 2.3	| 2.4	| 21.5%	| 21%
| 8	| 33520	| 4.4	| 4.6	| 3.9	| 4	| 10.4%	| 13.7%
| 9	| 69679	| 4	| 8.2	| 7.3	| 7.5	| -45.2%	| 10%
| 10	| 145050	| 3.8	| 15.5	| 14.1	| 14.3	| -73.1%	| 8.1%
| 11	| 301843	| 3.7	| 30.7	| 28.3	| 28.5	| -86.9%	| 7.6%
| 12	| 627536	| 4.2	| 70	| 56.8	| 57.2	| -92.6%	| 22.4%
| 13	| 1303950	| 4.9	| 146.2	| 117.2	| 117.9	| -95.8%	| 24%

(I removed some of the columns that show how many bytes are returned from the server for ease of reading.)

With the smaller pages (33K and smaller), `react-dom-stream` is a net negative; it adds time to both TTFB and TTLB. Note, though, that the absolute amout of time added is pretty small, usually less than a millisecond.

With the larger pages, TTFB stays more or less constant as the page size increases, and the TTLB increases between about 10 to 20 percent.

I also ran a less scientific, real world test of 100 iterations on a dyno on heroku, to see what happens when real world latencies are added:

| Depth	| Bytes	| Stream TTFB	| Stream TTLB | String TTFB	| String TTLB	| TTFB Diff	| TTLB Diff
| --- | ---:| ---:| ---:| ---:| ---:| ---:| ---:|
| 1	| 630	| 99.8	| 100.5	| 104.7	| 105	| -4.7%	| -4.3%
| 2	| 827	| 98.1	| 99	| 102.4	| 102.6	| -4.2%	| -3.5%
| 3	| 1250	| 97.5	| 98	| 106.4	| 106.6	| -8.3%	| -8%
| 4	| 2138	| 100.7	| 101.4	| 101.7	| 107.4	| -1%	| -5.6%
| 5	| 4009	| 99.7	| 107.4	| 103.3	| 104.3	| -3.5%	| 2.9%
| 6	| 7952	| 103.1	| 104.3	| 103.5	| 104.9	| -0.4%	| -0.6%
| 7	| 16220	| 109.4	| 206	| 112.2	| 202.8	| -2.5%	| 1.6%
| 8	| 33510	| 111.5	| 281.6	| 113.5	| 282.8	| -1.7%	| -0.4%
| 9	| 69698	| 111.2	| 398.5	| 122.8	| 434	| -9.4%	| -8.2%
| 10	| 144839	| 112.3	| 805.1	| 139.6	| 838.5	| -19.6%	| -4%
| 11	| 301716	| 113.6	| 1238.1	| 176	| 1165	| -35.4%	| 6.3%
| 12	| 628208	| 110.3	| 1652.6	| 246	| 1790.3	| -55.2%	| -7.7%
| 13	| 1305113	| 112.4	| 2828.2	| 525.3	| 3047.6	| -78.6%	| -7.2%

In this test, `react-dom-stream` does better than React almost across the board. In the smaller pages, the differences between `react-dom-stream` and React are negligible, but as the page gets larger, the difference in TTFB grows.

In constrast to the zero-latency, infinite bandwidth tests against localhost above, though, TTLB does pretty well in the real world tests, with `react-dom-stream` generally beating React by a small amount (about 5%). My current working theory is that this is at least partly a function of the responses being bandwidth-constrained, and `react-dom-stream` gets a head start in filling up the pipe.

There's clearly a lot more to be done here; this is a microbenchmark of a complicated topic. However, it's worth noting that the gap between streaming and string rendering should in theory get larger as pages get larger, as connection latency increases, and as bandwidth decreases.
