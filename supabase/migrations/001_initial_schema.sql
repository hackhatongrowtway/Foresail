-- Foresail - Initial Database Schema
-- Supabase (PostgreSQL)

-- 1. ORGANIZATIONS
CREATE TABLE public.organizations (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    slug       TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. PROFILES (extends auth.users)
CREATE TABLE public.profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    display_name    TEXT NOT NULL,
    email           TEXT UNIQUE NOT NULL,
    avatar_url      TEXT,
    org_role        TEXT NOT NULL DEFAULT 'member'
                        CHECK (org_role IN ('owner', 'admin', 'member')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_org ON public.profiles(organization_id);

-- 3. PROJECTS
CREATE TABLE public.projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_org ON public.projects(organization_id);
CREATE INDEX idx_projects_active ON public.projects(organization_id, is_active)
    WHERE is_active = true;

-- 4. PROJECT MEMBERS (N:N)
CREATE TABLE public.project_members (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role       TEXT NOT NULL DEFAULT 'viewer'
                   CHECK (role IN ('admin', 'viewer')),
    joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, user_id)
);

CREATE INDEX idx_pm_user ON public.project_members(user_id);
CREATE INDEX idx_pm_project ON public.project_members(project_id);

-- 5. REPOSITORIES (Git)
CREATE TABLE public.repositories (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id     UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    platform       TEXT NOT NULL DEFAULT 'github'
                       CHECK (platform IN ('github', 'gitlab', 'bitbucket')),
    platform_id    TEXT NOT NULL,
    platform_url   TEXT,
    default_branch TEXT DEFAULT 'main',
    is_active      BOOLEAN NOT NULL DEFAULT true,
    last_synced_at TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (platform, platform_id)
);

CREATE INDEX idx_repos_project ON public.repositories(project_id);
CREATE INDEX idx_repos_active ON public.repositories(project_id, is_active)
    WHERE is_active = true;

-- 6. JIRA PROJECTS
CREATE TABLE public.jira_projects (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id     UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    jira_key       TEXT NOT NULL,
    jira_url       TEXT NOT NULL,
    is_active      BOOLEAN NOT NULL DEFAULT true,
    last_synced_at TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (jira_url, jira_key)
);

CREATE INDEX idx_jira_project ON public.jira_projects(project_id);

-- 7. ANALYSES (versioned)
CREATE TABLE public.analyses (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id   UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    version      INT NOT NULL,
    health_score SMALLINT NOT NULL CHECK (health_score BETWEEN 0 AND 100),
    risk_level   TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    summary      TEXT,
    metrics      JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_risks  SMALLINT NOT NULL DEFAULT 0,
    analyzed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, version)
);

CREATE INDEX idx_analyses_project_date ON public.analyses(project_id, analyzed_at DESC);
CREATE INDEX idx_analyses_risk ON public.analyses(risk_level);

-- 8. RISK INDICATORS
CREATE TABLE public.risk_indicators (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    category    TEXT NOT NULL CHECK (category IN (
                    'large_pr', 'low_reviews', 'blocked_tasks',
                    'knowledge_silo', 'late_commits', 'communication_gap',
                    'high_churn', 'missing_tests', 'other'
                )),
    severity    TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title       TEXT NOT NULL,
    description TEXT,
    metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ri_analysis ON public.risk_indicators(analysis_id);
CREATE INDEX idx_ri_project_date ON public.risk_indicators(project_id, detected_at DESC);
CREATE INDEX idx_ri_severity ON public.risk_indicators(severity);

-- 9. ACTIVITY LOGS
CREATE TABLE public.activity_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    project_id      UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action          TEXT NOT NULL,
    entity_type     TEXT,
    entity_id       UUID,
    details         JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_logs_org ON public.activity_logs(organization_id);
CREATE INDEX idx_logs_project ON public.activity_logs(project_id);
CREATE INDEX idx_logs_created ON public.activity_logs(created_at DESC);

-- FUNCTIONS & TRIGGERS

-- Auto updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto version increment for analyses
CREATE OR REPLACE FUNCTION public.set_analysis_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version := COALESCE(
        (SELECT MAX(version) FROM public.analyses WHERE project_id = NEW.project_id), 0
    ) + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_analysis_version
    BEFORE INSERT ON public.analyses
    FOR EACH ROW EXECUTE FUNCTION public.set_analysis_version();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, email, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ROW LEVEL SECURITY (RLS)

ALTER TABLE public.organizations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repositories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jira_projects   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs   ENABLE ROW LEVEL SECURITY;

-- Org: members can see their own org
CREATE POLICY "org_members_select" ON public.organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

-- Profiles: see own profile
CREATE POLICY "own_profile_select" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "own_profile_update" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Projects: see projects from my org
CREATE POLICY "org_projects_select" ON public.projects
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Project members: see members from my org projects
CREATE POLICY "org_pm_select" ON public.project_members
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE organization_id IN (
                SELECT organization_id FROM public.profiles WHERE id = auth.uid()
            )
        )
    );

-- Repositories: inherit project access
CREATE POLICY "org_repos_select" ON public.repositories
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE organization_id IN (
                SELECT organization_id FROM public.profiles WHERE id = auth.uid()
            )
        )
    );

-- Jira projects: inherit project access
CREATE POLICY "org_jira_select" ON public.jira_projects
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE organization_id IN (
                SELECT organization_id FROM public.profiles WHERE id = auth.uid()
            )
        )
    );

-- Analyses: inherit project access
CREATE POLICY "org_analyses_select" ON public.analyses
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE organization_id IN (
                SELECT organization_id FROM public.profiles WHERE id = auth.uid()
            )
        )
    );

-- Risk indicators: inherit project access
CREATE POLICY "org_ri_select" ON public.risk_indicators
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE organization_id IN (
                SELECT organization_id FROM public.profiles WHERE id = auth.uid()
            )
        )
    );

-- Activity logs: see logs from my org
CREATE POLICY "org_logs_select" ON public.activity_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );


-- Tabela de Ingestion Runs (Histórico do Painel de Ingestão)
CREATE TABLE ingestion_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL, -- 'github' ou 'jira'
    status VARCHAR(50) NOT NULL DEFAULT 'running', -- 'running', 'success', 'error'
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    events_count INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    error_logs JSONB -- Guardará os logs de erros em formato JSON
);

CREATE INDEX idx_ingestion_runs_project_id ON ingestion_runs(project_id);
-- Tabela de Tickets (Armazena as Issues do Jira e PRs do GitHub genéricos)
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL, -- 'jira' ou 'github_pr'
    external_id VARCHAR(255) NOT NULL, -- 'PROJ-123' ou 'PR#45'
    title TEXT NOT NULL,
    status VARCHAR(100) NOT NULL,
    author VARCHAR(255),
    created_at_ext TIMESTAMPTZ,
    updated_at_ext TIMESTAMPTZ,
    metadata_json JSONB -- Guardará labels, pontos, arrays brutos do JSON original
);

CREATE INDEX idx_tickets_project_id ON tickets(project_id);
CREATE INDEX idx_tickets_external_id ON tickets(external_id);

-- Tabela de Commits (Armazena histórico de repositórios do GitHub)
CREATE TABLE commits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    commit_hash VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    author VARCHAR(255),
    date_ext TIMESTAMPTZ
);
CREATE INDEX idx_commits_project_id ON commits(project_id);
CREATE INDEX idx_commits_hash ON commits(commit_hash);

ALTER TABLE projects ADD COLUMN health_status VARCHAR(50) NOT NULL DEFAULT 'unknown';