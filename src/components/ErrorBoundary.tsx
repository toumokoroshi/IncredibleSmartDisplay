import type { ReactNode } from "react";
import { Component } from "react";

import { ErrorState } from "./ErrorState";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorState error={{ code: "UNKNOWN_ERROR", message: "Component crashed" }} />;
    }
    return this.props.children;
  }
}
