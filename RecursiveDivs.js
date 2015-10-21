import React from "react";

const leaf = <div>abcdefghij</div>;

export default class RecursiveDivs extends React.Component {
	render() {
		const {depth, breadth, textLength} = this.props;

		if (depth <= 0) {
			return leaf;
		}

		let children = [];
		for (let i = 0; i < breadth; i++) {
			children.push(<RecursiveDivs key={i} depth={depth-1} breadth={breadth} textLength={textLength}/>);
		}
		return <div>{children}</div>;
	}
}