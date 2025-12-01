import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TaskList } from './components/TaskList';
import { TaskDetail } from './components/TaskDetail';
import { AssetList } from './components/AssetList';
import { PeopleList } from './components/People';
import { ShoppingList } from './components/Shopping';

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<TaskList />} />
            <Route path="/tasks/:taskId" element={<TaskDetail />} />
            <Route path="/assets" element={<AssetList />} />
            <Route path="/people" element={<PeopleList />} />
            <Route path="/shopping" element={<ShoppingList />} />
            <Route path="/library" element={
              <div className="text-center mt-20 text-slate-500">
                <h2 className="text-2xl font-bold mb-2">Library Module</h2>
                <p>Personal development and reading goals tracking coming soon.</p>
              </div>
            } />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
};

export default App;