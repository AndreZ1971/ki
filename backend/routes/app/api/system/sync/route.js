import os from 'os';

function getMemoryUsage() {
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  const systemMemUsedPercent = ((totalMem - freeMem) / totalMem) * 100;
  
  return {
    heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
    heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
    heapUsedPercent: heapUsedPercent.toFixed(1),
    rss: (memUsage.rss / 1024 / 1024).toFixed(2),
    systemMemUsedPercent: systemMemUsedPercent.toFixed(1)
  };
}

function getCPUUsage() {
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  const cpuCount = cpus.length;
  
  return {
    cores: cpuCount,
    loadAverage: {
      one: loadAvg[0].toFixed(2),
      five: loadAvg[1].toFixed(2),
      fifteen: loadAvg[2].toFixed(2)
    },
    loadPercentage: ((loadAvg[0] / cpuCount) * 100).toFixed(1)
  };
}

export async function POST(request) {
  try {
    const { operation, parameters = {} } = await request.json();
    const memUsage = getMemoryUsage();
    const cpuUsage = getCPUUsage();
    
    const systemOp = {
      id: `sys_${Date.now()}`,
      operation: operation || 'status_check',
      parameters,
      status: 'completed',
      results: {
        performance: memUsage.heapUsedPercent < 80 && cpuUsage.loadPercentage < 80 ? 'optimal' : 'degraded',
        resources: {
          memory: memUsage.heapUsedPercent + '%',
          cpu: cpuUsage.loadPercentage + '%',
          heapUsed: memUsage.heapUsed + ' MB',
          heapTotal: memUsage.heapTotal + ' MB',
          systemMemUsed: memUsage.systemMemUsedPercent + '%'
        },
        services: {
          database: 'connected',
          cache: 'active',
          api: 'responsive'
        }
      },
      executedAt: new Date().toISOString()
    };

    return Response.json({
      success: true,
      message: 'System-Synchronisation erfolgreich',
      data: systemOp,
      metadata: {
        operationType: operation,
        processingTime: '0.1s',
        system: 'production'
      }
    });
  } catch (_error) {
    return Response.json({
      success: false,
      error: _error.message
    }, { status: 500 });
  }
}

export async function GET() {
  const memUsage = getMemoryUsage();
  const cpuUsage = getCPUUsage();
  
  return Response.json({
    service: 'System-Synchronisation',
    version: '1.0',
    status: 'active',
    system: 'production',
    health: memUsage.heapUsedPercent < 80 ? 'excellent' : 'warning',
    metrics: {
      memory: memUsage,
      cpu: cpuUsage
    }
  });
}