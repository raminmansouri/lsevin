import React from "react";

type Props = {
  title: string;
  description?: string;
};

const AuthPageHeader = ({ title, description }: Props) => {
  return (
    <div>
      <h1 className="text-heading heading-2 mb-2 text-lg font-normal">
        {title}
      </h1>
      {description && (
        <p className="text-body text-muted-foreground mb-4 text-sm">
          {description}
        </p>
      )}
    </div>
  );
};

export default AuthPageHeader;
