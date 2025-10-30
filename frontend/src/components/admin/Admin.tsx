// components/admin/Admin.tsx - ПОЛНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Invite, User } from '../../types';
import ConfirmDialog from '../common/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import Navbar from '../layout/Navbar';
import './Admin.css';

// Компонент загрузки данных
const UploadSection: React.FC<{
  loading: boolean;
  uploadStats: any;
  onFileUpload: (
    event: React.ChangeEvent<HTMLInputElement>,
    isCandlestick: boolean
  ) => void;
  onResetData: (ticker?: string) => void;
  availableTickers: string[];
}> = ({
  loading,
  uploadStats,
  onFileUpload,
  onResetData,
  availableTickers,
}) => {
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [resetType, setResetType] = useState<'all' | 'ticker'>('all');

  return (
    <div className="upload-section">
      <h3>Загрузка финансовых данных</h3>

      <div className="upload-card">
        <h4>📈 Линейные данные (цена закрытия)</h4>
        <p>Excel/CSV файл с колонками: date, price, volume, ticker</p>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => onFileUpload(e, false)}
          disabled={loading}
        />
      </div>

      <div className="upload-card">
        <h4>🕯️ Свечные данные (OHLC)</h4>
        <p>
          Excel/CSV файл с колонками: date, open, high, low, close, volume,
          ticker
        </p>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => onFileUpload(e, true)}
          disabled={loading}
        />
      </div>

      {uploadStats && (
        <div className="upload-stats">
          <h4>📊 Статистика загрузки</h4>

          <div className="stats-summary">
            <div>
              Файл: <strong>{uploadStats.filename}</strong>
            </div>
            <div>
              Листов обработано: <strong>{uploadStats.sheets_processed}</strong>
            </div>
            <div>
              Новых записей: <strong>{uploadStats.new_records_added}</strong>
            </div>
            <div>
              Существующих записей:{' '}
              <strong>{uploadStats.existing_records_skipped}</strong>
            </div>
            <div>
              Пропущено невалидных:{' '}
              <strong>{uploadStats.invalid_records_skipped}</strong>
            </div>
            <div>
              Дата обработки:{' '}
              <strong>
                {new Date(uploadStats.processing_date).toLocaleString()}
              </strong>
            </div>
          </div>

          <div className="tickers-details">
            <h5>Детали по тикерам:</h5>
            {uploadStats.tickers_details.map((ticker: any, index: number) => (
              <div key={index} className="ticker-card">
                <div className="ticker-header">
                  <strong>{ticker.ticker}</strong> ({ticker.group})
                </div>
                <div className="ticker-stats">
                  <span>Новые: {ticker.new_records}</span>
                  <span>Существующие: {ticker.existing_records}</span>
                  <span>Пропущено: {ticker.skipped_invalid}</span>
                  <span>Всего в файле: {ticker.total_in_file}</span>
                  <span>Всего в БД: {ticker.total_in_db_now}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="upload-card danger">
        <h4>🗑️ Опасная зона</h4>

        <div className="reset-options">
          <label>
            <input
              type="radio"
              value="all"
              checked={resetType === 'all'}
              onChange={(e) => setResetType(e.target.value as 'all' | 'ticker')}
            />
            Удалить ВСЕ данные
          </label>

          <label>
            <input
              type="radio"
              value="ticker"
              checked={resetType === 'ticker'}
              onChange={(e) => setResetType(e.target.value as 'all' | 'ticker')}
            />
            Удалить данные по тикеру
          </label>
        </div>

        {resetType === 'ticker' && (
          <div className="ticker-select">
            <label>Выберите тикер для удаления:</label>
            <select
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value)}
              disabled={availableTickers.length === 0}
            >
              <option value="">-- Выберите тикер --</option>
              {availableTickers.map((ticker) => (
                <option key={ticker} value={ticker}>
                  {ticker}
                </option>
              ))}
            </select>
            {availableTickers.length === 0 && (
              <p className="warning-text">
                ⚠️ Нет доступных тикеров для удаления
              </p>
            )}
          </div>
        )}

        <button
          onClick={() =>
            onResetData(resetType === 'ticker' ? selectedTicker : undefined)
          }
          disabled={loading || (resetType === 'ticker' && !selectedTicker)}
          className="danger-btn"
        >
          {loading ? '⏳ Удаление...' : '❌ Удалить данные'}
        </button>

        {resetType === 'ticker' && !selectedTicker && (
          <p className="warning-text">⚠️ Выберите тикер для удаления</p>
        )}
      </div>
    </div>
  );
};

// Компонент настроек индикаторов
const IndicatorSettingsSection: React.FC = () => {
  const [settings, setSettings] = useState({
    ema_period_short: 50,
    ema_period_long: 200,
    rsi_period: 14,
  });

  const saveSettings = async () => {
    try {
      const payload = {
        ema_periods: [settings.ema_period_short, settings.ema_period_long],
        rsi_period: settings.rsi_period,
      };

      await apiService.setIndicators(payload);
      alert('✅ Настройки сохранены!');
    } catch (error: any) {
      alert(
        `❌ Ошибка сохранения: ${error.response?.data?.detail || error.message}`
      );
    }
  };

  return (
    <div className="indicators-section">
      <h3>Настройка технических индикаторов</h3>

      <div className="settings-group">
        <label>Короткий период EMA:</label>
        <input
          type="number"
          value={settings.ema_period_short}
          onChange={(e) =>
            setSettings({
              ...settings,
              ema_period_short: Math.max(1, parseInt(e.target.value) || 50),
            })
          }
          min="1"
          max="500"
        />
      </div>

      <div className="settings-group">
        <label>Длинный период EMA:</label>
        <input
          type="number"
          value={settings.ema_period_long}
          onChange={(e) =>
            setSettings({
              ...settings,
              ema_period_long: Math.max(
                settings.ema_period_short + 1,
                parseInt(e.target.value) || 200
              ),
            })
          }
          min={settings.ema_period_short + 1}
          max="1000"
        />
        <small>Должен быть больше короткого периода</small>
      </div>

      <div className="settings-group">
        <label>Период RSI:</label>
        <input
          type="number"
          value={settings.rsi_period}
          onChange={(e) =>
            setSettings({
              ...settings,
              rsi_period: Math.max(1, parseInt(e.target.value) || 14),
            })
          }
          min="1"
          max="100"
        />
      </div>

      <button onClick={saveSettings} className="save-btn">
        💾 Сохранить настройки
      </button>
    </div>
  );
};

// Компонент управления пользователями
const UserManagementSection: React.FC<{
  invites: Invite[];
  onInviteCreated: () => void;
}> = ({ invites, onInviteCreated }) => {
  const [creating, setCreating] = useState<boolean>(false);
  const [inviteData, setInviteData] = useState({
    username_for: '',
    expires_in_days: 7,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

  const deleteConfirm = useConfirm();
  const adminConfirm = useConfirm();

  const activeInvites = invites.filter((invite) => !invite.is_used);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await apiService.getUsers();

      const normalizedUsers = response.map((user: any) => ({
        ...user,
        role: user.role.includes('ADMIN') ? 'admin' : 'user',
        is_active: Boolean(user.is_active),
        is_verified: Boolean(user.is_verified),
      }));

      setUsers(normalizedUsers || []);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
      alert('Ошибка загрузки списка пользователей');
    } finally {
      setLoadingUsers(false);
    }
  };

  const deleteUser = async (userId: number, username: string) => {
    deleteConfirm.confirm(
      `⚠️ Удалить пользователя "${username}"? Это действие нельзя отменить.`,
      async () => {
        try {
          await apiService.deleteUser(userId);
          alert(`✅ Пользователь ${username} удален!`);
          loadUsers();
        } catch (error: any) {
          alert(
            `❌ Ошибка удаления: ${error.response?.data?.detail || error.message}`
          );
        }
      }
    );
  };

  const toggleUserActive = async (
    userId: number,
    username: string,
    currentStatus: boolean
  ) => {
    try {
      await apiService.toggleUserActive(userId);
      alert(
        `✅ Пользователь ${username} ${currentStatus ? 'деактивирован' : 'активирован'}!`
      );
      loadUsers();
    } catch (error: any) {
      alert(`❌ Ошибка: ${error.response?.data?.detail || error.message}`);
    }
  };

  const makeUserAdmin = async (userId: number, username: string) => {
    adminConfirm.confirm(
      `🎯 Сделать пользователя "${username}" администратором?`,
      async () => {
        try {
          await apiService.makeUserAdmin(userId);
          alert(`✅ Пользователь ${username} теперь администратор!`);
          loadUsers();
        } catch (error: any) {
          alert(`❌ Ошибка: ${error.response?.data?.detail || error.message}`);
        }
      }
    );
  };

  const createInvite = async () => {
    setCreating(true);
    try {
      const payload: any = {};
      if (inviteData.username_for.trim()) {
        payload.username_for = inviteData.username_for.trim();
      }
      if (inviteData.expires_in_days !== 7) {
        payload.expires_in_days = inviteData.expires_in_days;
      }

      await apiService.createInvite(payload);
      alert('✅ Инвайт-код создан!');
      setInviteData({ username_for: '', expires_in_days: 7 });
      onInviteCreated();
    } catch (error: any) {
      alert(
        `❌ Ошибка создания: ${error.response?.data?.detail || error.message}`
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="users-section">
      <h3>Управление пользователями</h3>

      <div className="users-management">
        <h4>👥 Список пользователей</h4>

        {loadingUsers ? (
          <p>Загрузка пользователей...</p>
        ) : (
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Имя пользователя</th>
                  <th>Роль</th>
                  <th>Статус</th>
                  <th>Дата регистрации</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>
                      <span
                        className={`role-badge ${user.role === 'admin' ? 'admin' : 'user'}`}
                      >
                        {user.role === 'admin' ? '👑 Админ' : '👤 Пользователь'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}
                      >
                        {user.is_active ? '✅ Активен' : '❌ Неактивен'}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="actions">
                      <button
                        onClick={() =>
                          toggleUserActive(
                            user.id,
                            user.username,
                            user.is_active
                          )
                        }
                        className="action-btn toggle-active"
                      >
                        {user.is_active
                          ? '❌ Деактивировать'
                          : '✅ Активировать'}
                      </button>

                      {user.role !== 'admin' && (
                        <button
                          onClick={() => makeUserAdmin(user.id, user.username)}
                          className="action-btn make-admin"
                        >
                          🎯 Сделать админом
                        </button>
                      )}

                      {user.role !== 'admin' && (
                        <button
                          onClick={() => deleteUser(user.id, user.username)}
                          className="action-btn danger"
                        >
                          🗑️ Удалить
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <p className="no-users">Пользователи не найдены</p>
            )}
          </div>
        )}
      </div>

      <div className="invite-section">
        <h4>🎫 Создать инвайт-код</h4>

        <div className="invite-form">
          <div className="form-group">
            <label>Для пользователя (опционально):</label>
            <input
              type="text"
              value={inviteData.username_for}
              onChange={(e) =>
                setInviteData({ ...inviteData, username_for: e.target.value })
              }
              placeholder="Имя пользователя"
            />
          </div>

          <div className="form-group">
            <label>Срок действия (дней):</label>
            <input
              type="number"
              value={inviteData.expires_in_days}
              onChange={(e) =>
                setInviteData({
                  ...inviteData,
                  expires_in_days: parseInt(e.target.value) || 7,
                })
              }
              min="1"
              max="365"
            />
          </div>

          <button onClick={createInvite} disabled={creating}>
            {creating ? 'Создание...' : 'Создать инвайт-код'}
          </button>
        </div>
      </div>

      <div className="invites-list">
        <h4>📋 Активные инвайт-коды</h4>
        {activeInvites.length === 0 ? (
          <p>Нет активных инвайт-кодов</p>
        ) : (
          <div className="invites-grid">
            {activeInvites.map((invite) => (
              <div key={invite.id} className="invite-card">
                <div className="invite-code">
                  <strong>Код:</strong>
                  <code>{invite.invite_code}</code>
                </div>
                {invite.username_for && (
                  <div className="invite-for">
                    <strong>Для:</strong> {invite.username_for}
                  </div>
                )}
                <div className="invite-date">
                  Создан: {new Date(invite.created_at).toLocaleDateString()}
                </div>
                <div className="invite-expiry">
                  Истекает: {new Date(invite.expires_at).toLocaleDateString()}
                </div>
                <div className="invite-status">
                  {invite.is_used ? '✅ Использован' : '🟢 Активен'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        message={deleteConfirm.message}
        onConfirm={deleteConfirm.handleConfirm}
        onCancel={deleteConfirm.handleCancel}
      />

      <ConfirmDialog
        isOpen={adminConfirm.isOpen}
        message={adminConfirm.message}
        onConfirm={adminConfirm.handleConfirm}
        onCancel={adminConfirm.handleCancel}
      />
    </div>
  );
};

// Основной компонент админ-панели
interface AdminPanelProps {
  currentUser: User | null;
  onLogout: () => void;
  onNavigateToDashboard?: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  onLogout,
  onNavigateToDashboard,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'indicators' | 'users'>(
    'upload'
  );
  const [uploadStats, setUploadStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [availableTickers, setAvailableTickers] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const resetConfirm = useConfirm();
  const navigate = useNavigate();

  // Функции загрузки данных
  const loadInvites = async () => {
    try {
      const response = await apiService.getMyInvites();
      const invitesArray = response.invites || [];
      setInvites(invitesArray);
    } catch (error) {
      console.error('Ошибка загрузки инвайт-кодов:', error);
      setInvites([]);
    }
  };

  const loadTickers = async () => {
    try {
      const tickers = await apiService.getTickers();
      setAvailableTickers(tickers);
    } catch (error) {
      console.error('Ошибка загрузки тикеров:', error);
      setAvailableTickers([]);
    }
  };

  const loadGroups = async () => {
    try {
      const groupsData = await apiService.getAvailableGroups();
      const groupNames = Object.keys(groupsData);
      if (groupNames.length > 0 && groupNames[0]) {
        setSelectedGroup(groupNames[0]);
      }
    } catch (error) {
      console.error('Ошибка загрузки групп:', error);
    }
  };

  useEffect(() => {
    loadInvites();
    loadTickers();
    loadGroups();
  }, []);

  const handleGroupSelect = (groupName: string) => {
    console.log(`📊 [Admin] Выбрана группа: ${groupName}`);
    setSelectedGroup(groupName);
  };

  const handleNavigateToDashboard = () => {
    if (selectedGroup && onNavigateToDashboard) {
      onNavigateToDashboard();
    } else if (selectedGroup) {
      navigate('/dashboard');
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    isCandlestick: boolean = false
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const result = isCandlestick
        ? await apiService.uploadCandlestickData(file)
        : await apiService.uploadLinearData(file);

      setUploadStats(result.statistics);
      alert('✅ Файл успешно загружен!');
      event.target.value = '';
    } catch (error: any) {
      alert(
        `❌ Ошибка загрузки: ${error.response?.data?.detail || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = (ticker?: string) => {
    resetConfirm.confirm(
      ticker
        ? `⚠️ Удалить данные для тикера "${ticker}"? Это действие нельзя отменить.`
        : '⚠️ Удалить ВСЕ данные? Это действие нельзя отменить.',
      async () => {
        try {
          const result = await apiService.resetData(ticker);
          alert(`✅ ${result.message}`);
          loadTickers();
        } catch (error: any) {
          alert(
            `❌ Ошибка удаления: ${error.response?.data?.detail || error.message}`
          );
        }
      }
    );
  };

  return (
    <div className="admin-panel">
      <Navbar
        onGroupSelect={handleGroupSelect}
        selectedGroup={selectedGroup}
        currentUser={currentUser}
        onLogout={onLogout}
        onNavigateToDashboard={handleNavigateToDashboard}
        showGroupSelector={false}
        showAdminButton={false}
      />

      <div className="admin-content-wrapper">
        <h1>👨‍💼 Админ-панель FinDash</h1>

        <div className="admin-tabs">
          <button
            className={activeTab === 'upload' ? 'active' : ''}
            onClick={() => setActiveTab('upload')}
          >
            📤 Загрузка данных
          </button>
          <button
            className={activeTab === 'indicators' ? 'active' : ''}
            onClick={() => setActiveTab('indicators')}
          >
            📊 Настройка индикаторов
          </button>
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            👥 Управление пользователями
          </button>
        </div>

        <div className="admin-content">
          {activeTab === 'upload' && (
            <UploadSection
              loading={loading}
              uploadStats={uploadStats}
              onFileUpload={handleFileUpload}
              onResetData={handleResetData}
              availableTickers={availableTickers}
            />
          )}

          {activeTab === 'indicators' && <IndicatorSettingsSection />}

          {activeTab === 'users' && (
            <UserManagementSection
              invites={invites}
              onInviteCreated={loadInvites}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={resetConfirm.isOpen}
        message={resetConfirm.message}
        onConfirm={resetConfirm.handleConfirm}
        onCancel={resetConfirm.handleCancel}
      />
    </div>
  );
};

export default AdminPanel;
