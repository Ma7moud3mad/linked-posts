import { connect } from 'mongoose';
import { DB_URL_ATLAS, DB_URL_Local } from '../config/config.service.js';
async function test_DB_connections() {
    try {
        // await connect(DB_URL_Local);
        await connect(DB_URL_ATLAS);
        console.log('Connected to the database successfully');
    } catch (error) {
        console.error('Error connecting to the database', error);
    }
}

export default test_DB_connections;