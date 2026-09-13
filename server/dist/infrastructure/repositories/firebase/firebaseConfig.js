/**
 * Configuración y referencia para migración a Firebase Firestore.
 * Cuando se desee cambiar de base de datos local a Firebase:
 * 1. Instalar firebase-admin: npm install firebase-admin
 * 2. Configurar las variables en server/.env:
 *    DATABASE_PROVIDER=firebase
 *    FIREBASE_PROJECT_ID=tu-proyecto-id
 *    FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
 *    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
 */
export function getFirebaseConfig() {
    return {
        projectId: process.env.FIREBASE_PROJECT_ID || 'cevicheria-demo',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };
}
