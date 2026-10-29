import type { ReactNode } from "react";
import { ArrowUpRight, BookOpen, GraduationCap, PlayCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const resources = {
  pmbok: "https://www.pmi.org/standards/pmbok",
  pmiCourses: "https://www.pmi.org/learning/free-online-courses",
  cpmai: "https://www.pmi.org/shop/brazil/p-/elearning/free-introduction-to-cognitive-project-management-in-ai-cpmai/el185",
  vargasFlow: "https://get.ricardo-vargas.com/pmbok8en",
  vargasVideo: "https://youtu.be/TZMum9cuoJY",
  pmiLinkedIn: "https://www.linkedin.com/company/11352",
  vargasLinkedIn: "https://www.linkedin.com/in/ricardovargas",
  amazon: "https://www.amazon.com/Guide-Project-Management-Knowledge-PMBOK%C2%AE/dp/1628258292",
} as const;

function ResourceLink({ href, children, variant = "outline", className }: { href: string; children: ReactNode; variant?: "default" | "outline"; className?: string }) {
  return <Button asChild variant={variant} className={`h-auto min-h-11 w-full min-w-0 justify-between gap-x-2 rounded-xl px-3 py-2 text-left leading-snug whitespace-normal ${className ?? ""}`}>
    <a href={href} target="_blank" rel="noopener noreferrer">{children}<ArrowUpRight aria-hidden="true" /></a>
  </Button>;
}

export function ResourcesView() {
  return (
    <section className="h-full min-h-0 overflow-y-auto p-3 sm:p-5 lg:p-6" aria-labelledby="learning-resources-heading">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-5 pb-4">
        <header className="rounded-[24px] border bg-card p-5 shadow-[var(--shadow-card)] sm:p-7">
          <p className="eyebrow">Next steps</p>
          <h2 id="learning-resources-heading" className="mt-1 text-2xl font-[760] tracking-[-0.035em] sm:text-3xl">Resources to keep learning</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Browse the official references, explore Ricardo Vargas&apos; process flow, and find free content to deepen your studies.
          </p>
        </header>

        <div className="grid min-w-0 items-stretch gap-5 lg:grid-cols-2">
          <article className="flex min-w-0 flex-col gap-5 overflow-hidden rounded-[24px] border bg-card p-4 shadow-[var(--shadow-card)] xl:flex-row xl:items-center xl:p-6">
            <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">OFFICIAL GUIDE</span>
              <div>
                <h3 className="text-xl font-bold tracking-tight">PMBOK® Guide — 8th edition</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Visit the PMI page to read the Guide and see the available options.</p>
              </div>
              <div className="flex w-full min-w-0 flex-col gap-2">
                <ResourceLink href={resources.pmbok} variant="default"><BookOpen aria-hidden="true" /> Visit the PMI website</ResourceLink>
                <ResourceLink href={resources.amazon}>Find the printed edition on Amazon</ResourceLink>
              </div>
            </div>
          </article>

          <article className="flex min-w-0 flex-col justify-between gap-5 rounded-[24px] border border-[#273659] bg-[var(--hero)] p-5 text-white shadow-[var(--shadow-card)] sm:p-6">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold"><Sparkles aria-hidden="true" className="size-3.5" /> FREE LEARNING</span>
              <h3 className="mt-4 text-xl font-bold tracking-tight">Start learning for free.</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">Create a free PMI account to access free online courses, digital tools, virtual events, and leadership content.</p>
              <p className="mt-3 text-xs text-white/65">Availability and terms of each item are set by PMI.</p>
            </div>
            <div className="flex flex-col gap-2">
              <ResourceLink href={resources.cpmai} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"><GraduationCap aria-hidden="true" /> Free introduction to PMI-CPMAI™</ResourceLink>
              <ResourceLink href={resources.pmiCourses} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">Explore free PMI courses</ResourceLink>
            </div>
          </article>
        </div>

        <div className="grid min-w-0 items-stretch gap-5 md:grid-cols-2">
          <article className="flex min-w-0 flex-col gap-4 rounded-[24px] border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
            <div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><BookOpen aria-hidden="true" /></span><div><p className="eyebrow">Visual reference</p><h3 className="text-lg font-bold">Ricardo Vargas&apos; process flow</h3></div></div>
            <p className="text-sm leading-relaxed text-muted-foreground">See the original poster and the material published by the author. This app&apos;s Value-driven mode is an interactive way to explore that reference.</p>
            <div className="flex min-w-0 flex-col gap-2">
              <ResourceLink href={resources.vargasFlow} variant="default">Open the flow</ResourceLink>
              <ResourceLink href={resources.vargasVideo}><PlayCircle aria-hidden="true" /> Watch the video</ResourceLink>
              <ResourceLink href={resources.pmiLinkedIn}>PMI on LinkedIn</ResourceLink>
              <ResourceLink href={resources.vargasLinkedIn}>Ricardo Vargas on LinkedIn</ResourceLink>
            </div>
          </article>

          <aside className="flex min-w-0 flex-col justify-center rounded-[24px] border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
            <p className="eyebrow">About these references</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">PMBOK®, PMI® and the materials shown belong to their respective owners. This independent project collects links to the sources and is not affiliated with or endorsed by PMI or Ricardo Vargas.</p>
            <p className="mt-3 text-xs text-muted-foreground">External links open in a new tab. Check the source pages for up-to-date information on access and availability.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
