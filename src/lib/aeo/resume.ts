import type { Profile } from '../../content/schemas/profile';
import type { Project } from '../../content/schemas/project';
import { collectionOfBlock } from '../catalog/groups';
import { redactConfidential } from '../content/confidential';
import { absoluteUrl } from './urls';

interface Input {
  site: URL;
  profile: Profile;
  projects: readonly Project[];
}

interface ResumeProfile {
  network: string;
  username: string;
  url: string;
}

interface ResumeBasics {
  name: string;
  label: string;
  summary: string;
  url: string;
  /** Never populated: the machine routes carry no e-mail (REQ-009). */
  email?: undefined;
  profiles?: ResumeProfile[];
}

interface ResumeWork {
  name: string;
  position: string;
  url?: string;
  startDate: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
}

interface ResumeEducation {
  institution: string;
  area: string;
  studyType: string;
  url?: string;
  startDate: string;
  endDate?: string;
}

interface ResumeSkill {
  name: string;
  keywords: string[];
}

interface ResumeProject {
  name: string;
  description: string;
  keywords: string[];
  startDate: string;
  endDate?: string;
  url: string;
}

interface ResumeMeta {
  canonical: string;
  version: string;
  lastModified: string;
}

/**
 * The part the JSON Resume schema does not model. It lives in its own root key
 * rather than inside `meta`, because `meta` describes the document while this
 * describes the person's working context (AD-001 of the spec).
 */
interface AgentExtension {
  positioning: string;
  availability: {
    status: Profile['availability']['status'];
    detail: string;
    /** Lets an agent calibrate how stale the answer is (REQ-011). */
    updatedAt: string;
  };
  contact: {
    method: 'POST';
    endpoint: string;
    note: string;
  };
}

export interface Resume {
  $schema: string;
  basics: ResumeBasics;
  work?: ResumeWork[];
  education?: ResumeEducation[];
  skills?: ResumeSkill[];
  projects?: ResumeProject[];
  meta?: ResumeMeta;
  x_agent: AgentExtension;
}

const SCHEMA_URL =
  'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json';

/** The e-mail channel is deliberately absent: agents use POST /api/hire. */
const PUBLISHABLE_CONTACTS = ['github', 'linkedin', 'site'] as const;

const usernameOf = (url: string): string => {
  const segments = new URL(url).pathname.split('/').filter(Boolean);

  return segments.at(-1) ?? url;
};

const toProfiles = (profile: Profile): ResumeProfile[] =>
  profile.contacts
    .filter((contact) =>
      (PUBLISHABLE_CONTACTS as readonly string[]).includes(contact.kind),
    )
    .map((contact) => ({
      network: contact.kind,
      username: usernameOf(contact.value),
      url: contact.value,
    }));

/**
 * A case earns its place by being checkable. Ranking the ones with an external
 * link first keeps the strongest evidence at the top without hiding the rest
 * (REQ-010).
 */
const evidenceRank = (project: Project): number =>
  project.liveUrl ? 0 : project.repoUrl ? 1 : 2;

const projectUrl = (site: URL, project: Project): string =>
  project.liveUrl ??
  project.repoUrl ??
  absoluteUrl(site, `/${collectionOfBlock(project.block)}/${project.slug}`);

const toProject = (site: URL, project: Project): ResumeProject => ({
  name: project.title,
  description: project.summary,
  keywords: [...project.tech],
  startDate: project.date,
  /**
   * A shut-down case is presented as finished rather than running. Without a
   * recorded shutdown date, the case's own date is the only honest bound we
   * have, so it closes on itself instead of claiming to be active (REQ-010).
   */
  ...(project.discontinued ? { endDate: project.date } : {}),
  url: projectUrl(site, project),
});

/**
 * Builds the JSON Resume payload from the single source of truth.
 *
 * Pure on purpose: it never touches `astro:content`, so both routes and the
 * schema gate exercise the same function the server serves.
 */
export const buildResume = ({ site, profile, projects }: Input): Resume => {
  /**
   * Redaction is reapplied here rather than trusted from the caller. The access
   * layer already redacts on read, but this function is also called with raw
   * cases in tests and by future callers, and a leaked client name is not a
   * defect worth discovering in production (REQ-007).
   */
  const safe = projects
    .map(redactConfidential)
    .slice()
    .sort((a, b) => evidenceRank(a) - evidenceRank(b));

  return {
    $schema: SCHEMA_URL,
    basics: {
      name: profile.name,
      label: profile.headline,
      summary: profile.bio,
      url: site.toString(),
      profiles: toProfiles(profile),
    },
    ...(profile.work ? { work: profile.work.map((entry) => ({ ...entry })) } : {}),
    ...(profile.education
      ? { education: profile.education.map((entry) => ({ ...entry })) }
      : {}),
    skills: [{ name: 'Stack', keywords: [...profile.stack] }],
    ...(safe.length > 0
      ? { projects: safe.map((project) => toProject(site, project)) }
      : {}),
    meta: {
      canonical: absoluteUrl(site, '/api/resume.json'),
      version: 'v1.0.0',
      lastModified: profile.availability.updatedAt,
    },
    x_agent: {
      positioning: profile.positioning,
      availability: {
        status: profile.availability.status,
        detail: profile.availability.detail,
        updatedAt: profile.availability.updatedAt,
      },
      contact: {
        method: 'POST',
        endpoint: absoluteUrl(site, '/api/hire'),
        note: 'Agents should send a project brief here. Humans find the direct channel on the site.',
      },
    },
  };
};
