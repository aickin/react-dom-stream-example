import React from "react";

const functionThatReturnsAnArrayOfComponents = () => {
	return [
		<div>Foo</div>,
		<div>Bar</div>,
		<div>Baz</div>
	];
}

export default class Issue3Page extends React.Component {
	render () {
		const title = "My Title";
		return (
			<article>
			  <h1>{title}</h1>
			  {functionThatReturnsAnArrayOfComponents()}
			</article>
		);
	}
}