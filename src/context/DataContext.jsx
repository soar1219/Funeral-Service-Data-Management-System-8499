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

  // supabaseがセットされたら葬儀一覧を取得
  useEffect(() => {
    if (supabase) {
      loadFunerals();
    }
  }, [supabase]);

  // 設定の読み込み（初回のみ）
  useEffect(() => {
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
      if (!supabase) return;
      const { data: cloudFunerals, error } = await supabase
        .from('funerals')
        .select('*');
      if (error) {
        console.error('Supabase葬儀取得エラー:', error);
        toast.error('クラウドから葬儀一覧の取得に失敗しました');
        setFunerals([]);
        setCurrentFuneral(null);
        return;
      }
      // カラム名をローカル形式に変換
      const normalized = (cloudFunerals || []).map(cf => ({
        id: cf.id,
        familyName: cf.familyname,
        deceasedName: cf.deceasedname,
        relationship: cf.relationship,
        funeralDate: cf.funeraldate,
        venue: cf.venue,
        notes: cf.notes,
        createdAt: cf.createdat,
        updatedAt: cf.updatedat,
        status: cf.status
      }));
      setFunerals(normalized);
      if (normalized.length > 0) {
        setCurrentFuneral(normalized[0]);
      } else {
        setCurrentFuneral(null);
      }
    } catch (error) {
      console.error('葬儀データ読み込みエラー:', error);
      toast.error('葬儀データの読み込みに失敗しました');
      setFunerals([]);
      setCurrentFuneral(null);
    }
  };

  const loadDonationsForFuneral = async (funeralId) => {
    try {
      if (!supabase || !funeralId) return;
      const { data: cloudDonations, error } = await supabase
        .from('donations_kd7x9m2p1q')
        .select('*')
        .eq('funeral_id', funeralId);
      if (error) {
        console.error('Supabase香典取得エラー:', error);
        toast.error('クラウドから香典データの取得に失敗しました');
        setDonations([]);
        return;
      }
      setDonations(cloudDonations || []);
    } catch (error) {
      console.error('香典データ読み込みエラー:', error);
      toast.error('香典データの読み込みに失敗しました');
      setDonations([]);
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
      if (!supabase) throw new Error('Supabase未初期化');
      const newFuneral = {
        id: Date.now(),
        familyname: funeralData.familyName,
        deceasedname: funeralData.deceasedName,
        relationship: funeralData.relationship,
        funeraldate: funeralData.funeralDate,
        venue: funeralData.venue,
        notes: funeralData.notes,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
        status: 'active'
      };
      const { error } = await supabase.from('funerals').insert([newFuneral]);
      if (error) throw error;
      toast.success(`${funeralData.familyName}家の葬儀を作成しました`);
      await loadFunerals();
      return newFuneral;
    } catch (error) {
      console.error('葬儀作成エラー:', error);
      toast.error('葬儀の作成に失敗しました');
      throw error;
    }
  };

  const updateFuneral = async (funeralId, updates) => {
    try {
      if (!supabase) throw new Error('Supabase未初期化');
      const { error } = await supabase
        .from('funerals')
        .update({
          ...updates,
          updatedat: new Date().toISOString()
        })
        .eq('id', funeralId);
      if (error) throw error;
      toast.success('葬儀情報を更新しました');
      await loadFunerals();
    } catch (error) {
      console.error('葬儀更新エラー:', error);
      toast.error('葬儀情報の更新に失敗しました');
    }
  };

  const deleteFuneral = async (funeralId) => {
    try {
      if (!supabase) throw new Error('Supabase未初期化');
      // 関連する香典データも削除
      await supabase.from('donations_kd7x9m2p1q').delete().eq('funeral_id', funeralId);
      const { error } = await supabase.from('funerals').delete().eq('id', funeralId);
      if (error) throw error;
      toast.success('葬儀を削除しました');
      await loadFunerals();
    } catch (error) {
      console.error('葬儀削除エラー:', error);
      toast.error('葬儀の削除に失敗しました');
      throw error;
    }
  };

  const switchToFuneral = (funeral) => {
    setCurrentFuneral(funeral);
    toast.success(`${funeral.familyName}家の葬儀に切り替えました`);
    loadDonationsForFuneral(funeral.id);
  };

  const addDonation = async (donation) => {
    if (!currentFuneral) {
      toast.error('葬儀が選択されていません');
      throw new Error('No funeral selected');
    }
    try {
      if (!supabase) throw new Error('Supabase未初期化');
      const newDonation = {
        id: Math.floor(Date.now()),
        funeral_id: currentFuneral.id,
        fullname: donation.fullName,
        lastname: donation.lastName,
        firstname: donation.firstName,
        address: donation.address,
        amount: donation.amount,
        inneramount: donation.innerAmount,
        donationtype: donation.donationType,
        donationcategory: donation.donationCategory,
        companyname: donation.companyName,
        position: donation.position,
        conames: donation.coNames,
        notes: donation.notes,
        ocrresults: donation.ocrResults,
        ocrprovider: donation.ocrProvider,
        deviceinfo: donation.deviceInfo,
        images: donation.images,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
        lastmodified: new Date().toISOString(),
        cloudsynced: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase.from('donations_kd7x9m2p1q').insert([newDonation]);
      if (error) throw error;
      toast.success('香典を追加しました');
      await loadDonationsForFuneral(currentFuneral.id);
      return newDonation;
    } catch (error) {
      console.error('香典追加エラー:', error);
      toast.error('香典の追加に失敗しました');
      throw error;
    }
  };

  const updateDonation = async (id, updates) => {
    try {
      if (!supabase) throw new Error('Supabase未初期化');
      const { error } = await supabase
        .from('donations_kd7x9m2p1q')
        .update({
          ...updates,
          updatedat: new Date().toISOString(),
          lastmodified: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
      toast.success('香典情報を更新しました');
      if (currentFuneral) await loadDonationsForFuneral(currentFuneral.id);
    } catch (error) {
      console.error('香典更新エラー:', error);
      toast.error('香典情報の更新に失敗しました');
    }
  };

  const deleteDonation = async (id) => {
    try {
      if (!supabase) throw new Error('Supabase未初期化');
      const { error } = await supabase.from('donations_kd7x9m2p1q').delete().eq('id', id);
      if (error) throw error;
      toast.success('香典を削除しました');
      if (currentFuneral) await loadDonationsForFuneral(currentFuneral.id);
    } catch (error) {
      console.error('香典削除エラー:', error);
      toast.error('香典の削除に失敗しました');
    }
  };

  const searchDonations = (query) => {
    if (!query.trim()) return donations;
    const lowerQuery = query.toLowerCase();
    return donations.filter(donation =>
      donation.fullname?.toLowerCase().includes(lowerQuery) ||
      donation.lastname?.toLowerCase().includes(lowerQuery) ||
      donation.firstname?.toLowerCase().includes(lowerQuery) ||
      donation.companyname?.toLowerCase().includes(lowerQuery) ||
      donation.address?.toLowerCase().includes(lowerQuery) ||
      donation.amount?.toString().includes(query) ||
      (Array.isArray(donation.conames) && donation.conames.some(name => name.toLowerCase().includes(lowerQuery)))
    );
  };

  // 設定・エクスポート・インポート・ストレージ監視などは必要に応じて残す

  const value = {
    // 葬儀関連
    funerals,
    currentFuneral,
    createFuneral,
    updateFuneral,
    deleteFuneral,
    switchToFuneral,

    // 香典関連
    donations,
    addDonation,
    updateDonation,
    deleteDonation,
    searchDonations,

    // 設定・状態
    settings,
    isLoading,
    isSyncing,
    setIsLoading,
    supabaseConnected: !!supabase
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};