import fsp from 'fs/promises';
import fs from 'fs';
import path from 'path';
import lockfile from 'proper-lockfile';
import { ensureLogDirectoryExists } from '../middleware/splunkLogger';

// Manage read/write on dashboard file
export class DashboardPersistenceService {
    private readonly DASHBOARDS_FILE = path.join('/app/logs', 'dashboards.json');
    private dashboardsCache: { [key: string]: boolean } = {};

    constructor() {
        ensureLogDirectoryExists(this.DASHBOARDS_FILE);
        this.initialize();
    }

    // Asynchronous initialization
    private async initialize(): Promise<void> {
        await this.initializeDashboardFile();
    }

    // Create the file if it doesn't exist
    private async initializeDashboardFile(): Promise<void> {
        try {
            await fsp.access(this.DASHBOARDS_FILE);
        } catch {
            await this.withLock(async () => {
                await fsp.writeFile(this.DASHBOARDS_FILE, JSON.stringify({ dashboards: {} }, null, 2));
            });
        }
        await this.loadDashboardsCache();
    }

    // Utility to wrap an operation with a file lock
    private async withLock<T>(fn: () => Promise<T>, options?: lockfile.LockOptions): Promise<T> {
        const release = await lockfile.lock(this.DASHBOARDS_FILE, {
            retries: {
                retries: 5,
                minTimeout: 100,
                maxTimeout: 500
            },
            ...options
        });

        try {
            // Always refresh the cache before operating
            await this.loadDashboardsCache();
            return await fn();
        } finally {
            await release();
        }
    }

    // Load the dashboards file content into memory (used only within locked operations)
    private async loadDashboardsCache(): Promise<void> {
        try {
            const data = await fsp.readFile(this.DASHBOARDS_FILE, 'utf8');
            const jsonData = JSON.parse(data);

            // Merge the new data with existing cache (do not overwrite)
            this.dashboardsCache = {
                ...this.dashboardsCache,
                ...(jsonData.dashboards || {})
            };
        } catch (error) {
            console.error('Error loading dashboards file:', error);
            this.dashboardsCache = {};
        }
    }

    // Write updates to the dashboards file using lock and safe merging
    async writeDashboardsFile(updates: { [key: string]: boolean } = {}): Promise<void> {
        await this.withLock(async () => {
            try {
                // Load the most up-to-date file content
                const currentData = await this.loadCurrentFileData();

                // Merge existing data with updates
                const mergedData = {
                    dashboards: {
                        ...currentData.dashboards,
                        ...updates
                    }
                };

                // Update in-memory cache and write to file
                this.dashboardsCache = mergedData.dashboards;
                await fsp.writeFile(
                    this.DASHBOARDS_FILE,
                    JSON.stringify(mergedData, null, 2)
                );
            } catch (error) {
                console.error('Error writing dashboards file:', error);
                throw error;
            }
        }, {
            // Retry more aggressively on write conflicts
            retries: {
                retries: 10,
                minTimeout: 200,
                maxTimeout: 1000
            }
        });
    }

    // Load the full dashboards file from disk (should only be called inside a lock)
    private async loadCurrentFileData(): Promise<{ dashboards: { [key: string]: boolean } }> {
        try {
            const data = await fsp.readFile(this.DASHBOARDS_FILE, 'utf8');
            return JSON.parse(data);
        } catch {
            return { dashboards: {} };
        }
    }

    // Check whether a dashboard exists in memory
    async dashboardExists(dashboardName: string): Promise<boolean> {
        return !!this.dashboardsCache[dashboardName];
    }

    // Clean up old locks on startup (to avoid being blocked by leftover lock files)
    static async cleanupStaleLocks(): Promise<void> {
        try {
            await lockfile.unlock(path.resolve(__dirname, 'dashboards.json'));
        } catch (error) {
            // Ignore error if no lock exists
        }
    }
}