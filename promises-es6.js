
let iterations = 1000000;

var dummy = 0;
async function main() {
	let start = new Date();
	dummy = 0;
	for (let i = 0; i < iterations; i++) {
		dummy += await Promise.resolve(2);
	}

	console.log("Promises: " + (new Date() - start));
	console.log(dummy);

	start = new Date();
	dummy = 0;

	for (let i = 0; i < iterations; i++) {
		dummy += 2;
	}

	console.log("No Promises: " + (new Date() - start));
	console.log(dummy);

	start = new Date();
	dummy = 0;
	nextTick(start, 1000000);

}

function immediate(start, iterationsToGo) {
	dummy += 2;
	if (iterationsToGo > 1) {
		setImmediate(function() {immediate(start, iterationsToGo -1)});
	} else {
		console.log("Immediate: " + (new Date() - start));
		console.log(dummy);

	}
}
function nextTick(start, iterationsToGo) {
	dummy += 3;
	if (iterationsToGo > 1) {
		process.nextTick(function() {nextTick(start, iterationsToGo -1)});
	} else {
		console.log("Next Tick: " + (new Date() - start));
		console.log(dummy);
		var start = new Date();
		dummy = 0;
		immediate(start, 1000000);
	}

}

main();