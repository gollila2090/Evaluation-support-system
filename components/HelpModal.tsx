
import React from 'react';
import { XIcon, KeyIcon } from './icons';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 no-print"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-800">사용 방법 안내</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6 text-gray-700">
          <section>
            <h3 className="text-lg font-semibold text-blue-700 mb-2">시작하기: API 키 설정</h3>
            <p className="text-sm leading-relaxed">
              이 앱을 사용하려면 먼저 개인 Gemini API 키가 필요합니다. API 키는 평가 자료 생성을 위해 AI 모델과 통신하는 데 사용됩니다.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold underline">Google AI Studio</a>에 방문하여 무료로 API 키를 발급받으세요.</li>
              <li>발급받은 키를 앱의 'Gemini API 키 설정' 부분에 붙여넣고 '저장' 버튼을 누릅니다.</li>
              <li className="font-semibold">보안 안내: API 키는 현재 사용 중인 브라우저 내에만 안전하게 저장되며, 외부 서버로 전송되지 않습니다.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-blue-700 mb-2">1단계: 수행평가 계획 입력</h3>
            <p className="text-sm leading-relaxed">
              생성할 평가 자료의 기반이 되는 수행평가 계획을 구체적으로 입력합니다. 각 항목이 명확할수록 AI가 더 정확한 결과를 생성합니다.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li><strong>교과, 영역, 시기, 평가방법:</strong> 평가의 기본 정보를 선택합니다.</li>
              <li><strong>평가요소:</strong> 학생들의 성취를 통해 확인하고자 하는 핵심 역량이나 지식을 간결하게 입력합니다. (예: 글쓴이의 주장 파악하기)</li>
              <li><strong>성취기준:</strong> 교육과정 성취기준의 내용이나 코드를 입력합니다.</li>
              <li><strong>수업·평가 연계의 주안점:</strong> 수업과 평가의 방향성을 입력합니다. 'AI 추천' 버튼으로 자동 완성을 도울 수 있습니다.</li>
              <li><strong>평가기준 (상/중/하):</strong> 학생의 성취 수준을 판단하는 기준을 서술합니다. 'AI로 생성' 버튼을 누르면 성취기준과 주안점을 바탕으로 AI가 자동으로 기준을 작성해줍니다.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-blue-700 mb-2">2단계: 평가문항 입력</h3>
            <p className="text-sm leading-relaxed">
              실제 평가에 사용할 문항을 입력합니다. 직접 내용을 입력하거나, 문항이 담긴 PDF 파일을 첨부할 수 있습니다. AI는 이 정보를 바탕으로 채점기준과 예시 답안을 생성합니다.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-blue-700 mb-2">3단계: 평가 관련 참고자료 (선택 사항)</h3>
            <p className="text-sm leading-relaxed">
              평가와 관련된 파일(수업 자료, 활동지 등)이나 웹사이트 링크를 첨부하여 관리할 수 있습니다. <strong>이 자료는 AI 생성에 직접 사용되지 않으며, 사용자의 편의를 위한 보관용입니다.</strong>
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-blue-700 mb-2">4단계: AI로 최종 자료 생성 및 활용</h3>
            <p className="text-sm leading-relaxed">
              모든 정보 입력이 끝나면, 하단의 'AI로 최종 평가 자료 생성하기' 버튼을 클릭하세요. 잠시 기다리면 오른쪽에 결과가 나타납니다.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li><strong>새로 만들기:</strong> 모든 입력 내용과 결과를 초기화하고 새로 시작합니다.</li>
              <li><strong>복사:</strong> 생성된 모든 결과를 마크다운 형식으로 클립보드에 복사하여 한글(hwp) 등의 문서에 붙여넣을 수 있습니다.</li>
              <li><strong>인쇄:</strong> 생성된 결과 페이지를 인쇄합니다.</li>
            </ul>
          </section>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 text-center">
            <button
                onClick={onClose}
                className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700"
            >
                닫기
            </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
