import type { ReactNode } from 'react';

/** A titled, horizontally-scrolling row used on the Home screen. */
export function Showcase({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text">{title}</h2>
        {action}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">{children}</div>
    </section>
  );
}
