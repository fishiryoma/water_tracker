import { initializeApp } from 'firebase/app'
// import { getAnalytics } from 'firebase/analytics'
import { getDatabase } from 'firebase/database'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyDiTXgzOEu0kQ8t37prqGA-alI-cKN7RkU',
  authDomain: 'water-record.firebaseapp.com',
  databaseURL: 'https://water-record-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'water-record',
  storageBucket: 'water-record.firebasestorage.app',
  messagingSenderId: '260404007186',
  appId: '1:260404007186:web:d75c36dc3bf91e824723cb',
  measurementId: 'G-74YKJS7W58',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// const analytics = getAnalytics(app)

const database = getDatabase(app)

export { database }
