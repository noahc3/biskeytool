// This code is based on a C# implementation by SimonTime.

import RijndaelBlock from "rijndael-js";

const KEYBLOB_KEY_SRC = new Uint8Array([ 0xDF, 0x20, 0x6F, 0x59, 0x44, 0x54, 0xEF, 0xDC, 0x70, 0x74, 0x48, 0x3B, 0x0D, 0xED, 0x9F, 0xD3 ]);
const CONSOLE_KEY_SRC = new Uint8Array([ 0x4F, 0x02, 0x5F, 0x0E, 0xB6, 0x6D, 0x11, 0x0E, 0xDC, 0x32, 0x7D, 0x41, 0x86, 0xC2, 0xF4, 0x78 ]);
const RETAIL_AES_KEK_SRC = new Uint8Array([ 0xE2, 0xD6, 0xB8, 0x7A, 0x11, 0x9C, 0xB8, 0x80, 0xE8, 0x22, 0x88, 0x8A, 0x46, 0xFB, 0xA1, 0x95 ]);
const AES_KEK_SRC = new Uint8Array([ 0x4D, 0x87, 0x09, 0x86, 0xC4, 0x5D, 0x20, 0x72, 0x2F, 0xBA, 0x10, 0x53, 0xDA, 0x92, 0xE8, 0xA9 ]);
const AES_KEY_SRC = new Uint8Array([ 0x89, 0x61, 0x5E, 0xE0, 0x5C, 0x31, 0xB6, 0x80, 0x5F, 0xE5, 0x8F, 0x3D, 0xA2, 0x4F, 0x7A, 0xA8 ]);
const BIS_KEK_SRC = new Uint8Array([ 0x34, 0xC1, 0xA0, 0xC4, 0x82, 0x58, 0xF8, 0xB4, 0xFA, 0x9E, 0x5E, 0x6A, 0xDA, 0xFC, 0x7E, 0x4F ]);
const BIS_KEY_SRC_0 = new Uint8Array([ 0xF8, 0x3F, 0x38, 0x6E, 0x2C, 0xD2, 0xCA, 0x32, 0xA8, 0x9A, 0xB9, 0xAA, 0x29, 0xBF, 0xC7, 0x48, 0x7D, 0x92, 0xB0, 0x3A, 0xA8, 0xBF, 0xDE, 0xE1, 0xA7, 0x4C, 0x3B, 0x6E, 0x35, 0xCB, 0x71, 0x06 ]);
const BIS_KEY_SRC_1 = new Uint8Array([ 0x41, 0x00, 0x30, 0x49, 0xDD, 0xCC, 0xC0, 0x65, 0x64, 0x7A, 0x7E, 0xB4, 0x1E, 0xED, 0x9C, 0x5F, 0x44, 0x42, 0x4E, 0xDA, 0xB4, 0x9D, 0xFC, 0xD9, 0x87, 0x77, 0x24, 0x9A, 0xDC, 0x9F, 0x7C, 0xA4 ]);
const BIS_KEY_SRC_2 = new Uint8Array([ 0x52, 0xC2, 0xE9, 0xEB, 0x09, 0xE3, 0xEE, 0x29, 0x32, 0xA1, 0x0C, 0x1F, 0xB6, 0xA0, 0x92, 0x6C, 0x4D, 0x12, 0xE1, 0x4B, 0x2A, 0x47, 0x4C, 0x1C, 0x09, 0xCB, 0x03, 0x59, 0xF0, 0x15, 0xF4, 0xE4 ]);
        
function bytesToHexString(input) {
    return Array.from(input, (byte) => {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('').toUpperCase();
}

function hexStringToBytes(input) { 
    return Buffer.from(input, 'hex');
}

function formatKeys(key, sect) {
    let res = [];
    let crypt = bytesToHexString(key).substring(0, 32);
    let tweak = bytesToHexString(key).substring(32);
    
    res.push(`BIS Key ${sect} (Crypt): ${crypt}`);
    res.push(`BIS Key ${sect} (Tweak): ${tweak}`);

    return res;
}

function decrypt(data, key) { 
    const cipher = new RijndaelBlock(key, 'ecb');
    return cipher.decrypt(data, 128);
}

export default function deriveBisKeys(sbk, tsec) {
    let res = [];

    //convert hex strings to bytes
    if (typeof sbk === "string") sbk = hexStringToBytes(sbk);
    if (typeof tsec === "string") tsec = hexStringToBytes(tsec);

    const devKF1 = decrypt(KEYBLOB_KEY_SRC, tsec);
    const devKF2 = decrypt(devKF1, sbk);
    const devKey = decrypt(CONSOLE_KEY_SRC, devKF2);
    const s00Kek = decrypt(RETAIL_AES_KEK_SRC, devKey);
    const s00Key = decrypt(BIS_KEY_SRC_0, s00Kek);
    const ossKF1 = decrypt(AES_KEK_SRC, devKey);
    const ossKF2 = decrypt(BIS_KEK_SRC, ossKF1);
    const ossKey = decrypt(AES_KEY_SRC, ossKF2);
    const s01Key = decrypt(BIS_KEY_SRC_1, ossKey);
    const s02Key = decrypt(BIS_KEY_SRC_2, ossKey);
    
    res.push("SBK Key: " + bytesToHexString(sbk));
    res.push("TSEC Key: " + bytesToHexString(tsec));
    res = res.concat(formatKeys(s00Key, 0));
    res = res.concat(formatKeys(s01Key, 1));
    res = res.concat(formatKeys(s02Key, 2));
    res = res.concat(formatKeys(s02Key, 3));
    
    return res;
    
}