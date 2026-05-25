const admin = require('firebase-admin');

let db = null;

try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    
    if (serviceAccount.project_id) {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
        db = admin.firestore();
        console.log('✅ Firebase connected');
    } else {
        console.log('⚠️  Firebase not configured. Using local storage.');
    }
} catch (err) {
    console.log('⚠️  Firebase not configured. Using local storage.');
}

module.exports = { admin, db };