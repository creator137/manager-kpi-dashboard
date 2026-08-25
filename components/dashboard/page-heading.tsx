export function PageHeading({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div className="flex max-w-3xl flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {actions}
    </div>
  )
}
