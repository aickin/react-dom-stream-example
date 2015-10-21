import React from "react";

function returnArrayOfChildren() {
	return [
		<div>Foo</div>,
		<div>Bar</div>,
		<div>Baz</div>
	];
}

export default class MainDiv extends React.Component {
	render() {
		return <div>span<div>prelist</div>{returnArrayOfChildren()}</div>;
	}
}