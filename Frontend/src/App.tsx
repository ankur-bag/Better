import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import HomePage from './pages/HomePage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import CreateEventPage from './pages/CreateEventPage.tsx';
import EditEventPage from './pages/EditEventPage.tsx';
import AttendeesPage from './pages/AttendeesPage.tsx';
import PublicEventPage from './pages/PublicEventPage.tsx';
import EventTemplatePage from './pages/EventTemplatePage.tsx';
import EventDetailPage from './pages/EventDetailPage.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/events/:id" element={<PublicEventPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/events/templates" element={<EventTemplatePage />} />
          <Route path="/dashboard/events/new" element={<CreateEventPage />} />
          <Route path="/dashboard/events/:id" element={<EventDetailPage />} />
          <Route path="/dashboard/events/:id/edit" element={<EditEventPage />} />
          <Route path="/dashboard/events/:id/attendees" element={<AttendeesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}