// components/Dashboard.tsx
import React, { useState } from 'react';
import { User, ViewType } from '../types';
import Navbar from './layout/Navbar';
import ChartWrapper from './charts/ChartWrapper';
import './Dashboard.css';

interface DashboardProps {
  currentUser: User | null;
  onLogout: () => void;
  onNavigateToAdmin?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  onLogout,
  onNavigateToAdmin,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // ДОБАВИМ ПРОСТОЙ ОБРАБОТЧИК ДЛЯ ВЫБОРА ГРУППЫ
  const handleGroupSelect = (groupName: string) => {
    console.log(`📊 [Dashboard] Выбрана группа: ${groupName}`);
    setSelectedGroup(groupName);
  };

  const handleViewChange = (view: ViewType) => {
    console.log(`🔄 [Dashboard] Смена вида на: ${view}`);

    if (view === 'admin' && onNavigateToAdmin) {
      onNavigateToAdmin();
    }
  };

  return (
    <div className="dashboard">
      <Navbar
        onGroupSelect={handleGroupSelect} // ПЕРЕДАЕМ ОБРАБОТЧИК
        selectedGroup={selectedGroup}
        currentUser={currentUser}
        onLogout={onLogout}
        onNavigateToDashboard={() => {}} // Пустая функция, так как мы уже в дашборде
        showAdminButton={true}
        showGroupSelector={true} // ПОКАЗЫВАЕМ СЕЛЕКТОР ГРУПП
        currentView="dashboard"
        onViewChange={handleViewChange}
      />

      <div className="dashboard__content">
        {!selectedGroup ? (
          <div className="dashboard-welcome">
            <div className="welcome-message">
              <h2>Добро пожаловать в FinDash! 📊</h2>
              <p>Выберите группу для отображения графиков</p>
            </div>
          </div>
        ) : (
          <ChartWrapper group={selectedGroup} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
