const React = require("react");
const { View } = require("react-native");

const inset = { top: 0, right: 0, bottom: 0, left: 0 };

function SafeAreaProvider(props) {
  return React.createElement(View, props, props.children);
}
SafeAreaProvider.displayName = "SafeAreaProvider";

function SafeAreaView(props) {
  return React.createElement(View, props, props.children);
}
SafeAreaView.displayName = "SafeAreaView";

module.exports = {
  SafeAreaProvider,
  SafeAreaView,
  SafeAreaConsumer: (props) => props.children(inset),
  useSafeAreaInsets: () => inset,
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  initialWindowMetrics: {
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: inset,
  },
};
