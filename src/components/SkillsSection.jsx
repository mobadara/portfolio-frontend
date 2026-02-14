import { useState, useMemo, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import { skillsData } from '../data/skills';
import './SkillsSection.css';

/**
 * SkillsSection - Displays skills as an interactive word cloud
 * Font size represents proficiency level
 * @component
 * @returns {JSX.Element} Word cloud visualization of skills
 */
const SkillsSection = () => {
  const [hoveredSkill, setHoveredSkill] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
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

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['All', ...new Set(skillsData.map(skill => skill.category))];
    return cats;
  }, []);

  // Filter skills based on selected category
  const filteredSkills = useMemo(() => {
    if (selectedCategory === 'All') return skillsData;
    return skillsData.filter(skill => skill.category === selectedCategory);
  }, [selectedCategory]);

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
        <div className="wordcloud-container">
          <div className="wordcloud-content">
            {filteredSkills.map((skill, index) => (
              <span
                key={index}
                className={`skill-word ${getSkillColor(skill.level)}`}
                style={{
                  fontSize: `${calculateFontSize(skill.level)}rem`,
                }}
                onMouseEnter={() => setHoveredSkill(skill.name)}
                onMouseLeave={() => setHoveredSkill(null)}
              >
                {skill.name}
              </span>
            ))}
          </div>

          {/* Skill Info Tooltip */}
          {hoveredSkill && (
            <div className="skill-tooltip">
              <div className="tooltip-content">
                <strong>{hoveredSkill}</strong>
                <div className="skill-level">
                  {skillsData.find(s => s.name === hoveredSkill)?.level}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="row text-center mt-5 pt-4 border-top">
          <div className="col-md-3 mb-3">
            <h5 className="fw-bold text-primary">{skillsData.length}</h5>
            <p className="text-secondary">Total Skills</p>
          </div>
          <div className="col-md-3 mb-3">
            <h5 className="fw-bold text-success">{categories.length - 1}</h5>
            <p className="text-secondary">Categories</p>
          </div>
          <div className="col-md-3 mb-3">
            <h5 className="fw-bold text-warning">
              {Math.round(
                skillsData.reduce((sum, skill) => sum + skill.level, 0) /
                  skillsData.length
              )}
              %
            </h5>
            <p className="text-secondary">Avg Proficiency</p>
          </div>
          <div className="col-md-3 mb-3">
            <h5 className="fw-bold text-info">
              {skillsData.filter(s => s.level >= 90).length}
            </h5>
            <p className="text-secondary">Expert Level Skills</p>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default SkillsSection;
