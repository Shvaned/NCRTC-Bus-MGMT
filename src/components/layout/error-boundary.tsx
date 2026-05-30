"use client"

import { Component, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-500/15">
              <AlertTriangle className="size-8 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {this.state.error?.message ?? "An unexpected error occurred"}
            </p>
            <Button onClick={() => this.setState({ hasError: false, error: null })} variant="outline">
              <RefreshCw className="size-4 mr-2" /> Try Again
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
