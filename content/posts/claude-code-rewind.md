---
title: "[Claude Code] 아니 그게 아니라..."
date: "2026-04-25"
description: "Claude Code의 체크포인팅(Rewind) 기능을 활용하여 토큰 낭비를 줄이고 삽질의 흔적을 깨끗하게 되돌리는 방법"
tags:
  - Claude
  - AI
  - Productivity
thumbnail: /images/posts/claude-code-rewind/context-window.webp
---

> “아니 그게 아니라…”

이 한 문장이 우리의 토큰을 계속 태우고 있어요. 대화가 길어질수록 비용이 늘어난다는 건 이미 알고 계실 것 같아요. 그런데 진짜 문제는 따로 있어요. 우리의 `틀린 시도`와 `애매한 지시`까지 그대로 남아서, 다음 결과까지 망칠 수 있어요.

## 우리가 자주 하는 실수

Claude Code로 작업할 때 이런 흐름을 자주 반복해요.

1. A안과 B안 중 A를 먼저 시도한다. (A vs B)
2. 결과가 마음에 안 든다.
3. "아니 그게 아니라 이렇게 해줘"라고 추가로 지시한다.

동작은 하겠지만, **A의 모든 시행착오가 그대로 대화에 남아요.** 이후 모든 응답에서 실패한 A안의 흔적이 함께 따라다니기 때문에 두 가지 비용이 발생하게 돼요.

- **매 턴 비용이 늘어나요.** 대화가 길어질수록 모든 히스토리가 함께 전송돼서 더 많은 토큰을 사용해요. 
    ![Context Window](/images/posts/claude-code-rewind/context-window.webp)
    - LLM은 매 요청마다 `지금까지 대화 전체`를 다시 읽습니다.
    - [출처: Claude API Docs - Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows)
- **응답이 느려지고 흐려져요.** `읽어야 할 분량이 늘어나는 것`도 문제지만, 더 큰 문제는 Claude가 이미 한번 잡은 방향을 쉽게 못 놓는다는 거예요. B를 요청해도 A의 영향이 응답에 섞일 가능성이 있어요. (특히 코드처럼 산출물이 누적되는 작업에서 두드러져요.)

## 해결책은 되돌리기

Claude Code는 매 프롬프트마다 자동으로 [체크포인트](https://code.claude.com/docs/en/checkpointing)를 만들어요.

`Esc`를 두 번 누르거나 `/rewind` 명령으로 rewind 메뉴를 열 수 있어요. 메뉴에는 세션의 프롬프트들이 시점별로 나열돼요.

![Rewind Menu](/images/posts/claude-code-rewind/rewind-menu.webp)

원하는 시점을 고르면 작업 옵션이 나타나요.

![Rewind Options](/images/posts/claude-code-rewind/rewind-options.webp)

> ### 선택 옵션
>
> A vs B처럼 방향을 바꿔야 하는 상황이라면 `Restore code and conversation`을 선택하세요. 코드와 대화를 함께 되돌려서, A의 흔적 없이 깨끗한 상태에서 B를 시작할 수 있어요. 나머지 옵션은 상황에 따라 골라 쓰면 돼요.
> 
> - `Restore conversation`: 코드는 유지하고 대화만 되돌리기
> - `Restore code`: 대화는 유지하고 파일 변경만 되돌리기
> - `Summarize from here`: 이후 대화를 압축
> - `Never mind`: 변경 없이 메뉴 닫기
> 
> \* 코드를 되돌리는 옵션은 실제로 코드가 변경된 경우에만 보여요.

Rewind는 “방향이 틀렸을 때” 쓰는 도구에요. 반대로, 단순한 표현 수정이나 결과 다듬기처럼 기존 맥락을 유지해도 되는 경우라면 굳이 되돌릴 필요 없이 이어서 지시해도 충분할 수 있어요.

## 핵심은 페인포인트를 함께 전달하는 것

그냥 되돌려서 B를 다시 요청하면 A에서 배운 걸 전부 잃어요. 되돌린 직후 B를 요청할 때 **A에서 발견한 문제**를 한두 줄로 덧붙여주세요.

> B안으로 가자. A를 먼저 해봤는데 X 부분이 너무 복잡해졌고 Y 케이스에서 동작이 애매했어. 이 점은 피해서 구현해줘.

A의 시행착오를 학습으로 압축해 전달하는 셈이에요. 대화는 깨끗해지고, 인사이트는 살아남아요.

## 학습 자체를 버리고 싶지 않다면

A 과정에서 의미 있는 탐색이 많았다면 `Summarize from here` 옵션을 골라보세요. 코드는 그대로 두고 대화만 압축해서 컨텍스트 공간을 확보해요. 통째 롤백과 그냥 두기 사이의 절충안이에요.

## 언제 쓰면 좋은가

공식 문서는 다음 상황에 체크포인팅을 권장해요.

- 여러 구현 방법을 비교할 때
- 도입한 변경이 버그를 만들었을 때
- 같은 기능을 변형해가며 실험할 때
- 디버깅 세션이 길어져 컨텍스트가 부족할 때

## 알아둘 한계

- bash 명령(`rm`, `mv` 등)으로 바뀐 파일은 추적되지 않아요.
- Claude Code 외부에서 직접 수정한 파일도 추적되지 않아요.
- Git을 대체하지 않아요. **체크포인트는 "로컬 실행취소", Git은 "영구 기록"** 이에요.

> **참고**: A와 B를 동시에 비교하고 원본도 보존하고 싶다면 `claude --continue --fork-session`으로 세션을 분기할 수 있어요. Rewind는 순차적 실험, Fork는 병렬 비교에 적합해요.

## 정리

> ~~"아니 그게 아니라.."~~

마음에 안 든다고 클로드에게 화내지 마세요.
버릴 건 버리고, 가져갈 것만 들고 되돌아가세요.

`ESC` + `ESC` 또는 `/rewind` 한 번이면 돼요.

### 참고 문서

- [Claude Code Docs - Checkpointing](https://code.claude.com/docs/ko/checkpointing)
- [Claude Code Docs - Resume or fork sessions](https://code.claude.com/docs/en/how-claude-code-works#resume-or-fork-sessions)
- [Claude API Docs - Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows)
