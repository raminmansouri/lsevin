import React from "react";

type Props = {
  title: string;
  description?: string;
  eyebrow?: string;
  imageUrl?: string | null;
  imageAlt?: string;
};

const AuthPageHeader = ({
  title,
  description,
  eyebrow,
  imageUrl,
  imageAlt,
}: Props) => {
  return (
    <div>
      {imageUrl ? (
        <div className="mb-5 overflow-hidden rounded-3xl border bg-muted/30 shadow-sm">
          {/* Dynamic admin URLs may be local uploads or remote CDN files. Use img to avoid Next/Image remote-domain config breakage. */}
          <img
            src={imageUrl}
            alt={imageAlt || title}
            className="h-44 w-full object-cover"
            loading="eager"
          />
        </div>
      ) : null}

      {eyebrow ? (
        <p className="text-primary mb-2 text-xs font-semibold uppercase tracking-[0.18em]">
          {eyebrow}
        </p>
      ) : null}

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
