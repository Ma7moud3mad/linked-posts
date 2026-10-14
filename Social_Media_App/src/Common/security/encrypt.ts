import  CryptoJS  from 'crypto-js';
import { ENCRYPTION_KEY } from '../../config/config.service.js';


export function encryptvalue({value, key = ENCRYPTION_KEY} : {value: string, key?: string}) {
    return CryptoJS.AES.encrypt(value, key).toString();
}

export function decryptValue({encryptedValue, key = ENCRYPTION_KEY} : {encryptedValue: string, key?: string}) {
    const bytes = CryptoJS.AES.decrypt(encryptedValue, key);
    const decryptedValue = bytes.toString(CryptoJS.enc.Utf8);
    return decryptedValue;
}

