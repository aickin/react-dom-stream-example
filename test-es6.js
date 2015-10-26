import yargs from "yargs";
import "./round10";
var exec = require('child_process').exec;

const argv = yargs
	.options({
		"d" : {
			alias: "max-depth",
			default: 15,
			describe: "the maximum depth of tree to test"
		},
		"b" : {
			alias:"breadth", 
			default: 2,
			describe: "the branching breadth of the tree"
		},
		"h": {
			alias: "host",
			default: "http://localhost:5000/",
			describe: "the host for the test project"
		},
		"i": {
			alias: "iterations",
			default: 30,
			describe: "number of times to test each URL"
		}
	}).argv;

async function main() {
	console.log("Warming up the server");
	await warmUp(argv.h);

	const stringResults = await getSamples(argv.h, "string", argv.d, argv.b, argv.i);
	const streamResults = await getSamples(argv.h, "stream", argv.d, argv.b, argv.i);

	console.log(`\n\nResults`);

	console.log("Depth\tStream Size\tStream TTFB\tStream TTLB\tStringSize\tString TTFB\tString TTLB\tSize Diff\tTTFB Diff\tTTLB Diff");
	for (let depth = 1; depth <= argv.d; depth++) {
		let ttfbDiff = (streamResults[depth].ttfb - stringResults[depth].ttfb) / stringResults[depth].ttfb;
		let ttlbDiff = (streamResults[depth].ttlb - stringResults[depth].ttlb) / stringResults[depth].ttlb;
		let sizeDiff = (streamResults[depth].size - stringResults[depth].size) / stringResults[depth].size;
		console.log(
			`${depth}\t` +
			`${Math.round10(streamResults[depth].size, 0)}\t${Math.round10(streamResults[depth].ttfb *1000, -1)}\t${Math.round10(streamResults[depth].ttlb * 1000, -1)}\t` +
			`${Math.round10(stringResults[depth].size, 0)}\t${Math.round10(stringResults[depth].ttfb *1000, -1)}\t${Math.round10(stringResults[depth].ttlb * 1000, -1)}\t` +
			`${Math.round10(sizeDiff * 100, -1)}%\t${Math.round10(ttfbDiff * 100, -1)}%\t${Math.round10(ttlbDiff * 100, -1)}%`
			);
	}
}


const warmUp = async (host) => {
	for (let i = 0; i < 20; i++) {
		await executeCurl(host, "string", 14, 2);
		await executeCurl(host, "stream", 14, 2);
	}
}
const average = (input) => {
	if (input.length === 0) return 0;

	let sum = 0;
	input.forEach((i) => {sum += i;});
	return (sum / input.length);
}

const getSamples = async (host, path, maxDepth, breadth, iterations) => {
	const results = [];
	for (let depth = 1; depth <= maxDepth; depth++) {
		console.log(`Testing ${path} depth ${depth}`);
		let ttfbs = [], ttlbs = [], sizes = [];
		for (let i = 0; i < iterations; i++) {
			let {ttfb, ttlb, size} = await executeCurl(host, path, depth, breadth);
			ttfbs.push(ttfb);
			ttlbs.push(ttlb);
			sizes.push(size);
		}
		results[depth] = {ttfb: average(ttfbs), ttlb: average(ttlbs), size: average(sizes)};
	}
	return results;
}

const executeCurl = (host, path, depth, breadth) => {
	return new Promise((resolve, reject) => {
		exec(`curl -s -w "%{time_pretransfer} %{time_starttransfer} %{time_total}" -o /dev/null "${host}${path}?depth=${depth}&breadth=${breadth}"`, function (error, stdout, stderr) {
		  if (error !== null) {
		  	console.log(error);
		  	reject(error);
		  }
		  const output = stdout.toString();
		  const statsLine = output; //stdout.slice(stdout.lastIndexOf("\n") + 1);
		  const [preTransfer, startTransfer, total] = statsLine.split(" ");
		  const sizeDownload = 5; // output.length - statsLine.length;
		  resolve({
		  	ttfb: (startTransfer - preTransfer), 
		  	ttlb: (total - preTransfer),
		  	size: sizeDownload
		  });
		});
	});
};

main();
