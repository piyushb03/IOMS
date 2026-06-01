import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-5xl font-black text-destructive">!</div>
            <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              onClick={() => this.setState({ hasError: false, error: null })}
              id="btn-error-retry"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
