/** Local preview fixture only. No external connection, file database, or production writes. */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

export async function createPreviewData(db) {
  const data = JSON.parse(
    readFileSync(new URL("../seed/source-data.json", import.meta.url), "utf8"),
  );
  const uuid = (value) => {
    const h = createHash("sha256").update(value).digest("hex").slice(0, 32);
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20)}`;
  };
  const date = (value) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value || "") ? value : null;
  await db.exec(`
  CREATE TABLE profiles(id uuid PRIMARY KEY,name_ko text,name_en text,headline text,school_name text,department text,email text,github_url text,is_public boolean DEFAULT true,display_order integer DEFAULT 0,source_notion_id text);
  CREATE TABLE projects(id uuid PRIMARY KEY,slug text UNIQUE NOT NULL,name text NOT NULL,name_en text,summary text,summary_en text,description text,description_en text,content_markdown text,project_type text,status text,is_featured boolean DEFAULT false,started_at date,ended_at date,period_label text,role text,role_en text,key_contributions text,result_summary text,lessons_learned text,github_url text,live_url text,store_url text,source_code_visibility text,display_order integer DEFAULT 0,is_public boolean DEFAULT true,source_notion_id text);
  CREATE TABLE technologies(id uuid PRIMARY KEY,name text,category text,proficiency text,description text,description_en text,display_order integer DEFAULT 0,is_public boolean DEFAULT true);
  CREATE TABLE project_technologies(project_id uuid REFERENCES projects(id),technology_id uuid REFERENCES technologies(id),usage_note text,is_primary boolean DEFAULT false,PRIMARY KEY(project_id,technology_id));
  CREATE TABLE project_metrics(id uuid PRIMARY KEY,project_id uuid REFERENCES projects(id),metric_key text,metric_name text,display_value text,comparison text,is_verified boolean DEFAULT false,is_public boolean DEFAULT true);
  CREATE TABLE experiences(id uuid PRIMARY KEY,name text,name_en text,category text,organization text,role text,started_at date,ended_at date,period_label text,status text,is_ongoing boolean DEFAULT false,is_highlight boolean DEFAULT false,is_public boolean DEFAULT true,display_order integer DEFAULT 0);
  CREATE TABLE employment(id uuid PRIMARY KEY,experience_id uuid REFERENCES experiences(id),company_name text,position text,description_ko text,description_en text,started_at date,ended_at date,is_public boolean DEFAULT true);
  CREATE TABLE education(id uuid PRIMARY KEY,experience_id uuid REFERENCES experiences(id),school_name text,department text,started_at date,ended_at date,status text,is_public boolean DEFAULT true);
  CREATE TABLE leadership(id uuid PRIMARY KEY,experience_id uuid REFERENCES experiences(id),activity_name text,role text,status text,started_at date,ended_at date,is_public boolean DEFAULT true);
  CREATE TABLE recognitions(id uuid PRIMARY KEY,experience_id uuid REFERENCES experiences(id),title text,title_en text,recognition_type text,award_name text,award_name_en text,awarded_at date,related_project_id uuid REFERENCES projects(id),is_public boolean DEFAULT true);
  CREATE TABLE certifications(id uuid PRIMARY KEY,experience_id uuid REFERENCES experiences(id),name text,issuer text,issued_at date,status text,is_public boolean DEFAULT true);
  CREATE TABLE participations(id uuid PRIMARY KEY,title text,started_at date,ended_at date,attendance_status text,is_public boolean DEFAULT true);
  CREATE TABLE media_assets(id uuid PRIMARY KEY,file_name text,external_url text,is_public boolean DEFAULT false,created_at timestamptz DEFAULT now());
  CREATE TABLE asset_links(id uuid PRIMARY KEY,asset_id uuid REFERENCES media_assets(id),profile_id uuid REFERENCES profiles(id),project_id uuid REFERENCES projects(id),experience_id uuid REFERENCES experiences(id),recognition_id uuid REFERENCES recognitions(id),certification_id uuid REFERENCES certifications(id));
 `);
  async function insert(table, row) {
    const columns = Object.keys(row);
    await db.query(
      `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(",")}) VALUES (${columns.map((_, i) => "$" + (i + 1)).join(",")})`,
      Object.values(row),
    );
  }
  const p = data.profile;
  await insert("profiles", {
    id: uuid("profile-main"),
    name_ko: p.name_ko,
    name_en: p.name_en,
    headline: p.headline,
    school_name: p.school_name,
    department: p.department,
    email: null,
    github_url: p.github_url,
  });
  for (const [index, p] of data.projects.entries())
    await insert("projects", {
      id: uuid(p.id),
      slug: p.slug,
      name: p.name,
      name_en: p.name_en || null,
      summary: p.summary_ko,
      summary_en: p.summary_en,
      description: p.description_ko,
      description_en: p.description_en,
      content_markdown: null,
      project_type: p.project_type,
      status: p.status,
      is_featured: p.is_featured,
      started_at: date(p.started_at),
      ended_at: date(p.ended_at),
      period_label: p.period_note_ko || null,
      role: p.role,
      role_en: p.role_en || null,
      key_contributions: p.key_contributions || null,
      result_summary: p.result_summary || null,
      lessons_learned: p.lessons_learned || null,
      github_url: p.github_url,
      live_url: p.live_url,
      store_url: p.store_url || null,
      source_code_visibility: p.source_code_visibility,
      display_order: index,
    });
  for (const [index, t] of data.technologies.entries())
    await insert("technologies", {
      id: uuid(t.id),
      name: t.name,
      category: t.category,
      proficiency: t.proficiency,
      description: t.description_ko,
      description_en: t.description_en,
      display_order: index,
    });
  for (const t of data.technologies)
    for (const slug of t.linked_project_slugs || []) {
      const p = data.projects.find((p) => p.slug === slug);
      if (p)
        await insert("project_technologies", {
          project_id: uuid(p.id),
          technology_id: uuid(t.id),
          usage_note: null,
          is_primary: false,
        });
    }
  for (const [index, m] of data.project_metrics.entries())
    await insert("project_metrics", {
      id: uuid("metric-" + index),
      project_id: uuid(m.project_id),
      metric_key: m.metric_key,
      metric_name: m.name_ko,
      display_value: m.display_value,
      comparison: m.comparison || "exact",
      is_verified: false,
    });
  const experience = async (id, row) => {
    const expId = uuid("exp-" + id);
    await insert("experiences", { id: expId, ...row });
    return expId;
  };
  for (const e of data.employment) {
    const experience_id = await experience(e.id, {
      name: e.company,
      category: "Work",
      role: e.role,
      started_at: date(e.started_at),
      ended_at: date(e.ended_at),
      status: "completed",
    });
    await insert("employment", {
      id: uuid(e.id),
      experience_id,
      company_name: e.company,
      position: e.role,
      description_ko: e.description_ko,
      description_en: e.description_en,
      started_at: date(e.started_at),
      ended_at: date(e.ended_at),
    });
  }
  for (const e of data.education) {
    const experience_id = await experience(e.id, {
      name: e.school,
      category: "Education",
      started_at: date(e.started_at),
      ended_at: date(e.ended_at),
      is_ongoing: e.status === "enrolled",
    });
    await insert("education", {
      id: uuid(e.id),
      experience_id,
      school_name: e.school,
      department: e.department,
      started_at: date(e.started_at),
      ended_at: date(e.ended_at),
      status: e.status,
    });
  }
  for (const l of data.leadership) {
    const experience_id = await experience(l.id, {
      name: l.title,
      category: "Leadership & Activity",
      role: l.role,
      started_at: date(l.started_at),
      ended_at: date(l.ended_at),
      period_label: [l.started_at, l.ended_at].filter(Boolean).join(" — "),
      status: l.status || "completed",
      is_ongoing: l.status === "ongoing",
    });
    await insert("leadership", {
      id: uuid(l.id),
      experience_id,
      activity_name: l.title,
      role: l.role,
      status: l.status || "completed",
      started_at: date(l.started_at),
      ended_at: date(l.ended_at),
    });
  }
  for (const r of data.recognitions) {
    const experience_id = await experience(r.id, {
      name: r.title,
      category:
        r.type === "scholarship" ? "Scholarship" : "Competition & Hackathon",
      started_at: date(r.date),
    });
    await insert("recognitions", {
      id: uuid(r.id),
      experience_id,
      title: r.title,
      recognition_type: r.type,
      award_name: r.award,
      award_name_en: r.award_en || null,
      awarded_at: date(r.date),
    });
  }
  for (const c of data.certifications) {
    const experience_id = await experience(c.id, {
      name: c.title,
      category: "Certification & Badge",
      started_at: date(c.issued_at),
    });
    await insert("certifications", {
      id: uuid(c.id),
      experience_id,
      name: c.title,
      issuer: c.issuer,
      issued_at: date(c.issued_at),
      status: c.status,
    });
  }
  for (const p of data.programs)
    await insert("participations", {
      id: uuid(p.id),
      title: p.title,
      started_at: date(p.started_at),
      ended_at: date(p.ended_at),
      attendance_status: p.attendance_status || "unknown",
    });
}
