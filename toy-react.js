class elementWrapper{
  constructor (type)
  {
    this.root = document.createElement(type);
  }
  setAttribute (name,value)
  {
    this.root.setAttribute(name,value);
  }
  appendChild (component)
  {
    this.root.appendChild(component.root);
  }
}

class textNodeWrapper {
  constructor (content)
  {
    this.root = document.createTextNode(content);
  }
}
export function render(component, parentElement) {
  parentElement.appendChild(component.root);
}
export class Component {
  constructor () {
    this._root = null;
    this.props = Object.create(null);
    this.children = [];
  }
  setAttribute (name,value) {
    this.props[name] = value;
  }
  appendChild (component) {
   this.children.push(component);
  }
  get root(){
    if(!this._root) {
      this._root = this.render().root;
    }
    return this._root;
  }
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
