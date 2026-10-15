import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowUpRight, BookOpen, GraduationCap, PlayCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const resources = {
  pmbok: "https://www.pmi.org/standards/pmbok",
  pmbokPortuguese: "https://www.pmirio.org.br/noticia/262/",
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
          <p className="eyebrow">Próximos passos</p>
          <h2 id="learning-resources-heading" className="mt-1 text-2xl font-[760] tracking-[-0.035em] sm:text-3xl">Recursos para continuar aprendendo</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Consulte as referências oficiais, explore o fluxo de processos do Ricardo Vargas e encontre conteúdos gratuitos para aprofundar seus estudos.
          </p>
        </header>

        <div className="grid min-w-0 items-stretch gap-5 lg:grid-cols-2">
          <article className="flex min-w-0 flex-col gap-5 overflow-hidden rounded-[24px] border bg-card p-4 shadow-[var(--shadow-card)] xl:flex-row xl:items-center xl:p-6">
            <div className="flex min-w-0 justify-center rounded-2xl bg-[#211044] p-2 xl:w-[42%] xl:shrink-0">
              <Image
                src="/resources/pmbok8-portugues-divulgacao.png"
                alt="Divulgação da edição em português do Guia PMBOK® 8ª edição, com a capa do livro"
                width={400}
                height={500}
                className="h-auto max-h-[340px] w-auto max-w-full rounded-lg object-contain"
                priority
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">GUIA OFICIAL</span>
              <div>
                <h3 className="text-xl font-bold tracking-tight">PMBOK® Guide — 8ª edição</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Acesse a página do PMI para consultar o Guia e as opções disponíveis. O PMI Rio publicou informações sobre a versão em português e seu acesso para download.</p>
              </div>
              <div className="flex w-full min-w-0 flex-col gap-2">
                <ResourceLink href={resources.pmbok} variant="default"><BookOpen aria-hidden="true" /> Acessar no site do PMI</ResourceLink>
                <ResourceLink href={resources.pmbokPortuguese}>Versão em português · PMI Rio</ResourceLink>
                <ResourceLink href={resources.amazon}>Consultar edição impressa na Amazon</ResourceLink>
              </div>
            </div>
          </article>

          <article className="flex min-w-0 flex-col justify-between gap-5 rounded-[24px] border border-[#273659] bg-[var(--hero)] p-5 text-white shadow-[var(--shadow-card)] sm:p-6">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold"><Sparkles aria-hidden="true" className="size-3.5" /> APRENDIZADO GRATUITO</span>
              <h3 className="mt-4 text-xl font-bold tracking-tight">Comece a aprender gratuitamente.</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">Crie uma conta gratuita no PMI para acessar cursos online gratuitos, ferramentas digitais, eventos virtuais e conteúdos de liderança.</p>
              <p className="mt-3 text-xs text-white/65">A disponibilidade e as condições de cada conteúdo são definidas pelo PMI.</p>
            </div>
            <div className="flex flex-col gap-2">
              <ResourceLink href={resources.cpmai} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"><GraduationCap aria-hidden="true" /> Introdução gratuita ao PMI-CPMAI™</ResourceLink>
              <ResourceLink href={resources.pmiCourses} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">Explorar cursos gratuitos do PMI</ResourceLink>
            </div>
          </article>
        </div>

        <div className="grid min-w-0 items-stretch gap-5 md:grid-cols-2">
          <article className="flex min-w-0 flex-col gap-4 rounded-[24px] border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
            <div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><BookOpen aria-hidden="true" /></span><div><p className="eyebrow">Referência visual</p><h3 className="text-lg font-bold">Fluxo de processos de Ricardo Vargas</h3></div></div>
            <p className="text-sm leading-relaxed text-muted-foreground">Conheça a prancha original e o material publicado pelo autor. O modo Orientado por Valor deste app é uma forma interativa de explorar essa referência.</p>
            <div className="flex min-w-0 flex-col gap-2">
              <ResourceLink href={resources.vargasFlow} variant="default">Acessar o fluxo</ResourceLink>
              <ResourceLink href={resources.vargasVideo}><PlayCircle aria-hidden="true" /> Assistir ao vídeo</ResourceLink>
              <ResourceLink href={resources.pmiLinkedIn}>PMI no LinkedIn</ResourceLink>
              <ResourceLink href={resources.vargasLinkedIn}>Ricardo Vargas no LinkedIn</ResourceLink>
            </div>
          </article>

          <aside className="flex min-w-0 flex-col justify-center rounded-[24px] border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
            <p className="eyebrow">Sobre estas referências</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">PMBOK®, PMI® e os materiais apresentados pertencem aos respectivos titulares. Este projeto independente reúne links para as fontes e não é afiliado nem endossado pelo PMI ou por Ricardo Vargas.</p>
            <p className="mt-3 text-xs text-muted-foreground">Os links externos abrem em outra aba. Consulte as páginas de origem para informações atualizadas sobre acesso e disponibilidade.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
