import BoxScoreScreen from './ui/screens/BoxScoreScreen'
import HomeScreen from './ui/screens/HomeScreen'
import { useGameStore } from './state/gameStore'

export default function App() {
  const screen = useGameStore((s) => s.screen)

  switch (screen) {
    case 'boxscore':
      return <BoxScoreScreen />
    default:
      return <HomeScreen />
  }
}
