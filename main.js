import {createElement,Component,render} from "./toy-react";

class MyComponent extends Component{
    render() {
      return <div>
      <h1>MyComponent</h1>
      {this.children}
      </div>
    }
}

render(<MyComponent id="test" class="testClass">
            <div>abc</div>
            <div></div>
            <div></div>
        </MyComponent>,document.body);

