import { cn } from "@/lib/utils";

const Shell = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className="min-h-screen-header">
      <main className={cn("group flex flex-col gap-10 py-6", className)}>
        {children}
      </main>
    </div>
  );
};

export default Shell;
