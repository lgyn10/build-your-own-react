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
  updateDom(dom, {}, fiber.props);
  return dom;
}

const isEvent = (key) => key.startsWith('on');
const isProperty = (key) => key !== 'children' && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);

//! updateDom
function updateDom(dom, prevProps, nextProps) {
  //Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = '';
    });

  // set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });

  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

//! commitRoot
// 변경사항을 실제 DOM에 반영하는 함수
//  fiber 트리를 DOM에 커밋
function commitRoot() {
  deletions.forEach(commitWork);

  // TODO add nodes to dom
  commitWork(wipRoot.child);
  currentRoot = wipRoot; // 마지막으로 DOM에 커밋된 fiber 트리를 저장
  wipRoot = null;
}

//! commitWork
function commitWork(fiber) {
  if (!fiber) return;

  const domParent = fiber.parent.dom;

  // 1. PLACEMENT
  // fiber가 PLACEMENT 태그를 가진다면 이전에 했던 것과 동일하게 부모 fiber 노드에 자식 DOM 노드를 추가
  if (fiber.effectTag === 'PLACEMENT' && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  }
  // 3. UPDATE
  // 갱신(UPDATE)의 경우, 이미 존재하는 DOM 노드를 변경된 props를 이용하여 갱신
  else if (fiber.effectTag === 'UPDATE' && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }
  // 2. DELETION
  // DELETION 태그는 반대로 자식을 부모 DOM에서 제거
  else if (fiber.effectTag === 'DELETION') {
    domParent.removeChild(fiber.dom);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
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
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot, // 이 속성은 이전의 커밋 단계에서 DOM에 추가했던 오래된 fiber에 대한 링크
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

//! workLoop - 동시성 모드 지원
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    // 모든 fiber 작업이 완료되었고 (nextUnitOfWork가 없음)
    // 적용해야 할 변경사항이 있을 때 (wipRoot가 존재)
    // 실제 DOM에 모든 변경사항을 한 번에 적용하는 역할

    commitRoot();
    // 이전 코드 performUnitOfWork 함수에서 DOM 조작을 바로 하지 않고 모아뒀던 것을 이 시점에서 한 번에 처리
  }

  requestIdleCallback(workLoop);
}

//! performUnitOfWork
// 최초의 fiber 인자는 nextUnitOfWork 즉, wipRoot
function performUnitOfWork(fiber) {
  // 1. add dom node
  if (!fiber.dom) fiber.dom = createDom(fiber);
  // fiber.dom이 이미 존재하는 경우
  // - 업데이트 과정에서의 재사용
  // - 이미 처리된 Fiber 노드
  // 이러한 메커니즘은 React의 재조정 과정에서 효율적인 DOM 조작을 가능하게 하는 중요한 부분
  // 불필요한 DOM 생성을 방지하고, 가능한 한 기존 DOM을 재사용함으로써 성능을 최적화한다.

  // 브라우저가 렌더링이 진행되고 있는 중간에 난입할 수 있어 미완성된 UI를 보게 될 수도 있다.
  //| if (fiber.parent) fiber.parent.dom.appendChild(fiber.dom);
  // 이를 위해, 이 라인을 제거하고 DOM 업데이트를 한 번에 처리하는 별도의 커밋 단계를 만드는 것이 좋음

  // 2. create new fibers
  // React의 재조정(Reconciliation) 과정에서 중요한 부분으로,
  // 가상 DOM 트리를 Fiber 트리로 변환하는 작업을 수행한다.
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);

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

//! reconcileChildren
// 새로운 fiber를 생성하는 코드를 performUnitOfWork에서 추출
// 오래된 fiber를 새로운 엘리먼트로 재조정(reconcile) 할 것임
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  // element는 우리가 DOM 안에 렌더링하고 싶은 것
  // oldFiber는 가장 마지막으로 렌더링 했던 것
  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;

    // TODO compare oldFiber to element
    // DOM에 적용하기 위해, element와 oldFiber 사이에 어떤 차이가 생겼는지 비교해야 한다.
    const sameType = oldFiber && element && element.type == oldFiber.type;

    // 1. 오래된 fiber와 새로운 element가 같은 타입일 때,
    // DOM 노드를 유지하고 새로운 props만 업데이트한다.
    if (sameType) {
      // add update the node
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE',
      };
    }

    // 2. 서로 타입이 다르고 새로운 element가 존재할 때,
    // 이는 새로운 DOM 노드 생성이 필요하다는 뜻이다.
    if (element && !sameType) {
      // add this node
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: 'PLACEMENT',
      };
    }

    // 3. 타입이 다르고 오래된 fiber가 존재할 때,
    // 오래된 노드를 제거해야 한다.
    if (oldFiber && !sameType) {
      // delete the oldFiber's node
      oldFiber.effectTag = 'DELETION';
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber; // 부모 fiber의 child로 직접 연결
    } else if (element) {
      prevSibling.sibling = newFiber; // 이전 형제의 sibling으로 연결
    }
    prevSibling = newFiber;
    index++;
  }
}

//! ========================= 실행 코드 =========================

let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
// work in progress
// 1. 현재 상태 추적
// -> wipRoot는 현재 업데이트 중인 Fiber 트리의 루트. 이를 통해 React는 어떤 Fiber가 현재 작업 중인지 알 수 있다.
// 2. 렌더링 작업 관리
// -> wipRoot는 새로운 DOM 노드를 생성하고 업데이트하는 과정에서 필요한 정보를 담고 있다.
// -> 이 정보는 commitRoot 함수에서 실제 DOM에 변경 사항을 적용하는 데 사용된다.
// 3. 이전 상태와의 연결
// -> wipRoot는 alternate 속성을 통해 이전에 커밋된 Fiber 트리와 연결되어 있어,
// -> React가 이전 상태와 비교하여 어떤 변경이 필요한지를 판단하게 한다.

let deletions = null;

requestIdleCallback(workLoop);
// requestIdleCallback -> workLoop -> performUnitOfWork

const Didact = {
  createElement,
  render,
};

/** @jsx Didact.createElement */
const container = document.getElementById('root');

const updateValue = (e) => {
  rerender(e.target.value);
};

const rerender = (value) => {
  const element = (
    <div>
      <input onInput={updateValue} value={value} />
      <h2>Hello {value}</h2>
    </div>
  );
  Didact.render(element, container);
};

rerender('World');
