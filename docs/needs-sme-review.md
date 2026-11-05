# Items requiring independent subject-matter review

All entries below are drafts. No human reviewer or approval is recorded. AI-assisted drafting, source checking, and independent re-derivation are not substitutes for qualified human review.

## Data Engineer

- `de-window-functions-retain-rows` — SQL / Window functions and aggregation: What is the key difference between a window calculation and a grouped aggregate?
- `de-kafka-retry-after-timeout-can-duplicate` — Streaming systems / Producer retries and delivery semantics: A producer times out after sending an event. Why can a retry create a duplicate, and what guarantee would you check?
- `de-airflow-retries-need-idempotent-tasks` — Orchestration / Retries and idempotency: A scheduled pipeline task fails halfway through and the orchestrator retries it. What makes the retry safe?
- `de-watermark-bounds-streaming-state` — Streaming systems / Event time, late data, and watermarks: Why use a watermark for event-time aggregation, and what trade-off should you explain?
- `de-parquet-columnar-storage-tradeoffs` — Storage formats / Columnar representation and compression: What problem does a columnar format such as Parquet aim to solve, and what should you still benchmark?
- `de-iceberg-partition-evolution-no-rewrite` — Lakehouse table formats / Partition evolution: A table's query pattern shifts from daily to hourly filtering. Why might partition evolution help without rewriting all old data?
- `de-row-number-needs-deterministic-tie-breaker` — SQL / Window ranking and deterministic deduplication: You use ROW_NUMBER to keep the newest record per customer, but some timestamps tie. How do you make the choice reproducible?
- `de-window-order-by-default-frame-surprise` — SQL / Window frames and running totals: A SUM window returns a running total instead of the same whole-partition total on every row. What would you inspect?
- `de-kafka-key-ordering-and-hot-partitions` — Streaming systems / Partition keys and ordering: Why might a Kafka topic key preserve per-entity ordering but create an overloaded partition?
- `de-airflow-data-interval-backfill` — Orchestration / Data intervals and backfills: A daily DAG starts at midnight. Which date should its task process: the run's start time or its data interval?
- `de-iceberg-snapshot-expiration-tradeoff` — Lakehouse table formats / Snapshots, time travel, and retention: An Iceberg table's metadata and storage keep growing. What does snapshot expiration do, and what must you protect?
- `de-iceberg-small-file-compaction` — Lakehouse table formats / Small-file maintenance: A table has many tiny data files and query planning/open costs are rising. How would you decide whether to compact?
- `de-explain-estimate-versus-actual` — SQL / Query plans and row estimates: A PostgreSQL query plan estimates 20 rows at a node but returns 20,000. Why does that matter, and what would you inspect?
- `de-explain-cost-is-not-wall-clock-time` — SQL / Reading query plans: A PostgreSQL EXPLAIN plan shows a cost of 10,000. Does that mean the query takes 10 seconds?
- `de-left-join-filter-on-versus-where` — SQL / Outer joins and filter placement: A LEFT JOIN query unexpectedly drops customers with no matching order after you add a filter. What would you check?
- `de-parquet-per-column-encoding-choice` — Storage formats / Per-column encoding and compression: Why can two columns in the same Parquet file benefit from different compression choices?
- `de-parquet-preserve-nested-data` — Storage formats / Nested data representation: A source contains nested records and arrays. Why might you preserve that structure in Parquet instead of flattening immediately?
- `de-iceberg-schema-change-no-file-rewrite` — Lakehouse table formats / Schema evolution: A table needs a new nested field and a renamed column. What should you verify before applying the schema change?
- `de-window-filter-before-ranking` — SQL / Window input rows and query stages: A query ranks events per user, but filtering to a date range before ranking changes which event gets rank 1. Why?
- `de-explain-analyze-loops-interpretation` — SQL / Query plans and repeated plan nodes: An EXPLAIN ANALYZE node shows 1 row and 10 loops. Did the node process only one row in total?
- `de-kafka-consumer-group-parallelism` — Streaming systems / Consumer groups and partition parallelism: A Kafka topic has six partitions and your consumer group has ten consumers. Can all ten read that topic in parallel?
- `de-kafka-offset-rewind-replay-safety` — Streaming systems / Offsets and replay: A team rewinds a Kafka consumer offset to replay yesterday's events. What downstream risk should they check first?
- `de-iceberg-hidden-partitioning-query-filters` — Lakehouse table formats / Hidden partitioning and filter pushdown: How can Iceberg use a day-based partition layout without making every analyst filter a separate date column?
- `de-iceberg-partition-transform-versus-query-column` — Lakehouse table formats / Partition transforms: A team stores logs by day but analysts filter by timestamp and timezone. What partitioning risks would you review?
- `de-postgres-index-read-write-tradeoff` — SQL / Index trade-offs: A team wants an index for every frequently filtered column. What costs should you discuss before adding them?
- `de-spark-checkpoint-source-replayability` — Streaming systems / Checkpointing and source fault tolerance: A Spark streaming query restarts from a checkpoint but misses data from one source. What source capability would you verify?
- `de-spark-file-source-partition-layout-static` — Streaming systems / File source partition discovery: A Spark file stream starts reading a new directory layout and then fails to discover data consistently. What should you inspect?
- `de-kafka-committed-message-durability` — Streaming systems / Replication and committed records: In Kafka's documented durability model, what does it mean for a record to be committed?
- `de-spark-continuous-processing-guarantee-tradeoff` — Streaming systems / Streaming latency and processing guarantees: A Spark streaming team wants the lowest possible latency. Why should it review Continuous Processing's guarantee before choosing it?
- `de-postgres-explain-analyze-mutating-query-safety` — SQL / Safe query-plan measurement: A teammate runs EXPLAIN ANALYZE on a production DELETE to measure its speed. What safety check comes first?
- `de-kafka-batching-latency-throughput` — Streaming systems / Producer batching and latency: A Kafka producer is sending tiny batches. What trade-off would you explain before increasing its batch wait time?
- `de-spark-file-source-atomic-arrival` — Streaming systems / File source atomicity: A Spark file stream sometimes reads half-written files. What change to the file delivery process would you investigate?
- `de-postgres-btree-equality-range` — SQL / B-tree index access patterns: A query filters an indexed numeric column with `>=` and `<`. Why might a PostgreSQL B-tree be a candidate?
- `de-postgres-index-can-satisfy-order-by` — SQL / Indexes and ordered results: A query returns the newest 20 rows. How could an index help beyond filtering, and what should you measure?
- `de-iceberg-rewrite-manifests-query-planning` — Lakehouse table formats / Manifest organization and query planning: An Iceberg table has many manifests and query planning is slow after frequent small commits. What maintenance option would you investigate?
- `de-kafka-transactions-multi-partition-atomicity` — Streaming systems / Transactions across partitions: A producer writes a related set of records to several Kafka partitions. What guarantee can a Kafka transaction provide, and where does it stop?
- `de-kafka-producer-ack-latency-durability` — Streaming systems / Acknowledgement and durability trade-offs: A latency-sensitive producer wants to stop waiting for follower replication. What durability trade-off should it make explicit?
- `de-iceberg-metadata-file-retention` — Lakehouse table formats / Metadata file cleanup: An Iceberg table receives frequent streaming commits and its metadata directory grows. What cleanup setting and caveat would you investigate?
- `de-iceberg-orphan-files-separate-cleanup` — Lakehouse table formats / Orphan data file cleanup: Why can snapshot expiration leave some untracked Iceberg files behind, and why is orphan cleanup separate?
- `de-spark-file-source-trigger-limits` — Streaming systems / File source admission control: A Spark file stream falls behind after a large delivery burst. Which source limits could help control work per trigger?
- `de-postgres-count-star-versus-column` — SQL / Aggregate NULL behavior: Why can COUNT(*) and COUNT(email) return different totals for the same table?
- `de-postgres-union-versus-union-all` — SQL / Set operations and duplicates: Two daily extracts contain repeated records. What changes if you combine them with UNION instead of UNION ALL?
- `de-postgres-not-in-null-trap` — SQL / Three-valued logic and anti-joins: A NOT IN filter unexpectedly returns no rows after the lookup table gains a NULL. What is happening?
- `de-postgres-exists-for-presence-check` — SQL / Existence checks and subqueries: You only need to know whether a customer has any paid order. What does EXISTS express clearly?
- `de-postgres-multicolumn-index-leading-key` — SQL / Multicolumn index key order: A B-tree index is defined on (tenant_id, created_at). Why might a query filtering only created_at use it less efficiently?
- `de-spark-stream-join-watermark-state-bound` — Streaming systems / Stream-stream joins and state: An inner Spark stream-stream join's state store keeps growing. What must you add to safely bound matching state?
- `de-spark-sliding-window-overlap-counting` — Streaming systems / Event-time windows: A five-minute event-time window slides every minute. Can one event contribute to multiple window counts?
- `de-spark-session-window-dynamic-gap` — Streaming systems / Session windows: How does a session window differ from a fixed five-minute event-time window?
- `de-spark-streaming-sort-output-mode` — Streaming systems / Supported streaming operations: A Spark streaming query tries to sort all incoming raw rows by timestamp. Why may the operation be unsupported?
- `de-spark-stream-distinct-support-limit` — Streaming systems / Stateful streaming operations: A Spark streaming query fails when you add DISTINCT. What limitation should you check?
- `de-airflow-trigger-rules-branch-skip` — Orchestration / Branching and trigger rules: An Airflow task after a branch is skipped even though another branch succeeded. What should you inspect?
- `de-airflow-xcom-small-metadata` — Orchestration / Inter-task data exchange: Why should an Airflow task pass a file path through XCom instead of passing a large dataframe?
- `de-airflow-runtime-task-mapping-limit` — Orchestration / Dynamic task mapping: A daily Airflow run discovers a variable number of partitions to process. How can it create tasks at runtime without overwhelming the scheduler?
- `de-airflow-pool-concurrency-slots` — Orchestration / Resource and external-system limits: A pipeline floods a rate-limited warehouse when many DAG tasks become runnable. How can Airflow pools help?
- `de-airflow-sensor-poke-reschedule-tradeoff` — Orchestration / Sensors and worker capacity: A sensor polls for an upstream file every few minutes. When might reschedule mode be preferable to poke mode?
- `de-airflow-deferrable-worker-release` — Orchestration / Deferrable operators and triggerers: A task spends most of its runtime waiting for an external job. What does a deferrable operator change?
- `de-airflow-leaf-state-dag-run-status` — Orchestration / DAG run status and leaf tasks: An Airflow DAG run is marked successful even though a middle task failed. How can the leaf task explain this?
- `de-airflow-depends-on-past-sequencing` — Orchestration / Cross-run task dependencies: A task with depends_on_past is blocked in today's DAG run. Which previous-run state should you investigate?
- `de-parquet-row-group-column-chunk-pages` — Storage formats / Parquet file organization: How do row groups, column chunks, and pages fit together in a Parquet file?
- `de-parquet-row-group-size-throughput-buffering` — Storage formats / Row-group sizing: What trade-off should you measure when increasing Parquet row-group size?
- `de-parquet-page-index-reader-compatibility` — Storage formats / Page indexes and pruning: A Parquet scan still reads many pages despite selective filters. What should you verify about page indexes?
- `de-parquet-page-size-granularity-overhead` — Storage formats / Page-size trade-offs: What changes when Parquet data pages are made smaller?
- `de-parquet-dictionary-encoding-cardinality-fallback` — Storage formats / Dictionary encoding: A Parquet column has millions of distinct values. What may happen to dictionary encoding as the dictionary grows?
- `de-parquet-encoding-versus-compression` — Storage formats / Encoding and compression layers: In Parquet, how are encoding and compression different, and where are they applied?
- `de-kafka-compaction-latest-value-not-history` — Streaming systems / Compacted topics and key-value state: What does log compaction preserve, and why is a compacted Kafka topic not a full event-history archive?
- `de-kafka-delete-and-compact-cleanup-combination` — Streaming systems / Topic retention policies: A Kafka topic uses both delete and compact cleanup policies. What behavior should an operator expect?
- `de-kafka-tombstone-retention-snapshot-read` — Streaming systems / Compacted topics and tombstones: A consumer rebuilding a compacted-topic snapshot from offset zero misses a deletion. What retention setting should you investigate?
- `de-kafka-consumer-offset-processing-order` — Streaming systems / Offset commit and processing guarantees: A consumer needs at-least-once processing. When should it save its position relative to processing a batch?
- `de-kafka-offset-commit-coordinator-durability` — Streaming systems / Consumer group offset storage: A consumer offset commit fails during a broker issue. Which Kafka component and durability behavior should you inspect?
- `de-airflow-catchup-interval-backlog` — Orchestration / Catchup and scheduled intervals: After activating a DAG with an old start date, many historical runs appear. What Airflow behavior should you check?
- `de-postgres-read-committed-statement-snapshots` — SQL / Transaction isolation and snapshots: Two SELECT statements in one PostgreSQL transaction return different totals. What should you check first?
- `de-postgres-repeatable-read-concurrent-update-retry` — SQL / Repeatable Read conflict recovery: A PostgreSQL Repeatable Read transaction fails with “could not serialize access due to concurrent update.” How should the application recover?
- `de-postgres-deadlock-victim-retry` — SQL / Deadlock handling: Two PostgreSQL transactions lock the same rows in opposite orders and one aborts. How should you prevent or handle this?
- `de-postgres-logical-slot-consumer-replay` — Streaming systems / PostgreSQL logical decoding and replay: A PostgreSQL logical-decoding consumer restarts after a server crash and sees some changes again. Is the slot broken, and how should the consumer respond?
- `de-postgres-logical-slot-wal-retention` — Streaming systems / Logical replication slot operations: A PostgreSQL server is accumulating WAL while a logical-decoding consumer is offline. What would you inspect before changing the slot?
- `de-postgres-cte-folding-versus-materialization` — SQL / CTE optimization: A PostgreSQL query became slower after a common table expression was referenced twice. What would you inspect?

## Data Scientist

- `ds-separate-selection-and-final-test` — Machine learning evaluation / Model selection and held-out evaluation: Why should the final test set not guide repeated model or hyperparameter choices?
- `ds-brier-score-does-not-isolate-calibration` — Machine learning evaluation / Probability calibration: A classifier has a lower Brier loss than a baseline. Does that prove its probabilities are better calibrated?
- `ds-isotonic-calibration-small-sample-overfit` — Machine learning evaluation / Probability calibration: You have limited calibration data and are choosing between sigmoid and isotonic calibration. What trade-off matters?
- `ds-accuracy-hides-rare-class-failure` — Evaluation metrics and experiments / Rare classes and threshold decisions: A classifier reports 99% accuracy on a dataset where only 1% of cases are positive, but it misses every positive case. How would you evaluate it?
- `ds-align-regression-score-with-prediction-target` — Evaluation metrics and experiments / Scoring for statistical functionals: A forecasting team wants both the expected delivery time and a conservative 90th-percentile estimate. Should both outputs be evaluated with the same loss?
- `ds-compare-two-conversion-rates-with-uncertainty` — Experiment design and uncertainty / Confidence intervals for two proportions: An experiment reports conversion of 10.8% for a new design and 10.4% for the current design. What would you report before recommending a launch?
- `ds-interpret-macro-and-weighted-multiclass-scores` — Evaluation metrics and experiments / Macro and support-weighted averaging: A multiclass classifier has a much lower macro F1 than weighted F1. What might that difference reveal?
- `ds-investigate-sample-ratio-mismatch-before-reading-lift` — Experiment data quality / Sample ratio mismatch: A 50/50 experiment has a persistent 57/43 exposure split, and the treatment conversion rate looks higher. What should you do before interpreting the lift?
- `ds-select-imputation-for-prediction-objective` — Missing-data strategy / Imputation and missingness signals: For a prediction task with missing feature values, should you default to the most sophisticated imputation method?

## AI/ML Engineer

- `ml-seed-does-not-guarantee-reproducibility` — Training and reproducibility / Randomness and deterministic execution: A training run uses the same random seed but produces a different result. Does that prove the seed was ignored?
- `ml-resume-training-needs-optimizer-state` — Training and reproducibility / Checkpoints and resuming training: A training job resumes from model weights but its learning trajectory changes sharply. What checkpoint state might be missing?
- `ml-best-state-dict-reference-mutates` — Training and reproducibility / Checkpoint selection: A saved 'best validation' PyTorch model matches the final, overfit epoch. What could have gone wrong?
- `ml-diagnose-training-serving-skew-and-model-drift` — Production ML testing and monitoring / Training-serving skew and prediction drift: An online model's business quality has fallen while its offline test score remains stable. How would you distinguish training-serving skew from changing production data?
- `ml-block-candidate-model-with-slice-regression` — Production ML testing and monitoring / Candidate validation across data slices: A challenger model beats the current model on the aggregate test score but performs worse for one important region. What should the deployment gate consider?
- `ml-enforce-latency-as-a-deployment-gate` — Production ML testing and monitoring / Serving latency and release gates: A candidate model improves predictive quality but exceeds the serving latency budget in staging. How would you decide whether it is ready?
- `ml-gate-continuous-training-on-data-validation` — Production ML testing and monitoring / Training-data schema validation: A continuous-training pipeline starts failing after a source system adds a field and changes a feature's type. What should the pipeline do before training?
- `ml-use-artifact-lineage-to-debug-retrained-model-change` — Training experiment tracking and lineage / Reproducing and tracing model artifacts: A retrained model changes production predictions even though its validation score is similar. What run information would help you trace the difference?
- `ml-diagnose-amp-overflow-and-skipped-steps` — Numerical stability and mixed precision / Gradient scaling and overflow: A mixed-precision training run occasionally skips optimizer updates and its gradient scale drops below one. Does that alone mean GradScaler is broken?

## Generative AI Engineer

- `genai-rag-retrieval-is-not-proof-of-grounding` — Retrieval-augmented generation / Retrieval and answer evaluation: A RAG assistant retrieved relevant passages but gave an unsupported answer. What would you investigate?
- `genai-evaluate-retrieval-separately-from-generation` — Retrieval-augmented generation / Component-level evaluation: A RAG system gives an unsupported answer. How would you tell whether retrieval or generation caused the failure?
- `genai-faithfulness-does-not-prove-source-correctness` — Retrieval-augmented generation / Faithfulness metric boundaries: A RAG answer scores highly for faithfulness to its retrieved context. What important quality claim remains unproven?
- `genai-eval-summary-objective-dataset-metrics` — Generative AI evaluation / Defining an evaluation workflow: A team is replacing a transcript-summary prompt. How would you build an evaluation that can show whether the change is actually better?
- `genai-choose-evaluator-for-open-ended-outputs` — Generative AI evaluation / Choosing and calibrating evaluators: A team is judging open-ended support answers. When would you use a deterministic metric, a model grader, or human review?
- `genai-red-team-rag-against-instruction-injection` — Generative AI safety and robustness / Adversarial evaluation of untrusted content: A document-answering system sometimes follows instructions embedded in retrieved documents instead of answering the user. How would you test and reduce this risk?
- `genai-select-rag-or-fine-tuning-from-error-pattern` — Model optimization and adaptation / Choosing RAG versus fine-tuning: An assistant gives inconsistent answers about both frequently changing policy facts and a stable writing format. Would you use RAG or fine-tuning for both problems?
- `genai-schema-valid-output-is-not-safe-business-action` — Structured outputs and data contracts / Schema compliance versus semantic validity: A model returns schema-valid JSON for a CRM update. Is that enough to apply the update automatically?
- `genai-reduce-latency-by-measuring-the-bottleneck` — Latency and inference efficiency / Output length and request orchestration: An interactive assistant has high response latency, but its prompt is long and its final answers are also verbose. What would you investigate first?

## Agentic AI Engineer

- `agentic-workflow-before-autonomous-agent` — Agent architecture / Workflows versus agents: A team proposes an autonomous agent for a repeatable approval process. What would you ask before accepting that design?
- `agentic-sensitive-tool-action-human-approval` — Agent architecture / Human approval for sensitive tool actions: An agent can cancel accounts and issue refunds. What should happen before it executes a high-impact tool call?
- `agentic-route-specialized-prompts-for-clear-categories` — Agent architecture / Routing workflows: Support requests fall into billing, account-access, and technical categories. When would routing to specialized prompts help?
- `agentic-trace-grading-catches-wrong-tool-path` — Agent evaluation and observability / Trace-level grading: An agent eventually returns the right answer, but sometimes uses an unrelated tool or misses a required handoff first. What would you evaluate?
- `agentic-turn-debug-traces-into-repeatable-evals` — Agent evaluation and observability / From debugging traces to repeatable datasets: A trace reveals that a prompt change fixed one missed handoff. How would you check whether the fix works reliably and did not break other workflows?
- `agentic-place-guardrails-at-input-tool-and-output` — Agent architecture / Guardrail placement across workflow boundaries: A multi-step agent accepts user requests, calls tools, and returns a final answer. Where would you place automatic guardrails and human approval?
- `agentic-check-side-effects-before-retrying-timeout` — Agent errors and recovery / Safe recovery after an ambiguous timeout: An agent run times out while processing a request that can update an external account. What should the recovery logic do before retrying?
- `agentic-use-session-state-for-long-running-work` — Session state and turn control / Continuing and steering long-running work: A long-running agent task needs to preserve its work while a user provides follow-up guidance. How should the application manage the session?
- `agentic-model-tool-call-is-not-tool-execution` — Tool execution and application boundaries / Model requests versus application actions: An agent returns a tool call to issue a refund. Has the refund happened, and what should the application do next?

