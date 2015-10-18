var React = require("react");

export default class RecursiveDivs extends React.Component {
	render() {
		const {depth, breadth, textLength} = this.props;

		if (depth <= 0) {
			return <div>abcdefghij</div>;
		}

		let children = [];
		for (let i = 0; i < breadth; i++) {
			children.push(<RecursiveDivs key={i} depth={depth-1} breadth={breadth} textLength={textLength}/>);
		}
		return <div>{children}</div>;
	}
}