import ReactDOMStream from "react-dom-stream/server";
import ReactDOM from "react-dom/server";
import RecursiveDivs from "./RecursiveDivs";
import stream from "stream";
import React from "react";
import PoliteStream from "./PoliteStream";
import multistream from "multistream";

class CountingWritable extends stream.Writable {
	constructor(options) {
		super(options);
		this.count = 0;
		this.callCount = 0;
	}
	_write(chunk, encoding, next) {
		this.callCount++;
		this.count += chunk.length;
		next();
	}
}

class MakeString extends stream.Writable {
	constructor(options) {
		super({decodeStrings: false});
		this.buffer = "";
	}

	_write(chunk, encoding, next) {
		this.buffer += chunk;
		next();
	}
}

class ReadWrite extends stream.Readable {
	constructor(wrapped, options) {
		super(options);
		this.wrapped = wrapped;
		this.callCount = 0;
		this.wrapped.on("end", () => {
			this.push(null);
		})
		this.wrapped.on("close", () => {
			this.push(null);
		})
		this.wrapped.on("error", (e) => {
			this.push(null);
		})
	}

	_read(n) {
		let chunk;
		this.callCount++;
		setImmediate(() => {
			if(null === (chunk = this.wrapped.read(n))) {
				this.push("");
			} else {
				this.push(chunk);
			}
		});
	}
}

function * generateContent(size) {
	for (let i = 0; i < size; i++) {
		yield "a";
	}
}
function * generateNestedContent(depth, breadth) {
	if (1 === depth) {
		yield * generateContent(breadth);
	} else {
		for (let i = 0; i < breadth; i++) {
			yield * generateNestedContent(depth - 1, breadth);
		}
	}
}

function syncContent(size) {
	let result = "";
	for (let i = 0; i < size; i++) {
		result += "a";
	}
	return result;
}

class IteratorReadable extends stream.Readable {
	constructor(iterator, options) {
		super(options);
		this.iterator = iterator;

	}

	_read(n) {
		let countRead = 0;

		var done, value, buffer = "";

		while ({done, value} = this.iterator.next()) {
			if (done) {
				this.push(buffer);
				this.push(null);
				return;
			} else {
				buffer += value;
				if (buffer.length >= n) {
					this.push(buffer);
					return;
				}
			}
		}

	}
}

const iterations = 10;

const main = async () => {
	try {
		let stringTotals = { time: 0, size: 0, callCount: 0}, streamTotals = { time: 0, size: 0, callCount: 0, inputCallCount: 0};
		for (let i = 0; i < iterations; i++) {
			let {time, size, callCount, inputCallCount} = await runString();
			streamTotals.time += time;
			streamTotals.size += size;
			streamTotals.callCount += callCount;
			streamTotals.inputCallCount += inputCallCount;

			// ({time, size, callCount} = await runString());
			// stringTotals.time += time;
			// stringTotals.size += size;
			// stringTotals.callCount += callCount;


		}
		console.log("Stream");
		console.log("time: " + Math.round(streamTotals.time / iterations));
		console.log("size: " + Math.round(streamTotals.size / iterations));
		console.log("call count: " + Math.round(streamTotals.callCount / iterations));
		console.log("input call count: " + Math.round(streamTotals.inputCallCount / iterations));
		// console.log("String");
		// console.log("time: " + Math.round(stringTotals.time / iterations));
		// console.log("size: " + Math.round(stringTotals.size / iterations));
		// console.log("call count: " + Math.round(stringTotals.callCount / iterations));
	} catch (e) {
		console.log(e.stack);
	}
}

const runNestedGenerator = () => {
	const start = new Date();
	// let buffer = "";

	// for (let chunk of generateContent(100000)) {
	// 	buffer += chunk;
	// }

	let input = new IteratorReadable(generateNestedContent(5, 10));
	let output = new CountingWritable();
	// output.write(buffer);
	// output.end();
	input.pipe(output);

	return new Promise((resolve, reject) => {
		output.on("finish", () => {
			resolve({
				time: (new Date() - start), 
				size: output.count,
				callCount: output.callCount,
			});
		});
	});

}

const runGenerator = () => {
	const start = new Date();
	// let buffer = "";

	// for (let chunk of generateContent(100000)) {
	// 	buffer += chunk;
	// }

	let input = new IteratorReadable(generateContent(1000000));
	let output = new CountingWritable();
	// output.write(buffer);
	// output.end();
	input.pipe(output);

	return new Promise((resolve, reject) => {
		output.on("finish", () => {
			resolve({
				time: (new Date() - start), 
				size: output.count,
				callCount: output.callCount,
			});
		});
	});

}
const runSync = () => {
	const start = new Date();
	let buffer = syncContent(1000000);

	let output = new CountingWritable();
	output.write(buffer);
	output.end();

	return new Promise((resolve, reject) => {
		output.on("finish", () => {
			resolve({
				time: (new Date() - start), 
				size: output.count,
				callCount: output.callCount,
			});
		});
	});

}


const runStream = () => {

	const start = new Date();
	let input = new PoliteStream(1000000); // ReactDOMStream.renderToString(<RecursiveDivs depth={10} breadth={2}/>).setEncoding("utf8");
	let output = new CountingWritable();
	input.pipe(output);

	// return new Promise((resolve, reject) => {
	// 	let buffer = "";
	// 	let callCount = 0;
	// 	input.on("readable", () => {
	// 		callCount++;
	// 		var chunk = input.read(1000);
	// 		if (null !== chunk) {
	// 			buffer += chunk;
	// 		}
	// 	});
	// 	input.on("end", () => {
	// 		resolve({
	// 			time: (new Date() - start),
	// 			size: buffer.length,
	// 			callCount,
	// 		});
	// 	})
	// });
	return new Promise((resolve, reject) => {
		output.on("finish", () => {
			resolve({
				time: (new Date() - start), 
				size: output.count,
				callCount: output.callCount,
				inputCallCount: 0, //input.callCount,
			});
		});
	});
}

const runString = () => {
	const start = new Date();
	let input = ReactDOM.renderToString(<RecursiveDivs depth={13} breadth={2}/>);
	let output = new CountingWritable();
	output.write(input);
	output.end();

	return new Promise((resolve, reject) => {
		output.on("finish", () => {
			resolve({
				time: (new Date() - start), 
				size: output.count,
				callCount: output.callCount,
			});
		});
	});
}
const runAsync = () => {
	const start = new Date();
	let input = ReactDOMStream.renderToString(<RecursiveDivs depth={13} breadth={2}/>);

	let output = new CountingWritable();
	input.pipe(output);

	return new Promise((resolve, reject) => {
		output.on("finish", () => {
			resolve({
				time: (new Date() - start), 
				size: output.count,
				callCount: output.callCount,
			});
		});
	});
}




main();

// let chunk;

// console.log("reading out the component");
// output.on("readable", () => {
// 	let chunk = output.read(100);
// 	console.log(chunk);
// });	
