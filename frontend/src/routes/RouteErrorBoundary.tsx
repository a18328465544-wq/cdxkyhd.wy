import { Component, type ReactNode } from "react";

export default class RouteErrorBoundary extends Component<{ resetKey: string; children: ReactNode }, { resetKey: string; failed: boolean }> {
  state = { resetKey: this.props.resetKey, failed: false };

  static getDerivedStateFromProps(props: { resetKey: string }, state: { resetKey: string }) {
    return props.resetKey !== state.resetKey ? { resetKey: props.resetKey, failed: false } : null;
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div role="alert">
        <h1 className="page-title">页面暂时无法打开</h1>
        <p className="page-description">请检查网络后重试，也可以先返回首页。</p>
        <div className="mt-6 flex items-center gap-4">
          <button type="button" data-erp-control="button" data-size="md" data-variant="primary" onClick={() => window.location.reload()}>刷新重试</button>
          <a href="/" className="text-sm font-medium text-blue-700">返回首页</a>
        </div>
      </div>
    </main>;
  }
}
