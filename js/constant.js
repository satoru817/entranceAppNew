// TODO: come up with some idea to not hard code this
// export const APP_BASE_URL =
//   "https://shoei-549678050196.asia-northeast1.run.app/";
export const APP_BASE_URL = " https://efd04a35f759.ngrok-free.app/";
// export const APP_BASE_URL = "https://localhost:8080/"
export const ATTENDANCE_TOGGLE_API_ENDPOINT = `${APP_BASE_URL}api/attendance`;
export const LOGIN_END_POINT = APP_BASE_URL + "api/userLoginFromSmartPhone";
export const GET_STUDENT_API_END_POINT = `${APP_BASE_URL}api/getStudentsForCardRegistration`;
export const SET_STUDENT_CARDID_END_POINT = `${APP_BASE_URL}api/setCardIdToStudentFromSmartPhone`;
export const SET_TEACHER_CARDID_END_POINT = `${APP_BASE_URL}api/setCardIdToTeacherFromSmartPhone`;
