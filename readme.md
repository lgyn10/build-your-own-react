# Build Your Own React

밑바닥부터 시작해서 만들게 될 나만의 React 프로젝트

### 나만의 React에 추가될 기능들

```ts
Step    I: The createElement Function
Step   II: The render Function
Step  III: Concurrent Mode
Step   IV: Fibers
Step    V: Render and Commit Phases
Step   VI: Reconciliation
Step  VII: Function Components
Step VIII: Hooks
```

### 프로젝트 목적

리엑트를 사용함에 있어서 중요한 개념들을 학습한다.

### 자세히 알아보기

###### Step 1 : The `creatElement` Function

`createElement 함수`는 React에서 가장 핵심적인 API이다. 이 함수는 React 요소를 생성할 때 사용한다.

```jsx
// createElement 함수 구조
React.createElement(type, [props], [...children]);
```

`type`
이 매개 변수는 문자열이거나 React 컴포넌트이다. 문자열인 경우, HTML 태그 이름을 나타낸다. `div, span, input`
React 컴포넌트인 경우 해당 컴포넌트의 인스턴스를 생성한다.

`props`
이 매개 변수는 객체이다. 컴포넌트에 전달할 속성이나 메서드를 정의한다. 이 객체는 선택사항이며, 필요하지 않은 경우 null을 전달할 수 있다.

`children`
이 매개 변수는 컴포넌트의 자식 요소들이다. 선택적 매개 변수이며, 여러 개의 자식 요소를 가질 수 있다. 자식 요소는 `문자열, 숫자, React 요소, 배열` 등 여러 형태를 가질 수 있다.

> 일반적으로는 JSX 문법을 사용하여 직관적인 코드를 작성한다.

###### Step 2 : The `render` Function

###### Step 3 : Concurrent Mode

`Concurrent Mode`는 React의 기능 중 하나로, 사용자 인터페이스를 더 부드럽게 만드는 데 도움을 주는 것이 주 목적이다.

일반적으로, React는 렌더링을 시작하면 그 작업을 완려하기까지 다른 작업을 수행하지 않는다. 하지만, `Concurrent Mode`를 사용하면 React는 렌더링 작업을 중단하고 다른 더 중요한 작업을 처리할 수 있게 된다. 이로 인해, 앱은 사용자에게 더 반응적이고 부드러운 느낌을 준다.

큰 리스트를 렌더링하는 동안에 사용자가 어떤 버튼을 클릭하게 될 경우, `Concurrent Mode`를 활용하면 React는 현재 진행 중인 렌더링 작업을 일시 중단하고, 사용자의 버튼 클릭에 우선적으로 반응하도록 우선 순위를 재조정 할 수 있다.

###### Step 4 : Fibers

###### Step 5 : Render and Commit Phases

###### Step 6 : Reconcilation

###### Step 7 : Function Components

###### Step 8 : Hooks
