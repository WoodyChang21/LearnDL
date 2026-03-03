import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { createBrowserRouter, RouterProvider } from "react-router";
import { Training } from './pages/Training.tsx';
import { Archives } from './pages/Archives.tsx';
import { Prediction } from './pages/Prediction.tsx';

const router = createBrowserRouter([
  {path: "/", element: <App />},
  {path: "/training", element: <Training/>},
  {path: "/prediction", element: <Prediction/>},
  {path: "/archives", element: <Archives/>},
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
