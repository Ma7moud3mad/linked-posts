import { hash, compare } from 'bcrypt';
import { SALT_ROUNDS } from '../../config/config.service.js';

export async function hashOperation({plainValue,rounds = SALT_ROUNDS}:{plainValue: string, rounds?: number}) {

    return await hash(plainValue, rounds);
}

export async function compareOperation({plainValue,hashvalue}:{plainValue: string, hashvalue: string}) {
    return await compare(plainValue, hashvalue);
}

