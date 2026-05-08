interface Props {
  message: string;
  onClose?: () => void;
}

export function ErrorBox({ message, onClose }: Props) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <strong className="font-semibold">Error:</strong> {message}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-0.5 text-red-700 hover:bg-red-100"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
