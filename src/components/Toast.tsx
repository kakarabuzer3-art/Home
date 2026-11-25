import { CheckIcon } from './Icons';

interface ToastProps {
  message: string;
  visible: boolean;
}

export function Toast({ message, visible }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="haven-toast"
      className={`haven-toast glass ${visible ? 'visible' : ''}`}
    >
      <span
        className="w-[2.6rem] h-[2.6rem] rounded-full inline-flex items-center justify-center shrink-0"
        style={{ background: 'var(--grad)', color: '#103731' }}
        aria-hidden="true"
      >
        <CheckIcon className="w-[1.5rem] h-[1.5rem]" />
      </span>
      <span className="whitespace-nowrap">{message}</span>
    </div>
  );
}
