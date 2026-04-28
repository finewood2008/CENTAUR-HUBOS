import { getBuilderModule } from '../../services/qeeclaw';
import type { BuilderProject } from './types';

const STORAGE_KEY = 'hubos_builder_projects';

function readLocalProjects(): BuilderProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalProjects(projects: BuilderProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    /* ignore local persistence failures */
  }
}

export function saveBuilderProjectLocal(project: BuilderProject): void {
  const existing = readLocalProjects();
  const next = [project, ...existing.filter((item) => item.id !== project.id)];
  writeLocalProjects(next);
}

export async function saveBuilderProject(project: BuilderProject): Promise<void> {
  saveBuilderProjectLocal(project);
  try {
    await getBuilderModule().save(project);
  } catch (error) {
    console.warn('[Builder] Remote save failed, using local storage only:', error);
    // Show user notification that remote save failed
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('builder:save-warning', {
        detail: { message: '远程保存失败，项目已保存到本地存储' }
      }));
    }
  }
}

export async function loadBuilderProjects(): Promise<BuilderProject[]> {
  const localProjects = readLocalProjects();
  try {
    const remoteProjects = await getBuilderModule().list();
    const merged = new Map<string, BuilderProject>();
    [...localProjects, ...(remoteProjects as BuilderProject[])].forEach((project) => {
      if (project?.id && project.blueprint) {
        const current = merged.get(project.id);
        if (!current || String(project.updatedAt || '') > String(current.updatedAt || '')) {
          merged.set(project.id, project);
        }
      }
    });
    const list = Array.from(merged.values()).sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    writeLocalProjects(list);
    return list;
  } catch {
    return localProjects;
  }
}

export async function loadLatestDraftProject(): Promise<BuilderProject | null> {
  const projects = await loadBuilderProjects();
  return projects.find((project) => project.status !== 'deployed') ?? null;
}
