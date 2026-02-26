import Contact from '../components/feature/Contact';
import Footer from '../components/ui/Footer';
import { motion } from 'framer-motion';

const ContactPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-16"
    >
      <Contact />
      <Footer />
    </motion.div>
  );
};

export default ContactPage;