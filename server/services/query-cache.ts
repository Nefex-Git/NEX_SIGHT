import Redis from 'ioredis';
import crypto from 'crypto';

interface CacheConfig {
  defaultTTL: number; // seconds
  enabled: boolean;
}

interface CacheMetadata {
  query: string;
  timestamp: number;
  dataSourceIds: string[];
  ttl: number;
}

export class QueryCacheService {
  private redis: Redis | null = null;
  private config: CacheConfig;
  private static instance: QueryCacheService;

  private constructor() {
    this.config = {
      defaultTTL: parseInt(process.env.QUERY_CACHE_TTL || '300'), // 5 minutes default
      enabled: process.env.QUERY_CACHE_ENABLED !== 'false'
    };

    this.initializeRedis();
  }

  static getInstance(): QueryCacheService {
    if (!QueryCacheService.instance) {
      QueryCacheService.instance = new QueryCacheService();
    }
    return QueryCacheService.instance;
  }

  private initializeRedis() {
    try {
      // Try to connect to Redis if available (for production)
      const redisUrl = process.env.REDIS_URL || process.env.REDIS_PRIVATE_URL;
      
      if (redisUrl && this.config.enabled) {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          retryStrategy: (times) => {
            if (times > 3) {
              console.log('Redis connection failed, falling back to in-memory cache');
              this.redis = null;
              return null;
            }
            return Math.min(times * 100, 3000);
          }
        });

        this.redis.on('ready', () => {
          console.log('✅ Redis cache connected successfully');
        });

        this.redis.on('error', (err) => {
          console.log('Redis connection error, using in-memory cache:', err.message);
          this.redis = null;
        });
      } else {
        console.log('📦 Using in-memory cache (Redis not configured)');
        this.redis = null;
      }
    } catch (error) {
      console.error('Failed to initialize Redis, using in-memory cache:', error);
      this.redis = null;
    }
  }

  /**
   * Generate cache key from query and parameters
   */
  private generateCacheKey(
    query: string,
    params: Record<string, any>,
    dataSourceIds: string[]
  ): string {
    const cacheInput = JSON.stringify({
      query: query.trim(),
      params,
      dataSourceIds: dataSourceIds.sort()
    });
    
    const hash = crypto.createHash('sha256').update(cacheInput).digest('hex');
    return `query:${hash}`;
  }

  /**
   * Get cached query result
   */
  async get(
    query: string,
    params: Record<string, any> = {},
    dataSourceIds: string[] = []
  ): Promise<any[] | null> {
    if (!this.config.enabled) return null;

    const cacheKey = this.generateCacheKey(query, params, dataSourceIds);

    try {
      if (this.redis) {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          const data = JSON.parse(cached);
          console.log(`🎯 Cache HIT for key: ${cacheKey.substring(0, 16)}...`);
          return data.result;
        }
      } else {
        // Fallback to in-memory cache (simple Map-based)
        const cached = this.inMemoryCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
          console.log(`🎯 Memory cache HIT for key: ${cacheKey.substring(0, 16)}...`);
          return cached.result;
        }
      }

      console.log(`❌ Cache MISS for key: ${cacheKey.substring(0, 16)}...`);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cache entry with TTL
   */
  async set(
    query: string,
    result: any[],
    params: Record<string, any> = {},
    dataSourceIds: string[] = [],
    ttl?: number
  ): Promise<void> {
    if (!this.config.enabled) return;

    const cacheKey = this.generateCacheKey(query, params, dataSourceIds);
    const cacheTTL = ttl || this.config.defaultTTL;

    const metadata: CacheMetadata = {
      query: query.trim(),
      timestamp: Date.now(),
      dataSourceIds,
      ttl: cacheTTL
    };

    const cacheValue = {
      result,
      metadata
    };

    try {
      if (this.redis) {
        await this.redis.setex(cacheKey, cacheTTL, JSON.stringify(cacheValue));
        console.log(`💾 Cached result for ${cacheTTL}s: ${cacheKey.substring(0, 16)}...`);
      } else {
        // Fallback to in-memory cache
        this.inMemoryCache.set(cacheKey, {
          result,
          timestamp: Date.now(),
          ttl: cacheTTL
        });
        console.log(`💾 Memory cached result for ${cacheTTL}s: ${cacheKey.substring(0, 16)}...`);
        
        // Clean up old entries periodically
        this.cleanupInMemoryCache();
      }

      // Store reverse index: dataSourceId -> cache keys
      for (const dsId of dataSourceIds) {
        await this.addToDataSourceIndex(dsId, cacheKey);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Invalidate cache for specific data sources
   * Called when data is updated/deleted
   */
  async invalidateDataSource(dataSourceId: string): Promise<void> {
    try {
      if (this.redis) {
        const indexKey = `ds:${dataSourceId}:keys`;
        const cacheKeys = await this.redis.smembers(indexKey);
        
        if (cacheKeys.length > 0) {
          await Promise.all(cacheKeys.map(key => this.redis!.del(key)));
          await this.redis.del(indexKey);
          console.log(`🗑️  Invalidated ${cacheKeys.length} cache entries for data source ${dataSourceId}`);
        }
      } else {
        // In-memory: remove all entries for this data source
        for (const [key, value] of this.inMemoryCache.entries()) {
          // Simple check - in production would use proper index
          this.inMemoryCache.delete(key);
        }
        console.log(`🗑️  Cleared memory cache for data source ${dataSourceId}`);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      if (this.redis) {
        const keys = await this.redis.keys('query:*');
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
        const dsKeys = await this.redis.keys('ds:*');
        if (dsKeys.length > 0) {
          await this.redis.del(...dsKeys);
        }
        console.log('🗑️  Cleared all Redis cache');
      } else {
        this.inMemoryCache.clear();
        console.log('🗑️  Cleared all memory cache');
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    enabled: boolean;
    type: 'redis' | 'memory';
    entries: number;
    memoryUsage?: string;
  }> {
    try {
      if (this.redis) {
        const keys = await this.redis.keys('query:*');
        const info = await this.redis.info('memory');
        const memoryMatch = info.match(/used_memory_human:(.+)/);
        
        return {
          enabled: this.config.enabled,
          type: 'redis',
          entries: keys.length,
          memoryUsage: memoryMatch ? memoryMatch[1].trim() : 'unknown'
        };
      } else {
        return {
          enabled: this.config.enabled,
          type: 'memory',
          entries: this.inMemoryCache.size
        };
      }
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        enabled: this.config.enabled,
        type: this.redis ? 'redis' : 'memory',
        entries: 0
      };
    }
  }

  // Helper methods
  private async addToDataSourceIndex(dataSourceId: string, cacheKey: string): Promise<void> {
    if (!this.redis) return;
    
    try {
      const indexKey = `ds:${dataSourceId}:keys`;
      await this.redis.sadd(indexKey, cacheKey);
      // Set expiry on index too
      await this.redis.expire(indexKey, this.config.defaultTTL);
    } catch (error) {
      console.error('Error adding to data source index:', error);
    }
  }

  // In-memory cache fallback
  private inMemoryCache = new Map<string, {
    result: any[];
    timestamp: number;
    ttl: number;
  }>();

  private cleanupInMemoryCache() {
    const now = Date.now();
    for (const [key, value] of this.inMemoryCache.entries()) {
      if (now - value.timestamp > value.ttl * 1000) {
        this.inMemoryCache.delete(key);
      }
    }

    // Limit cache size
    if (this.inMemoryCache.size > 100) {
      const oldestKeys = Array.from(this.inMemoryCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 20)
        .map(([key]) => key);
      
      oldestKeys.forEach(key => this.inMemoryCache.delete(key));
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }
}

// Export singleton instance
export const queryCache = QueryCacheService.getInstance();
