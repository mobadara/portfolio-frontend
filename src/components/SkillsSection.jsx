import { useState, useMemo, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import { ADMIN_ROUTES, buildAdminUrl } from '../utils/adminApi';
import './SkillsSection.css';

const PUBLIC_SKILLS_ENDPOINT = ADMIN_ROUTES.publicSkills;
const COLLAPSED_SKILL_COUNT = 8;

const SKILL_ICON_CLASS_MAP = {
  python: 'bi-terminal-fill',
  javascript: 'bi-braces-asterisk',
  database: 'bi-database-fill',
  'neural-network': 'bi-diagram-3-fill',
  'chart-line': 'bi-graph-up-arrow',
  tensorflow: 'bi-cpu-fill',
  table: 'bi-table',
  calculator: 'bi-calculator-fill',
  'chart-bar': 'bi-bar-chart-fill',
  brain: 'bi-cpu',
  robot: 'bi-robot',
  'hugging-face': 'bi-emoji-smile-fill',
  'wand-magic-sparkles': 'bi-stars',
  react: 'bi-code-slash',
  html5: 'bi-filetype-html',
  mobile: 'bi-phone-fill',
  server: 'bi-server',
  docker: 'bi-box-seam-fill',
  azure: 'bi-cloud-fill',
  aws: 'bi-cloud-fill',
  leaf: 'bi-tree-fill',
  lightbulb: 'bi-lightbulb-fill',
  chat: 'bi-chat-dots-fill',
  users: 'bi-people-fill',
  diagram: 'bi-diagram-3-fill',
  star: 'bi-star-fill',
};

const getSkillIconClass = (iconKey = 'star') => {
  const normalizedKey = String(iconKey || 'star').trim().toLowerCase();
  return SKILL_ICON_CLASS_MAP[normalizedKey] || SKILL_ICON_CLASS_MAP.star;
};

/**
 * SkillsSection - Displays skills as an interactive word cloud
 * Font size represents proficiency level
 * @component
 * @returns {JSX.Element} Word cloud visualization of skills
 */
const SkillsSection = () => {
  const [skills, setSkills] = useState([]);
  const [hoveredSkill, setHoveredSkill] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isExpanded, setIsExpanded] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize for responsive font sizes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchSkills = async () => {
      try {
        const response = await fetch(buildAdminUrl(PUBLIC_SKILLS_ENDPOINT));
        if (!response.ok) {
          throw new Error('Unable to fetch skills.');
        }

        const payload = await response.json();
        const fetchedSkills = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.skills)
            ? payload.skills
            : [];

        if (!isMounted) return;

        setSkills(
          fetchedSkills.map((skill) => ({
            name: skill.name,
            level: Number(skill.level) || 0,
            category: skill.category || 'General',
            icon: skill.icon || 'star'
          }))
        );
      } catch {
        if (isMounted) {
          setSkills([]);
        }
      }
    };

    fetchSkills();

    return () => {
      isMounted = false;
    };
  }, []);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['All', ...new Set(skills.map(skill => skill.category))];
    return cats;
  }, [skills]);

  // Filter skills based on selected category
  const filteredSkills = useMemo(() => {
    if (selectedCategory === 'All') return skills;
    return skills.filter(skill => skill.category === selectedCategory);
  }, [selectedCategory, skills]);

  const visibleSkills = useMemo(() => {
    if (isExpanded) return filteredSkills;

    return [...filteredSkills]
      .sort((firstSkill, secondSkill) => secondSkill.level - firstSkill.level)
      .slice(0, COLLAPSED_SKILL_COUNT);
  }, [filteredSkills, isExpanded]);

  const canShowMoreSkills = filteredSkills.length > COLLAPSED_SKILL_COUNT;

  // Calculate font size based on skill level and screen size
  const calculateFontSize = (level) => {
    const windowWidth = window.innerWidth;
    if (windowWidth < 480) {
      // For mobile: Range from 0.65rem to 1.2rem
      return 0.65 + (level / 100) * 0.55;
    } else if (windowWidth < 768) {
      // For tablets: Range from 0.75rem to 1.6rem
      return 0.75 + (level / 100) * 0.85;
    } else if (windowWidth < 1024) {
      // For small desktops: Range from 0.85rem to 2rem
      return 0.85 + (level / 100) * 1.15;
    }
    // For large desktops: Range from 0.9rem to 2.8rem
    return 0.9 + (level / 100) * 1.9;
  };

  // Get skill color based on level
  const getSkillColor = (level) => {
    if (level >= 90) return 'skill-excellent'; // Dark green
    if (level >= 80) return 'skill-very-good'; // Green
    if (level >= 70) return 'skill-good'; // Blue
    return 'skill-decent'; // Purple
  };

  return (
    <section id="skills" className="section-padding bg-light position-relative">
      <Container className="pt-3 pb-3">
        <div className="section-shell">
          <div className="text-center mb-5">
            <h2 className="fw-bold display-6 text-dark">Skills & Expertise</h2>
            <p className="text-secondary fs-5">
              My proficiency in various technologies and soft skills
            </p>
          </div>
          {/* Category Filter */}
          <div className="category-filter mb-4 text-center">
            <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
              {categories.map(category => (
                <button
                  key={category}
                  className={`btn btn-sm transition-all ${
                    selectedCategory === category
                      ? 'btn-primary'
                      : 'btn-outline-primary'
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Word Cloud Container */}
          <div className={`wordcloud-container ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}>
            <div className="wordcloud-content">
              {visibleSkills.map((skill, index) => (
                <span
                  key={`${skill.name}-${index}`}
                  className={`skill-word ${getSkillColor(skill.level)}`}
                  style={{
                    fontSize: `${calculateFontSize(skill.level)}rem`,
                  }}
                  onMouseEnter={() => setHoveredSkill(skill.name)}
                  onMouseLeave={() => setHoveredSkill(null)}
                >
                  <span className="skill-icon" aria-hidden="true">
                    <i className={`bi ${getSkillIconClass(skill.icon)}`} />
                  </span>
                  {skill.name}
                </span>
              ))}
            </div>

            {canShowMoreSkills && (
              <div className="skill-expansion-actions">
                <Button
                  type="button"
                  variant="outline-primary"
                  className="see-more-skills-btn"
                  onClick={() => setIsExpanded((currentValue) => !currentValue)}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? 'Show fewer skills' : 'See more skills'}
                </Button>
              </div>
            )}

            {/* Skill Info Tooltip */}
            {hoveredSkill && (
              <div className="skill-tooltip">
                <div className="tooltip-content">
                  <strong>{hoveredSkill}</strong>
                  <div className="skill-level">
                    {skills.find(s => s.name === hoveredSkill)?.level}%
                  </div>
                  <div className="skill-tooltip-icon" aria-hidden="true">
                    <i className={`bi ${getSkillIconClass(skills.find(s => s.name === hoveredSkill)?.icon)}`} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="row text-center mt-5 pt-4 border-top">
            <div className="col-md-3 mb-3">
              <h5 className="fw-bold text-primary">{skills.length}</h5>
              <p className="text-secondary">Total Skills</p>
            </div>
            <div className="col-md-3 mb-3">
              <h5 className="fw-bold text-success">{categories.length - 1}</h5>
              <p className="text-secondary">Categories</p>
            </div>
            <div className="col-md-3 mb-3">
              <h5 className="fw-bold text-warning">
                {Math.round(
                  skills.reduce((sum, skill) => sum + skill.level, 0) /
                    (skills.length || 1)
                )}
                %
              </h5>
              <p className="text-secondary">Avg Proficiency</p>
            </div>
            <div className="col-md-3 mb-3">
              <h5 className="fw-bold text-info">
                {skills.filter(s => s.level >= 90).length}
              </h5>
              <p className="text-secondary">Expert Level Skills</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default SkillsSection;
