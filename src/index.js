//! createElement
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => (typeof child === 'object' ? child : createTextElement(child))),
    },
  };
}

//! createTextElement
// createElement에서 사용
function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

//! ========================= 실행 코드 =========================

const Didact = {
  createElement,
};

/** @jsx Didact.createElement */
const element = (
  <div id='foo'>
    <a>bar</a>
    <b />
  </div>
);

const container = document.getElementById('root');
ReactDOM.render(element, container);
