import type { Resume } from './resume';

/** Wide enough for a terminal, narrow enough to stay readable when quoted. */
const WIDTH = 80;

/**
 * Wraps on word boundaries. A résumé read by an agent is prose, and truncating
 * it would drop information the JSON route still carries, making the two
 * surfaces disagree (EC of REQ-005).
 *
 * A single token wider than the limit is emitted whole rather than split: the
 * only tokens that reach that size are URLs, and a URL broken across two lines
 * stops being a URL. So the width is a guarantee about wrapping, not a hard
 * column limit, and `resume-txt.test.ts` asserts exactly that.
 */
const wrap = (text: string, width = WIDTH): string[] =>
  text.split('\n').flatMap(paragraph => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return [''];

    return words.reduce<string[]>((lines, word) => {
      const current = lines.at(-1);

      if (current === undefined || `${current} ${word}`.length > width) {
        lines.push(word);
      } else {
        lines[lines.length - 1] = `${current} ${word}`;
      }

      return lines;
    }, []);
  });

const heading = (title: string): string[] => ['', title.toUpperCase(), '-'.repeat(title.length)];

/** An absent end date means the position is still running, and says so. */
const period = (startDate: string, endDate?: string): string => `${startDate} – ${endDate ?? 'present'}`;

/**
 * Renders the résumé as plain text derived from the SAME object the JSON route
 * serialises (AD-005). A second hand-written rendering would diverge on the
 * first change to either one.
 */
export const renderResumeText = (resume: Resume): string => {
  const lines: string[] = [resume.basics.name, resume.basics.label, resume.basics.url];

  lines.push(...heading('Summary'), ...wrap(resume.basics.summary));

  lines.push(
    ...heading('Availability'),
    `Status: ${resume.x_agent.availability.status}`,
    ...wrap(resume.x_agent.availability.detail),
    `Last updated: ${resume.x_agent.availability.updatedAt}`,
    `Focus: ${resume.x_agent.positioning}`,
  );

  if (resume.skills && resume.skills.length > 0) {
    lines.push(...heading('Skills'));
    for (const skill of resume.skills) {
      lines.push(...wrap(`${skill.name}: ${skill.keywords.join(', ')}`));
    }
  }

  if (resume.work && resume.work.length > 0) {
    lines.push(...heading('Experience'));
    for (const job of resume.work) {
      lines.push(`${job.position} — ${job.name} (${period(job.startDate, job.endDate)})`);
      if (job.summary) lines.push(...wrap(job.summary));
      for (const highlight of job.highlights ?? []) lines.push(...wrap(`- ${highlight}`));
    }
  }

  if (resume.education && resume.education.length > 0) {
    lines.push(...heading('Education'));
    for (const entry of resume.education) {
      lines.push(
        `${entry.studyType}, ${entry.area} — ${entry.institution} (${period(entry.startDate, entry.endDate)})`,
      );
    }
  }

  if (resume.projects && resume.projects.length > 0) {
    lines.push(...heading('Projects'));
    for (const project of resume.projects) {
      lines.push(`${project.name} (${period(project.startDate, project.endDate)})`);
      lines.push(...wrap(project.description));
      /** Deliberately unwrapped: the link is the evidence, and it must survive copy-paste. */
      lines.push(`  ${project.url}`);
      if (project.keywords.length > 0) {
        lines.push(...wrap(`  Stack: ${project.keywords.join(', ')}`));
      }
    }
  }

  lines.push(
    ...heading('Contact'),
    `${resume.x_agent.contact.method} ${resume.x_agent.contact.endpoint}`,
    ...wrap(resume.x_agent.contact.note),
  );

  for (const entry of resume.basics.profiles ?? []) {
    lines.push(`${entry.network}: ${entry.url}`);
  }

  return `${lines.join('\n')}\n`;
};
