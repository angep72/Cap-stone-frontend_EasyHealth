interface LoaderProps {
  label?: string;
  className?: string;
  fullHeight?: boolean;
}

export function Loader({ label = 'Loading...', className = '', fullHeight = false }: LoaderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-gray-600 ${
        fullHeight ? 'min-h-[200px]' : 'py-6'
      } ${className}`}
    >
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-sm font-medium text-emerald-700">{label}</p>
    </div>
  );
}

