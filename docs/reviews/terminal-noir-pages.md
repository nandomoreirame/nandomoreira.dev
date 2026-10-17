# Revisão — terminal-noir-pages

- **Rodada:** 2026-10-17
- **Achados abertos:** 2
- **Estado:** aguardando correção
- **Implementado por:** grok

> Arquivo reescrito por inteiro a cada `/project:review`. Um achado só desaparece
> daqui por ter deixado de existir no código: quem corrige não marca resolvido.

<!-- findings:begin -->

| Severidade | Arquivo:linha | Problema | Correção sugerida |
|------------|---------------|----------|-------------------|
| Low | src/components/catalog/CollectionListing.astro:54 | A discontinued case that keeps a liveUrl would show 'No ar' next to the discontinued label: liveHost runs for every project and the schema allows both. No case is in that state today (all five discontinued cases have liveUrl: null), so this is an unguarded edge, not a live bug. | Pass live={project.discontinued ? undefined : liveHost(project.liveUrl)} and add a test with a discontinued case that has a liveUrl. |
| Low | src/components/contact/AgentBrief.astro:49 | The TerminalWindow block (CopyButton plus the highlighted <pre>) is duplicated in the panel branch (line 18) and the section branch (line 49). The next change to the brief markup has to be made twice, and the two copies can drift. | Render the TerminalWindow once into a const or a small inner component and reuse it in both branches. |

<!-- findings:end -->
