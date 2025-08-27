import knex from 'knex';
import knexConfig from '../../knexfile.js';
import { sampleEmails } from './sample-data.js';

const db = knex(knexConfig.development);

class DB {
  static async getAllEmails() {
    return db('emails').select('*').orderBy('created_at', 'desc');
  }

  static async getEmailsPaginated(offset, limit) {
    return db('emails')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  static async getEmailById(id) {
    return db('emails').where({ id }).first();
  }

  static async createEmail(data) {
    return db('emails').insert(data);
  }

  static async deleteEmail(id) {
    const deletedCount = await db('emails').where({ id }).delete();
    return deletedCount > 0;
  }

  static async getEmailCount() {
    const result = await db('emails').count('id as count').first();
    return result.count;
  }

  static async initializeDatabase() {
    try {
      console.log('Checking database initialization...');
      const emailCount = await this.getEmailCount();

      if (emailCount === 0) {
        console.log('No emails found in database. Adding sample emails...');
        await this.addSampleEmails();
        console.log('Sample emails added successfully!');
      } else {
        console.log(`Database already contains ${emailCount} emails.`);
      }
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  static async addSampleEmails() {
    for (const email of sampleEmails) {
      await this.createEmail(email);
    }
  }
}

export default DB;
