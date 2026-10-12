import React from "react";

/** One titled part of the page: a heading, a line of explanation, its content. */
export default function AssetSection({ id, title, blurb, aside, children }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-cardline pt-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight">{title}</h2>
          {blurb ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{blurb}</p> : null}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}