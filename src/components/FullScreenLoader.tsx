type FullScreenLoaderProps = {
  /** Non-spinning minimal indicator when bootstrap/session fails */
  variant?: 'loading' | 'failed';
};

export function FullScreenLoader({ variant = 'loading' }: FullScreenLoaderProps) {
  if (variant === 'failed') {
    return (
      <div
        className="flex min-h-screen w-full items-center justify-center bg-gray-50"
        role="alert"
        aria-busy="false"
      >
        <span className="inline-block h-10 w-10 rounded-full border-2 border-red-200 border-t-red-500 opacity-90" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
        role="status"
        aria-busy="true"
      />
    </div>
  );
}
