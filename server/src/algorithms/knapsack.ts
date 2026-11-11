/**
 * 0/1 Knapsack Algorithm using Dynamic Programming
 * 
 * Resource Allocation Mapping:
 * - Items: Incoming microservice tasks / workloads
 * - Weight (w_i): Required compute resources (CPU / Memory allocation units)
 * - Value (v_i): Task priority / business criticality score (1–100)
 * - Knapsack Capacity (W): Total available cluster/server capacity envelope
 * 
 * Time Complexity: O(nW)
 * Space Complexity: O(nW) for full table inspection & subset backtracking
 */

export interface KnapsackTask {
  id: string;
  name: string;
  weight: number; // e.g. CPU/Memory units required (1 to 50)
  value: number;  // Priority / Quality of Service score (1 to 100)
  serviceType: 'AUTH' | 'PAYMENT' | 'STREAMING' | 'DATABASE' | 'REPORTING' | 'INGESTION';
}

export interface KnapsackStep {
  itemIndex: number;
  item: KnapsackTask;
  capacity: number;
  decision: 'EXCLUDE_WEIGHT' | 'EXCLUDE_BETTER' | 'INCLUDE';
  formula: string;
  optimalValue: number;
}

export interface KnapsackResult {
  capacity: number;
  tasks: KnapsackTask[];
  dpTable: number[][]; // (n + 1) rows x (capacity + 1) cols
  selectedTasks: KnapsackTask[];
  rejectedTasks: KnapsackTask[];
  totalWeight: number;
  totalValue: number;
  capacityUtilizationPct: number;
  stepTrace: KnapsackStep[];
  timeComplexity: string;
  spaceComplexity: string;
}

/**
 * Pre-configured realistic incoming task pool for cloud scheduling
 */
export const DEFAULT_TASKS: KnapsackTask[] = [
  { id: 'TASK-1', name: 'User Authentication Token Check', weight: 4, value: 35, serviceType: 'AUTH' },
  { id: 'TASK-2', name: 'Payment Gateway Transaction', weight: 6, value: 65, serviceType: 'PAYMENT' },
  { id: 'TASK-3', name: 'Video Transcode Stream Chunk', weight: 12, value: 70, serviceType: 'STREAMING' },
  { id: 'TASK-4', name: 'Database Read Replica Sync', weight: 8, value: 55, serviceType: 'DATABASE' },
  { id: 'TASK-5', name: 'Real-time Telemetry Ingestion', weight: 5, value: 40, serviceType: 'INGESTION' },
  { id: 'TASK-6', name: 'Batch Audit Report Generation', weight: 15, value: 45, serviceType: 'REPORTING' },
  { id: 'TASK-7', name: 'Fraud Detection Anomaly Scan', weight: 7, value: 60, serviceType: 'PAYMENT' },
  { id: 'TASK-8', name: 'Session State Snapshot Persistence', weight: 3, value: 30, serviceType: 'DATABASE' },
];

/**
 * Execute 0/1 Knapsack Dynamic Programming
 */
export function solveKnapsack(
  tasks: KnapsackTask[],
  capacity: number
): KnapsackResult {
  const n = tasks.length;
  const W = Math.max(0, Math.floor(capacity));

  // Initialize DP table of dimensions (n + 1) x (W + 1) with zeros
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));
  const stepTrace: KnapsackStep[] = [];

  // Populate DP matrix using the recurrence relation:
  // dp[i][w] = max(dp[i - 1][w], dp[i - 1][w - w_i] + v_i) when w_i <= w
  for (let i = 1; i <= n; i++) {
    const task = tasks[i - 1];
    const wi = task.weight;
    const vi = task.value;

    for (let w = 0; w <= W; w++) {
      if (wi > w) {
        dp[i][w] = dp[i - 1][w];
        if (w === W) {
          stepTrace.push({
            itemIndex: i,
            item: task,
            capacity: w,
            decision: 'EXCLUDE_WEIGHT',
            formula: `Task weight (${wi}) > current capacity (${w}). Inherited dp[${i - 1}][${w}] = ${dp[i - 1][w]}`,
            optimalValue: dp[i][w],
          });
        }
      } else {
        const withoutItem = dp[i - 1][w];
        const withItem = dp[i - 1][w - wi] + vi;

        if (withItem > withoutItem) {
          dp[i][w] = withItem;
          if (w === W) {
            stepTrace.push({
              itemIndex: i,
              item: task,
              capacity: w,
              decision: 'INCLUDE',
              formula: `Include: dp[${i - 1}][${w - wi}] + ${vi} = ${withItem} > Exclude: ${withoutItem}`,
              optimalValue: dp[i][w],
            });
          }
        } else {
          dp[i][w] = withoutItem;
          if (w === W) {
            stepTrace.push({
              itemIndex: i,
              item: task,
              capacity: w,
              decision: 'EXCLUDE_BETTER',
              formula: `Exclude: ${withoutItem} >= Include (${withItem}). Kept dp[${i - 1}][${w}] = ${withoutItem}`,
              optimalValue: dp[i][w],
            });
          }
        }
      }
    }
  }

  // Backtrack to find the optimal subset of tasks
  const selectedTasks: KnapsackTask[] = [];
  const rejectedTasks: KnapsackTask[] = [];
  let remainingCap = W;

  for (let i = n; i > 0; i--) {
    // If value came from dp[i - 1][remainingCap], the item was NOT included
    if (dp[i][remainingCap] !== dp[i - 1][remainingCap]) {
      selectedTasks.unshift(tasks[i - 1]);
      remainingCap -= tasks[i - 1].weight;
    } else {
      rejectedTasks.unshift(tasks[i - 1]);
    }
  }

  const totalWeight = selectedTasks.reduce((sum, t) => sum + t.weight, 0);
  const totalValue = selectedTasks.reduce((sum, t) => sum + t.value, 0);
  const capacityUtilizationPct = W > 0 ? Math.round((totalWeight / W) * 1000) / 10 : 0;

  return {
    capacity: W,
    tasks,
    dpTable: dp,
    selectedTasks,
    rejectedTasks,
    totalWeight,
    totalValue,
    capacityUtilizationPct,
    stepTrace,
    timeComplexity: `O(n · W) = O(${n} × ${W}) = ${n * W} operations`,
    spaceComplexity: `O(n · W) = ${n + 1} × ${W + 1} table cells`,
  };
}
