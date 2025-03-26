import { query } from '../db';

export interface EventData {
  id?: number;
  title: string;
  description?: string;
  start_time: Date;
  end_time?: Date;
  location?: string;
  max_participants?: number;
  creator_id: number;
  is_private: boolean;
  event_code?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class Event {
  static async findById(id: number): Promise<EventData | null> {
    const result = await query('SELECT * FROM events WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByEventCode(eventCode: string): Promise<EventData | null> {
    const result = await query('SELECT * FROM events WHERE event_code = $1', [eventCode]);
    return result.rows[0] || null;
  }

  static async create(eventData: EventData): Promise<EventData> {
    const { 
      title, 
      description, 
      start_time, 
      end_time, 
      location, 
      max_participants, 
      creator_id, 
      is_private, 
      event_code 
    } = eventData;
    
    const result = await query(
      `INSERT INTO events 
        (title, description, start_time, end_time, location, max_participants, creator_id, is_private, event_code) 
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [title, description, start_time, end_time, location, max_participants, creator_id, is_private, event_code]
    );
    
    return result.rows[0];
  }

  static async update(id: number, eventData: Partial<EventData>): Promise<EventData | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Dynamically build the SET part of the query
    for (const [key, value] of Object.entries(eventData)) {
      if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return null;
    }

    values.push(id);
    const query_text = `
      UPDATE events
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(query_text, values);
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM events WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  static async findAll({ limit, offset }: { limit?: number; offset?: number } = {}): Promise<EventData[]> {
    let sql = 'SELECT * FROM events WHERE is_private = false ORDER BY start_time ASC';
    const values: any[] = [];
    
    if (limit !== undefined) {
      sql += ' LIMIT $1';
      values.push(limit);
      
      if (offset !== undefined) {
        sql += ' OFFSET $2';
        values.push(offset);
      }
    }
    
    const result = await query(sql, values);
    return result.rows;
  }

  static async findByCreator(creatorId: number): Promise<EventData[]> {
    const result = await query(
      'SELECT * FROM events WHERE creator_id = $1 ORDER BY start_time ASC',
      [creatorId]
    );
    return result.rows;
  }

  static async findUpcoming(userId?: number): Promise<EventData[]> {
    let sql = 'SELECT * FROM events WHERE start_time > NOW()';
    const values: any[] = [];
    
    if (userId) {
      sql += ' AND (is_private = false OR creator_id = $1)';
      values.push(userId);
    } else {
      sql += ' AND is_private = false';
    }
    
    sql += ' ORDER BY start_time ASC';
    
    const result = await query(sql, values);
    return result.rows;
  }
} 