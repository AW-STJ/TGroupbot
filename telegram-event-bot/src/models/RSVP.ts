import { query } from '../db';

export type RSVPStatus = 'attending' | 'maybe' | 'not_attending';

export interface RSVPData {
  id?: number;
  user_id: number;
  event_id: number;
  status: RSVPStatus;
  rsvp_time?: Date;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class RSVP {
  static async findById(id: number): Promise<RSVPData | null> {
    const result = await query('SELECT * FROM rsvps WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByUserAndEvent(userId: number, eventId: number): Promise<RSVPData | null> {
    const result = await query(
      'SELECT * FROM rsvps WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );
    return result.rows[0] || null;
  }

  static async create(rsvpData: RSVPData): Promise<RSVPData> {
    const { user_id, event_id, status, notes } = rsvpData;
    
    const result = await query(
      `INSERT INTO rsvps 
        (user_id, event_id, status, notes) 
      VALUES 
        ($1, $2, $3, $4) 
      RETURNING *`,
      [user_id, event_id, status, notes]
    );
    
    return result.rows[0];
  }

  static async update(id: number, rsvpData: Partial<RSVPData>): Promise<RSVPData | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Dynamically build the SET part of the query
    for (const [key, value] of Object.entries(rsvpData)) {
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
      UPDATE rsvps
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(query_text, values);
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM rsvps WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  static async findByEvent(eventId: number): Promise<RSVPData[]> {
    const result = await query(
      'SELECT * FROM rsvps WHERE event_id = $1 ORDER BY rsvp_time DESC',
      [eventId]
    );
    return result.rows;
  }

  static async findByUser(userId: number): Promise<RSVPData[]> {
    const result = await query(
      'SELECT * FROM rsvps WHERE user_id = $1 ORDER BY rsvp_time DESC',
      [userId]
    );
    return result.rows;
  }

  static async getEventAttendees(eventId: number): Promise<{ user_id: number; status: RSVPStatus }[]> {
    const result = await query(
      'SELECT user_id, status FROM rsvps WHERE event_id = $1',
      [eventId]
    );
    return result.rows;
  }

  static async getAttendeeCount(eventId: number): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) as count FROM rsvps WHERE event_id = $1 AND status = $2',
      [eventId, 'attending']
    );
    return parseInt(result.rows[0].count, 10);
  }
} 