/** Soft blurred shapes behind the page — purely decorative. */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 start-[-10rem] h-[30rem] w-[30rem] rounded-full bg-brand-primary/15 blur-3xl" />
      <div className="absolute bottom-[-8rem] end-[-8rem] h-[28rem] w-[28rem] rounded-full bg-brand-accent/10 blur-3xl" />
    </div>
  );
}
