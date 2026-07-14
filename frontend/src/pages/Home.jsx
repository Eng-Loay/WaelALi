import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import SubjectsSection from '../components/SubjectsSection';
import Grades from '../components/Grades';
import CoursesSection from '../components/CoursesSection';
import Features from '../components/Features';
import Testimonials from '../components/Testimonials';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <SubjectsSection />
      <Grades showViewAll />
      <CoursesSection showViewAll />
      <Features />
      <Testimonials />
      <Footer />
    </>
  );
}
