"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RSVP = void 0;
const db_1 = require("../db");
class RSVP {
    static async findById(id) {
        const result = await (0, db_1.query)('SELECT * FROM rsvps WHERE id = $1', [id]);
        return result.rows[0] || null;
    }
    static async findByUserAndEvent(userId, eventId) {
        const result = await (0, db_1.query)('SELECT * FROM rsvps WHERE user_id = $1 AND event_id = $2', [userId, eventId]);
        return result.rows[0] || null;
    }
    static async create(rsvpData) {
        const { user_id, event_id, status, notes } = rsvpData;
        const result = await (0, db_1.query)(`INSERT INTO rsvps 
        (user_id, event_id, status, notes) 
      VALUES 
        ($1, $2, $3, $4) 
      RETURNING *`, [user_id, event_id, status, notes]);
        return result.rows[0];
    }
    static async update(id, rsvpData) {
        const updateFields = [];
        const values = [];
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
        const result = await (0, db_1.query)(query_text, values);
        return result.rows[0] || null;
    }
    static async delete(id) {
        const result = await (0, db_1.query)('DELETE FROM rsvps WHERE id = $1', [id]);
        return result.rowCount > 0;
    }
    static async findByEvent(eventId) {
        const result = await (0, db_1.query)('SELECT * FROM rsvps WHERE event_id = $1 ORDER BY rsvp_time DESC', [eventId]);
        return result.rows;
    }
    static async findByUser(userId) {
        const result = await (0, db_1.query)('SELECT * FROM rsvps WHERE user_id = $1 ORDER BY rsvp_time DESC', [userId]);
        return result.rows;
    }
    static async getEventAttendees(eventId) {
        const result = await (0, db_1.query)('SELECT user_id, status FROM rsvps WHERE event_id = $1', [eventId]);
        return result.rows;
    }
    static async getAttendeeCount(eventId) {
        const result = await (0, db_1.query)('SELECT COUNT(*) as count FROM rsvps WHERE event_id = $1 AND status = $2', [eventId, 'attending']);
        return parseInt(result.rows[0].count, 10);
    }
}
exports.RSVP = RSVP;
