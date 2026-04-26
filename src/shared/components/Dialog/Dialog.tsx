import { useRef, type FC } from 'react';
import { useOutsideClick } from '@/shared/hooks';

interface Props {
  message: string;
  onClose: () => void;
}

export const Dialog: FC<Props> = ({ message, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useOutsideClick(panelRef, onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div
        ref={panelRef}
        className="w-full max-w-sm rounded-lg border border-gray-700 bg-gray-900 p-6 shadow-xl"
      >
        <p className="text-sm text-gray-200">{message}</p>
        <div className="mt-5 flex justify-end">
          <button
            className="rounded bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
