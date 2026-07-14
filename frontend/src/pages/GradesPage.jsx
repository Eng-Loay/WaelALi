import { useParams, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Grades from '../components/Grades';
import Footer from '../components/Footer';
import { getStageByKey } from '../data/stages';
import './PageShell.css';

export default function GradesPage() {
  const { stage } = useParams();
  if (stage && !getStageByKey(stage)) {
    return <Navigate to="/grades" replace />;
  }

  return (
    <>
      <Navbar />
      <main className="page-shell">
        <Grades stage={stage || null} />
      </main>
      <Footer />
    </>
  );
}
