// オーディオファイル
export const AUDIO = {
    beep: "./sounds/beep.mp3",
    success: "./sounds/succeed.mp3",
    error: "./sounds/error.mp3",
};

/**
 * 音を再生する
 * @param {string} soundPath - 音声ファイルのパス
 */
export function playSound(soundPath) {
    const audio = new Audio(soundPath);
    audio
        .play()
        .catch((e) => console.log("音の再生ができませんでした", e));
}
