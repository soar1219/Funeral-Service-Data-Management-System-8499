import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import GoogleVisionSetup from '../components/GoogleVisionSetup';
import { useData } from '../context/DataContext';
import googleVisionService from '../services/googleVisionService';
import toast from 'react-hot-toast';

const {
  FiCamera,
  FiUpload,
  FiEdit3,
  FiSave,
  FiRotateCcw,
  FiCheckCircle,
  FiSettings,
  FiCloud,
  FiTag,
  FiImage,
  FiPlus,
  FiX,
  FiFolder,
  FiFile,
  FiLayers,
  FiAlertTriangle
} = FiIcons;

const OCRCapture = () => {
  const { addDonation, settings, currentFuneral } = useData();
  
  // 葬儀が選択されていない場合の早期リターン
  if (!currentFuneral) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <SafeIcon icon={FiAlertTriangle} className="text-4xl text-yellow-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-yellow-800 mb-2">葬儀が選択されていません</h2>
          <p className="text-yellow-700 mb-4">
            OCR入力を開始するには、まずダッシュボードで葬儀を作成または選択してください
          </p>
          <a
            href="/"
            className="inline-block bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            ダッシュボードに戻る
          </a>
        </div>
      </div>
    );
  }

  const [selectedImages, setSelectedImages] = useState({
    front: null,
    back: null,
    innerFront: null,
    innerBack: null
  });
  const [originalFiles, setOriginalFiles] = useState({
    front: null,
    back: null,
    innerFront: null,
    innerBack: null
  });
  const [ocrResults, setOcrResults] = useState({
    front: '',
    back: '',
    innerFront: '',
    innerBack: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    fullName: '',
    relationship: '',
    address: '',
    amount: '',
    innerAmount: '',
    donationType: '',
    donationCategory: '',
    companyName: '',
    position: '',
    coNames: [],
    notes: ''
  });
  const [step, setStep] = useState(1);
  const [showSetup, setShowSetup] = useState(false);
  const [donationTypeInfo, setDonationTypeInfo] = useState(null);
  const [extractedInfo, setExtractedInfo] = useState(null);
  const [uploadMode, setUploadMode] = useState('individual');
  const [dragOverType, setDragOverType] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageType, setSelectedImageType] = useState(null);

  // ファイル入力ref
  const fileInputRefs = {
    front: useRef(null),
    back: useRef(null),
    innerFront: useRef(null),
    innerBack: useRef(null)
  };

  const cameraInputRefs = {
    front: useRef(null),
    back: useRef(null),
    innerFront: useRef(null),
    innerBack: useRef(null)
  };

  const batchFileInputRef = useRef(null);

  const imageTypes = {
    front: {
      label: '香典袋 表面',
      description: '表書き・名前が記載されている面',
      color: 'bg-blue-50 border-blue-200'
    },
    back: {
      label: '香典袋 裏面',
      description: '住所・連絡先が記載されている面',
      color: 'bg-green-50 border-green-200'
    },
    innerFront: {
      label: '中袋 表面',
      description: '金額が記載されている面',
      color: 'bg-purple-50 border-purple-200'
    },
    innerBack: {
      label: '中袋 裏面',
      description: '名前・住所が記載されている面',
      color: 'bg-orange-50 border-orange-200'
    }
  };

  // 画像圧縮関数（モバイル最適化）
  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          let { width, height } = img;

          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            } else {
              width = (width * maxWidth) / height;
              height = maxWidth;
            }
          }

          canvas.width = width;
          canvas.height = height;

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          const originalSize = file.size;
          const compressedSize = Math.round((compressedDataUrl.length - 22) * 3 / 4);

          console.log(`Image compression: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB`);

          resolve({
            dataUrl: compressedDataUrl,
            originalSize,
            compressedSize,
            compressionRatio: originalSize / compressedSize
          });
        } catch (error) {
          console.error('Image compression error:', error);
          const reader = new FileReader();
          reader.onload = (e) => resolve({
            dataUrl: e.target.result,
            originalSize: file.size,
            compressedSize: file.size,
            compressionRatio: 1
          });
          reader.readAsDataURL(file);
        }
      };

      img.onerror = () => {
        console.error('Image load error during compression');
        const reader = new FileReader();
        reader.onload = (e) => resolve({
          dataUrl: e.target.result,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 1
        });
        reader.readAsDataURL(file);
      };

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const isMobileDevice = () => {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const handleDragOver = (e, imageType) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverType(imageType);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverType(null);
  };

  const handleDrop = async (e, imageType) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverType(null);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('画像ファイルまたはPDFファイルを選択してください');
      return;
    }

    const maxSize = isMobileDevice() ? 10 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`ファイルサイズが大きすぎます（最大${maxSize / 1024 / 1024}MB）`);
      return;
    }

    try {
      const compressed = await compressImage(file, isMobileDevice() ? 600 : 800, isMobileDevice() ? 0.7 : 0.8);
      
      setOriginalFiles(prev => ({ ...prev, [imageType]: file }));
      setSelectedImages(prev => ({ ...prev, [imageType]: compressed.dataUrl }));
      
      toast.success(`${imageTypes[imageType].label}を更新しました（圧縮率: ${compressed.compressionRatio.toFixed(1)}x）`);
    } catch (error) {
      console.error('Image processing error:', error);
      toast.error('画像の処理に失敗しました');
    }
  };

  const handleImageSelect = async (imageType, event) => {
    const file = event.target.files[0];
    if (file) {
      const maxSize = isMobileDevice() ? 10 * 1024 * 1024 : 20 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`ファイルサイズが大きすぎます（最大${maxSize / 1024 / 1024}MB）`);
        event.target.value = '';
        return;
      }

      try {
        const compressed = await compressImage(file, isMobileDevice() ? 600 : 800, isMobileDevice() ? 0.7 : 0.8);
        
        setOriginalFiles(prev => ({ ...prev, [imageType]: file }));
        setSelectedImages(prev => ({ ...prev, [imageType]: compressed.dataUrl }));
        
        toast.success(`${imageTypes[imageType].label}を選択しました（圧縮率: ${compressed.compressionRatio.toFixed(1)}x）`);
      } catch (error) {
        console.error('Image processing error:', error);
        toast.error('画像の処理に失敗しました');
      }
    }
    event.target.value = '';
  };

  const canProceedToOCR = () => {
    return Object.values(selectedImages).some(img => img !== null);
  };

  const processOCR = async () => {
    if (!canProceedToOCR()) return;

    if (!googleVisionService.hasValidApiKey()) {
      setShowSetup(true);
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const results = {};
      const files = Object.entries(originalFiles).filter(([_, file]) => file !== null);
      let processedCount = 0;

      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          const targetProgress = Math.min(90, (processedCount / files.length) * 90);
          return prev < targetProgress ? prev + 5 : prev;
        });
      }, 200);

      for (const [imageType, file] of files) {
        if (file) {
          try {
            const result = await googleVisionService.recognizeText(file, {
              languageHints: settings.ocrLanguage === 'jpn' ? ['ja'] : 
                            settings.ocrLanguage === 'eng' ? ['en'] : ['ja', 'en']
            });

            if (result.success) {
              results[imageType] = result.fullText || result.text;
            } else {
              results[imageType] = '';
              console.error(`${imageType} OCR失敗:`, result.error);
            }
          } catch (error) {
            console.error(`OCR processing error for ${imageType}:`, error);
            results[imageType] = '';
            toast.error(`${imageTypes[imageType].label}の処理に失敗しました`);
          }
          processedCount++;
        }
      }

      clearInterval(progressInterval);
      setProcessingProgress(100);
      setOcrResults(results);

      // 統合情報抽出
      const extractedData = await extractComprehensiveInfo(results);
      setExtractedInfo(extractedData);

      // 香典の種類を認識
      const donationTypeResult = googleVisionService.recognizeDonationType(
        results.front || '',
        []
      );
      setDonationTypeInfo(donationTypeResult);

      setFormData({
        ...extractedData,
        donationType: donationTypeResult.type,
        donationCategory: donationTypeResult.category
      });

      setStep(3);

      let successMessage = `OCR処理が完了しました`;
      if (donationTypeResult.type) {
        successMessage += ` - ${donationTypeResult.type}を検出`;
      }
      toast.success(successMessage);

    } catch (error) {
      console.error('OCR処理エラー:', error);
      toast.error(`OCR処理に失敗しました: ${error.message}`);
      if (error.message.includes('API') || error.message.includes('認証')) {
        setShowSetup(true);
      }
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  // OCR結果から情報を抽出する関数（簡略化）
  const extractComprehensiveInfo = async (ocrResults) => {
    const extracted = {
      lastName: '',
      firstName: '',
      fullName: '',
      relationship: '',
      address: '',
      amount: '',
      innerAmount: '',
      companyName: '',
      position: '',
      coNames: [],
      notes: ''
    };

    try {
      // 全てのテキストを結合
      const allText = Object.values(ocrResults).join('\n');
      
      // 金額の抽出
      const amountMatch = allText.match(/金\s*(\d{1,3}(?:,\d{3})*)\s*円/);
      if (amountMatch) {
        extracted.amount = amountMatch[1].replace(/,/g, '');
      }

      // ノート作成
      extracted.notes = Object.entries(ocrResults)
        .filter(([_, text]) => text)
        .map(([imageType, text]) => `【${imageTypes[imageType].label}】\n${text}`)
        .join('\n\n');

    } catch (error) {
      console.error('Information extraction error:', error);
      toast.error('情報の抽出中にエラーが発生しました');
    }

    return extracted;
  };

  const handleSave = async () => {
    if (!formData.fullName?.trim() && !formData.companyName?.trim() && !formData.amount) {
      toast.error('名前、会社名、または金額のいずれかを入力してください');
      return;
    }

    setIsSaving(true);

    try {
      const cleanedFormData = {
        ...formData,
        lastName: formData.lastName?.trim() || '',
        firstName: formData.firstName?.trim() || '',
        fullName: formData.fullName?.trim() || '',
        relationship: formData.relationship?.trim() || '',
        address: formData.address?.trim() || '',
        donationType: formData.donationType || '',
        donationCategory: formData.donationCategory || '',
        companyName: formData.companyName?.trim() || '',
        position: formData.position?.trim() || '',
        notes: formData.notes?.trim() || '',
        amount: parseInt(formData.amount) || 0,
        innerAmount: parseInt(formData.innerAmount) || 0,
        coNames: formData.coNames.filter(name => name?.trim()).map(name => name.trim())
      };

      const donationData = {
        ...cleanedFormData,
        funeralId: currentFuneral.id,
        ocrResults: ocrResults,
        ocrProvider: 'google-cloud-vision',
        donationTypeConfidence: donationTypeInfo?.confidence || 0,
        extractedInfo: extractedInfo,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          timestamp: new Date().toISOString(),
          isMobile: isMobileDevice()
        },
        images: selectedImages // 画像データを含める
      };

      await addDonation(donationData);

      let successMessage = `${currentFuneral.familyName}家の香典記録を保存しました`;
      if (donationData.fullName) {
        successMessage += ` - ${donationData.fullName}`;
      } else if (donationData.companyName) {
        successMessage += ` - ${donationData.companyName}`;
      }

      toast.success(successMessage);
      resetProcess();

    } catch (error) {
      console.error('Save error:', error);
      if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
        toast.error('ストレージ容量が不足しています。古いデータを削除するか、画像なしで保存してください。');
      } else if (error.message.includes('localStorage')) {
        toast.error('データの保存に失敗しました。ブラウザの設定を確認してください。');
      } else {
        toast.error(`保存に失敗しました: ${error.message}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const resetProcess = () => {
    try {
      setSelectedImages({ front: null, back: null, innerFront: null, innerBack: null });
      setOriginalFiles({ front: null, back: null, innerFront: null, innerBack: null });
      setOcrResults({ front: '', back: '', innerFront: '', innerBack: '' });
      setFormData({
        lastName: '',
        firstName: '',
        fullName: '',
        relationship: '',
        address: '',
        amount: '',
        innerAmount: '',
        donationType: '',
        donationCategory: '',
        companyName: '',
        position: '',
        coNames: [],
        notes: ''
      });
      setDonationTypeInfo(null);
      setExtractedInfo(null);
      setStep(1);
      setProcessingProgress(0);
      setUploadMode('individual');
      setIsSaving(false);
    } catch (error) {
      console.error('Reset process error:', error);
      toast.error('リセット処理に失敗しました');
    }
  };

  const openApiSettings = () => {
    setShowSetup(true);
  };

  // 香典の種類の選択肢
  const donationTypes = [
    { value: '御霊前', label: '御霊前', category: '仏式・神式・キリスト教式' },
    { value: '御仏前', label: '御仏前', category: '仏式（四十九日後）' },
    { value: '御香典', label: '御香典', category: '仏式' },
    { value: '御香料', label: '御香料', category: '仏式' },
    { value: '御花料', label: '御花料', category: 'キリスト教式' },
    { value: '御玉串料', label: '御玉串料', category: '神式' },
    { value: '御榊料', label: '御榊料', category: '神式' },
    { value: '御供物料', label: '御供物料', category: '神式' },
    { value: '御弔慰料', label: '御弔慰料', category: '一般' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-funeral-800 mb-2">OCR入力</h1>
            <p className="text-funeral-600 mb-2">
              {currentFuneral.familyName}家の香典袋をスキャンして自動入力します
            </p>
            {currentFuneral.deceasedName && (
              <p className="text-sm text-funeral-500">故 {currentFuneral.deceasedName} 様</p>
            )}
          </div>
          <button
            onClick={openApiSettings}
            className="flex items-center space-x-2 px-4 py-2 text-funeral-600 border border-funeral-300 rounded-lg hover:bg-funeral-50 transition-colors"
          >
            <SafeIcon icon={FiCloud} />
            <span>API設定</span>
          </button>
        </div>

        {/* API状態表示 */}
        <div className={`mt-4 p-3 rounded-lg border ${
          googleVisionService.hasValidApiKey() 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-yellow-50 border-yellow-200 text-yellow-700'
        }`}>
          <div className="flex items-center">
            <SafeIcon 
              icon={googleVisionService.hasValidApiKey() ? FiCheckCircle : FiSettings} 
              className="mr-2" 
            />
            <span className="text-sm font-medium">
              {googleVisionService.hasValidApiKey() 
                ? 'Google Cloud Vision API 設定済み - モバイル最適化対応' 
                : 'Google Cloud Vision API の設定が必要です'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* プロセス表示 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= stepNum ? 'bg-funeral-600 text-white' : 'bg-funeral-200 text-funeral-500'
              }`}>
                {step > stepNum ? (
                  <SafeIcon icon={FiCheckCircle} className="text-sm" />
                ) : (
                  stepNum
                )}
              </div>
              {stepNum < 3 && (
                <div className={`w-20 h-1 mx-2 ${step > stepNum ? 'bg-funeral-600' : 'bg-funeral-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-funeral-600">
          <span>画像選択</span>
          <span>OCR処理</span>
          <span>データ編集</span>
        </div>
      </div>

      {/* ステップ1: 画像選択 */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-sm border border-funeral-200 p-6"
        >
          <h2 className="text-xl font-bold text-funeral-800 mb-6">香典袋の画像を選択してください</h2>
          
          {/* 個別選択・撮影 */}
          <div className="mb-6">
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">📱 使い方</h3>
              <p className="text-blue-700 text-sm mb-2">
                各画像エリアをクリックすると、ファイル選択またはカメラ撮影を選べます
              </p>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• <strong>ファイル選択</strong>: 既存の画像ファイルを選択</li>
                <li>• <strong>カメラ撮影</strong>: その場で直接撮影</li>
                <li>• <strong>ドラッグ&ドロップ</strong>: 画像を直接ドロップして置き換え</li>
                <li>• <strong>自動最適化</strong>: {isMobileDevice() ? '600px・70%品質に自動圧縮' : '800px・80%品質に自動圧縮'}</li>
              </ul>
            </div>

            {/* 画像選択エリア */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(imageTypes).map(([type, info]) => (
                <div key={type} className="space-y-2">
                  <div
                    className={`relative rounded-lg border-2 cursor-pointer transition-all ${
                      dragOverType === type 
                        ? 'border-blue-500 bg-blue-50' 
                        : `border-dashed ${info.color} hover:border-solid hover:border-funeral-400`
                    }`}
                    onDragOver={(e) => handleDragOver(e, type)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, type)}
                    onClick={() => {
                      setSelectedImageType(type);
                      setShowImageModal(true);
                    }}
                  >
                    <div className="aspect-square bg-funeral-50 rounded-lg overflow-hidden">
                      {selectedImages[type] ? (
                        <>
                          <img
                            src={selectedImages[type]}
                            alt={info.label}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImages(prev => ({ ...prev, [type]: null }));
                                setOriginalFiles(prev => ({ ...prev, [type]: null }));
                              }}
                              className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <SafeIcon icon={FiX} className="text-xs" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center p-4">
                            <SafeIcon icon={FiImage} className="text-3xl text-funeral-300 mx-auto mb-2" />
                            <p className="text-sm font-medium text-funeral-600 mb-1">{info.label}</p>
                            <p className="text-xs text-funeral-400 mb-2">{info.description}</p>
                            <div className="flex items-center justify-center space-x-2 text-xs text-funeral-500">
                              <SafeIcon icon={FiUpload} className="text-sm" />
                              <span>クリックして選択</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-funeral-700">{info.label}</p>
                  </div>
                  
                  {/* 隠しinput */}
                  <input
                    ref={fileInputRefs[type]}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleImageSelect(type, e)}
                    className="hidden"
                  />
                  <input
                    ref={cameraInputRefs[type]}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleImageSelect(type, e)}
                    className="hidden"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 次へボタン */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-funeral-600">
              {Object.values(selectedImages).filter(Boolean).length}枚選択済み
              {isMobileDevice() && ' (自動圧縮済み)'}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!canProceedToOCR()}
              className="px-6 py-2 bg-funeral-600 text-white rounded-lg hover:bg-funeral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              OCR処理へ進む
            </button>
          </div>
        </motion.div>
      )}

      {/* ステップ2: OCR処理 */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-sm border border-funeral-200 p-6"
        >
          <h2 className="text-xl font-bold text-funeral-800 mb-4">多面OCR処理</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-funeral-700 mb-2">選択した画像</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(selectedImages).map(([type, image]) => (
                  image && (
                    <div key={type} className="aspect-square">
                      <img
                        src={image}
                        alt={imageTypes[type].label}
                        className="w-full h-full object-cover border border-funeral-200 rounded-lg"
                      />
                      <p className="text-xs text-funeral-600 mt-1 text-center">
                        {imageTypes[type].label}
                      </p>
                    </div>
                  )
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-funeral-700 mb-2">処理状況</h3>
              {isProcessing ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-funeral-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-funeral-600 mb-2">多面OCR処理中...</p>
                  <p className="text-sm text-blue-600 mb-2">詳細情報を抽出中...</p>
                  <div className="w-full bg-funeral-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-funeral-500">{processingProgress}%</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <button
                    onClick={processOCR}
                    disabled={!googleVisionService.hasValidApiKey() || !canProceedToOCR()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {googleVisionService.hasValidApiKey() ? 'OCR処理を開始' : 'API設定が必要です'}
                  </button>
                  {!googleVisionService.hasValidApiKey() && (
                    <p className="text-sm text-red-600 mt-2">
                      右上の「API設定」ボタンからGoogle Cloud Vision APIを設定してください
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="flex items-center space-x-2 text-funeral-600 hover:text-funeral-800 transition-colors"
            >
              <SafeIcon icon={FiRotateCcw} />
              <span>画像選択に戻る</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* ステップ3: データ編集 */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-sm border border-funeral-200 p-6"
        >
          <h2 className="text-xl font-bold text-funeral-800 mb-4">
            {currentFuneral.familyName}家 - 抽出データの確認・編集
          </h2>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">💡 入力について</h3>
            <p className="text-sm text-blue-700">
              <strong>全ての項目を入力する必要はありません。</strong> 
              名前、会社名、または金額のいずれかがあれば保存できます。
              OCRで認識できなかった項目は手動で入力することもできます。
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* OCR結果表示 */}
            <div>
              <h3 className="font-semibold text-funeral-700 mb-2">OCR認識結果</h3>
              <div className="space-y-3">
                {Object.entries(ocrResults).map(([type, text]) => (
                  text && (
                    <div key={type} className="bg-funeral-50 p-3 rounded-lg border border-funeral-200">
                      <h4 className="text-sm font-medium text-funeral-700 mb-1">
                        {imageTypes[type].label}
                      </h4>
                      <div className="max-h-20 overflow-y-auto">
                        <pre className="text-xs text-funeral-600 whitespace-pre-wrap">{text}</pre>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* フォーム入力 */}
            <div className="xl:col-span-2">
              <h3 className="font-semibold text-funeral-700 mb-4">情報入力・編集</h3>
              <div className="space-y-4">
                {/* 香典の種類 */}
                <div>
                  <label className="block text-sm font-medium text-funeral-700 mb-1">
                    香典の種類
                    {donationTypeInfo?.type && (
                      <span className="text-green-600 text-xs ml-1">(自動認識)</span>
                    )}
                  </label>
                  <select
                    value={formData.donationType}
                    onChange={(e) => {
                      const selectedType = donationTypes.find(type => type.value === e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        donationType: e.target.value,
                        donationCategory: selectedType?.category || ''
                      }));
                    }}
                    className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                  >
                    <option value="">選択してください</option>
                    {donationTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} ({type.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 会社情報 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-funeral-700 mb-1">
                      会社名
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                      placeholder="会社名を入力"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-funeral-700 mb-1">
                      役職
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                      placeholder="役職を入力"
                    />
                  </div>
                </div>

                {/* 個人名 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-funeral-700 mb-1">
                      氏名
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                      placeholder="フルネームを入力"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-funeral-700 mb-1">
                      続柄・関係
                    </label>
                    <input
                      type="text"
                      value={formData.relationship}
                      onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                      className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                      placeholder="続柄・関係を入力"
                    />
                  </div>
                </div>

                {/* 金額 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-funeral-700 mb-1">
                      金額
                    </label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                      placeholder="金額を入力"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-funeral-700 mb-1">
                      住所
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                      placeholder="住所を入力"
                    />
                  </div>
                </div>

                {/* 備考 */}
                <div>
                  <label className="block text-sm font-medium text-funeral-700 mb-1">
                    備考
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows="3"
                    className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                    placeholder="備考を入力"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={resetProcess}
              className="flex items-center space-x-2 text-funeral-600 hover:text-funeral-800 transition-colors"
              disabled={isSaving}
            >
              <SafeIcon icon={FiRotateCcw} />
              <span>やり直し</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 bg-funeral-600 text-white px-6 py-2 rounded-lg hover:bg-funeral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>保存中...</span>
                </>
              ) : (
                <>
                  <SafeIcon icon={FiSave} />
                  <span>保存</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* 画像選択モーダル */}
      {showImageModal && selectedImageType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-bold text-funeral-800 mb-4 text-center">
              {imageTypes[selectedImageType].label}
            </h3>
            <p className="text-sm text-funeral-600 mb-6 text-center">
              {imageTypes[selectedImageType].description}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowImageModal(false);
                  fileInputRefs[selectedImageType].current?.click();
                }}
                className="w-full flex items-center justify-center space-x-3 p-4 border-2 border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <SafeIcon icon={FiUpload} className="text-2xl text-blue-600" />
                <div className="text-left">
                  <p className="font-medium text-blue-800">ファイルを選択</p>
                  <p className="text-sm text-blue-600">
                    デバイスから画像を選択{isMobileDevice() && ' (自動圧縮)'}
                  </p>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowImageModal(false);
                  cameraInputRefs[selectedImageType].current?.click();
                }}
                className="w-full flex items-center justify-center space-x-3 p-4 border-2 border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                <SafeIcon icon={FiCamera} className="text-2xl text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-green-800">カメラで撮影</p>
                  <p className="text-sm text-green-600">
                    その場で直接撮影{isMobileDevice() && ' (自動最適化)'}
                  </p>
                </div>
              </button>
              <button
                onClick={() => setShowImageModal(false)}
                className="w-full flex items-center justify-center space-x-3 p-4 border-2 border-funeral-300 rounded-lg hover:border-funeral-400 hover:bg-funeral-50 transition-colors"
              >
                <SafeIcon icon={FiX} className="text-2xl text-funeral-600" />
                <div className="text-left">
                  <p className="font-medium text-funeral-800">キャンセル</p>
                  <p className="text-sm text-funeral-600">選択を取り消す</p>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Google Vision Setup Modal */}
      <GoogleVisionSetup
        isOpen={showSetup}
        onClose={() => setShowSetup(false)}
        onComplete={() => {
          toast.success('Google Cloud Vision API の設定が完了しました');
        }}
      />
    </div>
  );
};

export default OCRCapture;