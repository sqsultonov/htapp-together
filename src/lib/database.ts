// Unified database layer - works with SQLite (Electron offline)

// Check if running in Electron - check at runtime
const getIsElectron = () => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).electronAPI?.isElectron;
};

// Helper to parse JSON fields from SQLite
function parseJsonFields(row: any, fields: string[]): any {
  if (!row) return row;
  const parsed = { ...row };
  for (const field of fields) {
    if (parsed[field] && typeof parsed[field] === 'string') {
      try {
        parsed[field] = JSON.parse(parsed[field]);
      } catch {
        // Keep as string if not valid JSON
      }
    }
  }
  return parsed;
}

// Helper to stringify JSON fields for SQLite
function stringifyJsonFields(data: any, fields: string[]): any {
  const stringified = { ...data };
  for (const field of fields) {
    if (stringified[field] && typeof stringified[field] === 'object') {
      stringified[field] = JSON.stringify(stringified[field]);
    }
  }
  return stringified;
}

// Database interface matching Supabase-like API
interface QueryResult<T> {
  data: T | null;
  error: string | null;
}

interface QueryBuilder<T> {
  select: (columns?: string) => QueryBuilder<T>;
  insert: (data: Partial<T> | Partial<T>[]) => QueryBuilder<T>;
  update: (data: Partial<T>) => QueryBuilder<T>;
  delete: () => QueryBuilder<T>;
  eq: (column: string, value: any) => QueryBuilder<T>;
  neq: (column: string, value: any) => QueryBuilder<T>;
  gt: (column: string, value: any) => QueryBuilder<T>;
  gte: (column: string, value: any) => QueryBuilder<T>;
  lt: (column: string, value: any) => QueryBuilder<T>;
  lte: (column: string, value: any) => QueryBuilder<T>;
  like: (column: string, value: string) => QueryBuilder<T>;
  ilike: (column: string, value: string) => QueryBuilder<T>;
  in: (column: string, values: any[]) => QueryBuilder<T>;
  contains: (column: string, value: any) => QueryBuilder<T>;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder<T>;
  limit: (count: number) => QueryBuilder<T>;
  single: () => Promise<QueryResult<T>>;
  maybeSingle: () => Promise<QueryResult<T | null>>;
  then: <TResult>(onfulfilled?: (value: QueryResult<T[]>) => TResult) => Promise<TResult>;
}

// JSON fields per table for SQLite parsing
const jsonFieldsMap: Record<string, string[]> = {
  app_settings: ['available_classes', 'available_grades'],
  instructors: ['assigned_classes', 'assigned_grades'],
  lessons: ['attachments'],
  questions: ['options'],
  test_results: ['answers'],
};

class SQLiteQueryBuilder<T> implements QueryBuilder<T> {
  private table: string;
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private selectColumns: string = '*';
  private insertData: any = null;
  private updateData: any = null;
  private conditions: { column: string; op: string; value: any }[] = [];
  private orderBy: { column: string; ascending: boolean }[] = [];
  private limitCount: number | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = '*'): this {
    this.operation = 'select';
    this.selectColumns = columns;
    return this;
  }

  insert(data: Partial<T> | Partial<T>[]): this {
    this.operation = 'insert';
    this.insertData = data;
    return this;
  }

  update(data: Partial<T>): this {
    this.operation = 'update';
    this.updateData = data;
    return this;
  }

  delete(): this {
    this.operation = 'delete';
    return this;
  }

  eq(column: string, value: any): this {
    this.conditions.push({ column, op: '=', value });
    return this;
  }

  neq(column: string, value: any): this {
    this.conditions.push({ column, op: '!=', value });
    return this;
  }

  gt(column: string, value: any): this {
    this.conditions.push({ column, op: '>', value });
    return this;
  }

  gte(column: string, value: any): this {
    this.conditions.push({ column, op: '>=', value });
    return this;
  }

  lt(column: string, value: any): this {
    this.conditions.push({ column, op: '<', value });
    return this;
  }

  lte(column: string, value: any): this {
    this.conditions.push({ column, op: '<=', value });
    return this;
  }

  like(column: string, value: string): this {
    this.conditions.push({ column, op: 'LIKE', value });
    return this;
  }

  ilike(column: string, value: string): this {
    this.conditions.push({ column, op: 'LIKE', value: value.toLowerCase() });
    return this;
  }

  in(column: string, values: any[]): this {
    this.conditions.push({ column, op: 'IN', value: values });
    return this;
  }

  contains(column: string, value: any): this {
    // For JSON arrays in SQLite, use LIKE with JSON
    this.conditions.push({ column, op: 'LIKE', value: `%${JSON.stringify(value).slice(1, -1)}%` });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orderBy.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  private buildWhereClause(): { sql: string; params: any[] } {
    if (this.conditions.length === 0) {
      return { sql: '', params: [] };
    }

    const parts: string[] = [];
    const params: any[] = [];

    for (const cond of this.conditions) {
      if (cond.op === 'IN') {
        const placeholders = cond.value.map(() => '?').join(', ');
        parts.push(`${cond.column} IN (${placeholders})`);
        params.push(...cond.value);
      } else {
        parts.push(`${cond.column} ${cond.op} ?`);
        params.push(cond.value);
      }
    }

    return { sql: ' WHERE ' + parts.join(' AND '), params };
  }

  private buildOrderClause(): string {
    if (this.orderBy.length === 0) return '';
    const parts = this.orderBy.map(o => `${o.column} ${o.ascending ? 'ASC' : 'DESC'}`);
    return ' ORDER BY ' + parts.join(', ');
  }

  private async execute(): Promise<QueryResult<T[]>> {
    const api = (window as any).electronAPI.db;
    const jsonFields = jsonFieldsMap[this.table] || [];

    try {
      if (this.operation === 'select') {
        const { sql: whereSql, params } = this.buildWhereClause();
        const sql = `SELECT ${this.selectColumns} FROM ${this.table}${whereSql}${this.buildOrderClause()}${this.limitCount ? ` LIMIT ${this.limitCount}` : ''}`;
        const result = await api.query(sql, params);
        
        if (result.error) {
          return { data: null, error: result.error };
        }
        
        const parsed = result.data.map((row: any) => parseJsonFields(row, jsonFields));
        return { data: parsed, error: null };
      }

      if (this.operation === 'insert') {
        const items = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
        const results: T[] = [];
        
        for (const item of items) {
          const processed = stringifyJsonFields(item, jsonFields);
          const result = await api.insert(this.table, processed);
          if (result.error) {
            return { data: null, error: result.error };
          }
          results.push(parseJsonFields(result.data, jsonFields));
        }
        
        return { data: results, error: null };
      }

      if (this.operation === 'update') {
        const processed = stringifyJsonFields(this.updateData, jsonFields);
        
        // Build where object from conditions
        const where: Record<string, any> = {};
        for (const cond of this.conditions) {
          if (cond.op === '=') {
            where[cond.column] = cond.value;
          }
        }
        
        const result = await api.update(this.table, processed, where);
        if (result.error) {
          return { data: null, error: result.error };
        }
        
        return { data: [parseJsonFields(result.data, jsonFields)], error: null };
      }

      if (this.operation === 'delete') {
        const where: Record<string, any> = {};
        for (const cond of this.conditions) {
          if (cond.op === '=') {
            where[cond.column] = cond.value;
          }
        }
        
        await api.delete(this.table, where);
        return { data: [], error: null };
      }

      return { data: null, error: 'Unknown operation' };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  async single(): Promise<QueryResult<T>> {
    const result = await this.execute();
    if (result.error) {
      return { data: null, error: result.error };
    }
    if (!result.data || result.data.length === 0) {
      return { data: null, error: 'No rows found' };
    }
    return { data: result.data[0], error: null };
  }

  async maybeSingle(): Promise<QueryResult<T | null>> {
    const result = await this.execute();
    if (result.error) {
      return { data: null, error: result.error };
    }
    return { data: result.data?.[0] || null, error: null };
  }

  then<TResult>(
    onfulfilled?: (value: QueryResult<T[]>) => TResult
  ): Promise<TResult> {
    return this.execute().then(onfulfilled as any);
  }
}

// Table name type
type TableName = 'admin_settings' | 'app_settings' | 'attendance' | 'class_students' | 
  'classes' | 'grade_classes' | 'homework' | 'homework_submissions' | 'instructor_grades' | 
  'instructors' | 'lesson_progress' | 'lessons' | 'profiles' | 'questions' | 'students' | 
  'test_results' | 'tests' | 'user_roles';

// Unified database client (pure offline SQLite)
export const db = {
  from<T = any>(table: TableName | string): QueryBuilder<T> {
    if (!getIsElectron()) {
      throw new Error(
        "Bu ilova faqat Electron (desktop) muhitida ishlaydi. SQLite bazasi faqat desktopda mavjud."
      );
    }
    return new SQLiteQueryBuilder<T>(table);
  },
  
  // Check runtime environment
  get isOffline() { return getIsElectron(); },
  get isOnline() { return false; }, // Always offline
};

// Re-export for compatibility
export const isElectron = getIsElectron();
