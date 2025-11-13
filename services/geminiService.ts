

import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedData, AssessmentPlan } from '../types';

export const generateEvaluationCriteria = async (standard: string, keyPoints: string, apiKey: string): Promise<{ high: string; medium: string; low: string; } | null> => {
    if (!apiKey) {
        console.error("API key is missing.");
        return null;
    }
    const ai = new GoogleGenAI({ apiKey });

    if (!standard.trim() || !keyPoints.trim()) {
        console.error("Achievement standard and key points are required.");
        return null;
    }

    const prompt = `
        **지시:** 당신은 한국 초등학교 평가 전문가입니다. 주어진 '성취기준'과 '수업/평가 연계 주안점'을 바탕으로, 학생의 성취 수준을 '상', '중', '하' 세 단계로 구분하는 '평가기준'을 구체적으로 서술해주세요. JSON 객체로 반환해주세요.

        **성취기준:**
        ---
        ${standard}
        ---

        **수업/평가 연계 주안점:**
        ---
        ${keyPoints}
        ---

        **요구사항:**
        1. 'high', 'medium', 'low' 세 개의 키를 가진 JSON 객체를 생성해주세요.
        2. 각 키의 값은 해당 성취 수준에 도달한 학생이 보이는 구체적인 행동이나 결과물에 대한 설명이어야 합니다.
        3. '상'은 성취기준을 완전히 이해하고 초과 달성한 수준, '중'은 성취기준을 충실히 달성한 수준, '하'는 성취기준 도달에 추가 지원이 필요한 수준으로 기술해주세요.
        4. 각 설명은 '~할 수 있다.' 또는 '~한다.' 형태로 자연스럽게 기술해주세요.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        high: { type: Type.STRING, description: "성취수준 '상'에 대한 설명" },
                        medium: { type: Type.STRING, description: "성취수준 '중'에 대한 설명" },
                        low: { type: Type.STRING, description: "성취수준 '하'에 대한 설명" },
                    },
                    required: ["high", "medium", "low"]
                },
            },
        });
        const jsonText = response.text.trim();
        if (!jsonText) {
            throw new Error("API returned an empty response for criteria generation.");
        }
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error generating evaluation criteria:", error);
        return null;
    }
};

export const generateKeyPoints = async (
  plan: Pick<AssessmentPlan, 'subject' | 'domain' | 'assessmentMethod' | 'assessmentElements' | 'achievementStandard'>,
  apiKey: string
): Promise<{ teachingPoints: string; assessmentPoints: string; } | null> => {
    if (!apiKey) {
        console.error("API key is missing.");
        return null;
    }
    const ai = new GoogleGenAI({ apiKey });

    const { subject, domain, assessmentMethod, assessmentElements, achievementStandard } = plan;
    if (!subject || !domain || !assessmentMethod || !assessmentElements || !achievementStandard) {
        console.error("All fields are required to generate key points.");
        return null;
    }

    const prompt = `
        **지시:** 당신은 한국 초등학교 교육과정 및 평가 전문가입니다. 주어진 '교과', '영역', '평가방법', '평가요소', '성취기준' 정보를 바탕으로 '수업 주안점'과 '평가 주안점'을 각각 한 문장으로 생성해주세요. JSON 객체로 반환해주세요.

        **입력 정보:**
        ---
        - 교과: ${subject}
        - 영역: ${domain}
        - 평가방법: ${assessmentMethod}
        - 평가요소: ${assessmentElements}
        - 성취기준: ${achievementStandard}
        ---

        **요구사항:**
        1.  'teachingPoints'와 'assessmentPoints' 두 개의 키를 가진 JSON 객체를 생성해주세요.
        2.  'teachingPoints' 값은 수업 활동의 핵심 방향을 나타내야 합니다.
        3.  'assessmentPoints' 값은 평가 활동의 핵심 관점을 나타내야 합니다.
        4.  각 문장의 끝은 반드시 '~함.' 또는 '~음.'으로 종결되도록 작성해주세요.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        teachingPoints: { type: Type.STRING, description: "수업 주안점" },
                        assessmentPoints: { type: Type.STRING, description: "평가 주안점" },
                    },
                    required: ["teachingPoints", "assessmentPoints"]
                },
            },
        });
        const jsonText = response.text.trim();
        if (!jsonText) {
            throw new Error("API returned an empty response for key points generation.");
        }
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error generating key points:", error);
        return null;
    }
};


const formatPlanForPrompt = (plan: AssessmentPlan): string => {
    return `
- 교과: ${plan.subject}
- 영역: ${plan.domain}
- 시기: ${plan.period}
- 평가요소: ${plan.assessmentElements}
- 평가방법: ${plan.assessmentMethod}
- 성취기준: ${plan.achievementStandard}
- 수업/평가 연계 주안점: ${plan.keyPoints}
- 평가기준 (상): ${plan.criteria.high}
- 평가기준 (중): ${plan.criteria.medium}
- 평가기준 (하): ${plan.criteria.low}
    `.trim();
}

export const generateAssessmentMaterials = async (
    plan: AssessmentPlan,
    task: string,
    file: { data: string; mimeType: string } | null,
    apiKey: string
): Promise<GeneratedData | null> => {
  if (!apiKey) {
    console.error("API key is missing.");
    return null;
  }
  const ai = new GoogleGenAI({ apiKey });

  try {
    const formattedPlan = formatPlanForPrompt(plan);

    let taskPromptSection = '';
    if (task.trim() && file) {
        taskPromptSection = `
**평가문항:**
---
아래 텍스트와 첨부된 PDF 파일을 모두 분석하여 평가문항의 전체 내용을 파악해주세요.

[추가 설명/텍스트]
${task}
---
`;
    } else if (task.trim()) {
        taskPromptSection = `
**평가문항:**
---
${task}
---
`;
    } else if (file) {
        taskPromptSection = `
**평가문항:**
---
첨부된 PDF 파일을 분석하여 평가문항의 내용을 파악해주세요.
---
`;
    }

    const mainPrompt = `
        **지시:** 당신은 한국 초등학교 교사를 위한 AI 평가자료 제작 전문가입니다. 주어진 '수행평가계획'과 '평가문항'을 바탕으로, '평가기준안', '분석적 루브릭 채점기준', '종합 평가 기준', 그리고 '예시 답안'을 생성하여 하나의 JSON 객체로 반환해 주세요.

        **[중요] 첨부 파일 분석:**
        - PDF 파일이 첨부된 경우, 파일의 모든 텍스트와 시각적 요소(그림, 표, 그래프 등)를 종합적으로 분석하여 문항의 의도를 완벽하게 파악해야 합니다.
        - **특히 '수학' 교과인 경우, 문제에 포함된 모든 숫자, 기호, 수식, 도형을 정확히 인식하고 풀이 과정에 반영해야 합니다. 복잡한 문제나 그림이 포함된 문제일수록 더욱 세심한 분석이 필요합니다.**

        **수행평가계획:**
        ---
        ${formattedPlan}
        ---

        ${taskPromptSection}

        **요구사항:**
        1.  **평가기준안 (criteria):** '단원', '평가 영역', '평가 시기', '평가 방법', '성취기준', '교과역량', '평가 요소' 필드를 포함하여 생성하세요. 여기서 '평가 요소'는 수행평가계획에 명시된 값을 그대로 사용해야 합니다. 나머지 필드들은 '수행평가계획'의 내용을 바탕으로 적절한 값을 추론하여 채워주세요.
            - '단원'은 성취기준이나 평가요소 내용을 보고 추론하세요 (예: 2. 서로 다른 의견).
            - '교과역량'은 '비판적·창의적 사고 역량', '의사소통 역량' 등 관련 역량을 배열로 포함하세요.
        2.  **채점기준 (rubric):**
            - **분석적 루브릭(Analytic Rubric)** 형식으로 채점 기준표를 생성하세요.
            - 평가문항을 분석하여 **가장 핵심적인 '평가 준거(criteria)'를 2개, 최대 3개까지만** 추출해주세요. **3개를 초과해서는 안 됩니다.** (예: "글쓴이 의견 파악", "자신의 의견과 비교").
            - 성취 수준은 3단계('상', '중', '하')로 나누고, 각 수준에 맞는 배점은 **반드시 '3점', '2점', '1점'**으로 부여하세요.
            - 최종 결과는 하나의 JSON 객체여야 합니다. 이 객체는 다음 두 개의 키를 가집니다.
                - \`criteria\`: 추출된 평가 준거의 이름들을 담은 **문자열 배열** (예: ["준거1 이름", "준거2 이름"]).
                - \`levels\`: 각 성취 수준('상', '중', '하')에 대한 정보를 담은 **객체 배열**.
            - \`levels\` 배열의 각 객체는 \`level\`('상', '중', '하'), \`score\`(배점), 그리고 \`descriptions\`(**문자열 배열**) 키를 가져야 합니다.
            - \`descriptions\` 배열에는 \`criteria\` 배열의 각 평가 준거에 해당하는 구체적인 수행 내용이 순서대로 포함되어야 합니다. **각 설명은 '~할 수 있다.' 또는 '~한다.' 와 같이 명확하고 간결한 문장으로 기술해주세요.**
        3.  **종합 평가 기준 (scoringSummary):**
            - **[중요]** 채점 기준의 각 준거별 배점은 '상' 3점, '중' 2점, '하' 1점으로 고정됩니다.
            - 먼저, 생성된 '평가 준거(criteria)'의 개수를 세어 총점을 계산하세요 (예: 준거가 2개면 총점 6점, 3개면 총점 9점).
            - 계산된 총점을 기준으로, **성취율(%)**에 따라 '상', '중', '하' 세 단계의 점수 범위를 결정하세요.
                - **상**: 총점의 80% 이상 (예: 총점 9점일 경우, 7.2점 이상이므로 '8-9점'으로 표현)
                - **중**: 총점의 60% 이상 ~ 80% 미만 (예: 총점 9점일 경우, 5.4점 이상 7.2점 미만이므로 '6-7점'으로 표현)
                - **하**: 총점의 60% 미만 (예: 총점 9점일 경우, 5.4점 미만이므로 '5점 이하'로 표현)
            - 'high', 'medium', 'low' 키를 가진 JSON 객체로 생성하고, 각 값은 최종적으로 계산된 점수 범위를 나타내는 문자열이어야 합니다 (예: "8-9점").
        4.  **예시 답안 (exampleAnswers):**
            - 평가문항에 포함된 **각 문항별로** 모범 답안을 생성하세요. 평가문항이 하나라면, 문항이 하나인 배열을 반환하세요.
            - 결과는 객체 배열 형태여야 합니다.
            - 각 객체는 'question' (문항 번호 또는 간단한 문항 설명, 예: "1번 문항")과 'answer' (해당 문항의 모범 답안) 키를 가져야 합니다.
            - 답안은 서술형으로 작성하고, 핵심 내용을 포함해야 합니다.
            - **수학과 같이 정답이 명확한 과목의 경우 풀이 과정을 포함한 답안을, 국어/사회와 같이 다양한 답이 가능한 경우 모범적인 서술 방향을 제시해주세요.**
      `;
    
    const contentParts: any[] = [{ text: mainPrompt }];
    if (file) {
        contentParts.push({
            inlineData: {
                data: file.data,
                mimeType: file.mimeType
            }
        });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: contentParts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            criteria: {
              type: Type.OBJECT,
              properties: {
                unit: { type: Type.STRING, description: "단원명 (예: 2. 서로 다른 의견)" },
                assessmentArea: { type: Type.STRING, description: "평가 영역 (예: 읽기)" },
                assessmentPeriod: { type: Type.STRING, description: "평가 시기 (예: 4월)" },
                assessmentMethod: { type: Type.STRING, description: "평가 방법 (예: 서·논술형)" },
                achievementStandard: { type: Type.STRING, description: "성취기준 코드와 내용" },
                subjectCompetencies: { type: Type.ARRAY, items: { type: Type.STRING }, description: "관련 교과 역량 목록" },
                assessmentElements: { type: Type.STRING, description: "핵심 평가 요소 요약" },
              },
              required: ["unit", "assessmentArea", "assessmentPeriod", "assessmentMethod", "achievementStandard", "subjectCompetencies", "assessmentElements"]
            },
            rubric: {
                type: Type.OBJECT,
                properties: {
                    criteria: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "분석적 루브릭의 평가 준거 목록"
                    },
                    levels: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                level: { type: Type.STRING, description: "성취 수준 (상, 중, 하)" },
                                score: { type: Type.STRING, description: "배점 (예: 3점)" },
                                descriptions: { 
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING },
                                    description: "각 평가 준거에 대한 수준별 설명"
                                }
                            },
                            required: ["level", "score", "descriptions"]
                        }
                    }
                },
                required: ["criteria", "levels"]
            },
            scoringSummary: {
              type: Type.OBJECT,
              properties: {
                high: { type: Type.STRING, description: "종합 평가 '상' 수준의 점수 범위" },
                medium: { type: Type.STRING, description: "종합 평가 '중' 수준의 점수 범위" },
                low: { type: Type.STRING, description: "종합 평가 '하' 수준의 점수 범위" },
              },
              required: ["high", "medium", "low"]
            },
            exampleAnswers: {
              type: Type.ARRAY,
              description: "각 문항별 예시 답안 목록",
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: "문항 번호 또는 요약 (예: '1번 문항')" },
                  answer: { type: Type.STRING, description: "해당 문항에 대한 모범 답안" }
                },
                required: ["question", "answer"]
              }
            }
          },
          required: ["criteria", "rubric", "scoringSummary", "exampleAnswers"]
        },
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
        throw new Error("API returned an empty response.");
    }
    const data = JSON.parse(jsonText) as GeneratedData;

    // Ensure the output's assessment elements match the input plan's elements exactly.
    if (data.criteria) {
        data.criteria.assessmentElements = plan.assessmentElements;
    }

    return data;

  } catch (error) {
    console.error("Error generating assessment materials:", error);
    if (error instanceof Error && error.message.includes("API key not valid")) {
         throw new Error("API 키가 유효하지 않습니다. 키를 확인하고 다시 시도해주세요.");
    }
    return null;
  }
};