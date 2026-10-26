/**
 * Error thrown by workflow.batchSubmission. The server reports a failing operation as
 * "<message> operation : <n>" (n is 1-based within the request); `operationIndex` is
 * that operation's 0-based position in the whole list you passed, or null when the
 * server didn't say.
 */
export class BatchSubmissionError extends Error {
  operationIndex: number | null;
  /** Ids already saved by earlier chunks before this one failed. */
  savedSubmissionIds: string[];

  constructor(message: string, operationIndex: number | null, savedSubmissionIds: string[] = []) {
    super(message);
    this.name = "BatchSubmissionError";
    this.operationIndex = operationIndex;
    this.savedSubmissionIds = savedSubmissionIds;
    Object.setPrototypeOf(this, BatchSubmissionError.prototype);
  }

  static fromServerMessage(raw: string, chunkStart = 0, saved: string[] = []): BatchSubmissionError {
    const m = /^(.*?)\s*operation\s*:\s*(\d+)\s*$/i.exec(String(raw ?? ""));
    if (m) {
      const n = parseInt(m[2], 10);
      if (Number.isFinite(n) && n > 0) {
        return new BatchSubmissionError(m[1] || raw, chunkStart + n - 1, [...saved]);
      }
    }
    return new BatchSubmissionError(raw || "Batch submission failed", null, [...saved]);
  }
}
