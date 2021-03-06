const RENDER_TO_DOM = Symbol('render to dom');
export class Component {
  constructor () {
    this._root = null;
    this.props = Object.create(null);
    this.children = [];
    this._range = null;
    // this.state = null;
  }
  get vdom () {
    return this.render().vdom;
  }

  setAttribute (name,value) {
    this.props[name] = value;
  }
  appendChild (component) {
    this.children.push(component);
  }
  [RENDER_TO_DOM](range) {
    this._range = range;
    this._vdom = this.vdom;
    this._vdom[RENDER_TO_DOM](range);
  }
  /*rerender () {
    let oldRange = this._range;

    let range = document.createRange();
    range.setStart(oldRange.startContainer,oldRange.startOffset);
    range.setEnd(oldRange.startContainer,oldRange.startOffset);
    this[RENDER_TO_DOM](range);

    oldRange.setStart(range.endContainer,range.endOffset)
    oldRange.deleteContents();
  }
   */
  update () {
    let isSameNode = (oldNode, newNode) => {
      if (oldNode.type !== newNode.type) return false;
      for (let name in newNode.props) {
        if(newNode.props[name] !== oldNode.props[name]) return false;
      }
      if (Object.keys(oldNode.props).length > Object.keys(newNode.props).length) return false;

      if(newNode.type === "#text") {
        if(newNode.content !== oldNode.content) return false;
      }
      return true;
    }
    let update = (oldNode, newNode) => {
      if(!isSameNode(oldNode,newNode)) {
        newNode[RENDER_TO_DOM](oldNode._range);
        return;
      }
      newNode._range = oldNode._range;

      let newChildren = newNode.vChildren;
      let oldChildren = oldNode.vChildren;

      if(!newChildren || !newChildren.length) return;;

      let tailRange = oldChildren[oldChildren.length -1]._range;

      for (let i = 0; i < newChildren.length; i++) {
        let newChild = newChildren[i];
        let oldChild = oldChildren[i];

        if(i < oldChildren.length) {
          update(oldChild,newChild);
        }else {
          let range  = document.createRange();
          range.setStart(tailRange.endContainer,tailRange.endOffset);
          range.setEnd(tailRange.endContainer,tailRange.endOffset);
          newChild[RENDER_TO_DOM](range);
          tailRange = range;
        }
      }
    }
    let vdom = this.vdom;
    update(this._vdom,vdom);
    this._vdom = vdom;
  }
  setState (newState) {
    if(this.state === null || typeof this.state !== 'object') {
      this.state = newState;
      this.update();
      return;
    }
    let merge = (oldState, newState) => {
      for (let p in newState) {
        if(oldState[p] === null || typeof oldState[p] !== 'object') {
          oldState[p] = newState[p];
        }else{
          merge(oldState[p],newState[p]);
        }
      }
    }
    merge(this.state,newState);
    this.update();
  }
}
class elementWrapper extends Component{
  constructor (type)
  {
    super(type);
    this.type = type;
  }
  get vdom () {
    this.vChildren = this.children.map(child => child.vdom);
    return this;
  }
  [RENDER_TO_DOM](range) {
    this._range = range;

    let root = document.createElement(this.type);

    for (let name in this.props){
      let value = this.props[name];
      if(name.match(/^on([\s\S]+)/)){
        root.addEventListener((RegExp.$1.replace(/^[\s\S]/,c => c.toLowerCase())),value);
      }else {
        if(name === 'className'){
         root.setAttribute('class',value);
        }else{
          root.setAttribute(name,value);
        }
      }
    }

    if(!this.vChildren) this.vChildren = this.children.map(child => child.vdom);

    for (let child of this.vChildren) {
      let childRange = document.createRange();
      childRange.setStart(root,root.childNodes.length);
      childRange.setEnd(root,root.childNodes.length);
      childRange.deleteContents();
      child[RENDER_TO_DOM](childRange);
    }

    replaceContent(range,root);
  }
}

function replaceContent(range, node) {
  range.insertNode(node);
  range.setStartAfter(node);
  range.deleteContents();

  range.setStartBefore(node);
  range.setEndAfter(node);
}

class textNodeWrapper extends Component{
  constructor (content)
  {
    super(content);
    this.content = content;
  }
  get vdom () {
    return this;
  }
  [RENDER_TO_DOM](range) {
    this._range = range;
    let root = document.createTextNode(this.content);
    replaceContent(range,root);
  }
}
export function render(component, parentElement) {
  let range = document.createRange();
  range.setStart(parentElement,0);
  range.setEnd(parentElement,parentElement.childNodes.length);
  range.deleteContents();
  component[RENDER_TO_DOM](range);
}
export function createElement(type, attributes, ...children){
  let e;
  if(typeof type === 'string') {
    e = new elementWrapper(type);
  }else {
    e = new type;
  }
  for (let p in attributes) {
    e.setAttribute(p,attributes[p]);
  }
  let insertChildren = (children) => {
  for (let child of children){
    if(typeof child === 'string') {
      child = new textNodeWrapper(child);
    }
    if( child === null) {
      continue;
    }
      if(typeof child === 'object' && child instanceof Array){
          insertChildren(child);
      }else{
        e.appendChild(child);
      }
    }
  }
  insertChildren(children);
  return e;
}
