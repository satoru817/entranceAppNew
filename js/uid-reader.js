import { doScan } from "./scanElf.js";
import { doPost } from "./fetchElf.js";
import {
  GET_STUDENT_API_END_POINT,
  SET_STUDENT_CARDID_END_POINT,
} from "./constant.js";
import { AUDIO, playSound } from "./audio.js";
import { getParams } from "./WindowElf.js";

export const getStudentList = async (email, password) => {
  const data = { email, password };
  const students = await doPost(GET_STUDENT_API_END_POINT, data);
  console.log(`students = ${students}`);
  return students;
};

let selectedCramSchoolName = null;

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    const params = getParams();
    const email = params.get("email");
    const password = params.get("password");
    // Fetching students data ...
    const students = await getStudentList(email, password);
    const registrationBtn = document.getElementById("registrationBtn");
    const backBtn = document.getElementById("backBtn");

    backBtn.addEventListener("click", () => {
      if (confirm("元の画面に戻りますか？")) {
        window.location.href = `index.html?email=${encodeURIComponent(
          email
        )}&password=${encodeURIComponent(password)}}`;
      }
    });

    const cardIdRegistrationModal = document.getElementById(
      "cardId_registration_modal"
    );
    const cramSchoolSelection = document.getElementById("cramSchoolSelection");

    const updateStudents = (studentId, newCardId) => {
      console.log(`studentId = ${studentId}, newCardId = ${newCardId}`);
      console.log(`selectedCramScholName = ${selectedCramSchoolName}`);
      const _students = students.find(
        (s) => s.cramSchoolName === selectedCramSchoolName
      );
      console.log(`_students = ${_students} ${JSON.stringify(_students)}`);
      const _student = _students.studentInfos.find(
        (s) => s.studentId === studentId
      );
      console.log(`_student = ${_student}`);
      const curr = students
        .find((s) => s.cramSchoolName === selectedCramSchoolName)
        .studentInfos.find((s) => Number(s.studentId) === Number(studentId));
      console.log(`curr = ${curr} ,currJson = ${JSON.stringify(curr)}`);
      curr.cardId = newCardId;
      curr.cardIdSet = !!newCardId;
    };

    const studentSelection = document.getElementById("studentSelection");
    const cramSchools = [...students].map((s) => s.cramSchoolName);
    cramSchoolSelection.innerHTML = `<option>校舎を選択してください</option>${cramSchools
      .map((name) => `<option value=${name}>${name}</option>`)
      .join("")}`;
    const createOptionsFromStudentInfos = (studentInfos) => {
      const studentPart = studentInfos
        .map(
          (studentInfo) =>
            `<option id=option_${studentInfo.studentId} value='${
              studentInfo.studentId
            }' data-student-name='${studentInfo.studentName}' data-card-id='${
              studentInfo.cardId
            }' data-student-id=${studentInfo.studentId} class=${
              studentInfo.cardId ? "text-success" : "text-danger"
            }>${studentInfo.studentName} ${
              studentInfo.cardId ? "設定ずみ" : "未設定"
            } ${studentInfo.cardId}</option>`
        )
        .join("");

      return `<option class="text-danger">生徒を選択してください</option>${studentPart}`;
    };

    if (cramSchools.length === 1) {
      studentSelection.innerHTML = createOptionsFromStudentInfos(
        students[0].studentInfos
      );
      selectedCramSchoolName = cramSchools[0];
    }

    // ✅ Move event listeners OUTSIDE modal handler to prevent multiplication
    cramSchoolSelection.addEventListener("change", (e) => {
      if (e.target.value) {
        const _selectedCramSchoolName = e.target.value;
        selectedCramSchoolName = _selectedCramSchoolName;
        console.log(`selected cramSchool = ${_selectedCramSchoolName}`);
        const relatedStudents = students.filter(
          (dto) => dto.cramSchoolName === _selectedCramSchoolName
        )[0].studentInfos;
        studentSelection.innerHTML =
          createOptionsFromStudentInfos(relatedStudents);
      }
    });

    let isScanning = false; // ✅ Prevent multiple simultaneous scans
    let currentAbortController = null; // ✅ Track current scan to abort it if needed
    let ndefReader = null; // ✅ Reuse single NDEFReader instance

    studentSelection.addEventListener("change", async (e) => {
      const studentId = e.target.value;
      if (!studentId) return; // excludes guide option
      const selectedOption = document.getElementById(`option_${studentId}`);
      const studentName = selectedOption.dataset.studentName;
      const cardId = selectedOption.dataset.cardId;

      if (!("NDEFReader" in window)) {
        alert("このブラウザはWeb NFCに対応していません。");
        return;
      }

      if (isScanning) {
        alert("既にカード読み取り中です。");
        return;
      }

      if (
        confirm(
          `${studentName}にカードを紐づけますか？\n紐づけるつもりならOKボタンを押してからカードをかざしてください。`
        )
      ) {
        isScanning = true;

        // ✅ Abort any previous scan operation
        if (currentAbortController) {
          currentAbortController.abort();
        }

        // ✅ Create NDEFReader only once
        if (!ndefReader) {
          ndefReader = new NDEFReader();
        }

        try {
          await ndefReader.scan();

          // ✅ Use AbortController to ensure clean cleanup
          currentAbortController = new AbortController();

          ndefReader.addEventListener(
            "reading",
            async ({ serialNumber }) => {
              currentAbortController.abort(); // Stop listening after first read
              isScanning = false;

              if (!!serialNumber && cardId !== serialNumber) {
                if (
                  confirm(
                    `${studentName}に\nカードID: ${serialNumber}\nを紐づけますか？`
                  )
                ) {
                  playSound(AUDIO.success);
                  const data = {
                    email,
                    password,
                    studentId,
                    cardId: serialNumber,
                  };
                  const success = await doPost(
                    SET_STUDENT_CARDID_END_POINT,
                    data
                  );
                  console.log(`success = ${success}`);
                  // if failed then doPost will early-return;
                  if (success) {
                    console.log("successの中にはいます");
                    updateStudents(studentId, serialNumber);
                    const relatedOption = document.getElementById(
                      `option_${studentId}`
                    );
                    relatedOption.outerHTML = `<option id=option_${studentId} value='${studentId}' data-student-name='${studentName}' data-card-id='${serialNumber}' data-student-id=${studentId} class=text-success >${studentName}  '設定ずみ'  ${serialNumber}</option>`;
                    alert(
                      `${studentName}にカードID${serialNumber}を正常に紐づけられました.`
                    );
                  } else {
                    console.log("successの中にいません。");
                    alert(
                      `${studentName}にカードID\n${serialNumber}\nを紐づけるのに失敗しました`
                    );
                  }
                } else {
                  isScanning = false;
                }
              } else {
                alert(
                  `このカードID${serialNumber}が既にこの生徒${studentName}と紐づいています。`
                );
              }
            },
            { once: true, signal: currentAbortController.signal }
          );
        } catch (error) {
          isScanning = false;
          console.error("NFC scan error:", error);
          alert("カード読み取りエラーが発生しました。");
        }
      }
    });

    registrationBtn.addEventListener("click", () => {
      new bootstrap.Modal(cardIdRegistrationModal).show();
    });
  },
  { once: true }
);
