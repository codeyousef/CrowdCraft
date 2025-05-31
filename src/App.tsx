import { IsometricGrid } from './components/IsometricGrid';
import { BlockSelector } from './components/BlockSelector';

function App() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-text-primary">
      <IsometricGrid />
      <BlockSelector />
    </div>
  );
}

export default App;