
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateAssessmentMaterials, generateEvaluationCriteria, generateKeyPoints } from './services/geminiService';
import type { GeneratedData, AssessmentPlan, ReferenceItem } from './types';
import OutputDisplay from './components/OutputDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import HelpModal from './components/HelpModal';
import { GenerateIcon, SparklesIcon, PaperclipIcon, TrashIcon, KeyIcon, InfoIcon, PlusIcon, FileIcon, LinkIcon, DownloadIcon, CreateNewIcon, QuestionMarkCircleIcon } from './components/icons';
import { CURRICULUM_DATA, PERIODS } from './constants';

const ASSESSMENT_METHODS = [
    "서·논술형", "구술·발표", "토의·토론", "프로젝트", "실험·실습", "포트폴리오", "관찰법", "학습 일지"
];

const subjects = Object.keys(CURRICULUM_DATA);
const initialSubject = subjects[0];
const initialDomain = CURRICULUM_DATA[initialSubject][0];

type UploadedFile = {
    name: string;
    data: string; // base64 for pdf
    mimeType: string;
};

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>('');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const [planDetails, setPlanDetails] = useState<AssessmentPlan>({
    subject: initialSubject,
    domain: initialDomain,
    period: PERIODS[0],
    assessmentElements: '',
    assessmentMethod: ASSESSMENT_METHODS[0],
    achievementStandard: '',
    keyPoints: '',
    criteria: { high: '', medium: '', low: '' },
  });
  const [taskInput, setTaskInput] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  
  // Load reference items from localStorage or use defaults
  const [referenceItems, setReferenceItems] = useState<ReferenceItem[]>(() => {
    const savedItems = localStorage.getItem('assessment-reference-items');
    if (savedItems) {
      try {
        return JSON.parse(savedItems);
      } catch (e) {
        console.error('Failed to parse reference items from localStorage', e);
        return [];
      }
    }
    return [];
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceFileInputRef = useRef<HTMLInputElement>(null);
  
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCriteriaLoading, setIsCriteriaLoading] = useState<boolean>(false);
  const [isKeyPointsLoading, setIsKeyPointsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load API Key from localStorage on mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem('gemini-api-key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsApiKeySet(true);
    }
  }, []);

  // Save reference items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('assessment-reference-items', JSON.stringify(referenceItems));
  }, [referenceItems]);

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      localStorage.setItem('gemini-api-key', tempApiKey);
      setApiKey(tempApiKey);
      setIsApiKeySet(true);
      setError(null);
    } else {
        setError('API 키를 입력해주세요.');
    }
  };
  
  const handleClearApiKey = () => {
    localStorage.removeItem('gemini-api-key');
    setApiKey('');
    setTempApiKey('');
    setIsApiKeySet(false);
  };

  const handlePlanChange = (field: keyof Omit<AssessmentPlan, 'criteria'>, value: string) => {
    setPlanDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleSubjectChange = (newSubject: string) => {
    const newDomains = CURRICULUM_DATA[newSubject] || [];
    const newDomain = newDomains[0] || '';
    setPlanDetails(prev => ({
        ...prev,
        subject: newSubject,
        domain: newDomain,
    }));
  };

  const handleCriteriaChange = (level: 'high' | 'medium' | 'low', value: string) => {
    setPlanDetails(prev => ({
      ...prev,
      criteria: { ...prev.criteria, [level]: value },
    }));
  };
  
  const handleGenerateCriteria = useCallback(async () => {
    setIsCriteriaLoading(true);
    setError(null);
    const result = await generateEvaluationCriteria(planDetails.achievementStandard, planDetails.keyPoints, apiKey);
    if (result) {
      setPlanDetails(prev => ({
        ...prev,
        criteria: {
          high: result.high,
          medium: result.medium,
          low: result.low,
        },
      }));
    } else {
      setError('평가기준 생성에 실패했습니다. 성취기준과 주안점 내용을 확인해주세요.');
    }
    setIsCriteriaLoading(false);
  }, [planDetails.achievementStandard, planDetails.keyPoints, apiKey]);

  const handleGenerateKeyPoints = useCallback(async () => {
    setIsKeyPointsLoading(true);
    setError(null);
    const result = await generateKeyPoints({
        subject: planDetails.subject,
        domain: planDetails.domain,
        assessmentMethod: planDetails.assessmentMethod,
        assessmentElements: planDetails.assessmentElements,
        achievementStandard: planDetails.achievementStandard,
    }, apiKey);

    if (result) {
        const formattedKeyPoints = `[수업 주안점]\n${result.teachingPoints}\n\n[평가 주안점]\n${result.assessmentPoints}`;
        setPlanDetails(prev => ({
            ...prev,
            keyPoints: formattedKeyPoints,
        }));
    } else {
        setError('주안점 생성에 실패했습니다. 입력 내용을 확인해주세요.');
    }
    setIsKeyPointsLoading(false);
  }, [planDetails.subject, planDetails.domain, planDetails.assessmentMethod, planDetails.assessmentElements, planDetails.achievementStandard, apiKey]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.type !== 'application/pdf') {
          setError('지원하지 않는 파일 형식입니다. PDF 파일만 업로드해주세요.');
          if (fileInputRef.current) {
              fileInputRef.current.value = '';
          }
          return;
      }
      setError(null);

      const reader = new FileReader();
      reader.onload = () => {
          const base64Data = (reader.result as string).split(',')[1];
          setUploadedFile({ name: file.name, data: base64Data, mimeType: file.type });
      };
      reader.onerror = () => {
          setError('파일을 읽는 중 오류가 발생했습니다.');
      };
      reader.readAsDataURL(file);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
  };

  const handleRemoveFile = () => {
      setUploadedFile(null);
  };

  const handleAddReferenceFileClick = () => {
    referenceFileInputRef.current?.click();
  };
  
  const handleReferenceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (e) => {
      const newItem: ReferenceItem = {
        id: Date.now(),
        type: 'file',
        title: file.name,
        url: e.target?.result as string,
      };
      setReferenceItems(prev => [...prev, newItem]);
    };
    reader.readAsDataURL(file);

    if (referenceFileInputRef.current) {
        referenceFileInputRef.current.value = '';
    }
  };
  
  const handleAddLink = () => {
    const url = prompt('추가할 링크 주소(URL)를 입력하세요:');
    if (url) {
      const title = prompt('링크의 제목을 입력하세요:', url);
      if (title) {
        const newItem: ReferenceItem = {
          id: Date.now(),
          type: 'link',
          title: title,
          url: url,
        };
        setReferenceItems(prev => [...prev, newItem]);
      }
    }
  };
  
  const handleRemoveReferenceItem = (idToRemove: number) => {
    setReferenceItems(prev => prev.filter(item => item.id !== idToRemove));
  };


  const handleGenerate = useCallback(async () => {
    if (!taskInput.trim() && !uploadedFile) {
      setError('평가문항을 입력하거나 파일을 첨부해주세요.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedData(null);

    try {
        const result = await generateAssessmentMaterials(planDetails, taskInput, uploadedFile, apiKey);
        if (result) {
          setGeneratedData(result);
        } else {
          setError('자료 생성에 실패했습니다. API 키와 입력 내용을 확인 후 다시 시도해주세요.');
        }
    } catch (e: any) {
        setError(e.message || '알 수 없는 오류가 발생했습니다.');
        if (e.message.includes("API 키")) {
            handleClearApiKey();
        }
    } finally {
        setIsLoading(false);
    }
  }, [planDetails, taskInput, uploadedFile, apiKey]);
  
  const handleReset = () => {
    setGeneratedData(null);
    setError(null);
    
    setPlanDetails({
      subject: initialSubject,
      domain: initialDomain,
      period: PERIODS[0],
      assessmentElements: '',
      assessmentMethod: ASSESSMENT_METHODS[0],
      achievementStandard: '',
      keyPoints: '',
      criteria: { high: '', medium: '', low: '' },
    });
    setTaskInput('');
    setUploadedFile(null);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          #output-section { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
        }
      `}</style>
      
      <header className="bg-white shadow-md no-print">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="text-center relative">
                <h1 className="text-3xl font-bold text-gray-800">AI 기반 초등 학생 평가 시스템 🏫</h1>
                <p className="text-center text-gray-500 mt-1">수행평가계획과 평가문항을 입력하여 평가기준안과 채점기준을 손쉽게 만드세요.</p>
                <button
                    onClick={() => setIsHelpModalOpen(true)}
                    className="absolute top-1/2 right-0 -translate-y-1/2 flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors font-semibold"
                    title="사용 방법"
                >
                    <QuestionMarkCircleIcon className="w-5 h-5" />
                    <span>사용방법</span>
                </button>
            </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8 no-print">
            
            {/* --- API Key Input --- */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 space-y-4">
                <div className="flex items-center gap-3">
                    <KeyIcon className="w-6 h-6 text-yellow-600"/>
                    <h2 className="text-xl font-bold text-gray-800">Gemini API 키 설정</h2>
                </div>
                {isApiKeySet ? (
                     <div className="flex items-center justify-between bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg">
                        <p className="text-sm font-medium">API 키가 현재 사용 중인 브라우저에 저장되었습니다.</p>
                        <button onClick={handleClearApiKey} className="text-sm font-semibold text-gray-600 hover:text-gray-800">수정</button>
                    </div>
                ) : (
                    <div>
                        <div className="flex gap-2">
                           <input 
                                type="password"
                                value={tempApiKey}
                                onChange={(e) => setTempApiKey(e.target.value)}
                                placeholder="이곳에 API 키를 붙여넣으세요"
                                className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button onClick={handleSaveApiKey} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">저장</button>
                        </div>
                        <div className="flex items-start gap-2 mt-3 p-3 bg-gray-50 text-gray-600 text-xs rounded-md border">
                            <InfoIcon className="w-5 h-5 flex-shrink-0 mt-0.5"/>
                            <span>
                                API 키는 브라우저에만 저장되며 서버로 전송되지 않습니다. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold underline">Google AI Studio</a>에서 무료로 API 키를 발급받아 사용하세요.
                            </span>
                        </div>
                    </div>
                )}
            </div>
            
            <div className={`transition-opacity duration-500 ${!isApiKeySet && 'opacity-50 pointer-events-none'}`}>
                 {/* --- Assessment Plan Input --- */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 space-y-6">
                    <h2 className="text-xl font-bold text-gray-800 border-b pb-3">1. 수행평가 계획</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">교과</label>
                            <select id="subject" value={planDetails.subject} onChange={e => handleSubjectChange(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                               {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">영역</label>
                            <select id="domain" value={planDetails.domain} onChange={e => handlePlanChange('domain', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                               {CURRICULUM_DATA[planDetails.subject]?.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">시기(월)</label>
                             <select id="period" value={planDetails.period} onChange={e => handlePlanChange('period', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                               {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="assessmentMethod" className="block text-sm font-medium text-gray-700 mb-1">평가방법</label>
                            <select id="assessmentMethod" value={planDetails.assessmentMethod} onChange={e => handlePlanChange('assessmentMethod', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                                {ASSESSMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="assessmentElements" className="block text-sm font-medium text-gray-700 mb-1">평가요소</label>
                        <input type="text" id="assessmentElements" value={planDetails.assessmentElements} onChange={e => handlePlanChange('assessmentElements', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <label htmlFor="achievementStandard" className="block text-sm font-medium text-gray-700 mb-1">성취기준</label>
                        <textarea id="achievementStandard" value={planDetails.achievementStandard} onChange={e => handlePlanChange('achievementStandard', e.target.value)} rows={3} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="keyPoints" className="block text-sm font-medium text-gray-700">수업·평가 연계의 주안점</label>
                            <button onClick={handleGenerateKeyPoints} disabled={isKeyPointsLoading} className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-1 px-2 rounded-md transition-colors duration-200 text-xs disabled:bg-indigo-300">
                                <SparklesIcon className="w-3 h-3"/>
                                <span>{isKeyPointsLoading ? '생성중...' : 'AI 추천'}</span>
                            </button>
                        </div>
                        <textarea id="keyPoints" value={planDetails.keyPoints} onChange={e => handlePlanChange('keyPoints', e.target.value)} rows={4} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                             <h3 className="text-md font-semibold text-gray-700">평가기준 (상/중/하)</h3>
                             <button onClick={handleGenerateCriteria} disabled={isCriteriaLoading} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors duration-200 text-sm disabled:bg-teal-300">
                                <SparklesIcon className="w-4 h-4"/>
                                <span>{isCriteriaLoading ? '생성중...' : 'AI로 생성'}</span>
                             </button>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start">
                            <textarea aria-label="평가기준 상" value={planDetails.criteria.high} onChange={e => handleCriteriaChange('high', e.target.value)} placeholder="상" rows={5} className="w-full p-2 border border-gray-300 rounded-md bg-green-50 focus:ring-green-500 focus:border-green-500"/>
                            <textarea aria-label="평가기준 중" value={planDetails.criteria.medium} onChange={e => handleCriteriaChange('medium', e.target.value)} placeholder="중" rows={5} className="w-full p-2 border border-gray-300 rounded-md bg-yellow-50 focus:ring-yellow-500 focus:border-yellow-500"/>
                            <textarea aria-label="평가기준 하" value={planDetails.criteria.low} onChange={e => handleCriteriaChange('low', e.target.value)} placeholder="하" rows={5} className="w-full p-2 border border-gray-300 rounded-md bg-red-50 focus:ring-red-500 focus:border-red-500"/>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                        <label htmlFor="taskInput" className="block text-xl font-bold text-gray-800">
                          2. 평가문항
                        </label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="application/pdf"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                        >
                            <PaperclipIcon className="w-4 h-4" />
                            <span>파일 첨부</span>
                        </button>
                    </div>
                    <textarea
                        id="taskInput"
                        value={taskInput}
                        onChange={(e) => setTaskInput(e.target.value)}
                        rows={5}
                        className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200"
                        placeholder="평가문항의 내용을 직접 입력하거나, 위 '파일 첨부' 버튼을 눌러 PDF 파일을 첨부하세요."
                    />
                    {uploadedFile && (
                        <div className="mt-3 flex items-center justify-between bg-blue-50 border border-blue-200 text-blue-800 text-sm font-medium px-4 py-2 rounded-lg">
                            <span>첨부된 파일: {uploadedFile.name}</span>
                            <button onClick={handleRemoveFile} className="p-1 rounded-full hover:bg-blue-200" title="첨부파일 삭제">
                               <TrashIcon className="w-5 h-5 text-blue-600" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">3. 평가 관련 참고자료</h2>
                    <div className="space-y-2">
                        {referenceItems.length > 0 ? (
                            referenceItems.map(item => (
                                <div key={item.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md border">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        {item.type === 'file' ? <FileIcon className="w-5 h-5 text-blue-500 flex-shrink-0"/> : <LinkIcon className="w-5 h-5 text-green-500 flex-shrink-0"/>}
                                        <span className="text-sm text-gray-700 truncate">{item.title}</span>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {item.type === 'file' && (
                                            <a href={item.url} download={item.title} className="p-1.5 rounded-full hover:bg-gray-200" title="다운로드">
                                                <DownloadIcon className="w-5 h-5 text-gray-500"/>
                                            </a>
                                        )}
                                        {item.type === 'link' && (
                                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full hover:bg-gray-200" title="링크 열기">
                                                <LinkIcon className="w-5 h-5 text-gray-500"/>
                                            </a>
                                        )}
                                        <button onClick={() => handleRemoveReferenceItem(item.id)} className="p-1.5 rounded-full hover:bg-red-100" title="삭제">
                                            <TrashIcon className="w-5 h-5 text-red-500"/>
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                           <p className="text-sm text-gray-500 text-center py-2">첨부된 참고자료가 없습니다.</p>
                        )}
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                        <input type="file" ref={referenceFileInputRef} onChange={handleReferenceFileChange} className="hidden" />
                        <button onClick={handleAddReferenceFileClick} className="flex-1 flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm">
                            <PlusIcon className="w-4 h-4" />
                            <span>파일 추가</span>
                        </button>
                        <button onClick={handleAddLink} className="flex-1 flex items-center justify-center gap-2 bg-green-100 hover:bg-green-200 text-green-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm">
                            <LinkIcon className="w-4 h-4" />
                            <span>링크 추가</span>
                        </button>
                    </div>
                </div>

                <div className="sticky bottom-0 py-4 bg-gray-100/80 backdrop-blur-sm">
                     <button
                        onClick={handleGenerate}
                        disabled={isLoading || !isApiKeySet}
                        className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                    >
                        <GenerateIcon className="w-6 h-6"/>
                        <span>{isLoading ? '생성 중...' : 'AI로 최종 평가 자료 생성하기'}</span>
                    </button>
                </div>
            </div>
          </div>

          <div className="w-full">
            {isLoading && <div className="flex justify-center items-center h-full min-h-[500px]"><LoadingSpinner /></div>}
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg h-full flex justify-center items-center text-center">{error}</div>}
            {generatedData && <OutputDisplay data={generatedData} onReset={handleReset} />}
            {!isLoading && !error && !generatedData && (
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 text-center text-gray-500 h-full flex flex-col justify-center items-center min-h-[500px]">
                {isApiKeySet ? (
                    <>
                        <div className="mb-4 text-4xl">📋</div>
                        <h3 className="text-xl font-semibold text-gray-700 max-w-md">왼쪽의 평가 정보를 입력하고 생성 버튼을 누르면 여기에 결과가 표시됩니다.</h3>
                    </>
                ) : (
                    <>
                        <div className="mb-4 text-4xl">🔑</div>
                        <h3 className="text-xl font-semibold text-gray-700">API 키를 먼저 설정해주세요.</h3>
                        <p className="mt-2 max-w-sm">
                            왼쪽 상단에 있는 'Gemini API 키 설정'에서<br/>본인의 키를 입력하고 저장해야 생성 기능을 사용할 수 있습니다.
                        </p>
                    </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm no-print">
        created by Father gorilla
      </footer>
      
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </div>
  );
};

export default App;
