import React from "react";

class ApplicationComponent extends React.Component {

	render() {
		return <div>Application Component</div>;
	}
}

export default class Issue4Page extends React.Component {
	render() {
		const lang = "en/us";
		const title = "My Title";
		const css = [
			"css1.css",
			"css2.css"
		];
		const state = `{
			foo:1,
			bar:2,
			baz:3
		}`;
		const script = [
			"script1.js",
			"script2.js"
		];

		return (
	      <html lang={lang} >
	        <head>
	          <meta charSet="UTF-8" />
	          <title>{ title }</title>

	          { css.map((href, k) =>
	            <link key={k} rel="stylesheet" type="text/css" href={`${href}`} />)
	          }

	        </head>
	        <body>

	          <div id="root">
	            <ApplicationComponent context={ this.context } host={ this.props.req.hostname } />
	          </div>

	          <script dangerouslySetInnerHTML={{__html: state}} />

	          { script.map((src, k) => <script key={k} src={`${src}`} />) }
	        </body>
	      </html>			
      	);
	}
}