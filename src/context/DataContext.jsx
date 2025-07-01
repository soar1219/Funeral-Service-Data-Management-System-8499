import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [funerals, setFunerals] = useState([]);
  const [currentFuneral, setCurrentFuneral] = useState(null);
  const [donations, setDonations] = useState([]);
  const [settings, setSettings] = useState({
    funeralHomeName: '葬儀場名',
    address: '住所',
    phone: '電話番号',
    autoSave: true,
    ocrLanguage: 'jpn',
    syncEnabled: false,
    lastSyncTime: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [supabase, setSupabase] = useState(null);

  // Supabase初期化
  useEffect(() => {
    initializeSupabase();
  }, []);

  // データの読み込み
  useEffect(() => {
    loadFunerals();
    loadSettings();
  }, []);

  // 現在の葬儀が変更された時に香典データを読み込み
  useEffect(() => {
    if (currentFuneral) {
      loadDonationsForFuneral(currentFuneral.id);
    } else {
      setDonations([]);
    }
  }, [currentFuneral]);

  const initializeSupabase = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseAnonKey) {
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
        setSupabase(supabaseClient);
        console.log('Supabase initialized successfully');
      } else {
        console.log('Supabase not configured - using local storage only');
      }
    } catch (error) {
      console.error('Supabase initialization error:', error);
      console.log('Falling back to local storage only');
    }
  };

  const loadFunerals = async () => {
    try {
      const savedFunerals = localStorage.getItem('funeral-list');
      if (savedFunerals) {
        const parsedFunerals = JSON.parse(savedFunerals);
        setFunerals(parsedFunerals);
        console.log('Loaded funerals:', parsedFunerals.length);

        // 最後に使用していた葬儀を復元
        const lastFuneralId = localStorage.getItem('current-funeral-id');
        if (lastFuneralId) {
          const lastFuneral = parsedFunerals.find(f => f.id === lastFuneralId);
          if (lastFuneral) {
            setCurrentFuneral(lastFuneral);
          }
        }
      }
    } catch (error) {
      console.error('葬儀データ読み込みエラー:', error);
      toast.error('葬儀データの読み込みに失敗しました');
    }
  };

  const loadDonationsForFuneral = async (funeralId) => {
    try {
      const savedDonations = localStorage.getItem(`funeral-donations-${funeralId}`);
      if (savedDonations) {
        const parsedDonations = JSON.parse(savedDonations);
        setDonations(parsedDonations);
        console.log(`Loaded donations for funeral ${funeralId}:`, parsedDonations.length);
      } else {
        setDonations([]);
      }
    } catch (error) {
      console.error('香典データ読み込みエラー:', error);
      toast.error('香典データの読み込みに失敗しました');
    }
  };

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('funeral-settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      }
    } catch (error) {
      console.error('設定読み込みエラー:', error);
    }
  };

  const createFuneral = async (funeralData) => {
    try {
      const newFuneral = {
        id: Date.now() + Math.random(),
        ...funeralData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active' // active, completed, archived
      };

      const newFunerals = [...funerals, newFuneral];
      localStorage.setItem('funeral-list', JSON.stringify(newFunerals));
      setFunerals(newFunerals);
      
      // 新しい葬儀を現在の葬儀として設定
      setCurrentFuneral(newFuneral);
      localStorage.setItem('current-funeral-id', newFuneral.id);
      
      toast.success(`${funeralData.familyName}家の葬儀を作成しました`);
      return newFuneral;
    } catch (error) {
      console.error('葬儀作成エラー:', error);
      toast.error('葬儀の作成に失敗しました');
      throw error;
    }
  };

  const updateFuneral = async (funeralId, updates) => {
    try {
      const newFunerals = funerals.map(funeral =>
        funeral.id === funeralId
          ? {
              ...funeral,
              ...updates,
              updatedAt: new Date().toISOString()
            }
          : funeral
      );
      
      localStorage.setItem('funeral-list', JSON.stringify(newFunerals));
      setFunerals(newFunerals);
      
      // 現在の葬儀が更新された場合
      if (currentFuneral && currentFuneral.id === funeralId) {
        setCurrentFuneral({ ...currentFuneral, ...updates, updatedAt: new Date().toISOString() });
      }
      
      toast.success('葬儀情報を更新しました');
    } catch (error) {
      console.error('葬儀更新エラー:', error);
      toast.error('葬儀情報の更新に失敗しました');
    }
  };

  const switchToFuneral = (funeral) => {
    setCurrentFuneral(funeral);
    localStorage.setItem('current-funeral-id', funeral.id);
    toast.success(`${funeral.familyName}家の葬儀に切り替えました`);
  };

  const mergeData = (localData, cloudData) => {
    const merged = [...localData];
    
    cloudData.forEach(cloudItem => {
      const existingIndex = merged.findIndex(local => local.id === cloudItem.id);
      
      if (existingIndex >= 0) {
        const localItem = merged[existingIndex];
        const cloudModified = new Date(cloudItem.lastModified || cloudItem.updatedAt || cloudItem.createdAt);
        const localModified = new Date(localItem.lastModified || localItem.updatedAt || localItem.createdAt);
        
        if (cloudModified > localModified) {
          merged[existingIndex] = { ...cloudItem, cloudSynced: true };
        }
      } else {
        merged.push({ ...cloudItem, cloudSynced: true });
      }
    });

    return merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const syncToCloud = async (donationsToSync) => {
    if (!supabase || !settings.syncEnabled || !currentFuneral) return;

    try {
      setIsSyncing(true);
      
      const { data: existingData, error: fetchError } = await supabase
        .from('donations_kd7x9m2p1q')
        .select('*')
        .eq('funeral_id', currentFuneral.id);

      if (fetchError) throw fetchError;

      const localDonations = donationsToSync || donations;
      const mergedDonations = mergeData(localDonations, existingData || []);

      const newDonations = mergedDonations.filter(donation => 
        !existingData?.some(existing => existing.id === donation.id)
      );

      if (newDonations.length > 0) {
        const cloudDonations = newDonations.map(donation => ({
          ...donation,
          funeral_id: currentFuneral.id,
          images: null,
          cloudSynced: true,
          lastModified: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
          .from('donations_kd7x9m2p1q')
          .insert(cloudDonations);

        if (insertError) throw insertError;

        console.log(`Synced ${newDonations.length} new donations to cloud`);
      }

      const updatedDonations = mergedDonations.map(donation => ({
        ...donation,
        cloudSynced: true
      }));

      localStorage.setItem(`funeral-donations-${currentFuneral.id}`, JSON.stringify(updatedDonations));
      setDonations(updatedDonations);

      const newSettings = {
        ...settings,
        lastSyncTime: new Date().toISOString()
      };
      saveSettings(newSettings, true);

      toast.success(`クラウド同期完了 (${newDonations.length}件アップロード)`);

    } catch (error) {
      console.error('Cloud sync error:', error);
      toast.error(`クラウド同期に失敗しました: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncFromCloud = async () => {
    if (!supabase || !settings.syncEnabled || !currentFuneral) return;

    try {
      setIsSyncing(true);
      toast.info('クラウドからデータを同期中...');

      const { data: cloudData, error } = await supabase
        .from('donations_kd7x9m2p1q')
        .select('*')
        .eq('funeral_id', currentFuneral.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (cloudData && cloudData.length > 0) {
        const mergedDonations = mergeData(donations, cloudData);
        
        localStorage.setItem(`funeral-donations-${currentFuneral.id}`, JSON.stringify(mergedDonations));
        setDonations(mergedDonations);

        const newSettings = {
          ...settings,
          lastSyncTime: new Date().toISOString()
        };
        saveSettings(newSettings, true);

        toast.success(`クラウドから${cloudData.length}件のデータを同期しました`);
      } else {
        toast.info('クラウドに新しいデータはありません');
      }

    } catch (error) {
      console.error('Sync from cloud error:', error);
      toast.error(`クラウドからの同期に失敗しました: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncWithCloud = async () => {
    if (!supabase || !settings.syncEnabled || !currentFuneral) return;
    
    try {
      await syncFromCloud();
      await syncToCloud(donations);
    } catch (error) {
      console.error('Sync with cloud error:', error);
    }
  };

  useEffect(() => {
    if (settings.syncEnabled && supabase && currentFuneral) {
      syncWithCloud();
    }
  }, [settings.syncEnabled, supabase, currentFuneral]);

  const saveData = async (newDonations, skipSync = false) => {
    if (!currentFuneral) {
      toast.error('葬儀が選択されていません');
      return;
    }

    try {
      const dataString = JSON.stringify(newDonations);
      const dataSizeInMB = (dataString.length / (1024 * 1024)).toFixed(2);
      console.log(`Saving data size: ${dataSizeInMB}MB`);

      localStorage.setItem(`funeral-donations-${currentFuneral.id}`, dataString);
      setDonations(newDonations);

      if (settings.autoSave) {
        toast.success('データを保存しました');
      }

      if (settings.syncEnabled && supabase && !skipSync) {
        await syncToCloud(newDonations);
      }

      console.log('Successfully saved:', newDonations.length, 'donations for funeral:', currentFuneral.familyName);
    } catch (error) {
      console.error('データ保存エラー:', error);
      
      if (error.name === 'QuotaExceededError') {
        toast.error('ストレージ容量が不足しています。古いデータを削除してください。');
        try {
          const sortedDonations = [...newDonations].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          const recentDonations = sortedDonations.slice(0, Math.floor(sortedDonations.length * 0.8));
          localStorage.setItem(`funeral-donations-${currentFuneral.id}`, JSON.stringify(recentDonations));
          setDonations(recentDonations);
          toast.success(`古いデータを削除して保存しました（${recentDonations.length}件保持）`);
        } catch (retryError) {
          console.error('データ削除・再保存エラー:', retryError);
          throw retryError;
        }
      } else {
        toast.error('データの保存に失敗しました');
        throw error;
      }
    }
  };

  const saveSettings = (newSettings, skipToast = false) => {
    try {
      localStorage.setItem('funeral-settings', JSON.stringify(newSettings));
      setSettings(newSettings);
      if (!skipToast) {
        toast.success('設定を保存しました');
      }
    } catch (error) {
      console.error('設定保存エラー:', error);
      toast.error('設定の保存に失敗しました');
    }
  };

  const enableSync = async () => {
    if (!supabase) {
      toast.error('Supabaseが設定されていません');
      return false;
    }

    try {
      const { error } = await supabase
        .from('donations_kd7x9m2p1q')
        .select('count')
        .limit(1);

      if (error && error.message.includes('relation "donations_kd7x9m2p1q" does not exist')) {
        toast.info('データベーステーブルを作成中...');
        toast.error('データベーステーブルが存在しません。管理者に連絡してください。');
        return false;
      }

      const newSettings = {
        ...settings,
        syncEnabled: true
      };
      saveSettings(newSettings);

      if (currentFuneral) {
        await syncFromCloud();
      }
      
      toast.success('クラウド同期が有効になりました');
      return true;

    } catch (error) {
      console.error('Sync enable error:', error);
      toast.error(`同期の有効化に失敗しました: ${error.message}`);
      return false;
    }
  };

  const disableSync = () => {
    const newSettings = {
      ...settings,
      syncEnabled: false
    };
    saveSettings(newSettings);
    toast.info('クラウド同期を無効にしました');
  };

  const addDonation = async (donation) => {
    if (!currentFuneral) {
      toast.error('葬儀が選択されていません');
      throw new Error('No funeral selected');
    }

    try {
      console.log('Adding donation:', donation);
      const newDonation = {
        id: Date.now() + Math.random(),
        funeralId: currentFuneral.id,
        ...donation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        cloudSynced: false
      };

      const newDonations = [...donations, newDonation];
      
      await saveData(newDonations);
      return newDonation;
    } catch (error) {
      console.error('香典追加エラー:', error);
      throw error;
    }
  };

  const updateDonation = async (id, updates) => {
    try {
      const newDonations = donations.map(donation =>
        donation.id === id
          ? {
              ...donation,
              ...updates,
              updatedAt: new Date().toISOString(),
              lastModified: new Date().toISOString(),
              cloudSynced: false
            }
          : donation
      );
      await saveData(newDonations);
    } catch (error) {
      console.error('香典更新エラー:', error);
      toast.error('データの更新に失敗しました');
    }
  };

  const deleteDonation = async (id) => {
    try {
      const newDonations = donations.filter(donation => donation.id !== id);
      await saveData(newDonations);
      toast.success('データを削除しました');
    } catch (error) {
      console.error('香典削除エラー:', error);
      toast.error('データの削除に失敗しました');
    }
  };

  const searchDonations = (query) => {
    if (!query.trim()) return donations;

    const lowerQuery = query.toLowerCase();
    return donations.filter(donation =>
      donation.fullName?.toLowerCase().includes(lowerQuery) ||
      donation.lastName?.toLowerCase().includes(lowerQuery) ||
      donation.firstName?.toLowerCase().includes(lowerQuery) ||
      donation.companyName?.toLowerCase().includes(lowerQuery) ||
      donation.address?.toLowerCase().includes(lowerQuery) ||
      donation.relationship?.toLowerCase().includes(lowerQuery) ||
      donation.amount?.toString().includes(query) ||
      donation.coNames?.some(name => name.toLowerCase().includes(lowerQuery))
    );
  };

  const exportData = () => {
    try {
      if (!currentFuneral) {
        toast.error('葬儀が選択されていません');
        return;
      }

      const exportData = {
        funeral: currentFuneral,
        donations: donations
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentFuneral.familyName}家_香典記録_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('データをエクスポートしました');
    } catch (error) {
      console.error('エクスポートエラー:', error);
      toast.error('エクスポートに失敗しました');
    }
  };

  const importData = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          
          if (importedData.funeral && importedData.donations && Array.isArray(importedData.donations)) {
            // 葬儀データも含まれている場合
            const existingFuneral = funerals.find(f => f.id === importedData.funeral.id);
            if (!existingFuneral) {
              // 新しい葬儀として追加
              const newFunerals = [...funerals, importedData.funeral];
              localStorage.setItem('funeral-list', JSON.stringify(newFunerals));
              setFunerals(newFunerals);
            }
            
            // 該当葬儀に切り替え
            setCurrentFuneral(importedData.funeral);
            localStorage.setItem('current-funeral-id', importedData.funeral.id);
            
            // 香典データを保存
            await saveData(importedData.donations);
            toast.success('葬儀データと香典記録をインポートしました');
            resolve(importedData);
          } else if (Array.isArray(importedData)) {
            // 香典データのみの場合
            if (!currentFuneral) {
              toast.error('葬儀を選択してからインポートしてください');
              reject(new Error('No funeral selected'));
              return;
            }
            await saveData(importedData);
            toast.success('香典記録をインポートしました');
            resolve(importedData);
          } else {
            throw new Error('無効なデータ形式');
          }
        } catch (error) {
          console.error('インポートエラー:', error);
          toast.error('インポートに失敗しました');
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  };

  const checkStorageStatus = () => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(estimate => {
          const usedMB = (estimate.usage / (1024 * 1024)).toFixed(2);
          const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(2);
          const usagePercentage = (estimate.usage / estimate.quota) * 100;

          console.log(`Storage: ${usedMB}MB / ${quotaMB}MB (${usagePercentage.toFixed(1)}%)`);

          if (usagePercentage > 90) {
            toast.error('ストレージ容量が不足しています（90%以上使用中）');
          } else if (usagePercentage > 75) {
            toast.warning('ストレージ容量が残り少なくなっています');
          }
        });
      }
    } catch (error) {
      console.error('Storage check error:', error);
    }
  };

  useEffect(() => {
    checkStorageStatus();
    const interval = setInterval(checkStorageStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const value = {
    // 葬儀関連
    funerals,
    currentFuneral,
    createFuneral,
    updateFuneral,
    switchToFuneral,
    
    // 香典関連
    donations,
    addDonation,
    updateDonation,
    deleteDonation,
    searchDonations,
    
    // 設定・同期
    settings,
    isLoading,
    isSyncing,
    setIsLoading,
    saveSettings,
    exportData,
    importData,
    checkStorageStatus,
    syncEnabled: settings.syncEnabled,
    lastSyncTime: settings.lastSyncTime,
    enableSync,
    disableSync,
    syncFromCloud,
    syncToCloud: () => syncToCloud(donations),
    supabaseConnected: !!supabase
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};