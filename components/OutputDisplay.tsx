
import React, { useState } from 'react';
import type { GeneratedData } from '../types';
import { PrintIcon, CopyIcon, CreateNewIcon } from './icons';

interface OutputDisplayProps {
  data: GeneratedData;
  onReset: () => void;
}

const OutputDisplay: React.FC<OutputDisplayProps> = ({ data, onReset }) => {
    const { criteria, rubric, scoringSummary, exampleAnswers } = data;
    const [copySuccess, setCopySuccess] = useState('');

    const handlePrint = () => {
        window.print();
    };
    
    const copyToClipboard = () => {
        const rubricHeader = `| 수준 | 배점 | ${rubric.criteria.join(' | ')} |`;
        const rubricHeaderSeparator = `|---|---|${rubric.criteria.map(() => '---').join('|')}|`;

        const rubricRows = rubric.levels
            .sort((a, b) => (b.score || '').localeCompare(a.score || ''))
            .map(level => `| ${level.level} | ${level.score} | ${level.descriptions.join(' | ')} |`)
            .join('\n');
            
        const summaryText = `
## 종합 평가 기준

| 수준 | 총점 |
|---|---|
| 상 | ${scoringSummary.high} |
| 중 | ${scoringSummary.medium} |
| 하 | ${scoringSummary.low} |
        `;
        
        const exampleAnswersText = exampleAnswers.map(ea => `### ${ea.question}\n\n${ea.answer}`).join('\n\n');

        const textToCopy = `
## 평가기준안

| 항목 | 내용 |
|---|---|
| 단원 | ${criteria.unit} |
| 평가 영역 | ${criteria.assessmentArea} |
| 평가 시기 | ${criteria.assessmentPeriod} |
| 평가 방법 | ${criteria.assessmentMethod} |
| 성취기준 | ${criteria.achievementStandard} |
| 교과역량 | ${criteria.subjectCompetencies.join(', ')} |
| 평가 요소 | ${criteria.assessmentElements} |

## 채점기준

${rubricHeader}
${rubricHeaderSeparator}
${rubricRows}

## 예시 답안

${exampleAnswersText}

${summaryText}
        `;

        navigator.clipboard.writeText(textToCopy.trim()).then(() => {
            setCopySuccess('복사되었습니다!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => {
            setCopySuccess('복사에 실패했습니다.');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    return (
        <div id="output-section" className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200 w-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">AI 생성 결과</h2>
                <div className="flex gap-2">
                    <button
                        onClick={onReset}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm print:hidden"
                        title="새로 만들기"
                    >
                        <CreateNewIcon className="w-4 h-4" />
                        <span>새로 만들기</span>
                    </button>
                    <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm print:hidden"
                        title="Copy as Markdown"
                    >
                        <CopyIcon className="w-4 h-4" />
                        <span>{copySuccess || '복사'}</span>
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm print:hidden"
                        title="Print"
                    >
                        <PrintIcon className="w-4 h-4" />
                        <span>인쇄</span>
                    </button>
                </div>
            </div>

            <div className="space-y-10">
                <div>
                    <h3 className="text-xl font-bold text-blue-700 border-b-2 border-blue-200 pb-2 mb-4">평가기준안</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600 border-collapse">
                            <tbody>
                                <tr className="border-b"><td className="font-semibold p-3 bg-blue-50 w-1/4">단원</td><td className="p-3">{criteria.unit}</td></tr>
                                <tr className="border-b"><td className="font-semibold p-3 bg-blue-50">평가 영역</td><td className="p-3">{criteria.assessmentArea}</td></tr>
                                <tr className="border-b"><td className="font-semibold p-3 bg-blue-50">평가 시기</td><td className="p-3">{criteria.assessmentPeriod}</td></tr>
                                <tr className="border-b"><td className="font-semibold p-3 bg-blue-50">평가 방법</td><td className="p-3">{criteria.assessmentMethod}</td></tr>
                                <tr className="border-b"><td className="font-semibold p-3 bg-blue-50">성취기준</td><td className="p-3">{criteria.achievementStandard}</td></tr>
                                <tr className="border-b"><td className="font-semibold p-3 bg-blue-50">교과역량</td><td className="p-3">{criteria.subjectCompetencies.join(', ')}</td></tr>
                                <tr><td className="font-semibold p-3 bg-blue-50">평가 요소</td><td className="p-3">{criteria.assessmentElements}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold text-green-700 border-b-2 border-green-200 pb-2 mb-4">채점기준</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600 border border-gray-200">
                             <thead className="bg-green-50 text-gray-700 font-semibold">
                                <tr>
                                    <th className="p-3 border border-gray-200 w-16 text-center">수준</th>
                                    <th className="p-3 border border-gray-200 w-16 text-center">배점</th>
                                    {rubric.criteria.map((criterion, index) => (
                                        <th key={index} className="p-3 border border-gray-200 text-center">{criterion}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rubric.levels.sort((a, b) => (b.score || '').localeCompare(a.score || '')).map((level) => (
                                    <tr key={level.level} className="border-b hover:bg-gray-50">
                                        <td className="p-3 border border-gray-200 text-center font-bold">{level.level}</td>
                                        <td className="p-3 border border-gray-200 text-center font-semibold">{level.score}</td>
                                        {level.descriptions.map((desc, index) => (
                                           <td key={index} className="p-3 border border-gray-200">{desc}</td> 
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold text-orange-700 border-b-2 border-orange-200 pb-2 mb-4">예시 답안</h3>
                     <div className="space-y-4">
                        {exampleAnswers.map((item, index) => (
                             <div key={index} className="bg-orange-50 p-4 rounded-lg">
                                <p className="font-semibold text-gray-800 mb-2">{item.question}</p>
                                <div className="text-gray-700 whitespace-pre-wrap">
                                    {item.answer}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold text-purple-700 border-b-2 border-purple-200 pb-2 mb-4">종합 평가 기준</h3>
                    <div className="overflow-x-auto">
                         <table className="w-full text-sm text-left text-gray-600 border-collapse max-w-sm">
                            <thead>
                                <tr className="bg-purple-50">
                                    <th className="font-semibold p-3 text-gray-700 w-1/4 text-center">수준</th>
                                    <th className="font-semibold p-3 text-gray-700 text-center">총점</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b"><td className="font-bold p-3 bg-purple-50">상</td><td className="p-3">{scoringSummary.high}</td></tr>
                                <tr className="border-b"><td className="font-bold p-3 bg-purple-50">중</td><td className="p-3">{scoringSummary.medium}</td></tr>
                                <tr><td className="font-bold p-3 bg-purple-50">하</td><td className="p-3">{scoringSummary.low}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <footer className="text-center text-xs text-gray-400 mt-10">
                <p className="max-w-xl mx-auto break-keep leading-relaxed">생성된 자료는 참고용이며, 실제 적용 시에는 교사의 전문적인 판단에 따라 수정 및 보완이 필요합니다.</p>
            </footer>
        </div>
    );
};

export default OutputDisplay;