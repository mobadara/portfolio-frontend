import Container from 'react-bootstrap/Container';
import { FaLinkedin, FaTwitter, FaGithub } from 'react-icons/fa';
import { SiMedium, SiSubstack } from 'react-icons/si';

const FooterSection = () => (
  <footer id="blog" className="bg-navy text-white text-center py-5 border-top border-secondary">
    <Container>
      <div className="mb-4">
        <h6 className="text-warning fw-bold small text-uppercase mb-3">Connect & Read</h6>

        <div className="d-flex justify-content-center align-items-center flex-wrap gap-4">
          <div className="d-flex gap-4">
            <a href="https://linkedin.com/in/obadara-m" target="_blank" rel="noreferrer" className="text-white fs-4 hover-warning" title="LinkedIn">
              <FaLinkedin />
            </a>
            <a href="https://twitter.com/m_obadara" target="_blank" rel="noreferrer" className="text-white fs-4 hover-warning" title="X (Twitter)">
              <FaTwitter />
            </a>
            <a href="https://github.com/mobadara" target="_blank" rel="noreferrer" className="text-white fs-4 hover-warning" title="GitHub">
              <FaGithub />
            </a>
          </div>

          <div className="vr bg-secondary opacity-50 mx-2 d-none d-md-block" style={{ height: '30px' }}></div>

          <div className="d-flex gap-4">
            <a href="#" target="_blank" rel="noreferrer" className="text-white fs-4 hover-warning" title="Medium Blog">
              <SiMedium />
            </a>
            <a href="#" target="_blank" rel="noreferrer" className="text-white fs-4 hover-warning" title="Substack Newsletter">
              <SiSubstack />
            </a>
          </div>
        </div>
      </div>

      <p className="mb-0 small opacity-50">&copy; {new Date().getFullYear()} Muyiwa J. Obadara. Built with React & FastAPI.</p>
    </Container>
  </footer>
);

export default FooterSection;
