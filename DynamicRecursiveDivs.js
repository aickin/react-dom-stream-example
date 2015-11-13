import React from "react";
import RecursiveDivs from "./RecursiveDivs";

export default class DynamicRecursiveDivs extends React.Component {
  render() {
    let {breadth = 1, depth = 1} = this.state || {};

    return (
      <div>
        <div>Breadth: {breadth}<button onClick={() => this.change(1, 0)}>+</button><button onClick={() => this.change(-1, 0)}>-</button></div>
        <div>Depth: {depth}<button onClick={() => this.change(0, 1)}>+</button><button onClick={() => this.change(0, -1)}>-</button></div>
        <RecursiveDivs depth={depth} breadth={breadth}/>
      </div>
    );
  }

  change(breadthIncrement, depthIncrement) {
    let {breadth = 1, depth = 1} = this.state || {};

    breadth += breadthIncrement;
    depth += depthIncrement;

    this.setState({breadth, depth});
  }
}
