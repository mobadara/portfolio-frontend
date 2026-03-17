/**
 * Unified Portfolio Data Structure
 * MongoDB-compatible schema for all portfolio content
 * Can be fetched from a backend API
 */

export const portfolioData = {
  metadata: {
    lastUpdated: new Date().toISOString(),
    version: "2.0.0"
  },
  
  about: {
    name: "Muyiwa J. Obadara",
    title: "Senior Data Scientist & AI Engineer",
    summary: "Building intelligent systems at the intersection of data, code, and innovation.",
    bio: "Passionate about transforming complex problems into elegant solutions through data science, machine learning, and AI engineering.",
    image: "https://placehold.co/200x200/001f3f/FFF?text=Profile"
  },
  
  projects: [
    {
      _id: "proj_001",
      title: "Sentiment Analysis with BERT",
      category: "Deep Learning",
      description: "Fine-tuning transformer models to classify sentiment in financial news with 94% accuracy.",
      fullDescription: "This project demonstrates advanced NLP techniques using state-of-the-art transformer models. Achieved 94% accuracy on financial sentiment classification, enabling better market analysis.",
      technologies: ["PyTorch", "Hugging Face", "NLP", "Transformers"],
      image: "https://placehold.co/600x400/001f3f/FFF?text=NLP+Model",
      links: {
        github: "https://github.com/mobadara/sentiment-analysis",
        demo: "https://sentiment-demo.example.com",
        paper: null,
        youtube: "https://youtube.com/watch?v=sentiment-analysis-demo"
      },
      metrics: {
        accuracy: 94,
        datasets: 50000,
        models_trained: 3
      },
      order: 1,
      featured: true
    },
    {
      _id: "proj_002",
      title: "Credit Risk Prediction",
      category: "Data Science",
      description: "Classical ML pipeline using Random Forest and XGBoost to predict loan defaults for a fintech client.",
      fullDescription: "Enterprise-grade machine learning solution for financial risk assessment. Implemented comprehensive feature engineering, model selection, and cross-validation strategies.",
      technologies: ["Scikit-Learn", "Pandas", "XGBoost", "SQL"],
      image: "https://placehold.co/600x400/e0e0e0/333?text=Risk+Model",
      links: {
        github: "https://github.com/mobadara/credit-risk",
        demo: null,
        paper: null
      },
      metrics: {
        precision: 0.91,
        recall: 0.88,
        auc_score: 0.94
      },
      order: 2,
      featured: false
    },
    {
      _id: "proj_003",
      title: "AI-Powered REST API",
      category: "AI Engineering",
      description: "Scalable REST API built with FastAPI to serve real-time predictions from trained PyTorch models.",
      fullDescription: "Production-ready API serving ML models at scale. Includes authentication, rate limiting, comprehensive logging, and containerization for cloud deployment.",
      technologies: ["FastAPI", "Docker", "Azure", "PostgreSQL"],
      image: "https://placehold.co/600x400/003366/FFF?text=FastAPI+Backend",
      links: {
        github: "https://github.com/mobadara/ml-api",
        demo: "https://api.example.com/docs",
        paper: null,
          youtube: "https://youtube.com/watch?v=ml-api-tutorial"
      },
      metrics: {
        requests_per_second: 1000,
        uptime: 99.9,
        response_time_ms: 150
      },
      order: 3,
      featured: true
    },
    {
      _id: "proj_004",
      title: "Computer Vision for Medical Imaging",
      category: "Deep Learning",
      description: "CNN-based system trained on X-ray datasets to detect pneumonia with clinical-grade accuracy.",
      fullDescription: "Deep learning system achieving 96% sensitivity in pneumonia detection. Deployed in healthcare settings with HIPAA compliance and interpretability features.",
      technologies: ["TensorFlow", "CNN", "OpenCV", "Grad-CAM"],
      image: "https://placehold.co/600x400/555/FFF?text=Computer+Vision",
      links: {
        github: "https://github.com/mobadara/medical-imaging",
        demo: null,
        paper: "https://arxiv.example.com/pneumonia",
          youtube: "https://youtube.com/watch?v=medical-imaging-demo"
      },
      metrics: {
        sensitivity: 0.96,
        specificity: 0.94,
        auc: 0.98
      },
      order: 4,
      featured: true
    },
    {
      _id: "proj_005",
      title: "Customer Churn Prediction",
      category: "Data Science",
      description: "End-to-end ML pipeline identifying at-risk customers with actionable insights.",
      fullDescription: "Comprehensive churn analysis reducing customer loss by 28%. Includes feature importance analysis, customer segmentation, and retention strategies.",
      technologies: ["Python", "pandas", "scikit-learn", "Plotly"],
      image: "https://placehold.co/600x400/001f3f/FFF?text=Data+Analysis",
      links: {
        github: "https://github.com/mobadara/churn-prediction",
        demo: "https://churn-dashboard.example.com",
        paper: null
      },
      metrics: {
        churn_reduction: 0.28,
        model_accuracy: 0.89,
        features_used: 45
      },
      order: 5,
      featured: false
    },
    {
      _id: "proj_006",
      title: "Analytics Dashboard",
      category: "Visualization",
      description: "Interactive Power BI dashboard for healthcare resource optimization.",
      fullDescription: "Enterprise analytics solution visualizing patient demographics, resource allocation, and operational metrics in real-time.",
      technologies: ["Power BI", "SQL", "DAX", "Excel"],
      image: "https://placehold.co/600x400/FFD700/000?text=PowerBI",
      links: {
        github: null,
        demo: "https://app.powerbi.com/example",
        paper: null
      },
      metrics: {
        dashboards: 12,
        automated_reports: 8,
        users: 250
      },
      order: 6,
      featured: false
    }
  ],
  
  skills: [
    // Programming Languages
    { name: "Python", level: 95, category: "Programming Languages", icon: "python" },
    { name: "JavaScript", level: 88, category: "Programming Languages", icon: "javascript" },
    { name: "SQL", level: 90, category: "Programming Languages", icon: "database" },
    
    // Machine Learning & Data Science
    { name: "PyTorch", level: 90, category: "Machine Learning", icon: "neural-network" },
    { name: "Scikit-Learn", level: 92, category: "Machine Learning", icon: "chart-line" },
    { name: "TensorFlow", level: 85, category: "Machine Learning", icon: "tensorflow" },
    { name: "Pandas", level: 94, category: "Data Science", icon: "table" },
    { name: "NumPy", level: 92, category: "Data Science", icon: "calculator" },
    { name: "Statistics", level: 93, category: "Data Science", icon: "chart-bar" },
    
    // AI & LLMs
    { name: "LLM Integration", level: 89, category: "AI & Automation", icon: "brain" },
    { name: "OpenAI API", level: 88, category: "AI & Automation", icon: "robot" },
    { name: "Hugging Face", level: 87, category: "AI & Automation", icon: "hugging-face" },
    { name: "Prompt Engineering", level: 90, category: "AI & Automation", icon: "wand-magic-sparkles" },
    
    // Frontend Development
    { name: "React", level: 87, category: "Frontend", icon: "react" },
    { name: "HTML/CSS", level: 90, category: "Frontend", icon: "html5" },
    { name: "Responsive Design", level: 91, category: "Frontend", icon: "mobile" },
    
    // Backend & Cloud
    { name: "FastAPI", level: 89, category: "Backend", icon: "server" },
    { name: "Docker", level: 87, category: "Backend", icon: "docker" },
    { name: "Azure", level: 86, category: "Cloud & DevOps", icon: "azure" },
    { name: "AWS", level: 84, category: "Cloud & DevOps", icon: "aws" },
    { name: "PostgreSQL", level: 88, category: "Databases", icon: "database" },
    { name: "MongoDB", level: 85, category: "Databases", icon: "leaf" },
    
    // Product & Leadership
    { name: "Problem Solving", level: 96, category: "Core Competencies", icon: "lightbulb" },
    { name: "Communication", level: 93, category: "Core Competencies", icon: "chat" },
    { name: "Team Leadership", level: 90, category: "Core Competencies", icon: "users" },
    { name: "System Design", level: 91, category: "Core Competencies", icon: "diagram" }
  ],
  
  services: [
    {
      _id: "svc_001",
      title: "Machine Learning Consulting",
      description: "Strategic guidance for ML/AI initiatives, model selection, and production deployment.",
      icon: "brain",
      order: 1
    },
    {
      _id: "svc_002",
      title: "Data Engineering",
      description: "Design and implementation of robust data pipelines and ETL systems.",
      icon: "cogs",
      order: 2
    },
    {
      _id: "svc_003",
      title: "Full-Stack AI Solutions",
      description: "End-to-end development from data collection to deployment and monitoring.",
      icon: "rocket",
      order: 3
    }
  ],
  
  social: [
    { platform: "GitHub", url: "https://github.com/mobadara", icon: "github" },
    { platform: "LinkedIn", url: "https://linkedin.com/in/mobadara", icon: "linkedin" },
    { platform: "Twitter", url: "https://twitter.com/mobadara", icon: "twitter" },
    { platform: "Medium", url: "https://medium.com/@mobadara", icon: "medium" }
  ]
};

/**
 * Hook to fetch portfolio data from backend
 * In production, this would call a MongoDB API endpoint
 */
export const usePortfolioData = () => {
  // TODO: Replace with actual API call when backend is ready
  // const [data, setData] = useState(null);
  // const [loading, setLoading] = useState(true);
  // useEffect(() => {
  //   fetch(`${API_BASE}/portfolio`)
  //     .then(r => r.json())
  //     .then(setData)
  //     .finally(() => setLoading(false));
  // }, []);
  // return { data, loading };
  
  return portfolioData;
};
