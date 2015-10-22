require("babel/register")(
	{ 
		optional: [
			"optimisation.react.inlineElements", 
			"optimisation.react.constantElements"
		] 
	});
require("./server");