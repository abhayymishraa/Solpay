import '@solana/wallet-adapter-react-ui/styles.css';
import TabSwitcher from './components/TabSwitcher';

export default function App() {
  return (
    <main className="min-h-screen bg-gray-50">
      <TabSwitcher />
    </main>
  )
}
