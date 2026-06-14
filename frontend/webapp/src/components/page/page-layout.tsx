import { ReactNode } from "react";

type Props = {
  children?: ReactNode;
  title: ReactNode;
};

export default function PageLayout({ children, title }: Props) {
  return (
    <div className="bg-background relative flex grow flex-col py-36">
      <div className="absolute inset-0 overflow-hidden">
        <div className="from-background via-primary/50 absolute top-1 left-0 size-[20500px] translate-x-[-47.5%] rounded-full bg-gradient-to-b" />
      </div>
      <div className="relative container flex grow flex-col px-4">
        <h1 className="text-foreground text-3xl leading-tight font-semibold tracking-tight md:text-5xl">
          {title}
        </h1>
        <div className="text-muted-foreground mt-6 md:text-lg">{children}</div>
      </div>
    </div>
  );
}
