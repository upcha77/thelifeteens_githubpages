import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAej3qWpQcDLeB-h3l9I1HTL0WTs0e5vQ0", // 실제 API 키로 변경해주세요.
  authDomain: "thelifechurchteen.firebaseapp.com",
  databaseURL: "https://thelifechurchteen-default-rtdb.firebaseio.com",
  projectId: "thelifechurchteen",
  storageBucket: "thelifechurchteen.appspot.com",
  messagingSenderId: "489190566560",
  appId: "1:489190566560:web:04c8e37670951bfc40b7c5",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// 익명 로그인을 시도합니다.
firebase
  .auth()
  .signInAnonymously()
  .then((userCredential) => {
    console.log("익명 로그인 성공:", userCredential.user.uid);
  })
  .catch((error) => {
    console.error("익명 로그인 실패:", error);
  });

const db = firebase.firestore();
const auth = firebase.auth();
const FieldPath = firebase.firestore.FieldPath;
// ★★★ FieldValue를 추가로 내보냅니다. ★★★
const FieldValue = firebase.firestore.FieldValue;

export { db, auth, FieldPath, FieldValue };
