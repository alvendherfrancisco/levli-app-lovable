import React from "react";

/**
 * Keeps one failing report section from taking the whole page down: the section
 * shows a short message while every other section still renders.
 */
export default class SectionBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error(`[report] section "${this.props.title}" could not be rendered`, error, info);
  }

  render() {
    if (this.state.failed) {
      return (
        <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
          This section could not be loaded.
        </p>
      );
    }
    return this.props.children;
  }
}