import { useCargoStore } from './hooks/useCargoStore';
import { NavSidebar } from './components/NavSidebar/NavSidebar';
import { Header } from './components/Header/Header';
import { LeftPanel } from './components/LeftPanel/LeftPanel';
import { ContainerView } from './components/ContainerView/ContainerView';
import { RightPanel } from './components/RightPanel/RightPanel';

function App() {
  const store = useCargoStore();
  return (
    <div className="h-screen flex bg-white text-gray-900 overflow-hidden">
      <NavSidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header />
        <div className="flex-1 flex overflow-hidden min-w-0">
          <LeftPanel store={store} />
          <ContainerView store={store} />
          <RightPanel store={store} />
        </div>
      </div>
    </div>
  );
}

export default App;
