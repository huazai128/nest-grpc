/** 限制并发，避免 Kafka 故障时 gRPC 兜底打满进程 */
export class BoundedExecutor {
  private running = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly maxConcurrent: number) {}

  run(task: () => Promise<void>): void {
    const start = () => {
      this.running += 1;
      task()
        .catch(() => undefined)
        .finally(() => {
          this.running -= 1;
          const next = this.queue.shift();
          if (next) next();
        });
    };
    if (this.running < this.maxConcurrent) {
      start();
    } else {
      this.queue.push(start);
    }
  }
}

export const grpcFallbackExecutor = new BoundedExecutor(
  Math.max(8, Number(process.env.INGEST_GRPC_FALLBACK_CONCURRENCY) || 64),
);
