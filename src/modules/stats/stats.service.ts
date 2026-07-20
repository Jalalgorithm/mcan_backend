import { pool } from "../../config/db";
import { RowDataPacket } from "mysql2";

const PERIOD_DAYS: Record<string, number | null> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "365d": 365,
  all: null,
};

async function count(sql: string, params: unknown[] = []): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(sql, params);
  return rows[0]?.total ?? 0;
}

export async function getDashboardStats(period: string) {
  const days = PERIOD_DAYS[period] ?? 30;
  const since = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null;
  const sinceClause = since ? "AND created_at >= ?" : "";
  const sinceParams = since ? [since] : [];

  const [
    totalMembers,
    activeMembers,
    pendingMembers,
    suspendedMembers,
    newMembers,
    totalRequests,
    pendingIds,
    approvedIds,
    rejectedIds,
    revokedIds,
    generatedIds,
    totalNews,
    publishedNews,
    draftNews,
    publishedNewsThisPeriod,
    totalEvents,
    upcomingEvents,
    pastEvents,
    cancelledEvents,
    totalMessages,
    unreadMessages,
    messagesThisPeriod,
    membersByState,
    membersByType,
    recentRegistrations,
  ] = await Promise.all([
    count("SELECT COUNT(*) AS total FROM users WHERE role = 'member' AND is_deleted = 0"),
    count("SELECT COUNT(*) AS total FROM users WHERE role = 'member' AND status = 'active' AND is_deleted = 0"),
    count("SELECT COUNT(*) AS total FROM users WHERE role = 'member' AND status = 'pending' AND is_deleted = 0"),
    count("SELECT COUNT(*) AS total FROM users WHERE role = 'member' AND status = 'suspended' AND is_deleted = 0"),
    count(
      `SELECT COUNT(*) AS total FROM users WHERE role = 'member' AND is_deleted = 0 ${sinceClause}`,
      sinceParams
    ),
    count("SELECT COUNT(*) AS total FROM digital_ids"),
    count("SELECT COUNT(*) AS total FROM digital_ids WHERE status = 'pending'"),
    count("SELECT COUNT(*) AS total FROM digital_ids WHERE status = 'approved'"),
    count("SELECT COUNT(*) AS total FROM digital_ids WHERE status = 'rejected'"),
    count("SELECT COUNT(*) AS total FROM digital_ids WHERE status = 'revoked'"),
    count(`SELECT COUNT(*) AS total FROM digital_ids WHERE status = 'approved' ${sinceClause.replace("created_at", "issued_at")}`, sinceParams),
    count("SELECT COUNT(*) AS total FROM news WHERE is_deleted = 0"),
    count("SELECT COUNT(*) AS total FROM news WHERE status = 'published' AND is_deleted = 0"),
    count("SELECT COUNT(*) AS total FROM news WHERE status = 'draft' AND is_deleted = 0"),
    count(
      `SELECT COUNT(*) AS total FROM news WHERE status = 'published' AND is_deleted = 0 ${sinceClause.replace("created_at", "published_at")}`,
      sinceParams
    ),
    count("SELECT COUNT(*) AS total FROM events WHERE is_deleted = 0"),
    count("SELECT COUNT(*) AS total FROM events WHERE start_date >= NOW() AND is_deleted = 0"),
    count("SELECT COUNT(*) AS total FROM events WHERE start_date < NOW() AND is_deleted = 0"),
    count("SELECT COUNT(*) AS total FROM events WHERE status = 'cancelled' AND is_deleted = 0"),
    count("SELECT COUNT(*) AS total FROM contacts"),
    count("SELECT COUNT(*) AS total FROM contacts WHERE is_read = 0"),
    count(`SELECT COUNT(*) AS total FROM contacts WHERE 1=1 ${sinceClause}`, sinceParams),
    pool
      .query<RowDataPacket[]>(
        "SELECT state, COUNT(*) AS count FROM users WHERE role = 'member' AND is_deleted = 0 AND state IS NOT NULL GROUP BY state ORDER BY count DESC LIMIT 5"
      )
      .then(([rows]) => rows.map((r) => ({ state: r.state, count: r.count }))),
    pool
      .query<RowDataPacket[]>(
        "SELECT membership_type AS type, COUNT(*) AS count FROM users WHERE role = 'member' AND is_deleted = 0 GROUP BY membership_type"
      )
      .then(([rows]) => rows.map((r) => ({ type: r.type, count: r.count }))),
    pool
      .query<RowDataPacket[]>(
        "SELECT id, first_name, last_name, member_id, created_at FROM users WHERE role = 'member' AND is_deleted = 0 ORDER BY created_at DESC LIMIT 5"
      )
      .then(([rows]) =>
        rows.map((r) => ({
          id: r.id,
          firstName: r.first_name,
          lastName: r.last_name,
          memberId: r.member_id,
          createdAt: r.created_at,
        }))
      ),
  ]);

  return {
    members: {
      total: totalMembers,
      active: activeMembers,
      pending: pendingMembers,
      suspended: suspendedMembers,
      newThisPeriod: newMembers,
    },
    digitalIds: {
      totalRequests,
      pending: pendingIds,
      approved: approvedIds,
      rejected: rejectedIds,
      revoked: revokedIds,
      generatedThisPeriod: generatedIds,
    },
    news: {
      total: totalNews,
      published: publishedNews,
      drafts: draftNews,
      publishedThisPeriod: publishedNewsThisPeriod,
    },
    events: {
      total: totalEvents,
      upcoming: upcomingEvents,
      past: pastEvents,
      cancelled: cancelledEvents,
    },
    contact: {
      totalMessages,
      unread: unreadMessages,
      receivedThisPeriod: messagesThisPeriod,
    },
    membersByState,
    membersByType,
    recentRegistrations,
    period,
    generatedAt: new Date().toISOString(),
  };
}
