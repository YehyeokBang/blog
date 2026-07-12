/**
 * 텍스트 길이를 바탕으로 대략적인 읽는 시간을 계산합니다.
 * @param text 원본 텍스트
 * @param charsPerMinute 1분당 읽을 수 있는 글자 수 (기본값: 300)
 * @returns 분 단위의 읽는 시간 (최소 1분)
 */
export function calculateReadingTime(text: string, charsPerMinute: number = 300): number {
  if (!text) return 1;
  const time = Math.ceil(text.length / charsPerMinute);
  return time > 0 ? time : 1;
}
