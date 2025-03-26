"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = void 0;
const db_1 = require("../db");
class Event {
    static async findById(id) {
        const result = await (0, db_1.query)('SELECT * FROM events WHERE id = $1', [id]);
        return result.rows[0] || null;
    }
    static async findByEventCode(eventCode) {
        const result = await (0, db_1.query)('SELECT * FROM events WHERE event_code = $1', [eventCode]);
        return result.rows[0] || null;
    }
    static async create(eventData) {
        const { title, description, start_time, end_time, location, max_participants, creator_id, is_private, event_code } = eventData;
        const result = await (0, db_1.query)(`INSERT INTO events 
        (title, description, start_time, end_time, location, max_participants, creator_id, is_private, event_code) 
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`, [title, description, start_time, end_time, location, max_participants, creator_id, is_private, event_code]);
        return result.rows[0];
    }
    static async update(id, eventData) {
        const updateFields = [];
        const values = [];
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
        const result = await (0, db_1.query)(query_text, values);
        return result.rows[0] || null;
    }
    static async delete(id) {
        const result = await (0, db_1.query)('DELETE FROM events WHERE id = $1', [id]);
        return result.rowCount > 0;
    }
    static async findAll({ limit, offset } = {}) {
        let sql = 'SELECT * FROM events WHERE is_private = false ORDER BY start_time ASC';
        const values = [];
        if (limit !== undefined) {
            sql += ' LIMIT $1';
            values.push(limit);
            if (offset !== undefined) {
                sql += ' OFFSET $2';
                values.push(offset);
            }
        }
        const result = await (0, db_1.query)(sql, values);
        return result.rows;
    }
    static async findByCreator(creatorId) {
        const result = await (0, db_1.query)('SELECT * FROM events WHERE creator_id = $1 ORDER BY start_time ASC', [creatorId]);
        return result.rows;
    }
    static async findUpcoming(userId) {
        let sql = 'SELECT * FROM events WHERE start_time > NOW()';
        const values = [];
        if (userId) {
            sql += ' AND (is_private = false OR creator_id = $1)';
            values.push(userId);
        }
        else {
            sql += ' AND is_private = false';
        }
        sql += ' ORDER BY start_time ASC';
        const result = await (0, db_1.query)(sql, values);
        return result.rows;
    }
}
exports.Event = Event;
