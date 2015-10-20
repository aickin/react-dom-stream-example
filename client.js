import React from "react";
import ReactDOM from "react-dom";
import RecursiveDivs from "./RecursiveDivs";

if (window) {
	window.React = React;
	window.render = (depth, breadth) => {
		ReactDOM.render(<RecursiveDivs depth={depth} breadth={breadth}/>, document.getElementById("renderNode"));
	}
}