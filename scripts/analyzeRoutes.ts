// scripts/analyzeRoutes.ts
// Fastify Route Analyzer Script
// Usage:
//   npx ts-node scripts/analyzeRoutes.ts               # Lokale Analyse
//   npx ts-node scripts/analyzeRoutes.ts --compare     # Vergleich mit Referenz
//   npx ts-node scripts/analyzeRoutes.ts --update      # Referenz aktualisieren
//   npx ts-node scripts/analyzeRoutes.ts --remote http://example.com  # Remote-Server prüfen

import path from "path";
import fs from "fs-extra";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import axios, { AxiosInstance } from "axios";
import chalk from "chalk";
import Table from "cli-table3";

// Debug-Funktion mit besserer Sichtbarkeit
const debug = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(chalk.gray(`[${timestamp}] DEBUG: ${message}`));
  if (data !== undefined) {
    if (typeof data === "object") {
      console.log(chalk.gray(JSON.stringify(data, null, 2)));
    } else {
      console.log(chalk.gray(data));
    }
  }
};

const error = (message: string, err?: any) => {
  console.error(chalk.red(`❌ ERROR: ${message}`));
  if (err) {
    console.error(chalk.red(err instanceof Error ? err.stack : err));
  }
};

// Types
interface RouteInfo {
  method: string;
  url: string;
  path: string;
  routePath: string;
  constraints?: any;
  meta?: any;
  prefix?: string;
  details?: string;
}

interface ComparisonResult {
  missing: RouteInfo[];
  extra: RouteInfo[];
  changed: RouteInfo[];
  summary: {
    totalLocal: number;
    totalReference: number;
    missingCount: number;
    extraCount: number;
    changedCount: number;
  };
}

const REFERENCE_PATH = path.resolve(
  __dirname,
  "../docs/api-routes-reference.json"
);
const REPORT_PATH = path.resolve(
  __dirname,
  "../docs/route-analysis-report.json"
);

class RouteAnalyzer {
  private axiosInstance: AxiosInstance;

  constructor() {
    debug("RouteAnalyzer Konstruktor aufgerufen");
    this.axiosInstance = axios.create({
      timeout: 10000,
      validateStatus: () => true,
    });
  }

  /**
   * Parse Fastify route output into structured data
   */
  private parseRouteLine(line: string): RouteInfo | null {
    const trimmed = line.trim();
    if (!trimmed) return null;

    // Match lines like: "get    /api/users"
    const match = trimmed.match(/^(\w+)\s+(\S+)$/);
    if (!match) return null;

    const [, method, url] = match;
    return {
      method: method.toUpperCase(),
      url,
      path: url,
      routePath: url,
      constraints: {},
    };
  }

  /**
   * Get all routes from a local Fastify instance
   */
  async getLocalRoutes(): Promise<RouteInfo[]> {
    debug("getLocalRoutes() aufgerufen");
    let fastify: any = null;

    try {
      debug("Versuche ../backend/server zu importieren");

      // Versuche verschiedene Pfade
      const possiblePaths = [
        "../backend/server",
        path.resolve(__dirname, "../backend/server"),
        "./backend/server",
        path.resolve(process.cwd(), "backend/server"),
      ];

      let imported: any = null;

      for (const importPath of possiblePaths) {
        try {
          debug(`Versuche Import von: ${importPath}`);
          imported = await import(importPath);
          if (imported && imported.buildServer) {
            debug(`Erfolgreich importiert von: ${importPath}`);
            break;
          }
        } catch (e) {
          debug(
            `Import fehlgeschlagen für ${importPath}:`,
            typeof e === "object" && e !== null && "message" in e
              ? (e as any).message
              : e
          );
          continue;
        }
      }

      if (!imported || !imported.buildServer) {
        error("buildServer konnte nicht importiert werden!");

        // Alternative: Direkt Fastify erstellen
        debug("Versuche alternative Methode: Direkte Fastify-Erstellung");
        try {
          const Fastify = (await import("fastify")).default;
          fastify = Fastify({ logger: false });

          // Füge Test-Routen hinzu um zu sehen ob es funktioniert
          fastify.get("/test-analyzer", async () => ({ status: "ok" }));
          fastify.get("/api/test", async () => ({ test: "route" }));

          await fastify.ready();
          debug("Alternative Fastify-Instanz erstellt mit Test-Routen");
        } catch (e) {
          error("Auch alternative Methode fehlgeschlagen", e);
          throw new Error("Konnte keine Fastify-Instanz erstellen");
        }
      } else {
        debug("buildServer gefunden, erstelle Instanz");
        const { buildServer } = imported;
        fastify = await buildServer();

        if (!fastify) {
          error("buildServer() hat kein Fastify-Objekt geliefert!");
          throw new Error("Failed to build Fastify server instance.");
        }

        debug("Fastify-Instanz gebaut, rufe ready() auf");
        await fastify.ready();
      }

      // Use the internal route structure for more detailed information
      const routes: RouteInfo[] = [];

      // Method 1: Try to use fastify.routes
      if (fastify.routes) {
        debug("Fastify-Objekt hat .routes, extrahiere daraus");
        const fastifyRoutes = fastify.routes as any[];
        fastifyRoutes.forEach((route: any) => {
          routes.push({
            method: route.method?.toUpperCase() || "GET",
            url: route.url || route.path || "/",
            path: route.url || route.path || "/",
            routePath: route.url || route.path || "/",
            constraints: route.constraints,
            meta: route.meta,
          });
        });
        debug(`Found ${routes.length} routes via fastify.routes`);
      }

      // Method 2: Try printRoutes if no routes found
      if (routes.length === 0 && typeof fastify.printRoutes === "function") {
        debug("Nutze printRoutes() zur Extraktion der Routen");
        const routeOutput = fastify.printRoutes({ commonPrefix: false });
        debug("printRoutes-Ausgabe:", routeOutput);

        if (routeOutput && typeof routeOutput === "string") {
          routeOutput
            .split("\n")
            .map((line: string) => this.parseRouteLine(line))
            .filter(
              (route: RouteInfo | null): route is RouteInfo => route !== null
            )
            .forEach((route: RouteInfo) => routes.push(route));
        }
        debug(`Found ${routes.length} routes via printRoutes`);
      }

      // Method 3: Try to manually inspect the router
      if (routes.length === 0 && fastify._router) {
        debug("Versuche manuelle Extraktion aus _router");
        try {
          const stack = fastify._router?.stack || [];
          stack.forEach((layer: any) => {
            if (layer.route) {
              const methods = Object.keys(layer.route.methods || {});
              methods.forEach((method) => {
                routes.push({
                  method: method.toUpperCase(),
                  url: layer.route.path,
                  path: layer.route.path,
                  routePath: layer.route.path,
                });
              });
            }
          });
          debug(`Found ${routes.length} routes via _router inspection`);
        } catch (e) {
          debug(
            "Manuelle Extraktion fehlgeschlagen:",
            typeof e === "object" && e !== null && "message" in e
              ? (e as any).message
              : e
          );
        }
      }

      // Method 4: Add a debug endpoint and query it
      if (routes.length === 0) {
        debug("Füge Debug-Endpoint hinzu");
        fastify.get("/__analyzer_debug_routes", async () => {
          return {
            message: "Debug endpoint",
            availableRoutes: routes,
          };
        });

        routes.push({
          method: "GET",
          url: "/__analyzer_debug_routes",
          path: "/__analyzer_debug_routes",
          routePath: "/__analyzer_debug_routes",
        });

        debug("Hinzugefügte Debug-Route für Testing");
      }

      debug(
        `Insgesamt ${routes.length} Routen gefunden:`,
        routes.map((r) => `${r.method} ${r.url}`)
      );

      if (fastify) {
        await fastify.close();
        debug("Fastify-Instanz geschlossen");
      }

      if (routes.length === 0) {
        console.warn(chalk.yellow("⚠️  WARNUNG: Keine Routen gefunden!"));
        console.warn(chalk.yellow("Mögliche Ursachen:"));
        console.warn(chalk.yellow("1. Server hat keine definierten Routen"));
        console.warn(chalk.yellow("2. Server-Konstruktion fehlgeschlagen"));
        console.warn(chalk.yellow("3. Falscher Pfad zum Server-Modul"));
      }

      return routes;
    } catch (error) {
      console.error(chalk.red("❌ Fehler beim Abrufen der lokalen Routen:"));
      if (error instanceof Error) {
        console.error(chalk.red(error.message));
        console.error(chalk.red(error.stack));
      }
      // Rückgabe von leeren Routen statt Fehler werfen
      return [];
    }
  }

  /**
   * Get routes from a remote server
   */
  async getRemoteRoutes(remoteUrl: string): Promise<RouteInfo[]> {
    try {
      // Try to fetch from a debug endpoint first
      const debugEndpoints = [
        "/api/debug/routes",
        "/debug/routes",
        "/routes",
        "/api/routes",
        "/_routes",
      ];

      for (const endpoint of debugEndpoints) {
        try {
          debug(`Versuche Endpoint: ${remoteUrl}${endpoint}`);
          const response = await this.axiosInstance.get(
            `${remoteUrl}${endpoint}`
          );
          debug(`Response Status: ${response.status}`);

          if (response.status === 200) {
            if (Array.isArray(response.data)) {
              const routes = response.data.map((route: any) => ({
                method: route.method?.toUpperCase() || "GET",
                url: route.path || route.url,
                path: route.path || route.url,
                routePath: route.path || route.url,
                constraints: route.constraints,
                meta: route.meta,
              }));
              debug(`Found ${routes.length} routes via debug endpoint`);
              return routes;
            } else if (response.data && typeof response.data === "object") {
              // Versuche, Routen aus verschiedenen Formaten zu extrahieren
              const routes: RouteInfo[] = [];

              // Format: { routes: [...] }
              if (Array.isArray(response.data.routes)) {
                response.data.routes.forEach((route: any) => {
                  routes.push({
                    method: route.method?.toUpperCase() || "GET",
                    url: route.path || route.url,
                    path: route.path || route.url,
                    routePath: route.path || route.url,
                  });
                });
              }

              // Format: { endpoints: [...] }
              if (Array.isArray(response.data.endpoints)) {
                response.data.endpoints.forEach((endpoint: any) => {
                  routes.push({
                    method: endpoint.method?.toUpperCase() || "GET",
                    url: endpoint.path || endpoint.url,
                    path: endpoint.path || endpoint.url,
                    routePath: endpoint.path || endpoint.url,
                  });
                });
              }

              if (routes.length > 0) {
                debug(`Found ${routes.length} routes via parsed response`);
                return routes;
              }
            }
          }
        } catch (_e) {
          // Continue to next endpoint
          debug(
            `Endpoint ${endpoint} failed:`,
            typeof _e === "object" && _e !== null && "message" in _e
              ? (_e as any).message
              : _e
          );
        }
      }

      // If no debug endpoint, try to analyze common paths
      console.warn(
        chalk.yellow("No debug endpoint found, trying common routes...")
      );
      return await this.discoverRoutes(remoteUrl);
    } catch (error) {
      console.error(chalk.red("Error getting remote routes:"), error);
      return [];
    }
  }

  /**
   * Attempt to discover routes by trying common patterns
   */
  private async discoverRoutes(baseUrl: string): Promise<RouteInfo[]> {
    const commonRoutes = [
      "/api/users",
      "/api/auth",
      "/api/health",
      "/api/status",
      "/",
      "/health",
      "/status",
    ];

    const methods = ["GET", "POST", "PUT", "DELETE"];
    const discovered: RouteInfo[] = [];

    for (const route of commonRoutes) {
      for (const method of methods) {
        try {
          debug(`Testing ${method} ${baseUrl}${route}`);
          const response = await this.axiosInstance.request({
            method,
            url: `${baseUrl}${route}`,
            headers: {
              Accept: "application/json",
              "User-Agent": "RouteAnalyzer/1.0",
            },
          });

          // If we get a response that's not 404/405, assume route exists
          if (response.status !== 404 && response.status !== 405) {
            discovered.push({
              method,
              url: route,
              path: route,
              routePath: route,
              meta: { statusCode: response.status },
            });
            debug(
              `Found route: ${method} ${route} (Status: ${response.status})`
            );
          }
        } catch (_error) {
          // Ignore errors during discovery
        }
      }
    }

    debug(`Discovered ${discovered.length} routes`);
    return discovered;
  }

  /**
   * Load reference routes from file
   */
  async loadReferenceRoutes(): Promise<RouteInfo[]> {
    try {
      debug(`Prüfe Referenz-Datei: ${REFERENCE_PATH}`);

      if (await fs.pathExists(REFERENCE_PATH)) {
        debug("Referenz-Datei existiert, lade Daten");
        const data = await fs.readJson(REFERENCE_PATH);
        debug(
          `Daten geladen: ${Array.isArray(data) ? data.length : "invalid"} Einträge`
        );

        if (Array.isArray(data)) {
          debug(`Lade ${data.length} Referenz-Routen`);
          return data;
        } else {
          console.warn(
            chalk.yellow("Referenz-Datei enthält kein Array, zurück zu []")
          );
          return [];
        }
      } else {
        debug("Referenz-Datei existiert NICHT");
        return [];
      }
    } catch (error) {
      console.warn(chalk.yellow(`Could not load reference routes: ${error}`));
      return [];
    }
  }

  /**
   * Save routes as reference
   */
  async saveReferenceRoutes(routes: RouteInfo[]): Promise<void> {
    try {
      debug(`Speichere ${routes.length} Routen in ${REFERENCE_PATH}`);

      // Erstelle docs Verzeichnis falls es nicht existiert
      const docsDir = path.dirname(REFERENCE_PATH);
      await fs.ensureDir(docsDir);
      debug(`Docs Verzeichnis gesichert: ${docsDir}`);

      // Speichere die Routen
      await fs.writeJson(REFERENCE_PATH, routes, { spaces: 2 });
      console.log(chalk.green(`✓ Reference routes saved to ${REFERENCE_PATH}`));
      debug(`Erfolgreich gespeichert: ${routes.length} Routen`);

      // Prüfe ob Datei existiert und lesbar ist
      const fileExists = await fs.pathExists(REFERENCE_PATH);
      if (fileExists) {
        const stats = await fs.stat(REFERENCE_PATH);
        debug(`Datei erstellt: ${stats.size} Bytes`);
      } else {
        console.error(chalk.red("❌ Datei wurde nicht erstellt!"));
      }
    } catch (error) {
      console.error(chalk.red("❌ Error saving reference routes:"), error);
      // Versuche alternativen Speicherort
      const altPath = path.resolve(__dirname, "api-routes-reference.json");
      console.warn(chalk.yellow(`Versuche alternativen Pfad: ${altPath}`));
      try {
        await fs.writeJson(altPath, routes, { spaces: 2 });
        console.log(chalk.green(`✓ Backup reference saved to ${altPath}`));
      } catch (backupError) {
        console.error(chalk.red("Auch Backup fehlgeschlagen:"), backupError);
      }
    }
  }

  /**
   * Compare two sets of routes
   */
  compareRoutes(
    localRoutes: RouteInfo[],
    referenceRoutes: RouteInfo[]
  ): ComparisonResult {
    debug(
      `Vergleiche ${localRoutes.length} lokale mit ${referenceRoutes.length} Referenz-Routen`
    );

    // Normalize routes for comparison
    const normalizeRoute = (route: RouteInfo) =>
      `${route.method}:${route.url}`.toLowerCase();

    const localMap = new Map<string, RouteInfo>();
    const referenceMap = new Map<string, RouteInfo>();

    localRoutes.forEach((route) => {
      const key = normalizeRoute(route);
      localMap.set(key, route);
    });

    referenceRoutes.forEach((route) => {
      const key = normalizeRoute(route);
      referenceMap.set(key, route);
    });

    const missing: RouteInfo[] = [];
    const extra: RouteInfo[] = [];
    const changed: RouteInfo[] = [];

    // Find missing routes (in reference but not in local)
    referenceMap.forEach((refRoute, key) => {
      if (!localMap.has(key)) {
        missing.push(refRoute);
        debug(`Missing route: ${refRoute.method} ${refRoute.url}`);
      } else {
        const localRoute = localMap.get(key)!;
        // Compare additional properties if needed
        if (
          JSON.stringify(refRoute.constraints) !==
          JSON.stringify(localRoute.constraints)
        ) {
          changed.push({
            ...refRoute,
            details: `Constraints changed`,
          });
          debug(`Changed route: ${refRoute.method} ${refRoute.url}`);
        }
      }
    });

    // Find extra routes (in local but not in reference)
    localMap.forEach((localRoute, key) => {
      if (!referenceMap.has(key)) {
        extra.push(localRoute);
        debug(`Extra route: ${localRoute.method} ${localRoute.url}`);
      }
    });

    debug(
      `Vergleich abgeschlossen: ${missing.length} missing, ${extra.length} extra, ${changed.length} changed`
    );

    return {
      missing,
      extra,
      changed,
      summary: {
        totalLocal: localRoutes.length,
        totalReference: referenceRoutes.length,
        missingCount: missing.length,
        extraCount: extra.length,
        changedCount: changed.length,
      },
    };
  }

  /**
   * Print comparison results in a nice format
   */
  printComparison(result: ComparisonResult): void {
    const { summary, missing, extra, changed } = result;

    console.log(chalk.cyan("\n" + "=".repeat(60)));
    console.log(chalk.bold.cyan("🚀 ROUTE ANALYSIS REPORT"));
    console.log(chalk.cyan("=".repeat(60) + "\n"));

    // Summary table
    const summaryTable = new Table({
      head: [
        chalk.white("Local Routes"),
        chalk.white("Reference Routes"),
        chalk.white("Missing"),
        chalk.white("Extra"),
        chalk.white("Changed"),
      ],
      style: { head: ["cyan"] },
      colWidths: [20, 20, 12, 12, 12],
    });

    summaryTable.push([
      chalk.bold(summary.totalLocal.toString()),
      chalk.bold(summary.totalReference.toString()),
      summary.missingCount > 0
        ? chalk.red(summary.missingCount.toString())
        : chalk.green("0"),
      summary.extraCount > 0
        ? chalk.yellow(summary.extraCount.toString())
        : chalk.green("0"),
      summary.changedCount > 0
        ? chalk.blue(summary.changedCount.toString())
        : chalk.green("0"),
    ]);

    console.log(summaryTable.toString());

    // Detailed breakdown
    if (missing.length > 0) {
      console.log(
        chalk.red("\n❌ MISSING ROUTES (in reference but not local):")
      );
      missing.forEach((route) => {
        console.log(
          `  ${chalk.red("✗")} ${chalk.bold(route.method)} ${route.url}`
        );
      });
    }

    if (extra.length > 0) {
      console.log(
        chalk.yellow("\n⚠️  EXTRA ROUTES (in local but not in reference):")
      );
      extra.forEach((route) => {
        console.log(
          `  ${chalk.yellow("+")} ${chalk.bold(route.method)} ${route.url}`
        );
      });
    }

    if (changed.length > 0) {
      console.log(
        chalk.blue("\n🔀 CHANGED ROUTES (constraints or metadata changed):")
      );
      changed.forEach((route) => {
        console.log(
          `  ${chalk.blue("~")} ${chalk.bold(route.method)} ${route.url} - ${route.details}`
        );
      });
    }

    if (missing.length === 0 && extra.length === 0 && changed.length === 0) {
      console.log(chalk.green("\n✅ All routes match perfectly!"));
    }

    // Save detailed report
    this.saveReport(result);
  }

  /**
   * Save detailed report to file
   */
  private async saveReport(result: ComparisonResult): Promise<void> {
    try {
      debug(`Speichere Report nach ${REPORT_PATH}`);
      await fs.ensureDir(path.dirname(REPORT_PATH));
      await fs.writeJson(
        REPORT_PATH,
        {
          timestamp: new Date().toISOString(),
          ...result,
        },
        { spaces: 2 }
      );

      console.log(chalk.gray(`\n📄 Detailed report saved to: ${REPORT_PATH}`));
    } catch (error) {
      console.warn(chalk.yellow("Could not save report file:"), error);
    }
  }
}

// Main function
async function main() {
  console.log(chalk.blue("=".repeat(60)));
  console.log(chalk.bold.blue("🔄 Fastify Route Analyzer gestartet"));
  console.log(chalk.blue("=".repeat(60)));

  debug("main() wird aufgerufen");
  debug(`Aktuelles Arbeitsverzeichnis: ${process.cwd()}`);
  debug(`Script-Verzeichnis: ${__dirname}`);

  const argv = await yargs(hideBin(process.argv))
    .option("compare", {
      alias: "c",
      type: "boolean",
      description: "Compare local routes with reference",
    })
    .option("update", {
      alias: "u",
      type: "boolean",
      description: "Update reference routes with current local routes",
    })
    .option("remote", {
      alias: "r",
      type: "string",
      description: "Compare with remote server",
    })
    .option("html", {
      type: "boolean",
      description: "Generate HTML report",
    })
    .option("verbose", {
      alias: "v",
      type: "boolean",
      description: "Verbose output",
    })
    .option("debug", {
      alias: "d",
      type: "boolean",
      description: "Enable debug mode",
    })
    .help()
    .parse();

  debug("CLI-Argumente:", argv);

  // Warnung falls keine Argumente angegeben wurden
  if (!argv.compare && !argv.update && !argv.remote) {
    console.log(
      chalk.yellow(
        "\nℹ️  Kein Modus angegeben, verwende Standardmodus (Analyse + Vergleich)"
      )
    );
    console.log(chalk.yellow("   Verfügbare Optionen:"));
    console.log(chalk.yellow("   --update     : Aktualisiere Referenz-Routen"));
    console.log(
      chalk.yellow("   --compare    : Vergleiche mit Referenz (Standard)")
    );
    console.log(chalk.yellow("   --remote URL : Analysiere Remote-Server"));
    console.log(chalk.yellow("   --verbose    : Zeige detaillierte Ausgaben"));
    console.log(chalk.yellow(""));
  }

  const analyzer = new RouteAnalyzer();

  try {
    if (argv.update) {
      debug("--update Modus aktiviert");
      console.log(chalk.blue("\n📝 Updating reference routes..."));
      const localRoutes = await analyzer.getLocalRoutes();
      debug(`Erhaltene lokale Routen: ${localRoutes.length}`, localRoutes);

      if (localRoutes.length === 0) {
        console.warn(chalk.yellow("⚠️  Keine Routen gefunden!"));
        console.warn(
          chalk.yellow(
            "   Stellen Sie sicher, dass der Server korrekt geladen wird."
          )
        );
        console.warn(
          chalk.yellow("   Möglicherweise müssen Sie den Server-Pfad anpassen.")
        );
        process.exit(1);
      }

      await analyzer.saveReferenceRoutes(localRoutes);
      console.log(chalk.green("✅ Reference updated successfully"));
      return;
    }

    if (argv.remote) {
      debug("--remote Modus aktiviert, remote:", argv.remote);
      console.log(chalk.blue(`\n🌐 Analyzing remote server: ${argv.remote}`));
      const remoteRoutes = await analyzer.getRemoteRoutes(argv.remote);
      debug(`Erhaltene Remote-Routen: ${remoteRoutes.length}`, remoteRoutes);
      const referenceRoutes = await analyzer.loadReferenceRoutes();
      debug(
        `Geladene Referenz-Routen: ${referenceRoutes.length}`,
        referenceRoutes
      );

      if (referenceRoutes.length === 0) {
        console.warn(
          chalk.yellow(
            "⚠️  No reference routes found. Saving remote routes as reference."
          )
        );
        await analyzer.saveReferenceRoutes(remoteRoutes);
        return;
      }

      const result = analyzer.compareRoutes(remoteRoutes, referenceRoutes);
      debug("Vergleichsergebnis:", result);
      analyzer.printComparison(result);

      return;
    }

    // Default: compare local with reference
    debug("Standard-Modus: lokale Analyse");
    console.log(chalk.blue("\n🔍 Analyzing local routes..."));
    const localRoutes = await analyzer.getLocalRoutes();
    debug(`Erhaltene lokale Routen: ${localRoutes.length}`, localRoutes);

    if (localRoutes.length === 0) {
      console.error(chalk.red("❌ Keine lokalen Routen gefunden!"));
      console.error(chalk.red("   Das Script kann nicht fortfahren."));
      console.error(chalk.red("   Mögliche Lösungen:"));
      console.error(chalk.red("   1. Korrigieren Sie den Server-Pfad"));
      console.error(chalk.red("   2. Starten Sie mit --update zuerst"));
      console.error(chalk.red("   3. Prüfen Sie die Server-Konstruktion"));
      process.exit(1);
    }

    const referenceRoutes = await analyzer.loadReferenceRoutes();
    debug(
      `Geladene Referenz-Routen: ${referenceRoutes.length}`,
      referenceRoutes
    );

    if (referenceRoutes.length === 0) {
      console.warn(
        chalk.yellow(
          "⚠️  No reference routes found. Creating initial reference."
        )
      );
      await analyzer.saveReferenceRoutes(localRoutes);
      console.log(
        chalk.green("✅ Initial reference created. Run again to compare.")
      );
      return;
    }

    const result = analyzer.compareRoutes(localRoutes, referenceRoutes);
    debug("Vergleichsergebnis:", result);
    analyzer.printComparison(result);

    // Exit with appropriate code for CI/CD
    if (result.missing.length > 0) {
      console.log(chalk.red("\n❌ Build failed due to missing routes"));
      process.exit(1);
    } else {
      console.log(chalk.green("\n✅ All routes verified successfully!"));
    }
  } catch (error) {
    console.error(chalk.red("❌ Analysis failed:"));
    if (error instanceof Error) {
      console.error(chalk.red(error.message));
      if (argv.verbose || argv.debug) {
        console.error(chalk.red(error.stack));
      }
    } else {
      console.error(chalk.red(error));
    }
    process.exit(1);
  }
}

// Run main
main().catch((error) => {
  console.error(chalk.red("❌ Unhandled error in main:"), error);
  process.exit(1);
});

export { RouteAnalyzer };
