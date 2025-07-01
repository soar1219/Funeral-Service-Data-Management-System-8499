import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import googleVisionService from '../services/googleVisionService';
import toast from 'react-hot-toast';

const { FiKey, FiCheck, FiX, FiEye, FiEyeOff, FiHelpCircle, FiExternalLink, FiInfo } = FiIcons;

const GoogleVisionSetup = ({ isOpen, onClose, onComplete }) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const existingKey = googleVisionService.getApiKey();
      if (existingKey) {
        setApiKey(existingKey);
      }
      // デバッグ情報を取得
      setDebugInfo(googleVisionService.getDebugInfo());
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('APIキーを入力してください');
      return;
    }

    setIsValidating(true);
    try {
      // APIキーを設定
      googleVisionService.setApiKey(apiKey.trim());
      
      // 設定の検証
      const validation = await googleVisionService.validateConfiguration();
      setValidationResult(validation);
      
      if (validation.valid) {
        toast.success('Google Cloud Vision API の設定が完了しました');
        onComplete && onComplete();
        onClose();
      } else {
        toast.error(validation.message);
      }
    } catch (error) {
      console.error('API設定エラー:', error);
      toast.error('API設定の検証に失敗しました');
      setValidationResult({
        valid: false,
        message: error.message
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      toast.error('APIキーを入力してください');
      return;
    }

    setIsValidating(true);
    try {
      googleVisionService.setApiKey(apiKey.trim());
      const validation = await googleVisionService.validateConfiguration();
      setValidationResult(validation);
      
      if (validation.valid) {
        toast.success('API接続テスト成功');
      } else {
        toast.error(validation.message);
      }
    } catch (error) {
      toast.error('接続テストに失敗しました');
      setValidationResult({
        valid: false,
        message: error.message
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleUseDefault = () => {
    const defaultApiKey = 'AIzaSyAmapxk4pObGmXLAQh3hWgv7ZLca-ocsnY';
    setApiKey(defaultApiKey);
    toast.success('デフォルトAPIキーを設定しました');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiKey} className="text-xl text-blue-600" />
            <h2 className="text-xl font-bold text-funeral-800">Google Cloud Vision API 設定</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-funeral-400 hover:text-funeral-600 transition-colors"
          >
            <SafeIcon icon={FiX} className="text-xl" />
          </button>
        </div>

        {/* 現在の設定状況 */}
        <div className={`mb-6 p-4 rounded-lg border ${
          googleVisionService.hasValidApiKey() 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-yellow-50 border-yellow-200 text-yellow-700'
        }`}>
          <div className="flex items-center mb-2">
            <SafeIcon 
              icon={googleVisionService.hasValidApiKey() ? FiCheck : FiInfo} 
              className="mr-2" 
            />
            <span className="font-medium">
              {googleVisionService.hasValidApiKey() ? 'API設定済み' : 'API設定が必要'}
            </span>
          </div>
          {debugInfo && (
            <div className="text-sm">
              <p>プロジェクトID: {debugInfo.projectId}</p>
              <p>APIキー形式: {debugInfo.apiKeyFormat ? '正常' : '要確認'}</p>
            </div>
          )}
        </div>

        {/* クイック設定 */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-blue-800">クイック設定</h3>
            <button
              onClick={handleUseDefault}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              デフォルトAPIキーを使用
            </button>
          </div>
          <p className="text-sm text-blue-700">
            設定済みのAPIキーを使用して、すぐにOCR機能を利用できます
          </p>
        </div>

        {/* 設定手順 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center mb-3">
            <SafeIcon icon={FiHelpCircle} className="text-gray-600 mr-2" />
            <h3 className="font-semibold text-gray-800">手動設定手順</h3>
          </div>
          <ol className="text-sm text-gray-700 space-y-2">
            <li>1. <a 
              href="https://console.cloud.google.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline inline-flex items-center"
            >
              Google Cloud Console <SafeIcon icon={FiExternalLink} className="ml-1 text-xs" />
            </a> にアクセス</li>
            <li>2. 新しいプロジェクトを作成、または既存のプロジェクトを選択</li>
            <li>3. 「APIとサービス」→「ライブラリ」から「Cloud Vision API」を有効化</li>
            <li>4. 「APIとサービス」→「認証情報」でAPIキーを作成</li>
            <li>5. 必要に応じてAPIキーに制限を設定（推奨）</li>
            <li>6. 生成されたAPIキーを下記に入力</li>
          </ol>
        </div>

        {/* APIキー入力 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-funeral-700 mb-2">
            Google Cloud Vision API キー *
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="AIzaSy..."
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-funeral-400 hover:text-funeral-600"
            >
              <SafeIcon icon={showApiKey ? FiEyeOff : FiEye} />
            </button>
          </div>
        </div>

        {/* 検証結果 */}
        {validationResult && (
          <div className={`mb-6 p-4 rounded-lg border ${
            validationResult.valid 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <div className="flex items-center">
              <SafeIcon 
                icon={validationResult.valid ? FiCheck : FiX} 
                className={`mr-2 ${validationResult.valid ? 'text-green-600' : 'text-red-600'}`} 
              />
              <span className="font-medium">
                {validationResult.valid ? '設定成功' : 'エラー'}
              </span>
            </div>
            <p className="mt-1 text-sm">{validationResult.message}</p>
            {validationResult.projectId && (
              <p className="mt-1 text-xs">プロジェクトID: {validationResult.projectId}</p>
            )}
          </div>
        )}

        {/* 注意事項 */}
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-2">重要な注意事項</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• APIキーは機密情報です。第三者と共有しないでください</li>
            <li>• APIの使用量に応じて料金が発生します（月1000回まで無料）</li>
            <li>• APIキーの制限設定を行うことを強く推奨します</li>
            <li>• 本番環境では環境変数での管理を推奨します</li>
          </ul>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleTestConnection}
            disabled={isValidating || !apiKey.trim()}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                <span>テスト中...</span>
              </>
            ) : (
              <>
                <SafeIcon icon={FiCheck} />
                <span>接続テスト</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleSave}
            disabled={isValidating || !apiKey.trim()}
            className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SafeIcon icon={FiKey} />
            <span>設定を保存</span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-sm text-funeral-500 hover:text-funeral-700 transition-colors"
          >
            後で設定する
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default GoogleVisionSetup;