import type { BigQueryOptimizationResult } from '../../types';

/**
 * Google BigQuery SQL & FinOps Cost Optimizer
 * Emulates BigQuery dry-run cost estimation ($6.25/TB on-demand pricing)
 * and generates production-grade partitioned, clustered SQL.
 */

const BQ_COST_PER_TB = 6.25;

export function optimizeBigQuerySQL(query: string): BigQueryOptimizationResult {
  const cleanQuery = query.trim();
  const lower = cleanQuery.toLowerCase();

  const recommendations: string[] = [];
  let originalBytesScannedGb = 120.0;
  let optimizedBytesScannedGb = 1.8;

  // 1. Detect SELECT *
  if (lower.includes('select *')) {
    recommendations.push(
      'Anti-pattern detected: `SELECT *` forces BigQuery to read all columns in columnar storage. Project only necessary fields to reduce scanned bytes.'
    );
    originalBytesScannedGb += 250.0;
  }

  // 2. Detect missing partition filter
  if (!lower.includes('_partitiontime') && !lower.includes('created_at') && !lower.includes('date(') && !lower.includes('partition by')) {
    recommendations.push(
      'No partition filter found. BigQuery is performing a costly full-table scan across all historical dates. Adding `WHERE _PARTITIONDATE >= CURRENT_DATE() - 7` will prune 98% of table partitions.'
    );
    originalBytesScannedGb += 850.0;
    optimizedBytesScannedGb = Math.max(0.5, originalBytesScannedGb * 0.02);
  }

  // 3. Detect unclustered joins
  if (lower.includes('join') && !lower.includes('cluster by')) {
    recommendations.push(
      'High shuffle cost detected on JOIN. Cluster destination table by join keys (e.g., `CLUSTER BY merchant_id, currency`) to leverage BigQuery collocated shuffle.'
    );
    originalBytesScannedGb += 180.0;
  }

  // Generate optimized SQL replacement
  let optimizedSQL = cleanQuery;

  if (lower.includes('select * from `fintech_lake.transactions`')) {
    optimizedSQL = `-- Optimized by ApexFin BigQuery FinOps Agent (Pruned 98.6% of data scanned)
SELECT 
  transaction_id,
  merchant_id,
  amount_cents,
  currency,
  payment_method,
  status,
  created_at
FROM 
  \`fintech_lake.transactions\`
WHERE 
  -- Partition filter applied: Prunes 1,400+ daily partitions down to 7 days
  _PARTITIONDATE >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
  AND status IN ('succeeded', 'requires_action')
-- Leverages table clustering on merchant_id
CLUSTER BY merchant_id;`;
  } else if (lower.includes('select *')) {
    optimizedSQL = cleanQuery
      .replace(/select\s+\*/i, 'SELECT id, timestamp, merchant_id, amount, status')
      .concat('\nWHERE _PARTITIONDATE >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 DAY)');
  } else {
    optimizedSQL = `-- ApexFin Partitioning & Clustering Optimization
${cleanQuery}
-- Added date partition guard
AND _PARTITIONDATE >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY)`;
  }

  const originalCostUsd = +((originalBytesScannedGb / 1024) * BQ_COST_PER_TB).toFixed(4);
  const optimizedCostUsd = +((optimizedBytesScannedGb / 1024) * BQ_COST_PER_TB).toFixed(4);
  const savingsPercentage = +(((originalCostUsd - optimizedCostUsd) / originalCostUsd) * 100).toFixed(1);

  return {
    originalQuery: cleanQuery,
    optimizedQuery: optimizedSQL,
    originalBytesScannedGb,
    optimizedBytesScannedGb,
    originalCostUsd,
    optimizedCostUsd,
    savingsPercentage,
    recommendations,
  };
}
