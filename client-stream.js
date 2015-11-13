import React from "react";
import ReactDOM from "react-dom";
import ReactDOMStream from "react-dom-stream";
import RecursiveDivs from "./RecursiveDivs";
import DynamicRecursiveDivs from "./DynamicRecursiveDivs";

if (window) {
	window.render = (depth, breadth, hash) => {
		ReactDOMStream.render(<RecursiveDivs depth={depth} breadth={breadth}/>, document.getElementById("renderNode"), hash);
	}
	window.renderDynamic = () => {
		ReactDOM.render(<DynamicRecursiveDivs/>, document.getElementById("renderNode"));
	}

	window.React = React;
	window.ReactDOM = ReactDOM;
}