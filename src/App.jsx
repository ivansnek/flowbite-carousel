import viteLogo from '/vite.svg'
import { Carousel } from './components/carousel'
import './App.css'

const defaultCarouselItems = [
  'bg-yellow-500',
  'bg-purple-600',
  'bg-blue-500',
  'bg-gray-500',
  'bg-green-500'
];

function App() {
  return (
    <>
      <div className="w-[1000px] h-[500px]">
        <Carousel scrollable type="static">
          {defaultCarouselItems.map((bg, index) => (
            <div key={index} className={`h-full w-full flex flex-col justify-center items-center ${bg}`}>
              <h1 className="text-white text-5xl text-center">{index + 1}</h1>
            </div>
          ))}
        </Carousel>
      </div>
      <div className="flex flex-col justify-center items-center">
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
    </>
  )
}

export default App
