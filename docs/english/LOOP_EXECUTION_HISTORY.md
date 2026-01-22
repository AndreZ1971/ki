# Loop Execution History

## Overview

The **Loop Execution History** view displays all automatic cronjob executions of the Agentic Loops in a clear and organized interface.

## Access

1. Navigate to **Settings** → **Agentic Loops**
2. Click the **📜 Cronjob History** button

## Features

### Loop Selector (Cards at the top)

Each loop is displayed as a summary card containing:

- **Loop Name & Icon**: Loop identification
  - 🚨 Anomaly Detection
  - 📊 Product Performance
  - 💳 Payment Recovery
  - 📈 Analytics Insights

- **Success Rate (%)**: Percentage of successful runs (only shown if runs > 0)
- **Runs**: Total number of executions for this loop
- **Avg Duration**: Average execution time

**Note**: If a loop has never been executed, "–" appears instead of percentage and average values.

### Filter Options

Three filter buttons in the upper left:

- **All**: Shows all runs (default)
- **✅ Successful**: Only successful runs
- **❌ Failed**: Only failed runs

The table is updated automatically when filters change.

### Export Functions

Two export buttons in the upper right:

- **📥 JSON**: Downloads filtered run results as JSON file
  - Ideal for debugging, post-processing, or archiving
  - Contains complete metadata (timestamps, insights, recommendations)

- **📥 CSV**: Downloads filtered run results as CSV file
  - Ideal for reporting and Excel/Sheets import
  - Tabular format with columns: Timestamp, Status, Duration, Insights, Recommendations

### History Table

The table displays all runs for the selected loop with these columns:

| Column | Description |
|--------|------------|
| **Timestamp** | Date and time when the run started |
| **Status** | ✅ Success or ❌ Failed |
| **Duration** | How long the run took (ms/s/m) |
| **Insights** | Number of generated insights |
| **Recommendations** | Number of generated recommendations |

**On Errors**: An error message is displayed below the row.

### Summary Statistics (bottom)

After the table, a summary section shows:

- **Total**: Number of filtered runs
- **Success Rate**: Percentage of successful runs (overall)
- **Avg Duration**: Average execution time for all filtered runs
- **Total Insights**: Sum of all insights across all filtered runs

## Automatic Cronjobs

Agentic Loops run automatically on set schedules:

- **Anomaly Detection**: Daily at 09:00 AM
- **Product Performance**: Monday & Thursday at 10:00 AM
- **Payment Recovery**: Every 30 minutes
- **Analytics Insights**: Daily at 08:00 PM

The history displays all these automatic runs, not just manually started ones.

## Frequently Asked Questions

**Q: Why do I see only dashes "–" for some loops?**  
A: This means that loop has not been executed yet or no data is available.

**Q: How long are run histories stored?**  
A: Histories are stored in memory. Older entries may be lost on system restart. Use the export function to archive important data.

**Q: Can I export data for longer time periods?**  
A: The export shows the last 100 runs. For longer histories, we recommend regular manual exports.

**Q: Why does a loop have "Failed" status?**  
A: Click on the error row to see the detailed error message. Common reasons: API errors, incomplete data, network issues.

## Navigation

- **← Back**: Returns to Settings
- **📜 Cronjob History**: Refreshes this page (from the dashboard)

## Tips & Tricks

1. **Regular Exports**: Use the export function to archive important histories
2. **Use Filters**: Filter by success/failure to help with debugging
3. **Spot Trends**: Compare average values over time
4. **Error Analysis**: Export errors as JSON for detailed analysis
5. **Monitor Performance**: Track average duration to identify performance issues

## Data Structure

### JSON Export Format

```json
{
  "exportDate": "2026-01-22T10:30:00.000Z",
  "loopType": "anomaly-detection",
  "period": {
    "days": 30,
    "limit": 100
  },
  "stats": {
    "totalRuns": 42,
    "successRate": 0.95,
    "avgExecutionTime": 1250
  },
  "history": [
    {
      "timestamp": 1706951400000,
      "success": true,
      "executionTime": 1200,
      "insights": 3,
      "recommendations": 2
    }
  ]
}
```

### CSV Export Format

```
Run ID,Start Time,Duration (ms),Status,Iterations,Success Rate,Findings,Insights
1,2026-01-22T10:30:00Z,1200,success,5,100%,12,3
2,2026-01-22T11:00:00Z,1150,success,5,100%,10,2
```
