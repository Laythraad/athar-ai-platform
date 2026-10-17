/* Server-side read helpers.
 *
 * All of these run with the *user-scoped* client, so Postgres RLS is the
 * real gate: anonymous callers only ever see `published` works. Nothing here
 * can be used to bypass moderation. */

import { serverSupabase } from "./supabase/server";

/** Escape PostgREST/PostgreSQL ILIKE special characters in a user-supplied
    search term so `%`, `_`, `\`, `,`, `(`, `)`, and `.` inside the term cannot
    break out of the pattern or inject extra OR clauses. */
export function escapeIlike(term: string): string {
  return term.replace(/[\\%_,().*+?^${}[\]|/]/g, (m) => `\\${m}`);
}

export interface WorkRow {
  id: string;
  author_id: string;
  title: string;
  description: string | null;
  content: string | null;
  category: string;
  tags: string[] | null;
  language: string;
  status: string;
  cover_path: string | null;
  file_path: string | null;
  file_mime: string | null;
  allow_download: boolean | null;
  read_count: number | null;
  avg_rating: number | null;
  rating_count: number | null;
  is_sample?: boolean | null;
  created_at: string;
  published_at: string | null;
  rejection_reason: string | null;
  pen_name?: string | null;
}

export interface AuthorRow {
  id: string;
  pen_name: string;
  bio: string | null;
  avatar_path: string | null;
  author_type: string;
  account_status: string;
  created_at: string;
}

export type SortKey = "new" | "top" | "read";

export interface FeedOptions {
  q?: string;
  category?: string;
  sort?: SortKey;
  limit?: number;
}

const WORK_SELECT =
  "id, author_id, title, description, content, category, tags, language, status, cover_path, file_path, file_mime, allow_download, read_count, avg_rating, rating_count, is_sample, created_at, published_at, rejection_reason";

/* Feed select also joins the author pen name so cards can show "by …". */
const WORK_SELECT_FEED =
  WORK_SELECT + ", profiles:author_id(pen_name)";

export async function fetchPublishedWorks(opts: FeedOptions = {}): Promise<WorkRow[]> {
  const supabase = await serverSupabase();
  if (!supabase) return [];

  let query = supabase
    .from("works")
    .select(WORK_SELECT_FEED)
    .eq("status", "published")
    .limit(opts.limit ?? 60);

  if (opts.category && opts.category !== "all") {
    query = query.eq("category", opts.category);
  }
  if (opts.q && opts.q.trim()) {
    const term = escapeIlike(opts.q.trim());
    // title + description + body (the body includes text extracted from
    // uploaded PDFs, so file works stay searchable)
    query = query.or(
      `title.ilike.%${term}%,description.ilike.%${term}%,content.ilike.%${term}%`,
    );
  }

  if (opts.sort === "top") {
    // `works.avg_rating` is a dead column (the protect trigger forces it to 0
    // on insert and there are no per-work ratings — only per-author). Sort by
    // read_count as an honest popularity proxy instead.
    query = query.order("read_count", { ascending: false, nullsFirst: false });
  } else if (opts.sort === "read") {
    query = query.order("read_count", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("published_at", { ascending: false, nullsFirst: false });
  }

  const { data, error } = await query;
  if (error) {
    // Don't silently swallow query failures — log so a bad filter or a
    // schema drift is visible in server logs instead of looking like an
    // empty library.
    console.error("[queries] fetchPublishedWorks failed:", error.message);
    return [];
  }
  const rows = (data as unknown as Array<WorkRow & { profiles: { pen_name: string } | null }>) ?? [];
  /* flatten the join so WorkCard sees `pen_name` */
  return rows.map(({ profiles, ...w }) => ({
    ...w,
    pen_name: profiles?.pen_name ?? null,
  }));
}

export async function fetchWork(id: string): Promise<WorkRow | null> {
  const supabase = await serverSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("works")
    .select(WORK_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[queries] fetchWork failed:", error.message);
    return null;
  }
  return (data as WorkRow | null) ?? null;
}

export async function fetchAuthorWorks(authorId: string): Promise<WorkRow[]> {
  const supabase = await serverSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("works")
    .select(WORK_SELECT)
    .eq("author_id", authorId)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(60);
  if (error) {
    console.error("[queries] fetchAuthorWorks failed:", error.message);
    return [];
  }
  return (data as WorkRow[]) ?? [];
}

export async function fetchAuthor(id: string): Promise<AuthorRow | null> {
  const supabase = await serverSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, pen_name, bio, avatar_path, author_type, account_status, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[queries] fetchAuthor failed:", error.message);
    return null;
  }
  return (data as AuthorRow | null) ?? null;
}

export async function fetchMyWorks(userId: string): Promise<WorkRow[]> {
  const supabase = await serverSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("works")
    .select(WORK_SELECT)
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    console.error("[queries] fetchMyWorks failed:", error.message);
    return [];
  }
  return (data as WorkRow[]) ?? [];
}

export interface CategoryRow {
  slug: string;
  name_ar: string;
  name_en: string;
  sort: number;
}

export async function fetchCategories(): Promise<CategoryRow[]> {
  const supabase = await serverSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("categories")
    .select("slug, name_ar, name_en, sort")
    .order("sort", { ascending: true });
  if (error) {
    console.error("[queries] fetchCategories failed:", error.message);
    return [];
  }
  return (data as CategoryRow[]) ?? [];
}

export interface ReadingListRow {
  work_id: string;
  status: string;
  work: WorkRow | null;
}

export async function fetchReadingList(userId: string): Promise<ReadingListRow[]> {
  const supabase = await serverSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("reading_list")
    .select(`work_id, status, works (${WORK_SELECT})`)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) {
    console.error("[queries] fetchReadingList failed:", error.message);
    return [];
  }

  // PostgREST returns an embedded to-one relation as a 1-element array.
  const rows = (data ?? []) as unknown as {
    work_id: string;
    status: string;
    works: WorkRow[] | WorkRow | null;
  }[];

  return rows.map((r) => ({
    work_id: r.work_id,
    status: r.status,
    work: Array.isArray(r.works) ? (r.works[0] ?? null) : r.works,
  }));
}

export async function fetchAuthorRating(
  authorId: string,
): Promise<{ avg: number; count: number; mine: number | null }> {
  const supabase = await serverSupabase();
  if (!supabase) return { avg: 0, count: 0, mine: null };

  const { data: agg, error: aggErr } = await supabase
    .from("author_rating_agg")
    .select("avg_stars, count")
    .eq("author_id", authorId)
    .maybeSingle();
  if (aggErr) {
    console.error("[queries] fetchAuthorRating agg failed:", aggErr.message);
  }

  const { data: { user } } = await supabase.auth.getUser();
  let mine: number | null = null;
  if (user) {
    const { data: r, error: rErr } = await supabase
      .from("author_ratings")
      .select("stars")
      .eq("author_id", authorId)
      .eq("rater_id", user.id)
      .maybeSingle();
    if (rErr) {
      console.error("[queries] fetchAuthorRating mine failed:", rErr.message);
    }
    mine = typeof r?.stars === "number" ? r.stars : null;
  }

  return {
    avg: typeof agg?.avg_stars === "number" ? Number(agg.avg_stars) : 0,
    count: typeof agg?.count === "number" ? agg.count : 0,
    mine,
  };
}
