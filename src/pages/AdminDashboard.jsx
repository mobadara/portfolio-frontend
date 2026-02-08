import AdminChatPage from './components/AdminChatPage';

/**
 * AdminDashboard - Simple demo page for admin chat
 * This can be added to your app routing at /admin/chat or /admin/dashboard
 * 
 * To use:
 * 1. Add this to your App.jsx:
 *    import AdminDashboard from './pages/AdminDashboard';
 * 
 * 2. Add a route (if using React Router):
 *    <Route path="/admin/dashboard" element={<AdminDashboard />} />
 * 
 * 3. Or render directly in a modal/page when needed
 */

function AdminDashboard() {
  return <AdminChatPage />;
}

export default AdminDashboard;
