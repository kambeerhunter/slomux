import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';

const createStore = (reducer, initialState = {}) => {
  let currentState = initialState;
  const listeners = [];

  const getState = () => currentState;
  const dispatch = action => {
    currentState = reducer(currentState, action);
    listeners.forEach(listener => listener());
  };

  const subscribe = listener => listeners.push(listener);

  return { getState, dispatch, subscribe };
};

const connect = (mapStateToProps, mapDispatchToProps) => Component => {
  class WrappedComponent extends React.Component {
    render() {
      return (
        <Component
          {...this.props}
          {...mapStateToProps(this.context.store.getState(), this.props)}
          {...mapDispatchToProps(this.context.store.dispatch, this.props)}
        />
      );
    }

    // На ComponentDidUpdate не сработает подписка, т.к. компонент не будет обновляться
    componentDidMount() {
      this.unsubscribe = this.context.store.subscribe(this.handleChange);
    }

    componentWillUnmount() {
      this.unsubscribe();
    }

    handleChange = () => {
      this.forceUpdate();
    };
  }

  WrappedComponent.contextTypes = {
    store: PropTypes.object,
  };

  return WrappedComponent;
};

class Provider extends React.Component {
  getChildContext() {
    return {
      store: this.props.store,
    };
  }

  render() {
    return React.Children.only(this.props.children);
  }
}

Provider.childContextTypes = {
  store: PropTypes.object,
};

// APP

// actions
const CHANGE_INTERVAL = 'CHANGE_INTERVAL';

// action creators
const changeInterval = value => ({
  type: CHANGE_INTERVAL,
  payload: value,
});

// Добавил начальное состояние редьюсеру, сделал стейт объектом, а не числом.
const initialState = {
  currentInterval: 0,
};

// reducers
const reducer = (state = initialState, action) => {
  switch (action.type) {
    case CHANGE_INTERVAL:
      return {
        ...state,
        currentInterval: state.currentInterval + action.payload,
      };
    default:
      return state;
  }
};

// components

class IntervalComponent extends React.Component {
  // Добавил PropTypes
  static propTypes = {
    currentInterval: PropTypes.number.isRequired,
    changeInterval: PropTypes.func.isRequired,
  };

  render() {
    // Достал значения из props деструктуризацией
    const { currentInterval, changeInterval } = this.props;

    return (
      <div>
        <span>Интервал обновления секундомера: {currentInterval} сек.</span>
        <span>
          <button onClick={() => changeInterval(-1)}>-</button>
          <button onClick={() => changeInterval(1)}>+</button>
        </span>
      </div>
    );
  }
}

// Исправил неверный порядок аргументов
const Interval = connect(
  state => ({
    currentInterval: state.currentInterval,
  }),
  dispatch => ({
    changeInterval: value => dispatch(changeInterval(value)),
  })
)(IntervalComponent);

class TimerComponent extends React.Component {
  state = {
    currentTime: 0,
  };
  // Добавил PropTypes
  static propTypes = {
    currentInterval: PropTypes.number.isRequired,
  };

  handleStart = () => {
    // С помощью деструктуризации получаю значения и сохраняю в замыкании, чтобы
    // в setTimeout они не зависели от изменившегося контекста
    const { currentTime } = this.state;
    const { currentInterval } = this.props;

    setTimeout(() => {
      this.setState({
        currentTime: currentTime + currentInterval,
      });
    }, currentInterval * 1000);
  };

  handleStop = () => {
    this.setState({ currentTime: 0 });
  };

  render() {
    // Деструктуризация из стейта
    const { currentTime } = this.state;

    return (
      <div>
        <Interval />
        <div>Секундомер: {currentTime} сек.</div>
        <div>
          <button onClick={this.handleStart}>Старт</button>
          <button onClick={this.handleStop}>Стоп</button>
        </div>
      </div>
    );
  }
}

const Timer = connect(
  state => ({
    currentInterval: state.currentInterval,
  }),
  () => {}
)(TimerComponent);

// init

// Вынес создание стора в отдельную переменную, задал начальное значение
const store = createStore(reducer, initialState);

ReactDOM.render(
  <Provider store={store}>
    <Timer />
  </Provider>,
  document.getElementById('root')
);
