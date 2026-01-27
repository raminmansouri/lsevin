import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  showSeparator?: boolean;
};

const AuthLinksContainer = ({
  children,
  className,
  showSeparator = true,
}: Props) => {
  return (
    <>
      {showSeparator && (
        <Separator className="from-background via-foreground to-background bg-linear-to-r" />
      )}
      <div
        className={cn(
          "mt-8 flex w-full items-center justify-between gap-2",
          className
        )}
      >
        {children}
      </div>
    </>
  );
};

export default AuthLinksContainer;
