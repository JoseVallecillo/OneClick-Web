import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    render() {
        if (this.state.error) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-background p-8">
                    <div className="w-full max-w-lg rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm">
                        <h2 className="mb-2 font-semibold text-destructive">Error al cargar la vista</h2>
                        <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
                            {this.state.error.message}
                        </pre>
                        <button
                            className="mt-4 rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:opacity-90"
                            onClick={() => window.location.reload()}
                        >
                            Recargar página
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
