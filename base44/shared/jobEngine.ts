// Durable Job Engine — Phase 3.
// A real durable job abstraction built on the Base44 entity DB.
// Jobs survive process restarts because they are persisted as Job records.
//
// This is NOT a distributed queue (Base44 cannot host persistent workers).
// It IS a durable, retryable, observable job state machine that any
// backend function or workflow can claim and process. For production-scale
// throughput, the interface below maps cleanly to an external queue
// (BullMQ/Temporal) via the same createJob/claimNextJob/completeJob contract.

import { secrets } from "base44:runtime";

export interface JobCreateOpts {
  type: string;
  payload: any;
  priority?: number;
  max_attempts?: number;
  tenant_id?: string;
  correlation_id?: string;
  idempotency_key?: string;
  parent_job_id?: string;
  dependencies?: string[];
  timeout_seconds?: number;
  autonomy_level?: string;
}

export interface JobClaimResult {
  claimed: boolean;
  job?: any;
  reason?: string;
}

/**
 * Create a durable job. Idempotent — if idempotency_key matches an
 * existing non-terminal job, returns that job instead of duplicating.
 */
export async function createJob(db: any, opts: JobCreateOpts): Promise<any> {
  // Idempotency check
  if (opts.idempotency_key) {
    const existing = await db.entities.Job.filter({ idempotency_key: opts.idempotency_key }).catch(() => []);
    if (existing.length > 0) {
      const job = existing[0];
      if (["queued", "running", "waiting", "retrying"].includes(job.status)) {
        return job; // Already in flight — don't duplicate
      }
    }
  }

  const jobId = crypto.randomUUID();
  const now = new Date().toISOString();
  return db.entities.Job.create({
    job_id: jobId,
    type: opts.type,
    priority: opts.priority || 5,
    payload: opts.payload || {},
    status: "queued",
    attempts: 0,
    max_attempts: opts.max_attempts || 3,
    created_at: now,
    tenant_id: opts.tenant_id || "",
    correlation_id: opts.correlation_id || "",
    idempotency_key: opts.idempotency_key || "",
    parent_job_id: opts.parent_job_id || "",
    dependencies: opts.dependencies || [],
    timeout_seconds: opts.timeout_seconds || 120,
    autonomy_level: opts.autonomy_level || "execute_reversible",
  });
}

/**
 * Atomically claim the next job of a given type.
 * Uses updateMany with a status filter to prevent double-claiming.
 * Returns the claimed job or { claimed: false } if none available.
 */
export async function claimNextJob(db: any, type: string): Promise<JobClaimResult> {
  // Find queued jobs of this type, sorted by priority then age
  const queued = await db.entities.Job.filter({ type, status: "queued" }, "priority", 20).catch(() => []);
  if (queued.length === 0) {
    return { claimed: false, reason: "No queued jobs" };
  }

  // Also include retrying jobs whose next_retry_at has passed
  const now = new Date().toISOString();
  const retrying = await db.entities.Job.filter({ type, status: "retrying" }, "priority", 20).catch(() => []);
  const readyToRetry = retrying.filter((j: any) => !j.next_retry_at || j.next_retry_at <= now);

  const candidates = [...queued, ...readyToRetry];
  if (candidates.length === 0) {
    return { claimed: false, reason: "No ready jobs" };
  }

  // Sort by priority (1=highest) then by created_at (oldest first)
  candidates.sort((a: any, b: any) => (a.priority - b.priority) || (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));

  const job = candidates[0];

  // Atomically transition queued/retrying → running (prevents double-claim)
  const updated = await db.entities.Job.updateMany(
    { job_id: job.job_id, status: { $in: ["queued", "retrying"] } },
    { $set: { status: "running", started_at: now, attempts: (job.attempts || 0) + 1 } }
  ).catch(() => ({ modified_count: 0 }));

  if (updated.modified_count === 0) {
    return { claimed: false, reason: "Race lost — another worker claimed it" };
  }

  const claimed = await db.entities.Job.filter({ job_id: job.job_id });
  return { claimed: true, job: claimed[0] };
}

/**
 * Mark a job as completed with its result.
 */
export async function completeJob(db: any, jobId: string, result: any): Promise<void> {
  await db.entities.Job.updateMany(
    { job_id: jobId },
    { $set: { status: "completed", completed_at: new Date().toISOString(), result, error: "" } }
  );
}

/**
 * Mark a job as failed. If attempts < max_attempts, schedule a retry
 * with exponential backoff. Otherwise, send to dead-letter queue.
 */
export async function failJob(db: any, jobId: string, error: string, checkpoint?: any): Promise<{ action: string; next_retry_at?: string }> {
  const jobs = await db.entities.Job.filter({ job_id: jobId });
  if (jobs.length === 0) return { action: "not_found" };

  const job = jobs[0];
  const attempts = (job.attempts || 0);

  if (attempts >= (job.max_attempts || 3)) {
    // Dead letter
    await db.entities.Job.updateMany(
      { job_id: jobId },
      { $set: { status: "dead_letter", error, completed_at: new Date().toISOString() } }
    );
    return { action: "dead_letter" };
  }

  // Exponential backoff: 2^attempts seconds (2s, 4s, 8s, 16s, 32s...)
  const backoffSeconds = Math.pow(2, attempts);
  const nextRetry = new Date(Date.now() + backoffSeconds * 1000).toISOString();

  await db.entities.Job.updateMany(
    { job_id: jobId },
    { $set: { status: "retrying", error, next_retry_at: nextRetry, checkpoint: checkpoint || job.checkpoint || {} } }
  );

  return { action: "retrying", next_retry_at: nextRetry };
}

/**
 * Cancel a job (only if not already terminal).
 */
export async function cancelJob(db: any, jobId: string, reason: string = "cancelled"): Promise<boolean> {
  const res = await db.entities.Job.updateMany(
    { job_id: jobId, status: { $in: ["queued", "waiting", "retrying"] } },
    { $set: { status: "cancelled", error: reason, completed_at: new Date().toISOString() } }
  );
  return res.modified_count > 0;
}

/**
 * Save a checkpoint for resumability.
 */
export async function saveCheckpoint(db: any, jobId: string, checkpoint: any): Promise<void> {
  await db.entities.Job.updateMany({ job_id: jobId }, { $set: { checkpoint } });
}

/**
 * Get jobs by correlation ID (for pipeline observability).
 */
export async function getPipelineJobs(db: any, correlationId: string): Promise<any[]> {
  return db.entities.Job.filter({ correlation_id: correlationId }, "created_at", 100);
}

/**
 * Get dead-letter jobs for inspection/replay.
 */
export async function getDeadLetterJobs(db: any, type?: string): Promise<any[]> {
  const filter: any = { status: "dead_letter" };
  if (type) filter.type = type;
  return db.entities.Job.filter(filter, "created_at", 50);
}