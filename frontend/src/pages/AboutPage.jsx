import Navbar from '../components/Navbar';
import About from '../components/About';
import Footer from '../components/Footer';
import './PageShell.css';

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="page-shell">
        <About />
      </main>
      <Footer />
    </>
  );
}
