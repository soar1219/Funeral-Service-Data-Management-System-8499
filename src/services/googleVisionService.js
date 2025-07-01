// Google Cloud Vision API サービス
class GoogleVisionService {
  constructor() {
    // 環境変数またはローカルストレージからAPIキーを取得
    this.apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY || 
                  localStorage.getItem('google-cloud-api-key') ||
                  'AIzaSyAmapxk4pObGmXLAQh3hWgv7ZLca-ocsnY'; // フォールバック
    this.projectId = import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID || 'ancient-booster-464612-g8';
    this.endpoint = 'https://vision.googleapis.com/v1/images:annotate';
  }

  // APIキーの設定
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    localStorage.setItem('google-cloud-api-key', apiKey);
  }

  // APIキーの取得
  getApiKey() {
    return this.apiKey;
  }

  // プロジェクトIDの取得
  getProjectId() {
    return this.projectId;
  }

  // APIキーの有効性チェック
  hasValidApiKey() {
    return this.apiKey && this.apiKey.trim().length > 0;
  }

  // 画像をBase64に変換
  async imageToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // data:image/jpeg;base64, の部分を除去
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Google Cloud Vision API でOCR実行
  async recognizeText(imageFile, options = {}) {
    if (!this.hasValidApiKey()) {
      throw new Error('Google Cloud Vision API キーが設定されていません');
    }

    try {
      // 画像をBase64に変換
      const base64Image = await this.imageToBase64(imageFile);

      // API リクエストボディ
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 50 // より多くのテキストを取得
              },
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 1
              }
            ],
            imageContext: {
              languageHints: options.languageHints || ['ja', 'en']
            }
          }
        ]
      };

      // API コール
      const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      // エラーチェック
      if (data.responses?.[0]?.error) {
        throw new Error(`Vision API Error: ${data.responses[0].error.message}`);
      }

      // テキスト抽出
      const textAnnotations = data.responses?.[0]?.textAnnotations;
      const fullTextAnnotation = data.responses?.[0]?.fullTextAnnotation;

      return {
        success: true,
        text: textAnnotations?.[0]?.description || '',
        fullText: fullTextAnnotation?.text || '',
        textAnnotations: textAnnotations || [],
        confidence: this.calculateConfidence(textAnnotations),
        detectedLanguages: this.extractLanguages(fullTextAnnotation),
        rawResponse: data
      };

    } catch (error) {
      console.error('Google Vision API Error:', error);
      return {
        success: false,
        error: error.message,
        text: '',
        fullText: '',
        textAnnotations: []
      };
    }
  }

  // 信頼度計算
  calculateConfidence(textAnnotations) {
    if (!textAnnotations || textAnnotations.length === 0) return 0;
    
    // テキストの長さと検出されたテキスト数から信頼度を推定
    const totalText = textAnnotations[0]?.description || '';
    const textLength = totalText.length;
    const annotationCount = textAnnotations.length;
    
    if (textLength > 50 && annotationCount > 5) return 0.95;
    if (textLength > 20 && annotationCount > 3) return 0.85;
    if (textLength > 10 && annotationCount > 1) return 0.75;
    if (textLength > 0) return 0.65;
    
    return 0.0;
  }

  // 検出された言語の抽出
  extractLanguages(fullTextAnnotation) {
    if (!fullTextAnnotation?.pages) return ['ja'];
    
    const languages = new Set();
    fullTextAnnotation.pages.forEach(page => {
      page.property?.detectedLanguages?.forEach(lang => {
        languages.add(lang.languageCode);
      });
    });
    
    return Array.from(languages).length > 0 ? Array.from(languages) : ['ja'];
  }

  // 香典の種類を認識
  recognizeDonationType(text, textAnnotations = []) {
    // 一般的な香典の表書きパターン
    const donationTypes = [
      { pattern: /御霊前|ご霊前/i, type: '御霊前', category: '仏式・神式・キリスト教式' },
      { pattern: /御仏前|ご仏前/i, type: '御仏前', category: '仏式（四十九日後）' },
      { pattern: /御香典|ご香典/i, type: '御香典', category: '仏式' },
      { pattern: /御香料|ご香料/i, type: '御香料', category: '仏式' },
      { pattern: /御花料|ご花料/i, type: '御花料', category: 'キリスト教式' },
      { pattern: /御玉串料|ご玉串料/i, type: '御玉串料', category: '神式' },
      { pattern: /御榊料|ご榊料/i, type: '御榊料', category: '神式' },
      { pattern: /御供物料|ご供物料/i, type: '御供物料', category: '神式' },
      { pattern: /御弔慰料|ご弔慰料/i, type: '御弔慰料', category: '一般' },
      { pattern: /御悔|ご悔/i, type: '御悔', category: '一般' },
      { pattern: /御供|ご供/i, type: '御供', category: '仏式' }
    ];

    // テキスト全体から検索
    for (const donationType of donationTypes) {
      if (donationType.pattern.test(text)) {
        return {
          type: donationType.type,
          category: donationType.category,
          confidence: 0.9
        };
      }
    }

    // 個別のテキスト注釈からも検索（位置情報を考慮）
    if (textAnnotations && textAnnotations.length > 1) {
      // Y座標が小さい（上部の）テキストを優先的に検査
      const sortedAnnotations = textAnnotations
        .slice(1) // 最初の要素は全体テキストなのでスキップ
        .filter(annotation => annotation.boundingPoly && annotation.boundingPoly.vertices)
        .sort((a, b) => {
          const aY = a.boundingPoly.vertices[0].y || 0;
          const bY = b.boundingPoly.vertices[0].y || 0;
          return aY - bY;
        });

      // 上部30%のテキストを検査（水引の上部分）
      const topThird = Math.floor(sortedAnnotations.length * 0.3);
      const topAnnotations = sortedAnnotations.slice(0, Math.max(topThird, 5));

      for (const annotation of topAnnotations) {
        const annotationText = annotation.description || '';
        for (const donationType of donationTypes) {
          if (donationType.pattern.test(annotationText)) {
            return {
              type: donationType.type,
              category: donationType.category,
              confidence: 0.85,
              position: 'top_section'
            };
          }
        }
      }
    }

    return {
      type: '',
      category: '',
      confidence: 0
    };
  }

  // API使用量チェック（概算）
  async checkApiUsage() {
    return {
      status: 'available',
      message: 'API使用量はGoogle Cloud Consoleで確認してください',
      projectId: this.projectId
    };
  }

  // 設定の妥当性チェック
  async validateConfiguration() {
    if (!this.hasValidApiKey()) {
      return {
        valid: false,
        message: 'APIキーが設定されていません'
      };
    }

    try {
      // 小さなテスト画像でAPIをテスト (1x1 白い画像)
      const testImageBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A';
      
      const testResponse = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: {
              content: testImageBase64
            },
            features: [{
              type: 'TEXT_DETECTION',
              maxResults: 1
            }]
          }]
        })
      });

      if (testResponse.ok) {
        const testData = await testResponse.json();
        return {
          valid: true,
          message: 'Google Cloud Vision API の設定が正常です',
          projectId: this.projectId,
          testResponse: testData
        };
      } else {
        const errorData = await testResponse.json();
        return {
          valid: false,
          message: `API設定エラー: ${errorData.error?.message || 'Unknown error'}`,
          status: testResponse.status
        };
      }
    } catch (error) {
      return {
        valid: false,
        message: `接続エラー: ${error.message}`
      };
    }
  }

  // APIキーの形式チェック
  isValidApiKeyFormat(apiKey) {
    // Google Cloud API キーの一般的な形式をチェック
    return /^AIza[0-9A-Za-z_-]{35}$/.test(apiKey);
  }

  // デバッグ情報の取得
  getDebugInfo() {
    return {
      hasApiKey: this.hasValidApiKey(),
      apiKeyLength: this.apiKey ? this.apiKey.length : 0,
      apiKeyFormat: this.apiKey ? this.isValidApiKeyFormat(this.apiKey) : false,
      projectId: this.projectId,
      endpoint: this.endpoint
    };
  }
}

// シングルトンインスタンス
const googleVisionService = new GoogleVisionService();

export default googleVisionService;