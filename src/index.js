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

//! createDOM
function createDom(fiber) {
  const dom = fiber.type == 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(fiber.type);
  // 노드에 엘리먼트 속성 부여
  const isProperty = (key) => key !== 'children';
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = fiber.props[name];
    });

  return dom;
}

//! render
// 함수 내부에 루트 fiber 생성, 이를 nextUnitOfWork로 설정
// 남은 작업들은 performUnitOfWork에서 진행

// 각각 fiber에서는 3가지 작업
// 1. DOM에 리액트 엘리먼트를 추가하기
// 2. 각 엘리먼트의 children에 대해 fiber를 생성하기
// 3. 다음 작업 단위를 선택하기

// fiber 자료구조의 목적 중 하나는 다음에 필요한 작업 단위를 찾기 쉽도록 하는 것
// 작업 단위 = fiber
// child -> sibling -> parent 순

// root에 도달했다면 이는 렌더링 작업 수행이 끝났음을 의미

function render(element, container) {
  // TODO set next unit of work
  // render 함수에서 fiber 트리의 루트에 nextUnitOfWork 함수를 설정한다.
  // nextUnitOfWork는 현재 업데이트에서 “다음에 작업할 단위”를 가리키는 포인터 역할을 한다.
  // 이 변수는 “작업의 진행 상태”를 추적해나가며, 리액트가 멈췄다가 다시 시작해도 작업을 이어갈 수 있게 해준다.
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  };
}

//! 동시성 모드 - Concurrent Mode
let nextUnitOfWork = null;

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  requestIdleCallback(workLoop);
}

function performUnitOfWork(fiber) {
  // 1. add dom node
  if (!fiber.dom) fiber.dom = createDom(fiber);
  // fiber.dom이 이미 존재하는 경우
  // - 업데이트 과정에서의 재사용
  // - 이미 처리된 Fiber 노드
  // 이러한 메커니즘은 React의 재조정 과정에서 효율적인 DOM 조작을 가능하게 하는 중요한 부분
  // 불필요한 DOM 생성을 방지하고, 가능한 한 기존 DOM을 재사용함으로써 성능을 최적화한다.

  if (fiber.parent) fiber.parent.dom.appendChild(fiber.dom);

  // 2. create new fibers
  // React의 재조정(Reconciliation) 과정에서 중요한 부분으로,
  // 가상 DOM 트리를 Fiber 트리로 변환하는 작업을 수행한다.
  const elements = fiber.props.children;
  let index = 0;
  let prevSibling = null;

  while (index < element.length) {
    const element = elements[index];
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber, // 부모-자식 관계와 형제 관계를 설정하는 것
      dom: null,
    };
    if (index === 0) {
      fiber.child = newFiber; // 부모 fiber의 child로 직접 연결
    } else {
      prevSibling = newFiber; // 이전 형제의 sibling으로 연결
      index++;
    }
  }

  // 3. return next unit of work
  // 탐색 작업, 탐색은 먼저 child, sibling, parent's sibling 순서로 진행

  // 3-1. child 탐색
  if (fiber.child) {
    return fiber.child; // 자식이 있으면 자식을 반환함
  }

  let nextFiber = fiber;
  while (nextFiber) {
    // 3-2. sibling 탐색
    if (nextFiber.sibling) return nextFiber.sibling;
    // 3-3. parent's sibling 탐색
    nextFiber = nextFiber.parent;
  }

  // 4.
  // 여기에 도달하는 경우:
  // 1. child가 없고
  // 2. sibling이 없고
  // 3. 부모를 따라 올라가도 sibling이 없는 경우
  // = 트리의 마지막 노드에 도달했음을 의미
  // 암묵적으로 undefined를 반환
}

//! ========================= 실행 코드 =========================

requestIdleCallback(workLoop);
// requestIdleCallback -> workLoop -> performUnitOfWork

const Didact = {
  createElement,
  render,
};

/** @jsx Didact.createElement */
const element = (
  <div id='foo'>
    <a>bar</a>
    <b />
  </div>
);

const container = document.getElementById('root');
Didact.render(element, container);
// render ->
