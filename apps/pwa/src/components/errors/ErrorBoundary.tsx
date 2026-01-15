import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const isDev = import.meta.env.DEV

type ErrorBoundaryProps = {
  children: React.ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: undefined,
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.assign('/')
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/40 via-background to-muted/20 p-6">
        <Card className="w-full max-w-lg border border-destructive/20 shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Algo salio mal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Ocurrio un problema inesperado. Puedes reintentar o volver al inicio.
            </p>
            {isDev && this.state.error?.message ? (
              <div className="rounded-md bg-muted p-3 text-left text-xs text-muted-foreground">
                {this.state.error.message}
              </div>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button variant="outline" onClick={this.handleRetry}>
                Reintentar
              </Button>
              <Button variant="secondary" onClick={this.handleGoHome}>
                Ir al inicio
              </Button>
              <Button onClick={this.handleReload}>Recargar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
}

export default ErrorBoundary
