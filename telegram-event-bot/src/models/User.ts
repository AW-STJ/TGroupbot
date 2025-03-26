import { query } from '../db';

export interface UserData {
  id?: number;
  telegram_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class User {
  static async findById(id: number): Promise<UserData | null> {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByTelegramId(telegramId: string): Promise<UserData | null> {
    const result = await query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
    return result.rows[0] || null;
  }

  static async create(userData: UserData): Promise<UserData> {
    const { telegram_id, username, first_name, last_name } = userData;
    
    const result = await query(
      'INSERT INTO users (telegram_id, username, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING *',
      [telegram_id, username, first_name, last_name]
    );
    
    return result.rows[0];
  }

  static async update(id: number, userData: Partial<UserData>): Promise<UserData | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Dynamically build the SET part of the query
    for (const [key, value] of Object.entries(userData)) {
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
      UPDATE users
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(query_text, values);
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  static async findAll(): Promise<UserData[]> {
    const result = await query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows;
  }
} 