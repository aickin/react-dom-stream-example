import React from "react";
import ReactDOMStream from "react-dom-stream";
import RecursiveDivs from "./RecursiveDivs";

if (window) {
	window.render = (depth, breadth, hash) => {
		ReactDOMStream.render(<RecursiveDivs depth={depth} breadth={breadth}/>, document.getElementById("renderNode"), hash);
	}
}