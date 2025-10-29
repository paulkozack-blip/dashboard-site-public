// components/layout/Navbar.tsx
import React, { useState, useEffect } from 'react';
import { NavbarProps, GroupsData } from '../../types';
import { apiService } from '../../services/api';
import './Navbar.css';

const Navbar: React.FC<NavbarProps> = ({
  onGroupSelect,
  selectedGroup,
  currentUser,
  onLogout,
  onNavigateToDashboard,
  showAdminButton = true,
  showGroupSelector = true,
  currentView = 'dashboard',
  onViewChange
}) => {
  const [groups, setGroups] = useState<GroupsData>({});

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const groupsData = await apiService.getAvailableGroups();
      setGroups(groupsData);
    } catch (error) {
      console.error('Ошибка загрузки групп:', error);
    }
  };

  const handleGroupChange = (groupName: string) => {
    if (onGroupSelect) {
      onGroupSelect(groupName);
    }
  };

  const handleViewChange = (view: 'dashboard' | 'admin') => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  const handleNavigateToDashboard = () => {
    if (onNavigateToDashboard) {
      onNavigateToDashboard();
    } else if (onViewChange) {
      onViewChange('dashboard');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h2>📊 FinDash</h2>
        {currentUser && (
          <span className="user-info">
            {currentUser.username} 
            {currentUser.role === 'admin' && ' 👑'}
          </span>
        )}
      </div>

      <div className="navbar-controls">
        {/* Кнопка переключения между дашбордом и админкой */}
        <div className="view-switcher">
          <button
            className={`view-btn ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={handleNavigateToDashboard}
            // УБИРАЕМ disabled - кнопка всегда активна для навигации
          >
            📈 Графики
          </button>
          
          {showAdminButton && currentUser?.role === 'admin' && (
            <button
              className={`view-btn ${currentView === 'admin' ? 'active' : ''}`}
              onClick={() => handleViewChange('admin')}
              disabled={currentView === 'admin'}
            >
              👨‍💼 Админка
            </button>
          )}
        </div>

        {/* Селектор групп - показываем только когда нужно */}
        {showGroupSelector && Object.keys(groups).length > 0 && (
          <div className="group-selector">
            <select
              value={selectedGroup || ''}
              onChange={(e) => handleGroupChange(e.target.value)}
              className="group-select"
            >
              <option value="">Выберите группу</option>
              {Object.keys(groups).map(groupName => (
                <option key={groupName} value={groupName}>
                  {groupName} ({groups[groupName]?.type === 'line' ? '📈' : '🕯️'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Кнопка выхода */}
        <button onClick={onLogout} className="logout-btn">
          🚪 Выйти
        </button>
      </div>
    </nav>
  );
};

export default Navbar;