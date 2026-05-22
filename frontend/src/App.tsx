import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Landing } from '@/pages/Landing';
import { Generate } from '@/pages/Generate';
import { NotFound } from '@/pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<Generate />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
