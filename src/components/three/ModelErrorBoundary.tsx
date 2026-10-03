"use client";

import { Component, type ReactNode } from "react";

interface Props {
  fallback: ReactNode;
  onError?: (error: unknown) => void;
  children: ReactNode;
}

/** A missing or broken .glb falls back to the placeholder instead of crashing the page. */
export class ModelErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[ModelSlot] model failed to load, showing placeholder.", error);
    this.props.onError?.(error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
