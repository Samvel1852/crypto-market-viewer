import type { HostKvApi } from '@cursor/bdk';
import { CANDIDATE } from './config.js';

export type ApplicationPack = {
  date: string;
  savedAt: string;
  job: {
    id: string;
    source: string;
    title: string;
    company: string;
    location: string;
    region: string;
    url: string;
    applyUrl?: string;
  };
  fitScore: number;
  fitReasons: string[];
  gaps: string[];
  headline: string;
  summary: string;
  cvMarkdown: string;
  coverLetter: string;
  canvaUrl?: string;
};

export type SeenRecord = { date: string; jobId: string };

export type BaseCv = { markdown: string; source: string; updatedAt: string };

export const keys = {
  baseCv: 'cv:base',
  seenJob: (jobId: string) => `seen:job:${jobId}`,
  seenFingerprint: (fp: string) => `seen:fp:${fp}`,
  day: (date: string) => `day:${date}`,
  pack: (jobId: string) => `pack:${jobId}`,
};

export function today(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CANDIDATE.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export async function wasDelivered(
  kv: HostKvApi,
  jobId: string,
  fp: string,
): Promise<SeenRecord | undefined> {
  const byId = (await kv.get(keys.seenJob(jobId))) as SeenRecord | undefined;
  if (byId) return byId;
  return (await kv.get(keys.seenFingerprint(fp))) as SeenRecord | undefined;
}

export async function dayJobIds(kv: HostKvApi, date: string): Promise<string[]> {
  return ((await kv.get(keys.day(date))) as string[] | undefined) ?? [];
}

export async function loadPacks(kv: HostKvApi, date: string): Promise<ApplicationPack[]> {
  const ids = await dayJobIds(kv, date);
  const packs = await Promise.all(ids.map((id) => kv.get(keys.pack(id))));
  return packs.filter(Boolean) as ApplicationPack[];
}
