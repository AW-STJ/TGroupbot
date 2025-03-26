"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const db_1 = require("../db");
class User {
    static async findById(id) {
        const result = await (0, db_1.query)('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0] || null;
    }
    static async findByTelegramId(telegramId) {
        const result = await (0, db_1.query)('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
        return result.rows[0] || null;
    }
    static async create(userData) {
        const { telegram_id, username, first_name, last_name } = userData;
        const result = await (0, db_1.query)('INSERT INTO users (telegram_id, username, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING *', [telegram_id, username, first_name, last_name]);
        return result.rows[0];
    }
    static async update(id, userData) {
        const updateFields = [];
        const values = [];
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
        const result = await (0, db_1.query)(query_text, values);
        return result.rows[0] || null;
    }
    static async delete(id) {
        const result = await (0, db_1.query)('DELETE FROM users WHERE id = $1', [id]);
        return result.rowCount > 0;
    }
    static async findAll() {
        const result = await (0, db_1.query)('SELECT * FROM users ORDER BY created_at DESC');
        return result.rows;
    }
}
exports.User = User;
