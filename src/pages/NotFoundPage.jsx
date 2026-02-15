import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';
import FooterSection from '../components/FooterSection';
import './NotFoundPage.css';

const NotFoundPage = () => {
  const [theme, setTheme] = useState('light');
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [floatingIcons, setFloatingIcons] = useState([]);

  // Data Science Quiz Questions
  const questions = [
    {
      question: "What does 'ML' stand for?",
      options: ["Machine Learning", "Mega Logic", "Micro List", "Matrix Library"],
      correct: 0
    },
    {
      question: "Which algorithm is best for classification?",
      options: ["Linear Regression", "Random Forest", "K-Means", "PCA"],
      correct: 1
    },
    {
      question: "What is overfitting?",
      options: ["Model too simple", "Model too complex", "Perfect model", "No training"],
      correct: 1
    },
    {
      question: "What does NLP stand for?",
      options: ["Neural Link Protocol", "Natural Language Processing", "Network Layer Protocol", "Numeric Logic Process"],
      correct: 1
    },
    {
      question: "Which is a supervised learning task?",
      options: ["Clustering", "Dimensionality Reduction", "Classification", "Association Rules"],
      correct: 2
    }
  ];

  // Floating data icons
  const dataIcons = ['📊', '📈', '🤖', '🧠', '💻', '📉', '🔬', '⚙️', '🎯', '🔍'];

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    
    // Generate random floating icons
    const icons = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      icon: dataIcons[Math.floor(Math.random() * dataIcons.length)],
      left: Math.random() * 100,
      animationDuration: 15 + Math.random() * 10,
      animationDelay: Math.random() * 5,
      size: 20 + Math.random() * 30
    }));
    setFloatingIcons(icons);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const handleStartGame = () => {
    setGameStarted(true);
    setScore(0);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleAnswerSelect = (index) => {
    if (showResult) return;
    
    setSelectedAnswer(index);
    setShowResult(true);
    
    if (index === questions[currentQuestion].correct) {
      setScore(score + 1);
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        // Game finished
        setTimeout(() => {
          setGameStarted(false);
        }, 2000);
      }
    }, 1500);
  };

  const getButtonClass = (index) => {
    if (!showResult) return 'btn-outline-primary';
    if (index === questions[currentQuestion].correct) return 'btn-success';
    if (index === selectedAnswer && index !== questions[currentQuestion].correct) return 'btn-danger';
    return 'btn-outline-secondary';
  };

  return (
    <div className="not-found-page">      
      {/* Floating Icons Background */}
      <div className="floating-icons">
        {floatingIcons.map(icon => (
          <div
            key={icon.id}
            className="floating-icon"
            style={{
              left: `${icon.left}%`,
              animationDuration: `${icon.animationDuration}s`,
              animationDelay: `${icon.animationDelay}s`,
              fontSize: `${icon.size}px`
            }}
          >
            {icon.icon}
          </div>
        ))}
      </div>

      <Container className="not-found-content">
        <Row className="justify-content-center align-items-center min-vh-100 py-5">
          <Col lg={8} className="text-center">
            <div className="error-code-wrapper mb-4">
              <h1 className="error-code">404</h1>
              <div className="error-animation">
                <div className="neural-network">
                  <div className="node"></div>
                  <div className="node"></div>
                  <div className="node"></div>
                  <div className="connection"></div>
                  <div className="connection"></div>
                  <div className="connection"></div>
                </div>
              </div>
            </div>

            <h2 className="error-title mb-3">Page Not Found in Dataset</h2>
            <p className="error-message mb-4">
              Oops! Our ML model couldn't classify this route. It seems this page is an outlier in our data!
            </p>

            {!gameStarted ? (
              <div className="game-intro">
                <h3 className="mb-3">🎮 Play a Quick Data Science Game!</h3>
                <p className="mb-4">Test your knowledge while you're here</p>
                <div className="d-flex gap-3 justify-content-center flex-wrap">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={handleStartGame}
                    className="px-4 py-2"
                  >
                    🚀 Start Quiz
                  </Button>
                  <Link to="/">
                    <Button variant="warning" size="lg" className="px-4 py-2">
                      🏠 Go Home
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="quiz-game">
                {currentQuestion < questions.length ? (
                  <div className="quiz-card">
                    <div className="quiz-header mb-4">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="badge bg-primary">Question {currentQuestion + 1}/{questions.length}</span>
                        <span className="badge bg-success">Score: {score}</span>
                      </div>
                    </div>
                    
                    <h4 className="quiz-question mb-4">{questions[currentQuestion].question}</h4>
                    
                    <div className="quiz-options d-grid gap-3">
                      {questions[currentQuestion].options.map((option, index) => (
                        <Button
                          key={index}
                          variant={getButtonClass(index)}
                          size="lg"
                          onClick={() => handleAnswerSelect(index)}
                          disabled={showResult}
                          className="quiz-option-btn"
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="quiz-complete">
                    <h3 className="mb-3">🎉 Quiz Complete!</h3>
                    <h2 className="score-display mb-4">
                      Final Score: {score}/{questions.length}
                    </h2>
                    <p className="mb-4">
                      {score === questions.length 
                        ? "Perfect! You're a Data Science Expert! 🌟" 
                        : score >= 3 
                        ? "Great job! Keep learning! 📚" 
                        : "Good effort! Practice makes perfect! 💪"}
                    </p>
                    <div className="d-flex gap-3 justify-content-center flex-wrap">
                      <Button 
                        variant="primary" 
                        size="lg" 
                        onClick={handleStartGame}
                      >
                        🔄 Play Again
                      </Button>
                      <Link to="/">
                        <Button variant="warning" size="lg">
                          🏠 Go Home
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Col>
        </Row>
      </Container>

      <FooterSection />
    </div>
  );
};

export default NotFoundPage;
