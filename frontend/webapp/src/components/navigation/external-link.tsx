type Props = {
  title: string;
  description: string;
  href: string;
};

export default function ExternalLink({ description, href, title }: Props) {
  return (
    <a
      className="border-border hover:border-muted-foreground inline-block rounded-md border p-8 transition-colors"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <p className="text-foreground text-xl font-semibold">
        {title} <span className="ml-2 inline-block">→</span>
      </p>
      <p className="text-muted-foreground mt-2 max-w-[250px]">{description}</p>
    </a>
  );
}
