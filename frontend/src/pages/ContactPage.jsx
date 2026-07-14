import Navbar from '../components/Navbar';
import SubscribeForm from '../components/SubscribeForm';
import Footer from '../components/Footer';
import './PageShell.css';

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="page-shell">
        <SubscribeForm />
      </main>
      <Footer />
    </>
  );
}
