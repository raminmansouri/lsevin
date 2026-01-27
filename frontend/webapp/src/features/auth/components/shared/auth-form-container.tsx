import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
};

const AuthFormContainer = ({ children, className }: Props) => {
  return (
    <div
      className={cn("mx-auto flex max-w-3xl flex-col gap-4 py-8", className)}
    >
      {children}
    </div>
  );
};

export default AuthFormContainer;
